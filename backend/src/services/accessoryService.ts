import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { normalizeImageValue } from '../utils/uploads';
import { translationService } from './translationService';
import { translationBackfillService } from './translationBackfillService';
import { DEFAULT_ACCESSORIES } from '../data/defaultAccessories';

const isDeeplAutoTranslateOnReadEnabled = () => {
  const raw = process.env.DEEPL_AUTO_TRANSLATE_ON_READ;
  if (raw === undefined) return true;
  const normalized = String(raw).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const toOptionalString = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
};

const toOptionalText = (value: unknown) => {
  const text = toOptionalString(value);
  return text;
};

const toNumber = (value: unknown, field: string) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new AppError(`Invalid ${field}`, 400);
  }
  return num;
};

const toInt = (value: unknown, field: string) => {
  const num = toNumber(value, field);
  const int = Math.trunc(num);
  if (!Number.isFinite(int)) {
    throw new AppError(`Invalid ${field}`, 400);
  }
  return int;
};

export type AccessoryCreateInput = {
  nameEn: string;
  nameDe?: string | null;
  descriptionEn: string;
  descriptionDe?: string | null;
  detailsEn?: string | null;
  detailsDe?: string | null;
  unitEn?: string | null;
  unitDe?: string | null;
  price: number;
  quantityMode?: 'GUEST_COUNT' | 'FIXED' | 'CLIENT';
  fixedQuantity?: number | null;
  image?: string | null;
  isActive?: boolean;
};

export type AccessoryUpdateInput = Partial<AccessoryCreateInput>;

export const accessoryService = {
  async getAccessories(filters?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { nameEn: { contains: filters.search } },
        { nameDe: { contains: filters.search } },
        { descriptionEn: { contains: filters.search } },
        { descriptionDe: { contains: filters.search } }
      ];
    }

    const accessories = await prisma.accessory.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });

    if (isDeeplAutoTranslateOnReadEnabled()) {
      await translationBackfillService.backfillAccessoriesDe(accessories as any);
    }

    return accessories;
  },

  async getAccessoryById(id: number) {
    const accessory = await prisma.accessory.findUnique({ where: { id } });
    if (!accessory) {
      throw new AppError('Accessory not found', 404);
    }

    if (isDeeplAutoTranslateOnReadEnabled()) {
      await translationBackfillService.backfillAccessoriesDe([accessory] as any);
    }

    return accessory;
  },

  async createAccessory(data: AccessoryCreateInput) {
    const nameEn = toOptionalString(data.nameEn);
    const descriptionEn = toOptionalText(data.descriptionEn);
    if (!nameEn) throw new AppError('nameEn is required', 400);
    if (!descriptionEn) throw new AppError('descriptionEn is required', 400);

    const pendingTranslations: Array<{ key: 'nameDe' | 'descriptionDe' | 'detailsDe'; text: string }> = [];
    const providedNameDe = toOptionalString(data.nameDe);
    const providedDescriptionDe = toOptionalText(data.descriptionDe);
    const providedDetailsDe = toOptionalText(data.detailsDe);
    const detailsEn = toOptionalText(data.detailsEn);

    if (!providedNameDe) pendingTranslations.push({ key: 'nameDe', text: nameEn });
    if (!providedDescriptionDe) pendingTranslations.push({ key: 'descriptionDe', text: descriptionEn });
    if (!providedDetailsDe && detailsEn) pendingTranslations.push({ key: 'detailsDe', text: detailsEn });

    const translated = pendingTranslations.length
      ? await translationService.translateTexts(pendingTranslations.map(item => item.text), { targetLang: 'DE' })
      : null;
    const translationMap = new Map<string, string>();
    if (translated) {
      pendingTranslations.forEach((item, index) => {
        translationMap.set(item.key, translated[index] ?? '');
      });
    }

    const price = toNumber(data.price, 'price');
    const quantityMode = (() => {
      if (data.quantityMode === undefined) return 'GUEST_COUNT';
      if (data.quantityMode === 'GUEST_COUNT' || data.quantityMode === 'FIXED' || data.quantityMode === 'CLIENT') {
        return data.quantityMode;
      }
      throw new AppError('Invalid quantityMode', 400);
    })();
    const fixedQuantity = data.fixedQuantity === null || data.fixedQuantity === undefined
      ? null
      : Math.max(1, toInt(data.fixedQuantity, 'fixedQuantity'));
    if (quantityMode === 'FIXED' && !fixedQuantity) {
      throw new AppError('fixedQuantity is required when quantityMode is FIXED', 400);
    }
    if (quantityMode !== 'FIXED') {
      // fixedQuantity must be null for guest-based and client-adjustable modes.
      // (Client quantities are set in the order UI, not here.)
    }
    const image = await normalizeImageValue(toOptionalString(data.image), { prefix: 'accessory' });

    return prisma.accessory.create({
      data: {
        nameEn,
        nameDe: providedNameDe ?? (translationMap.get('nameDe') || null),
        descriptionEn,
        descriptionDe: providedDescriptionDe ?? (translationMap.get('descriptionDe') || null),
        detailsEn: detailsEn ?? null,
        detailsDe: providedDetailsDe ?? (translationMap.get('detailsDe') || null),
        unitEn: toOptionalString(data.unitEn),
        unitDe: toOptionalString(data.unitDe),
        price,
        quantityMode: quantityMode as any,
        fixedQuantity: quantityMode === 'FIXED' ? fixedQuantity : null,
        image,
        isActive: data.isActive ?? true
      }
    });
  },

  async updateAccessory(id: number, data: AccessoryUpdateInput) {
    const existing = await prisma.accessory.findUnique({ where: { id } });
    if (!existing) throw new AppError('Accessory not found', 404);

    const update: any = {};
    if (data.nameEn !== undefined) update.nameEn = toOptionalString(data.nameEn) || '';
    if (data.nameDe !== undefined) update.nameDe = toOptionalString(data.nameDe) ?? null;
    if (data.descriptionEn !== undefined) update.descriptionEn = toOptionalText(data.descriptionEn) || '';
    if (data.descriptionDe !== undefined) update.descriptionDe = toOptionalText(data.descriptionDe) ?? null;
    if (data.detailsEn !== undefined) update.detailsEn = toOptionalText(data.detailsEn) ?? null;
    if (data.detailsDe !== undefined) update.detailsDe = toOptionalText(data.detailsDe) ?? null;
    if (data.unitEn !== undefined) update.unitEn = toOptionalString(data.unitEn) ?? null;
    if (data.unitDe !== undefined) update.unitDe = toOptionalString(data.unitDe) ?? null;
    if (data.image !== undefined) {
      update.image = (await normalizeImageValue(toOptionalString(data.image), { prefix: 'accessory' })) ?? null;
    }
    if (data.isActive !== undefined) update.isActive = Boolean(data.isActive);
    if (data.price !== undefined) update.price = toNumber(data.price, 'price');
    if (data.quantityMode !== undefined) {
      if (data.quantityMode === 'GUEST_COUNT' || data.quantityMode === 'FIXED' || data.quantityMode === 'CLIENT') {
        update.quantityMode = data.quantityMode;
      } else {
        throw new AppError('Invalid quantityMode', 400);
      }
    }
    if (data.fixedQuantity !== undefined) {
      update.fixedQuantity = data.fixedQuantity === null
        ? null
        : Math.max(1, toInt(data.fixedQuantity, 'fixedQuantity'));
    }

    if (Object.keys(update).length === 0) {
      return existing;
    }

    const pendingTranslations: Array<{ key: 'nameDe' | 'descriptionDe' | 'detailsDe'; text: string }> = [];
    const nextNameEn = update.nameEn ?? existing.nameEn;
    const nextDescriptionEn = update.descriptionEn ?? existing.descriptionEn;
    const nextDetailsEn = update.detailsEn ?? existing.detailsEn;
    const nextNameDe = update.nameDe ?? existing.nameDe ?? null;
    const nextDescriptionDe = update.descriptionDe ?? existing.descriptionDe ?? null;
    const nextDetailsDe = update.detailsDe ?? existing.detailsDe ?? null;

    if (update.nameEn !== undefined && update.nameDe === undefined && !nextNameDe && nextNameEn) {
      pendingTranslations.push({ key: 'nameDe', text: nextNameEn });
    }
    if (update.descriptionEn !== undefined && update.descriptionDe === undefined && !nextDescriptionDe && nextDescriptionEn) {
      pendingTranslations.push({ key: 'descriptionDe', text: nextDescriptionEn });
    }
    if (update.detailsEn !== undefined && update.detailsDe === undefined && !nextDetailsDe && nextDetailsEn) {
      pendingTranslations.push({ key: 'detailsDe', text: nextDetailsEn });
    }

    if (pendingTranslations.length > 0) {
      const translated = await translationService.translateTexts(
        pendingTranslations.map(item => item.text),
        { targetLang: 'DE' }
      );
      if (translated) {
        pendingTranslations.forEach((item, index) => {
          update[item.key] = translated[index] ?? null;
        });
      }
    }

    const nextQuantityMode = update.quantityMode ?? existing.quantityMode;
    const nextFixedQuantity = update.fixedQuantity ?? existing.fixedQuantity ?? null;
    if (nextQuantityMode === 'FIXED' && !nextFixedQuantity) {
      throw new AppError('fixedQuantity is required when quantityMode is FIXED', 400);
    }
    if (nextQuantityMode !== 'FIXED') {
      update.fixedQuantity = null;
    }

    if (update.nameEn !== undefined && !update.nameEn) {
      throw new AppError('nameEn cannot be empty', 400);
    }
    if (update.descriptionEn !== undefined && !update.descriptionEn) {
      throw new AppError('descriptionEn cannot be empty', 400);
    }

    return prisma.accessory.update({
      where: { id },
      data: update
    });
  },

  async deleteAccessory(id: number) {
    const existing = await prisma.accessory.findUnique({ where: { id } });
    if (!existing) throw new AppError('Accessory not found', 404);
    await prisma.accessory.delete({ where: { id } });
    return { deleted: true };
  },

  async restoreDefaultAccessories() {
    let created = 0;

    for (const item of DEFAULT_ACCESSORIES) {
      const existing = await prisma.accessory.findFirst({ where: { nameEn: item.nameEn } });
      if (existing) continue;

      await prisma.accessory.create({
        data: {
          nameEn: item.nameEn,
          nameDe: item.nameDe,
          descriptionEn: item.descriptionEn,
          descriptionDe: item.descriptionDe,
          detailsEn: item.detailsEn ?? null,
          detailsDe: item.detailsDe ?? null,
          unitEn: item.unitEn ?? null,
          unitDe: item.unitDe ?? null,
          price: item.price,
          quantityMode: 'GUEST_COUNT' as any,
          fixedQuantity: null,
          image: item.image,
          isActive: item.isActive
        }
      });

      created += 1;
    }

    return { created, totalDefaults: DEFAULT_ACCESSORIES.length };
  }
};
