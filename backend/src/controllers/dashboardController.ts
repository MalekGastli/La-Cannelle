import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dashboardService } from '../services/dashboardService';

export const dashboardController = {
  async getDashboard(req: AuthRequest, res: Response) {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
  }
};
