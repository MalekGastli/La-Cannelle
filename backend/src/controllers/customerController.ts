import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { customerService } from '../services/customerService';

export const customerController = {
  async getCustomers(req: AuthRequest, res: Response) {
    const { status, tier, search } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (tier) filters.tier = tier;
    if (search) filters.search = search as string;

    const customers = await customerService.getCustomers(filters);
    res.json(customers);
  },

  async getCustomerById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(parseInt(id));
    res.json(customer);
  }
};
