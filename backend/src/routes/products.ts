import express from 'express';
import { productController } from '../controllers/productController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public routes
router.get('/', asyncHandler(productController.getProducts));
router.get('/:id', asyncHandler(productController.getProductById));

// Admin routes
router.use(authenticate);
router.use(requireAdmin);

router.post('/', asyncHandler(productController.createProduct));
router.put('/:id', asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));

export default router;
