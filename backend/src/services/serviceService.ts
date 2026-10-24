import { ServiceOccasion } from '@prisma/client';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { normalizeImageValue } from '../utils/uploads';
import { translationService } from './translationService';
import { translationBackfillService } from './translationBackfillService';
import { DEFAULT_SERVICES } from '../data/defaultServices';
import { cache, invalidateCatalog } from '../utils/cache';
import { isOwnImageUrl, withImageUrls } from '../utils/catalogImages';
import { parseOrThrow, serviceSchemas } from '../utils/catalogSchemas';

const CACHE_TTL_MS = 30_000;
const LIST_HARD_CAP = 1000;

/** Everything the public site reads; `image` is added separately so base64 blobs never leave the database. */
const serviceSelect = {
  id: true,
  name: true,
  nameDe: true,
  occasion: true,
  description: true,
  descriptionDe: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const;

function normalizeOccasion(value: unknown): ServiceOccasion | undefined {
  if (!value) return undefined;
  const raw = String(value).toUpperCase();
  if (raw === 'BUSINESS') return 'BUSINESS';
  if (raw === 'PRIVATE') return 'PRIVATE';
  if (raw === 'BOTH') return 'BOTH';
  return undefined;
}

export const serviceService = {
  normalizeOccasion,

  async getServices(
    filters?: { occasion?: string; isActive?: boolean; search?: string },
    options: { bypassCache?: boolean } = {}
  ) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const occasion = normalizeOccasion(filters?.occasion);
    if (occasion) {
      where.OR = [{ occasion }, { occasion: 'BOTH' }];
    }

    const search = filters?.search?.trim().slice(0, 100);
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameDe: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { descriptionDe: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const load = async () => {
      const rows = await prisma.service.findMany({
        where,
        select: serviceSelect,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        take: LIST_HARD_CAP
      });
      const services = await withImageUrls('services', rows);
      // Optional, off by default, fire-and-forget: never awaited, never able to fail this request.
      translationBackfillService.scheduleOnRead('services', services, () => invalidateCatalog('services'));
      return services;
    };

    if (options.bypassCache || search) return load();
    return cache.wrap(`services:list:${JSON.stringify([occasion ?? null, filters?.isActive ?? null])}`, load, { ttlMs: CACHE_TTL_MS });
  },

  async getServiceById(id: number, options: { bypassCache?: boolean } = {}) {
    if (!Number.isInteger(id)) throw new AppError('Service not found', 404);
    const load = async () => {
      const row = await prisma.service.findUnique({ where: { id }, select: serviceSelect });
      if (!row) throw new AppError('Service not found', 404);
      const [service] = await withImageUrls('services', [row]);
      return service;
    };
    if (options.bypassCache) return load();
    return cache.wrap(`services:byId:${id}`, load, { ttlMs: CACHE_TTL_MS });
  },

  async createService(data: {
    name: string;
    nameDe?: string | null;
    occasion: string;
    description?: string;
    descriptionDe?: string | null;
    image?: string;
    isActive?: boolean;
  }) {
    parseOrThrow(serviceSchemas.create, data);
    const name = String(data.name || '').trim();
    if (!name) throw new AppError('Name is required', 400);
    const occasion = normalizeOccasion(data.occasion);
    if (!occasion) throw new AppError('Occasion is required', 400);

    const image = await normalizeImageValue(data.image, { prefix: 'service' });

    const providedNameDe = typeof data.nameDe === 'string' ? data.nameDe.trim() : '';
    const providedDescriptionDe = typeof data.descriptionDe === 'string' ? data.descriptionDe.trim() : '';

    const toTranslate: Array<{ key: 'nameDe' | 'descriptionDe'; text: string }> = [];
    if (!providedNameDe) toTranslate.push({ key: 'nameDe', text: name });
    if (!providedDescriptionDe && data.description) toTranslate.push({ key: 'descriptionDe', text: data.description });

    const translated = toTranslate.length
      ? await translationService.translateTexts(toTranslate.map(item => item.text), { targetLang: 'DE' })
      : null;
    const translatedMap = new Map<string, string>();
    if (translated) {
      toTranslate.forEach((item, index) => {
        translatedMap.set(item.key, translated[index] ?? '');
      });
    }

    const nameDe = providedNameDe || (translatedMap.get('nameDe') || null);
    const descriptionDe = providedDescriptionDe || (translatedMap.get('descriptionDe') || null);

    const created = await prisma.service.create({
      data: {
        name,
        nameDe,
        occasion,
        description: data.description || null,
        descriptionDe,
        image: image || null,
        isActive: data.isActive ?? true
      }
    });
    invalidateCatalog('services', 'menus');
    return created;
  },

  async updateService(id: number, data: Partial<{
    name: string;
    occasion: string;
    description: string | null;
    image: string | null;
    isActive: boolean;
  }>) {
    parseOrThrow(serviceSchemas.update, data);
    const updateData: any = { ...data };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.menuServices;
    delete updateData.orders;
    if (isOwnImageUrl(updateData.image)) delete updateData.image;
    if (updateData.name !== undefined) updateData.name = String(updateData.name).trim();
    if (updateData.occasion !== undefined) {
      const occasion = normalizeOccasion(updateData.occasion);
      if (!occasion) throw new AppError('Invalid occasion', 400);
      updateData.occasion = occasion;
    }
    if (updateData.image !== undefined) {
      updateData.image = await normalizeImageValue(updateData.image, { prefix: 'service' });
    }

    const toTranslate: Array<{ key: 'nameDe' | 'descriptionDe'; text: string }> = [];
    if (updateData.name !== undefined && updateData.nameDe === undefined) {
      const name = String(updateData.name || '').trim();
      if (name) {
        toTranslate.push({ key: 'nameDe', text: name });
      }
    }
    if (updateData.description !== undefined && updateData.descriptionDe === undefined) {
      const description = updateData.description === null ? '' : String(updateData.description || '').trim();
      if (description) {
        toTranslate.push({ key: 'descriptionDe', text: description });
      } else if (updateData.description === null) {
        updateData.descriptionDe = null;
      }
    }
    if (toTranslate.length > 0) {
      const translated = await translationService.translateTexts(
        toTranslate.map(item => item.text),
        { targetLang: 'DE' }
      );
      if (translated) {
        toTranslate.forEach((item, index) => {
          updateData[item.key] = translated[index] ?? null;
        });
      }
    }

    try {
      return await prisma.service.update({
        where: { id },
        data: updateData
      });
    } catch (error) {
      if ((error as any)?.code === 'P2025') throw new AppError('Service not found', 404);
      throw error;
    } finally {
      invalidateCatalog('services', 'menus');
    }
  },

  async deleteService(id: number) {
    try {
      await prisma.service.delete({ where: { id } });
    } catch (error) {
      if ((error as any)?.code === 'P2025') throw new AppError('Service not found', 404);
      throw error;
    } finally {
      invalidateCatalog('services', 'menus');
    }
  },

  async restoreDefaultServices() {
    // one lookup + one insert instead of a find/create pair per default
    const existing = await prisma.service.findMany({ select: { name: true, occasion: true } });
    const known = new Set(existing.map((row) => `${row.name}|${row.occasion}`));
    const missing = DEFAULT_SERVICES.filter((item) => {
      const key = `${item.name}|${item.occasion}`;
      if (known.has(key)) return false;
      known.add(key);
      return true;
    });

    if (missing.length) {
      await prisma.service.createMany({
        data: missing.map((item) => ({
          name: item.name,
          nameDe: null,
          occasion: item.occasion,
          description: item.description,
          descriptionDe: null,
          image: item.image,
          isActive: item.isActive
        }))
      });
      invalidateCatalog('services', 'menus');
    }

    return { created: missing.length, totalDefaults: DEFAULT_SERVICES.length };
  }
};
