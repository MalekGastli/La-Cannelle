import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { serviceService } from '../services/serviceService';

export const serviceController = {
  async getServices(req: AuthRequest, res: Response) {
    const { occasion, isActive, search } = req.query;

    const filters: any = {};
    if (occasion) filters.occasion = String(occasion);
    if (isActive !== undefined) filters.isActive = String(isActive) === 'true';
    if (search) filters.search = String(search);

    const services = await serviceService.getServices(filters);
    res.json(services);
  },

  async getServiceById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const service = await serviceService.getServiceById(parseInt(id, 10));
    res.json(service);
  },

  async createService(req: AuthRequest, res: Response) {
    const service = await serviceService.createService(req.body);
    res.status(201).json(service);
  },

  async updateService(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const service = await serviceService.updateService(parseInt(id, 10), req.body);
    res.json(service);
  },

  async deleteService(req: AuthRequest, res: Response) {
    const { id } = req.params;
    await serviceService.deleteService(parseInt(id, 10));
    res.status(204).send();
  },

  async restoreDefaultServices(_req: AuthRequest, res: Response) {
    const result = await serviceService.restoreDefaultServices();
    res.json(result);
  }
};
