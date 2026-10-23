import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { accessoryService } from '../services/accessoryService';

export const accessoryController = {
  async getAccessories(req: AuthRequest, res: Response) {
    const { isActive, search } = req.query;
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = String(search);
    const accessories = await accessoryService.getAccessories(filters);
    res.json(accessories);
  },

  async getAccessoryById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const accessory = await accessoryService.getAccessoryById(parseInt(id, 10));
    res.json(accessory);
  },

  async createAccessory(req: AuthRequest, res: Response) {
    const accessory = await accessoryService.createAccessory(req.body);
    res.status(201).json(accessory);
  },

  async updateAccessory(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const accessory = await accessoryService.updateAccessory(parseInt(id, 10), req.body);
    res.json(accessory);
  },

  async deleteAccessory(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const result = await accessoryService.deleteAccessory(parseInt(id, 10));
    res.json(result);
  },

  async restoreDefaultAccessories(_req: AuthRequest, res: Response) {
    const result = await accessoryService.restoreDefaultAccessories();
    res.json(result);
  }
};
