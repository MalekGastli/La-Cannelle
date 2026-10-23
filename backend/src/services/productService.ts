import { ProductCategory } from '@prisma/client';
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
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { customCategory: { contains: filters.search } }
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
  }
};
