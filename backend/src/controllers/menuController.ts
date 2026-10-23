import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { menuService } from '../services/menuService';
import { legacyBackupRestoreService } from '../services/legacyBackupRestoreService';

export const menuController = {
  async getMenus(req: AuthRequest, res: Response) {
    const { isActive, search, serviceId, includeImages } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search as string;
    if (serviceId !== undefined) {
      const parsed = parseInt(String(serviceId), 10);
      if (Number.isFinite(parsed)) filters.serviceId = parsed;
    }
    if (includeImages !== undefined) {
      filters.includeImages = String(includeImages) === 'true' || String(includeImages) === '1';
    }

    const menus = await menuService.getMenus(filters);
    res.json(menus);
  },

  async getMenuById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const includeImages = String(req.query.includeImages ?? '') === 'true' || String(req.query.includeImages ?? '') === '1';
    const menu = await menuService.getMenuById(parseInt(id), { includeImages });
    res.json(menu);
  },

  async createMenu(req: AuthRequest, res: Response) {
    const minPeopleValue = req.body.minPeople;
    const minPeople = minPeopleValue === '' || minPeopleValue === null || minPeopleValue === undefined
      ? null
      : parseInt(minPeopleValue, 10);
    const serviceIdsSource = Array.isArray(req.body?.serviceIds)
      ? req.body.serviceIds
      : Array.isArray(req.body?.services)
      ? req.body.services
      : undefined;
    const serviceIds = Array.isArray(serviceIdsSource)
      ? (serviceIdsSource as any[]).map((id) => parseInt(id as any, 10)).filter((id) => Number.isFinite(id))
      : undefined;
    const { category: _category, type: _type, services: _services, ...body } = req.body || {};
    const menu = await menuService.createMenu({
      ...body,
      serviceIds,
      minPeople: Number.isFinite(minPeople) ? minPeople : null,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
    });
    res.status(201).json(menu);
  },

  async updateMenu(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    const parseOptionalDate = (value: unknown) => {
      if (value === '' || value === null) return null;
      if (value === undefined) return undefined;
      const date = new Date(String(value));
      return Number.isFinite(date.getTime()) ? date : null;
    };

    // Normalize date fields (allow clearing via empty string)
    if (updateData.startDate !== undefined) updateData.startDate = parseOptionalDate(updateData.startDate);
    if (updateData.endDate !== undefined) updateData.endDate = parseOptionalDate(updateData.endDate);

    // Normalize price (avoid sending empty string/NaN to Prisma)
    if (updateData.price === '' || updateData.price === null) {
      updateData.price = null;
    } else if (updateData.price !== undefined) {
      const parsedPrice = parseFloat(updateData.price);
      updateData.price = Number.isFinite(parsedPrice) ? parsedPrice : null;
    }

    if (updateData.minPeople === '' || updateData.minPeople === null) {
      updateData.minPeople = null;
    } else if (updateData.minPeople !== undefined) {
      const parsedMinPeople = parseInt(updateData.minPeople, 10);
      updateData.minPeople = Number.isFinite(parsedMinPeople) ? parsedMinPeople : null;
    }
    // Remove client-only fields that Prisma doesn't accept
    delete updateData.products;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.menuProducts;
    delete updateData.menuServices;
    delete updateData.category;
    delete updateData.type;
    delete updateData.services;

    const serviceIdsSource = Array.isArray(req.body?.serviceIds)
      ? req.body.serviceIds
      : Array.isArray(req.body?.services)
      ? req.body.services
      : undefined;
    const serviceIds = Array.isArray(serviceIdsSource)
      ? (serviceIdsSource as any[]).map((id) => parseInt(id as any, 10)).filter((id) => Number.isFinite(id))
      : undefined;

    const menu = await menuService.updateMenu(parseInt(id), { ...updateData, serviceIds });
    res.json(menu);
  },

  async deleteMenu(req: AuthRequest, res: Response) {
    const { id } = req.params;
    await menuService.deleteMenu(parseInt(id));
    res.status(204).send();
  },

  async restoreDefaultMenus(_req: AuthRequest, res: Response) {
    const result = await menuService.restoreDefaultMenus();
    res.json(result);
  },

  async restoreLegacyMenusFromBackup(_req: AuthRequest, res: Response) {
    const result = await legacyBackupRestoreService.restoreLegacyMenusFromBackup();
    res.json(result);
  }
};
