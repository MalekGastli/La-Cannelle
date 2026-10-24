import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

// Same limit the upload helper enforces when it stores the image (UPLOAD_MAX_BYTES, default 15 MB).
const getMaxUploadBytes = () => {
  const parsed = Number(process.env.UPLOAD_MAX_BYTES?.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15 * 1024 * 1024;
};

/**
 * Validation for admin writes. Schemas are deliberately tolerant about unknown keys (the classic admin page sends
 * whole objects back) and only constrain the fields the services actually persist.
 */

export const parseOrThrow = <T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join('.');
    throw new AppError(path ? `${path}: ${issue.message}` : issue.message, 400);
  }
  return result.data;
};

const isHttpOrRelative = (value: string) => {
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!scheme) return true; // relative path
  return scheme[1].toLowerCase() === 'http' || scheme[1].toLowerCase() === 'https';
};

/** http(s) URL, relative path, or data:image/...;base64 within the upload limit. Empty string/null clear the image. */
export const imageField = z
  .string()
  .nullish()
  .superRefine((value, ctx) => {
    if (value === null || value === undefined) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (/^data:/i.test(trimmed)) {
      if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(trimmed)) {
        ctx.addIssue({ code: 'custom', message: 'image must be a data:image base64 string' });
        return;
      }
      // base64 expands data by 4/3
      if (trimmed.length > Math.ceil((getMaxUploadBytes() * 4) / 3) + 128) {
        ctx.addIssue({ code: 'custom', message: 'image is too large' });
      }
      return;
    }
    if (trimmed.length > 2048) ctx.addIssue({ code: 'custom', message: 'image URL is too long' });
    else if (!isHttpOrRelative(trimmed)) ctx.addIssue({ code: 'custom', message: 'image must be an http(s) URL, a relative path or a data:image string' });
  });

const money = z.number({ invalid_type_error: 'must be a number' }).finite().min(0, 'must be >= 0').max(1_000_000);
const numericString = z.string().trim().regex(/^\d+(\.\d+)?$/, 'must be a number');
const lenientMoney = z.union([money, numericString.transform(Number).pipe(money)]);
const intId = z.number().int().positive();
export const idArray = z.array(intId).max(1000);

const text = (max: number) => z.string().max(max, `must be at most ${max} characters`);
const requiredName = z.string().trim().min(1, 'is required').max(200, 'must be at most 200 characters');

const stringList = z.array(z.union([z.string().max(300), z.number()])).max(200);

const translationEntry = z
  .object({ name: text(200).nullish(), description: text(5000).nullish() })
  .passthrough();
export const translationsField = z
  .object({ EN: translationEntry.nullish(), FR: translationEntry.nullish(), TR: translationEntry.nullish() })
  .passthrough()
  .nullish();

const categoryField = (valid: readonly string[]) =>
  z.string().refine((v) => valid.includes(v.toUpperCase()), { message: `must be one of ${valid.join(', ')}` });

export const productSchemas = (validCategories: readonly string[]) => {
  const shared = {
    description: text(5000).nullish(),
    category: categoryField(validCategories),
    customCategory: text(100).nullish(),
    price: money,
    cost: money,
    available: z.boolean().optional(),
    minOrderQuantity: z.number().int().min(1, 'must be >= 1').max(100000),
    ingredients: stringList.nullish(),
    allergens: stringList.nullish(),
    ingredientsDe: stringList.nullish(),
    allergensDe: stringList.nullish(),
    image: imageField,
    menuIds: idArray.optional(),
    menus: idArray.optional(),
    translations: translationsField,
  };
  return {
    create: z.object({ ...shared, name: requiredName, minOrderQuantity: shared.minOrderQuantity.optional() }).passthrough(),
    update: z
      .object({
        ...shared,
        name: requiredName.optional(),
        category: shared.category.optional(),
        price: shared.price.optional(),
        cost: shared.cost.optional(),
        minOrderQuantity: shared.minOrderQuantity.optional(),
      })
      .passthrough(),
  };
};

export const menuStepsField = z
  .array(
    z
      .object({
        label: z.string().max(100),
        included: z.number().int().min(0).max(10000),
      })
      .passthrough()
  )
  .max(30);

const menuShared = {
  description: text(5000).nullish(),
  isActive: z.boolean().optional(),
  price: money.nullish(),
  image: imageField,
  minPeople: z.number().int().min(1).max(100000).nullish(),
  steps: menuStepsField.nullish(),
  productIds: idArray.optional(),
  serviceIds: idArray.optional(),
};
export const menuSchemas = {
  create: z.object({ ...menuShared, name: requiredName }).passthrough(),
  update: z.object({ ...menuShared, name: requiredName.optional() }).passthrough(),
};

export const serviceSchemas = {
  create: z
    .object({
      name: requiredName,
      nameDe: text(200).nullish(),
      occasion: z.string().min(1, 'is required'),
      description: text(5000).nullish(),
      descriptionDe: text(5000).nullish(),
      image: imageField,
      isActive: z.boolean().optional(),
    })
    .passthrough(),
  update: z
    .object({
      name: requiredName.optional(),
      nameDe: text(200).nullish(),
      occasion: z.string().min(1).optional(),
      description: text(5000).nullish(),
      descriptionDe: text(5000).nullish(),
      image: imageField,
      isActive: z.boolean().optional(),
    })
    .passthrough(),
};

const accessoryShared = {
  nameDe: text(200).nullish(),
  descriptionDe: text(5000).nullish(),
  detailsEn: text(5000).nullish(),
  detailsDe: text(5000).nullish(),
  unitEn: text(100).nullish(),
  unitDe: text(100).nullish(),
  price: z.union([lenientMoney, z.literal('')]).nullish(),
  quantityMode: z.enum(['GUEST_COUNT', 'FIXED', 'CLIENT']),
  fixedQuantity: z.number().int().min(1).max(1_000_000).nullish(),
  image: imageField,
  isActive: z.boolean().optional(),
};
export const accessorySchemas = {
  create: z
    .object({
      ...accessoryShared,
      nameEn: requiredName,
      descriptionEn: z.string().trim().min(1, 'is required').max(5000),
      quantityMode: accessoryShared.quantityMode.optional(),
    })
    .passthrough(),
  update: z
    .object({
      ...accessoryShared,
      nameEn: requiredName.optional(),
      descriptionEn: z.string().trim().min(1, 'is required').max(5000).optional(),
      price: accessoryShared.price.optional(),
      quantityMode: accessoryShared.quantityMode.optional(),
    })
    .passthrough(),
};

export const bulkSchema = z.object({
  ids: idArray.min(1, 'No products selected').max(500),
  action: z.enum(['setAvailable', 'adjustPrice', 'setCategory', 'addToMenu', 'removeFromMenu']),
  value: z.unknown().optional(),
});
