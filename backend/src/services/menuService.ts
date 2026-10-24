import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { normalizeImageValue } from '../utils/uploads';
import { DEFAULT_MENUS } from '../data/defaultMenus';
import { cache, invalidateCatalog } from '../utils/cache';
import { isOwnImageUrl, loadImageUrls } from '../utils/catalogImages';
import { menuSchemas, parseOrThrow } from '../utils/catalogSchemas';

export const LIST_DEFAULT_LIMIT = 500;
export const LIST_MAX_LIMIT = 1000;
const CACHE_TTL_MS = 30_000;

/** Only what the public site reads. `image` is added separately so base64 blobs never leave the database. */
const menuSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  startDate: true,
  endDate: true,
  price: true,
  minPeople: true,
  steps: true,
  createdAt: true,
  updatedAt: true,
  menuProducts: { select: { productId: true } },
  menuServices: { select: { serviceId: true } }
} as const;

const assertProductsExist = async (ids: number[]) => {
  const unique = Array.from(new Set(ids));
  if (!unique.length) return;
  const found = await prisma.product.count({ where: { id: { in: unique } } });
  if (found !== unique.length) throw new AppError('Unknown product id', 400);
};

const assertServicesExist = async (ids: number[]) => {
  const unique = Array.from(new Set(ids));
  if (!unique.length) return;
  const found = await prisma.service.count({ where: { id: { in: unique } } });
  if (found !== unique.length) throw new AppError('Unknown service id', 400);
};

const withMenuImages = async <T extends { id: number }>(menus: T[]) => {
  const images = await loadImageUrls('menus', menus.map((menu) => menu.id));
  return menus.map((menu) => ({ ...menu, image: images.get(menu.id) ?? null }));
};


const sanitizeMenuSteps = (steps: any) => {
  if (!Array.isArray(steps)) return steps;
  return steps.map((step) => {
    if (!step || typeof step !== 'object') return step;
    const next: any = { ...step };
    if (typeof next.label === 'string') next.label = next.label.trim();
    delete next.labelDe;
    return next;
  });
};

export const menuService = {
  async getMenus(
    filters?: {
      isActive?: boolean;
      search?: string;
      serviceId?: number;
      includeImages?: boolean;
      limit?: number;
      offset?: number;
    },
    options: { bypassCache?: boolean } = {}
  ) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const search = filters?.search?.trim().slice(0, 100);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters?.serviceId) {
      where.menuServices = { some: { serviceId: filters.serviceId } };
    }

    const includeImages = Boolean(filters?.includeImages);
    const take = Number.isInteger(filters?.limit) && (filters!.limit as number) > 0
      ? Math.min(filters!.limit as number, LIST_MAX_LIMIT)
      : LIST_DEFAULT_LIMIT;
    const skip = Number.isInteger(filters?.offset) && (filters!.offset as number) > 0 ? (filters!.offset as number) : 0;

    const load = async () => {
      const menus = await prisma.menu.findMany({
        where,
        select: menuSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
        skip
      });
      const rows = includeImages ? await withMenuImages(menus) : menus;
      return rows.map((menu: any) => ({
        ...menu,
        steps: sanitizeMenuSteps(menu?.steps),
      }));
    };

    // Free-text searches have unbounded key space: never cache them.
    if (options.bypassCache || search) return load();

    const key = `menus:list:${JSON.stringify([filters?.isActive ?? null, filters?.serviceId ?? null, includeImages, take, skip])}`;
    return cache.wrap(key, load, { ttlMs: CACHE_TTL_MS });
  },

  async getMenuById(id: number, options?: { includeImages?: boolean; bypassCache?: boolean }) {
    if (!Number.isInteger(id)) throw new AppError('Menu not found', 404);
    const load = async () => {
      const menu = await prisma.menu.findUnique({ where: { id }, select: menuSelect });
      if (!menu) throw new AppError('Menu not found', 404);
      const [row] = options?.includeImages ? await withMenuImages([menu]) : [menu];
      return {
        ...(row as any),
        steps: sanitizeMenuSteps((row as any)?.steps),
      };
    };
    if (options?.bypassCache) return load();
    return cache.wrap(`menus:byId:${options?.includeImages ? 1 : 0}:${id}`, load, { ttlMs: CACHE_TTL_MS });
  },

  async createMenu(data: {
    name: string;
    description: string;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
    price?: number;
    image?: string;
    minPeople?: number | null;
    steps?: any;
    productIds?: number[];
    serviceIds?: number[];
    services?: number[];
  }) {
    parseOrThrow(menuSchemas.create, data);
    const productIds = data.productIds ? Array.from(new Set(data.productIds)) : undefined;
    const serviceIds = (data.serviceIds || data.services) ? Array.from(new Set(data.serviceIds || data.services || [])) : undefined;
    if (productIds) await assertProductsExist(productIds);
    if (serviceIds) await assertServicesExist(serviceIds);

    const image = await normalizeImageValue(isOwnImageUrl(data.image) ? undefined : data.image, { prefix: 'menu' });

    const steps = sanitizeMenuSteps(data.steps ?? undefined);

    const menu = await prisma.menu.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        startDate: data.startDate,
        endDate: data.endDate,
        price: data.price,
        image,
        minPeople: data.minPeople ?? null,
        steps,
        menuProducts: productIds ? {
          create: productIds.map(productId => ({ productId }))
        } : undefined,
        menuServices: serviceIds ? {
          create: serviceIds.map(serviceId => ({ serviceId }))
        } : undefined
      },
      include: {
        menuProducts: { select: { productId: true } },
        menuServices: { select: { serviceId: true } }
      }
    });

    invalidateCatalog('menus', 'products');
    return menu;
  },

  async updateMenu(id: number, data: Partial<{
    name: string;
    description: string;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    price: number;
    image: string;
    minPeople: number | null;
    steps: any;
    productIds: number[];
    products: number[];
    serviceIds: number[];
    services: number[];
  }>) {
    parseOrThrow(menuSchemas.update, data);
    const updateData: any = { ...data };
    delete updateData.productIds;
    delete updateData.products;
    delete updateData.serviceIds;
    delete updateData.services;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.menuProducts;
    delete updateData.menuServices;
    delete updateData.nameDe;
    delete updateData.descriptionDe;

    // Echoed back by the admin UI for legacy base64 rows: keep the stored image untouched.
    if (isOwnImageUrl(updateData.image)) delete updateData.image;
    if (updateData.image !== undefined) {
      updateData.image = await normalizeImageValue(updateData.image, { prefix: 'menu' });
    }

    if (updateData.steps !== undefined) {
      updateData.steps = updateData.steps === null ? Prisma.DbNull : sanitizeMenuSteps(updateData.steps);
    }

    const productIds = data.productIds !== undefined || data.products !== undefined
      ? Array.from(new Set(data.productIds ?? data.products ?? []))
      : undefined;
    const serviceIdsInput = data.serviceIds ?? data.services;
    const serviceIds = serviceIdsInput !== undefined ? Array.from(new Set(serviceIdsInput)) : undefined;
    if (productIds) await assertProductsExist(productIds);
    if (serviceIds) await assertServicesExist(serviceIds);

    try {
      // menu fields + association replacement succeed or fail together
      const results = await prisma.$transaction([
        prisma.menu.update({
          where: { id },
          data: updateData,
          include: {
            menuProducts: { select: { productId: true } },
            menuServices: { select: { serviceId: true } }
          }
        }),
        ...(productIds !== undefined
          ? [
              prisma.menuProduct.deleteMany({ where: { menuId: id } }),
              ...(productIds.length
                ? [prisma.menuProduct.createMany({ data: productIds.map(productId => ({ menuId: id, productId })), skipDuplicates: true })]
                : [])
            ]
          : []),
        ...(serviceIds !== undefined
          ? [
              prisma.menuService.deleteMany({ where: { menuId: id } }),
              ...(serviceIds.length
                ? [prisma.menuService.createMany({ data: serviceIds.map(serviceId => ({ menuId: id, serviceId })), skipDuplicates: true })]
                : [])
            ]
          : [])
      ]);

      invalidateCatalog('menus', 'products');
      if (productIds !== undefined || serviceIds !== undefined) {
        return this.getMenuById(id, { includeImages: true, bypassCache: true });
      }
      return results[0];
    } catch (error) {
      if ((error as any)?.code === 'P2025') throw new AppError('Menu not found', 404);
      throw error;
    } finally {
      invalidateCatalog('menus', 'products');
    }
  },

  async duplicateMenu(id: number) {
    const source = await prisma.menu.findUnique({
      where: { id },
      include: { menuProducts: true, menuServices: true }
    });
    if (!source) throw new AppError('Menu not found', 404);
    const created = await prisma.menu.create({
      data: {
        name: `${source.name} (Kopie)`,
        description: source.description,
        isActive: false,
        startDate: source.startDate,
        endDate: source.endDate,
        price: source.price,
        image: source.image,
        minPeople: source.minPeople,
        steps: (source.steps as any) ?? undefined,
        menuProducts: { create: source.menuProducts.map((mp) => ({ productId: mp.productId })) },
        menuServices: { create: source.menuServices.map((ms) => ({ serviceId: ms.serviceId })) }
      }
    });
    invalidateCatalog('menus', 'products');
    return created;
  },

  async deleteMenu(id: number) {
    try {
      await prisma.menu.delete({
        where: { id }
      });
    } catch (error) {
      if ((error as any)?.code === 'P2025') throw new AppError('Menu not found', 404);
      throw error;
    } finally {
      invalidateCatalog('menus', 'products');
    }
  },

  async restoreDefaultMenus() {
    const [services, activeProducts, existingMenus] = await Promise.all([
      prisma.service.findMany({ select: { id: true, name: true } }),
      prisma.product.findMany({ where: { available: true }, select: { id: true, category: true } }),
      prisma.menu.findMany({
        where: { name: { in: DEFAULT_MENUS.map((def) => def.name) } },
        select: { id: true, name: true },
        orderBy: { id: 'asc' }
      })
    ]);

    const existingByName = new Map<string, number>();
    for (const menu of existingMenus) {
      if (!existingByName.has(menu.name)) existingByName.set(menu.name, menu.id);
    }

    const pickServiceIdsForMenu = (serviceName?: string) => {
      if (serviceName) {
        const match = services.find((s) => s.name === serviceName);
        if (match) return [match.id];
      }
      return services.map((s) => s.id);
    };

    const pickProductIdsForMenu = (def: (typeof DEFAULT_MENUS)[number]) => {
      const productIdSet = new Set<number>();

      for (const p of activeProducts) {
        const category = String(p.category);
        const matches = def.productFilter.categories.includes(category as any);

        if (matches) productIdSet.add(p.id);
      }

      const productIds = Array.from(productIdSet);
      return productIds.length ? productIds : activeProducts.map((p) => p.id);
    };

    let created = 0;
    let updated = 0;
    const operations: any[] = [];

    for (const def of DEFAULT_MENUS) {
      const productIds = pickProductIdsForMenu(def);
      const serviceIds = pickServiceIdsForMenu(def.serviceName);
      const fields = {
        description: def.description,
        isActive: def.isActive,
        price: def.price,
        image: def.image,
        minPeople: def.minPeople,
        steps: sanitizeMenuSteps(def.steps as any)
      };
      const existingId = existingByName.get(def.name);

      if (existingId === undefined) {
        operations.push(
          prisma.menu.create({
            data: {
              name: def.name,
              ...fields,
              menuProducts: { create: productIds.map((productId) => ({ productId })) },
              menuServices: { create: serviceIds.map((serviceId) => ({ serviceId })) }
            }
          })
        );
        created += 1;
      } else {
        operations.push(
          prisma.menu.update({ where: { id: existingId }, data: fields }),
          prisma.menuProduct.deleteMany({ where: { menuId: existingId } }),
          prisma.menuService.deleteMany({ where: { menuId: existingId } })
        );
        if (productIds.length) {
          operations.push(prisma.menuProduct.createMany({ data: productIds.map((productId) => ({ menuId: existingId, productId })) }));
        }
        if (serviceIds.length) {
          operations.push(prisma.menuService.createMany({ data: serviceIds.map((serviceId) => ({ menuId: existingId, serviceId })) }));
        }
        updated += 1;
      }
    }

    try {
      // one round trip, all-or-nothing
      await prisma.$transaction(operations);
    } finally {
      invalidateCatalog('menus', 'products');
    }

    return {
      created,
      updated,
      totalDefaults: DEFAULT_MENUS.length,
      connectedServices: services.length,
      availableProducts: activeProducts.length
    };
  }
};
