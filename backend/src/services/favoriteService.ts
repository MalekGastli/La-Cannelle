import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export const favoriteService = {
  async getFavorites(userId: number) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: true
      }
    });

    return favorites.map(fav => fav.product);
  },

  async addFavorite(userId: number, productId: number) {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existing) {
      throw new AppError('Product already in favorites', 400);
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId
      },
      include: {
        product: true
      }
    });

    return favorite.product;
  },

  async removeFavorite(userId: number, productId: number) {
    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });
  }
};
