import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { reportsService } from '../services/reportsService';

const parseDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new AppError('Invalid date', 400);
  return date;
};

export const reportsController = {
  async getRevenueReport(req: AuthRequest, res: Response) {
    const { dateFrom, dateTo } = req.query;

    const report = await reportsService.getRevenueReport(
      parseDate(dateFrom),
      parseDate(dateTo)
    );
    res.json(report);
  },

  async getPopularItems(req: AuthRequest, res: Response) {
    const { dateFrom, dateTo } = req.query;

    const items = await reportsService.getPopularItems(
      parseDate(dateFrom),
      parseDate(dateTo)
    );
    res.json(items);
  },

  async getCustomerAnalytics(req: AuthRequest, res: Response) {
    const analytics = await reportsService.getCustomerAnalytics();
    res.json(analytics);
  }
};
