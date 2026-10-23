import { Prisma, ProductCategory } from '@prisma/client';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { normalizeImageValue } from '../utils/uploads';
import { translationService } from './translationService';
import { translationBackfillService } from './translationBackfillService';

const isDeeplAutoTranslateOnReadEnabled = () => {
  const raw = process.env.DEEPL_AUTO_TRANSLATE_ON_READ;
  if (raw === undefined) return true;
  const normalized = String(raw).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
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

export const productService = {
  async getProducts(filters?: {
    category?: ProductCategory;
    available?: boolean;
    search?: string;
    menuId?: number;
  }) {
    const where: any = {};

    if (filters?.category) {
      where.category = normalizeCategory(filters.category);
    }

    if (filters?.available !== undefined) {
      where.available = filters.available;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { customCategory: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters?.menuId) {
      where.menuProducts = {
        some: {
          menuId: filters.menuId
        }
      };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: {
        popularity: 'desc'
      },
      include: {
        menuProducts: true
      }
    });

    if (isDeeplAutoTranslateOnReadEnabled()) {
      await translationBackfillService.backfillProductsDe(products);
    }

    return products;
  },

  async getProductById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        menuProducts: true
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (isDeeplAutoTranslateOnReadEnabled()) {
      await translationBackfillService.backfillProductsDe([product]);
    }

    return product;
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
    const normalizedData = normalizeProductInput(data);
    const image = await normalizeImageValue(normalizedData.image, { prefix: 'product' });
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
          create: normalizedData.menuIds.map(menuId => ({ menuId }))
        } : undefined
      },
      include: {
        menuProducts: true
      }
    });

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

    if (updateData.image !== undefined) {
      updateData.image = await normalizeImageValue(updateData.image, { prefix: 'product' });
    }

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

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        menuProducts: true
      }
    });

    // Update menu associations if provided
    if (menuIds !== undefined) {
      // Delete existing associations
      await prisma.menuProduct.deleteMany({
        where: { productId: id }
      });

      // Create new associations
      if (menuIds.length > 0) {
        await prisma.menuProduct.createMany({
          data: menuIds.map(menuId => ({ menuId, productId: id }))
        });
      }

      // Fetch updated product
      return this.getProductById(id);
    }

    return product;
  },

  async deleteProduct(id: number) {
    const existing = await prisma.product.findUnique({
      where: { id }
    });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id }
    });

    if (orderItemCount > 0) {
      await prisma.menuProduct.deleteMany({
        where: { productId: id }
      });
      await prisma.favorite.deleteMany({
        where: { productId: id }
      });
      await prisma.product.update({
        where: { id },
        data: { available: false }
      });
      return { archived: true };
    }

    await prisma.product.delete({
      where: { id }
    });
    return { deleted: true };
  },

  /** One action applied to many products at once. */
  async bulkUpdate(input: {
    ids: number[];
    action: 'setAvailable' | 'adjustPrice' | 'setCategory' | 'addToMenu' | 'removeFromMenu';
    value?: any;
  }) {
    const ids = Array.from(new Set((input.ids || []).map(Number).filter((n) => Number.isInteger(n))));
    if (!ids.length) throw new AppError('No products selected', 400);
    const where = { id: { in: ids } };

    switch (input.action) {
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
        const products = await prisma.product.findMany({ where, select: { id: true, price: true } });
        await prisma.$transaction(
          products.map((product) => {
            const next = mode === 'percent' ? product.price * (1 + amount / 100) : product.price + amount;
            return prisma.product.update({
              where: { id: product.id },
              data: { price: Math.max(0, Math.round(next * 100) / 100) }
            });
          })
        );
        break;
      }
      case 'addToMenu': {
        const menuId = Number(input.value);
        if (!Number.isInteger(menuId)) throw new AppError('Menu required', 400);
        await prisma.menuProduct.createMany({
          data: ids.map((productId) => ({ menuId, productId })),
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
    return { updated: ids.length };
  },

  async duplicateProduct(id: number) {
    const source = await prisma.product.findUnique({ where: { id }, include: { menuProducts: true } });
    if (!source) throw new AppError('Product not found', 404);
    return prisma.product.create({
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
  }
};
