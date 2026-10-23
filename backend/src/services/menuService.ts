import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { normalizeImageValue } from '../utils/uploads';
import { DEFAULT_MENUS } from '../data/defaultMenus';

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
  async getMenus(filters?: {
    isActive?: boolean;
    search?: string;
    serviceId?: number;
    includeImages?: boolean;
  }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters?.serviceId) {
      where.menuServices = { some: { serviceId: filters.serviceId } };
    }

    const includeImages = Boolean(filters?.includeImages);

    const select: any = {
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
    };
    if (includeImages) {
      select.image = true;
    }

    const menus = await prisma.menu.findMany({
      where,
      select,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return menus.map((menu: any) => ({
      ...menu,
      steps: sanitizeMenuSteps(menu?.steps),
    }));
  },

  async getMenuById(id: number, options?: { includeImages?: boolean }) {
    const select: any = {
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
    };
    if (options?.includeImages) {
      select.image = true;
    }

    const menu = await prisma.menu.findUnique({
      where: { id },
      select
    });

    if (!menu) {
      throw new AppError('Menu not found', 404);
    }

    return {
      ...(menu as any),
      steps: sanitizeMenuSteps((menu as any)?.steps),
    };
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
    const image = await normalizeImageValue(data.image, { prefix: 'menu' });

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
        menuProducts: data.productIds ? {
          create: data.productIds.map(productId => ({ productId }))
        } : undefined,
        menuServices: (data.serviceIds || data.services) ? {
          create: (data.serviceIds || data.services || []).map(serviceId => ({ serviceId }))
        } : undefined
      },
      include: {
        menuProducts: { select: { productId: true } },
        menuServices: { select: { serviceId: true } }
      }
    });

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

    if (updateData.image !== undefined) {
      updateData.image = await normalizeImageValue(updateData.image, { prefix: 'menu' });
    }

    if (updateData.steps !== undefined) {
      updateData.steps = sanitizeMenuSteps(updateData.steps);
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: updateData,
      include: {
        menuProducts: { select: { productId: true } },
        menuServices: { select: { serviceId: true } }
      }
    });

    // Update product associations if provided
    if (data.productIds !== undefined) {
      // Delete existing associations
      await prisma.menuProduct.deleteMany({
        where: { menuId: id }
      });

      // Create new associations
      if (data.productIds.length > 0) {
        await prisma.menuProduct.createMany({
          data: data.productIds.map(productId => ({ menuId: id, productId }))
        });
      }

      // Fetch updated menu
      return this.getMenuById(id, { includeImages: true });
    }

    const serviceIds = data.serviceIds ?? data.services;
    if (serviceIds !== undefined) {
      await prisma.menuService.deleteMany({
        where: { menuId: id }
      });

      if (serviceIds.length > 0) {
        await prisma.menuService.createMany({
          data: serviceIds.map(serviceId => ({ menuId: id, serviceId }))
        });
      }

      return this.getMenuById(id, { includeImages: true });
    }

    return menu;
  },

  async deleteMenu(id: number) {
    await prisma.menu.delete({
      where: { id }
    });
  },

  async restoreDefaultMenus() {
    const services = await prisma.service.findMany({
      select: { id: true, name: true }
    });
    const activeProducts = await prisma.product.findMany({
      where: { available: true },
      select: { id: true, category: true }
    });

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

    for (const def of DEFAULT_MENUS) {
      const productIds = pickProductIdsForMenu(def);
      const serviceIds = pickServiceIdsForMenu(def.serviceName);

      const existing = await prisma.menu.findFirst({ where: { name: def.name }, select: { id: true } });

      if (!existing) {
        await prisma.menu.create({
          data: {
            name: def.name,
            description: def.description,
            isActive: def.isActive,
            price: def.price,
            image: def.image,
            minPeople: def.minPeople,
            steps: sanitizeMenuSteps(def.steps as any)
          }
        });
        created += 1;
      } else {
        await prisma.menu.update({
          where: { id: existing.id },
          data: {
            description: def.description,
            isActive: def.isActive,
            price: def.price,
            image: def.image,
            minPeople: def.minPeople,
            steps: sanitizeMenuSteps(def.steps as any)
          }
        });
        updated += 1;
      }

      const menu = await prisma.menu.findFirst({ where: { name: def.name }, select: { id: true } });
      if (!menu) continue;

      await prisma.$transaction([
        prisma.menuProduct.deleteMany({ where: { menuId: menu.id } }),
        prisma.menuService.deleteMany({ where: { menuId: menu.id } }),
        productIds.length ? prisma.menuProduct.createMany({ data: productIds.map((productId) => ({ menuId: menu.id, productId })) }) : prisma.menuProduct.deleteMany({ where: { menuId: menu.id } }),
        serviceIds.length ? prisma.menuService.createMany({ data: serviceIds.map((serviceId) => ({ menuId: menu.id, serviceId })) }) : prisma.menuService.deleteMany({ where: { menuId: menu.id } })
      ]);
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
