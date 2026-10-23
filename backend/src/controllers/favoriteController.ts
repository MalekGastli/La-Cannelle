import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { favoriteService } from '../services/favoriteService';
import { AppError } from '../middleware/errorHandler';

export const favoriteController = {
  async getFavorites(req: AuthRequest, res: Response) {
    const userId = req.user?.id ?? 0;
    const favorites = await favoriteService.getFavorites(userId);
    res.json(favorites);
  },

  async addFavorite(req: AuthRequest, res: Response) {
    const { productId } = req.body;
    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }

    const userId = req.user?.id ?? 0;
    const product = await favoriteService.addFavorite(userId, productId);
    res.status(201).json(product);
  },

  async removeFavorite(req: AuthRequest, res: Response) {
    const { productId } = req.params;
    const userId = req.user?.id ?? 0;
    await favoriteService.removeFavorite(userId, parseInt(productId));
    res.status(204).send();
  }
};
