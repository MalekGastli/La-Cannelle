import { ServiceOccasion } from '@prisma/client';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { normalizeImageValue } from '../utils/uploads';
import { translationService } from './translationService';
import { translationBackfillService } from './translationBackfillService';
import { DEFAULT_SERVICES } from '../data/defaultServices';

const isDeeplAutoTranslateOnReadEnabled = () => {
  const raw = process.env.DEEPL_AUTO_TRANSLATE_ON_READ;
  if (raw === undefined) return true;
  const normalized = String(raw).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

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

  async getServices(filters?: { occasion?: string; isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const occasion = normalizeOccasion(filters?.occasion);
    if (occasion) {
      where.OR = [{ occasion }, { occasion: 'BOTH' }];
    }

    if (filters?.search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: filters.search } },
            { nameDe: { contains: filters.search } },
            { description: { contains: filters.search } },
            { descriptionDe: { contains: filters.search } }
          ]
        }
      ];
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    if (isDeeplAutoTranslateOnReadEnabled()) {
      await translationBackfillService.backfillServicesDe(services);
    }

    return services;
  },

  async getServiceById(id: number) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) throw new AppError('Service not found', 404);

    if (isDeeplAutoTranslateOnReadEnabled()) {
      await translationBackfillService.backfillServicesDe([service]);
    }

    return service;
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

    return await prisma.service.create({
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
  },

  async updateService(id: number, data: Partial<{
    name: string;
    occasion: string;
    description: string | null;
    image: string | null;
    isActive: boolean;
  }>) {
    const updateData: any = { ...data };
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

    return await prisma.service.update({
      where: { id },
      data: updateData
    });
  },

  async deleteService(id: number) {
    await prisma.service.delete({ where: { id } });
  },

  async restoreDefaultServices() {
    let created = 0;

    for (const item of DEFAULT_SERVICES) {
      const existing = await prisma.service.findFirst({
        where: { name: item.name, occasion: item.occasion }
      });
      if (existing) continue;

      await prisma.service.create({
        data: {
          name: item.name,
          nameDe: null,
          occasion: item.occasion,
          description: item.description,
          descriptionDe: null,
          image: item.image,
          isActive: item.isActive
        }
      });

      created += 1;
    }

    return { created, totalDefaults: DEFAULT_SERVICES.length };
  }
};
