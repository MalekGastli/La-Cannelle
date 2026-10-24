import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { systemService } from '../services/systemService';

export const systemController = {
  async getSystemStatus(req: AuthRequest, res: Response) {
    const status = await systemService.getSystemStatus();
    res.json(status);
  },

  async updateSystemStatus(req: AuthRequest, res: Response) {
    const updateData: any = { ...req.body };
    if (updateData.pauseUntil) {
      updateData.pauseUntil = updateData.pauseUntil ? new Date(updateData.pauseUntil) : null;
    }

    const status = await systemService.updateSystemStatus(updateData);
    res.json(status);
  },

  async getClosedDates(req: AuthRequest, res: Response) {
    const dates = await systemService.getClosedDates();
    res.json(dates);
  },

  async createClosedDate(req: AuthRequest, res: Response) {
    const { date, reason, recurring } = req.body;

    if (!date || !reason) {
      throw new AppError('Date and reason are required', 400);
    }

    const closedDate = await systemService.createClosedDate({
      date: new Date(date),
      reason,
      recurring: recurring || false
    });
    res.status(201).json(closedDate);
  },

  async deleteClosedDate(req: AuthRequest, res: Response) {
    const { id } = req.params;
    await systemService.deleteClosedDate(parseInt(id));
    res.status(204).send();
  }
};
