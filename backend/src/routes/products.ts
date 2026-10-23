import express from 'express';
import { productController } from '../controllers/productController';
import { authenticate, requireResource } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public routes
router.get('/', asyncHandler(productController.getProducts));
router.get('/:id', asyncHandler(productController.getProductById));

// Admin routes
router.use(authenticate);
router.use(requireResource('products'));

router.patch('/bulk', asyncHandler(productController.bulkUpdate));
router.delete('/', asyncHandler(productController.bulkDelete));
router.post('/:id/duplicate', asyncHandler(productController.duplicateProduct));
router.post('/', asyncHandler(productController.createProduct));
router.put('/:id', asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));

export default router;
