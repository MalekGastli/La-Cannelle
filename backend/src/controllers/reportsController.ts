import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { reportsService } from '../services/reportsService';

export const reportsController = {
  async getRevenueReport(req: AuthRequest, res: Response) {
    const { dateFrom, dateTo } = req.query;

    const report = await reportsService.getRevenueReport(
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );
    res.json(report);
  },

  async getPopularItems(req: AuthRequest, res: Response) {
    const { dateFrom, dateTo } = req.query;

    const items = await reportsService.getPopularItems(
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );
    res.json(items);
  },

  async getCustomerAnalytics(req: AuthRequest, res: Response) {
    const analytics = await reportsService.getCustomerAnalytics();
    res.json(analytics);
  }
};
