import { Prisma, ProductCategory } from '@prisma/client';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { normalizeImageValue } from '../utils/uploads';
import { translationService } from './translationService';
import { translationBackfillService } from './translationBackfillService';
import { cache, invalidateCatalog } from '../utils/cache';
import { isOwnImageUrl, withImageUrls } from '../utils/catalogImages';
import { bulkSchema, parseOrThrow, productSchemas } from '../utils/catalogSchemas';

export const LIST_DEFAULT_LIMIT = 500;
export const LIST_MAX_LIMIT = 1000;
const CACHE_TTL_MS = 30_000;

const schemas = productSchemas(Object.keys(ProductCategory));

/** Fields the public site reads (image is added separately so base64 blobs never leave the database). */
const publicSelect = (includeCost: boolean) => ({
  id: true,
  name: true,
  description: true,
  category: true,
  customCategory: true,
  price: true,
  ...(includeCost && { cost: true }),
  available: true,
  minOrderQuantity: true,
  ingredients: true,
  ingredientsDe: true,
  allergens: true,
  allergensDe: true,
  translations: true,
  popularity: true,
  createdAt: true,
  updatedAt: true,
  menuProducts: { select: { menuId: true, productId: true } }
});

const clampPaging = (limit?: number, offset?: number) => ({
  take: Number.isInteger(limit) && (limit as number) > 0 ? Math.min(limit as number, LIST_MAX_LIMIT) : LIST_DEFAULT_LIMIT,
  skip: Number.isInteger(offset) && (offset as number) > 0 ? (offset as number) : 0
});

const assertMenusExist = async (menuIds: number[]) => {
  const unique = Array.from(new Set(menuIds));
  if (!unique.length) return;
  const found = await prisma.menu.findMany({ where: { id: { in: unique } }, select: { id: true } });
  if (found.length !== unique.length) throw new AppError('Unknown menu id', 400);
};

const normalizeCategory = (category?: string | ProductCategory): ProductCategory | undefined => {
  if (!category) return undefined;
  const normalized = category.toString().toUpperCase();
  if (!(normalized in ProductCategory)) {
    throw new AppError('Invalid product category', 400);
  }
  return normalized as ProductCategory;
};

const normalizeProductInput = <T extends {
  category?: string | ProductCategory;
  menus?: number[];
  menuIds?: number[];
}>(data: T) => {
  return {
    ...data,
    ...(data.category && { category: normalizeCategory(data.category) }),
    ...(data.menuIds && { menuIds: data.menuIds }),
    ...(data.menus && { menuIds: data.menuIds ?? data.menus })
  };
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0);
};

const toOptionalString = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
};

/** Keeps only { EN|FR|TR: { name, description } } with non-empty trimmed strings. */
const sanitizeTranslations = (value: unknown) => {
  if (!value || typeof value !== 'object') return null;
  const out: Record<string, { name?: string; description?: string }> = {};
  for (const lang of ['EN', 'FR', 'TR']) {
    const entry = (value as any)[lang];
    if (!entry || typeof entry !== 'object') continue;
    const name = toOptionalString(entry.name);
    const description = toOptionalString(entry.description);
    if (name || description) out[lang] = { ...(name && { name }), ...(description && { description }) };
  }
  return Object.keys(out).length ? out : null;
};

type ListOptions = { includeCost?: boolean; bypassCache?: boolean };

const loadProductList = async (where: any, paging: { take: number; skip: number }, includeCost: boolean) => {
  const rows = await prisma.product.findMany({
    where,
    orderBy: [{ popularity: 'desc' }, { id: 'asc' }],
    select: publicSelect(includeCost) as any,
    ...paging
  });
  const products = await withImageUrls('products', rows as any as Array<{ id: number }>);
  // Optional, off by default, fire-and-forget: never awaited, never able to fail this request.
  translationBackfillService.scheduleOnRead('products', products, () => invalidateCatalog('products'));
  return products;
};

const loadProduct = async (id: number, includeCost: boolean) => {
  const row = await prisma.product.findUnique({ where: { id }, select: publicSelect(includeCost) as any });
  if (!row) throw new AppError('Product not found', 404);
  const [product] = await withImageUrls('products', [row as any as { id: number }]);
  return product;
};

export const productService = {
  async getProducts(
    filters?: {
      category?: ProductCategory;
      available?: boolean;
      search?: string;
      menuId?: number;
      limit?: number;
      offset?: number;
    },
    options: ListOptions = {}
  ) {
    const where: any = {};
    const category = filters?.category ? normalizeCategory(filters.category) : undefined;
    if (category) where.category = category;
    if (filters?.available !== undefined) where.available = filters.available;

    const search = filters?.search?.trim().slice(0, 100);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customCategory: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (filters?.menuId) {
      where.menuProducts = { some: { menuId: filters.menuId } };
    }

    const paging = clampPaging(filters?.limit, filters?.offset);
    const includeCost = Boolean(options.includeCost);
    const load = () => loadProductList(where, paging, includeCost);

    // Free-text searches have unbounded key space: never cache them.
    if (options.bypassCache || search) return load();

    const key = `products:list:${includeCost ? 1 : 0}:${JSON.stringify([category ?? null, filters?.available ?? null, filters?.menuId ?? null, paging.take, paging.skip])}`;
    return cache.wrap(key, load, { ttlMs: CACHE_TTL_MS });
  },

  async getProductById(id: number, options: ListOptions = {}) {
    if (!Number.isInteger(id)) throw new AppError('Product not found', 404);
    const includeCost = Boolean(options.includeCost);
    if (options.bypassCache) return loadProduct(id, includeCost);
    return cache.wrap(`products:byId:${includeCost ? 1 : 0}:${id}`, () => loadProduct(id, includeCost), { ttlMs: CACHE_TTL_MS });
  },

  async createProduct(data: {
    name: string;
    description: string;
    category: ProductCategory;
    customCategory?: unknown;
    price: number;
    cost: number;
    available?: boolean;
    minOrderQuantity?: number;
    ingredients: string[];
    ingredientsDe?: unknown;
    allergens: string[];
    allergensDe?: unknown;
    image?: string;
    menuIds?: number[];
  }) {
    parseOrThrow(schemas.create, data);
    const normalizedData = normalizeProductInput(data);
    if (normalizedData.menuIds) await assertMenusExist(normalizedData.menuIds);
    const image = await normalizeImageValue(isOwnImageUrl(normalizedData.image) ? undefined : normalizedData.image, { prefix: 'product' });
    const customCategory = toOptionalString((normalizedData as any).customCategory) ?? null;

    const ingredients = normalizeStringArray(normalizedData.ingredients);
    const allergens = normalizeStringArray(normalizedData.allergens);

    const hasIngredientsDe = (data as any).ingredientsDe !== undefined;
    const providedIngredientsDe = hasIngredientsDe ? normalizeStringArray((data as any).ingredientsDe) : null;
    const hasAllergensDe = (data as any).allergensDe !== undefined;
    const providedAllergensDe = hasAllergensDe ? normalizeStringArray((data as any).allergensDe) : null;

    const translationTargets: Array<
      { kind: 'array'; key: 'ingredientsDe' | 'allergensDe'; texts: string[] }
    > = [];

    if (!hasIngredientsDe) translationTargets.push({ kind: 'array', key: 'ingredientsDe', texts: ingredients });
    if (!hasAllergensDe) translationTargets.push({ kind: 'array', key: 'allergensDe', texts: allergens });

    const texts: string[] = [];
    translationTargets.forEach((target) => {
      texts.push(...target.texts);
    });

    // Explicit admin save: translating here is intended (and awaited), unlike on public reads.
    const translated = texts.length ? await translationService.translateTexts(texts, { targetLang: 'DE' }) : null;
    const translatedMap: Record<string, any> = {};

    if (translated) {
      let cursor = 0;
      translationTargets.forEach((target) => {
        translatedMap[target.key] = translated.slice(cursor, cursor + target.texts.length);
        cursor += target.texts.length;
      });
    }

    const translatedIngredients = hasIngredientsDe ? providedIngredientsDe : (translatedMap.ingredientsDe ?? null);
    const translatedAllergens = hasAllergensDe ? providedAllergensDe : (translatedMap.allergensDe ?? null);

    const product = await prisma.product.create({
      data: {
        name: normalizedData.name,
        description: normalizedData.description,
        category: normalizedData.category as ProductCategory,
        customCategory,
        price: normalizedData.price,
        cost: normalizedData.cost,
        available: normalizedData.available ?? true,
        minOrderQuantity: normalizedData.minOrderQuantity ?? 1,
        ingredients,
        ingredientsDe: translatedIngredients,
        allergens,
        allergensDe: translatedAllergens,
        translations: sanitizeTranslations((data as any).translations) ?? undefined,
        image,
        menuProducts: normalizedData.menuIds ? {
          create: Array.from(new Set(normalizedData.menuIds)).map(menuId => ({ menuId }))
        } : undefined
      },
      include: {
        menuProducts: true
      }
    });

    invalidateCatalog('products', 'menus');
    return product;
  },

  async updateProduct(id: number, data: Partial<{
    name: string;
    description: string;
    category: ProductCategory;
    customCategory: unknown;
    price: number;
    cost: number;
    available: boolean;
    minOrderQuantity: number;
    ingredients: unknown;
    allergens: unknown;
    image: string;
    menuIds: number[];
    menus: number[];
  }>) {
    parseOrThrow(schemas.update, data);
    const normalized = normalizeProductInput(data);
    const updateData: any = { ...normalized };
    const menuIds = normalized.menuIds;
    delete updateData.menuIds;
    delete updateData.menus;
    delete updateData.id;
    delete updateData.popularity;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.menuProducts;
    delete updateData.orderItems;
    delete updateData.favorites;
    delete updateData.tier;
    delete updateData.nameDe;
    delete updateData.descriptionDe;
    delete updateData.productCategories;
    delete updateData.productCategoriesDe;

    if (updateData.translations !== undefined) {
      updateData.translations = sanitizeTranslations(updateData.translations) ?? Prisma.DbNull;
    }

    if (updateData.customCategory !== undefined) {
      updateData.customCategory = toOptionalString(updateData.customCategory) ?? null;
    }

    // Echoed back by the admin UI for legacy base64 rows: keep the stored image untouched.
    if (isOwnImageUrl(updateData.image)) delete updateData.image;
    if (updateData.image !== undefined) {
      updateData.image = await normalizeImageValue(updateData.image, { prefix: 'product' });
    }

    if (menuIds !== undefined) await assertMenusExist(menuIds);

    const translationTargets: Array<
      { kind: 'array'; key: 'ingredientsDe' | 'allergensDe'; texts: string[] }
    > = [];

    if (updateData.ingredients !== undefined && updateData.ingredientsDe === undefined) {
      const ingredients = normalizeStringArray(updateData.ingredients);
      updateData.ingredients = ingredients;
      if (ingredients.length === 0) {
        updateData.ingredientsDe = [];
      } else {
        translationTargets.push({ kind: 'array', key: 'ingredientsDe', texts: ingredients });
      }
    }

    if (updateData.allergens !== undefined && updateData.allergensDe === undefined) {
      const allergens = normalizeStringArray(updateData.allergens);
      updateData.allergens = allergens;
      if (allergens.length === 0) {
        updateData.allergensDe = [];
      } else {
        translationTargets.push({ kind: 'array', key: 'allergensDe', texts: allergens });
      }
    }

    if (translationTargets.length > 0) {
      const texts: string[] = [];
      translationTargets.forEach((target) => {
        texts.push(...target.texts);
      });

      // Explicit admin save: translating here is intended (and awaited), unlike on public reads.
      const translated = await translationService.translateTexts(texts, { targetLang: 'DE' });
      if (translated) {
        let cursor = 0;
        translationTargets.forEach((target) => {
          const slice = translated.slice(cursor, cursor + target.texts.length);
          updateData[target.key] = slice;
          cursor += target.texts.length;
        });
      }
    }

    try {
      if (menuIds !== undefined) {
        const unique = Array.from(new Set(menuIds));
        // product update + association replacement succeed or fail together
        await prisma.$transaction([
          prisma.product.update({ where: { id }, data: updateData }),
          prisma.menuProduct.deleteMany({ where: { productId: id } }),
          ...(unique.length
            ? [prisma.menuProduct.createMany({ data: unique.map((menuId) => ({ menuId, productId: id })) })]
            : [])
        ]);
        invalidateCatalog('products', 'menus');
        return loadProduct(id, true);
      }

      return await prisma.product.update({
        where: { id },
        data: updateData,
        include: { menuProducts: true }
      });
    } catch (error) {
      if ((error as any)?.code === 'P2025') throw new AppError('Product not found', 404);
      throw error;
    } finally {
      invalidateCatalog('products', 'menus');
    }
  },

  async deleteProduct(id: number) {
    const result = await this.deleteProducts([id]);
    if (!result.found) throw new AppError('Product not found', 404);
    return result.archived ? { archived: true } : { deleted: true };
  },

  /** Deletes (or archives, when ordered before) many products with a constant number of queries. */
  async deleteProducts(ids: number[]) {
    const unique = Array.from(new Set(ids.filter((n) => Number.isInteger(n))));
    if (!unique.length) return { found: 0, deleted: 0, archived: 0 };

    try {
      const existing = await prisma.product.findMany({ where: { id: { in: unique } }, select: { id: true } });
      const existingIds = existing.map((row) => row.id);
      if (!existingIds.length) return { found: 0, deleted: 0, archived: 0 };

      const ordered = await prisma.orderItem.findMany({
        where: { productId: { in: existingIds } },
        select: { productId: true },
        distinct: ['productId']
      });
      const archivedIds = ordered.map((row) => row.productId);
      const archivedSet = new Set(archivedIds);
      const deletableIds = existingIds.filter((id) => !archivedSet.has(id));

      await prisma.$transaction([
        ...(archivedIds.length
          ? [
              prisma.menuProduct.deleteMany({ where: { productId: { in: archivedIds } } }),
              prisma.favorite.deleteMany({ where: { productId: { in: archivedIds } } }),
              prisma.product.updateMany({ where: { id: { in: archivedIds } }, data: { available: false } })
            ]
          : []),
        ...(deletableIds.length ? [prisma.product.deleteMany({ where: { id: { in: deletableIds } } })] : [])
      ]);

      return { found: existingIds.length, deleted: deletableIds.length, archived: archivedIds.length };
    } finally {
      invalidateCatalog('products', 'menus');
    }
  },

  /** One action applied to many products at once. */
  async bulkUpdate(input: {
    ids: number[];
    action: 'setAvailable' | 'adjustPrice' | 'setCategory' | 'addToMenu' | 'removeFromMenu';
    value?: any;
  }) {
    const parsed = parseOrThrow(bulkSchema, {
      ...input,
      ids: Array.from(new Set((input?.ids || []).map(Number).filter((n) => Number.isInteger(n))))
    });
    const ids = parsed.ids;
    const where = { id: { in: ids } };

    try {
      switch (parsed.action) {
        case 'setAvailable':
          await prisma.product.updateMany({ where, data: { available: Boolean(input.value) } });
          break;
        case 'setCategory': {
          const category = normalizeCategory(String(input.value || ''));
          if (!category) throw new AppError('Category required', 400);
          await prisma.product.updateMany({ where, data: { category } });
          break;
        }
        case 'adjustPrice': {
          // value: { mode: 'percent' | 'amount', amount: number } — positive raises, negative lowers
          const mode = input.value?.mode === 'amount' ? 'amount' : 'percent';
          const amount = Number(input.value?.amount);
          if (!Number.isFinite(amount) || Math.abs(amount) > (mode === 'percent' ? 100 : 1000)) {
            throw new AppError('Invalid price change', 400);
          }
          // single statement instead of one UPDATE per product
          const next = mode === 'percent'
            ? Prisma.sql`"price" * (1 + ${amount}::float8 / 100.0)`
            : Prisma.sql`"price" + ${amount}::float8`;
          await prisma.$executeRaw(
            Prisma.sql`UPDATE "products" SET "price" = GREATEST(0, ROUND((${next})::numeric, 2))::float8, "updatedAt" = NOW() WHERE "id" IN (${Prisma.join(ids)})`
          );
          break;
        }
        case 'addToMenu': {
          const menuId = Number(input.value);
          if (!Number.isInteger(menuId)) throw new AppError('Menu required', 400);
          await assertMenusExist([menuId]);
          const existing = await prisma.product.findMany({ where, select: { id: true } });
          await prisma.menuProduct.createMany({
            data: existing.map(({ id: productId }) => ({ menuId, productId })),
            skipDuplicates: true
          });
          break;
        }
        case 'removeFromMenu': {
          const menuId = Number(input.value);
          if (!Number.isInteger(menuId)) throw new AppError('Menu required', 400);
          await prisma.menuProduct.deleteMany({ where: { menuId, productId: { in: ids } } });
          break;
        }
        default:
          throw new AppError('Unknown action', 400);
      }
    } finally {
      // products embed their menu ids and menus embed their product ids
      invalidateCatalog('products', 'menus');
    }
    return { updated: ids.length };
  },

  async duplicateProduct(id: number) {
    const source = await prisma.product.findUnique({ where: { id }, include: { menuProducts: true } });
    if (!source) throw new AppError('Product not found', 404);
    const created = await prisma.product.create({
      data: {
        name: `${source.name} (Kopie)`,
        description: source.description,
        category: source.category,
        customCategory: source.customCategory,
        price: source.price,
        cost: source.cost,
        available: false,
        minOrderQuantity: source.minOrderQuantity,
        ingredients: (source.ingredients as any) ?? undefined,
        ingredientsDe: (source.ingredientsDe as any) ?? undefined,
        allergens: (source.allergens as any) ?? undefined,
        allergensDe: (source.allergensDe as any) ?? undefined,
        translations: (source.translations as any) ?? undefined,
        image: source.image,
        menuProducts: { create: source.menuProducts.map((mp) => ({ menuId: mp.menuId })) }
      },
      include: { menuProducts: true }
    });
    invalidateCatalog('products', 'menus');
    return created;
  }
};
