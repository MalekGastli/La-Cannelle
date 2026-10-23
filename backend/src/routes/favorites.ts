import express from 'express';
import { favoriteController } from '../controllers/favoriteController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(favoriteController.getFavorites));
router.post('/', asyncHandler(favoriteController.addFavorite));
router.delete('/:productId', asyncHandler(favoriteController.removeFavorite));

export default router;
