import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { customerService } from '../services/customerService';
import { parsePagination, setTotalCount } from '../utils/pagination';

export const customerController = {
  async getCustomers(req: AuthRequest, res: Response) {
    const { status, tier, search } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (tier) filters.tier = tier;

    if (search) filters.search = String(search).slice(0, 100);

    const page = parsePagination(req.query as Record<string, unknown>);
    const { customers, total } = await customerService.getCustomers({
      ...filters,
      take: page.take,
      skip: page.skip,
      withTotal: page.paginated
    });
    if (total !== undefined) setTotalCount(res, total);
    res.json(customers);
  },

  async getCustomerById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(parseInt(id));
    res.json(customer);
  }
};
