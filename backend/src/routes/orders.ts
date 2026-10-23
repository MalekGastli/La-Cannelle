import express from 'express';
import { orderController } from '../controllers/orderController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create order (client or guest)
router.post('/', asyncHandler(orderController.createOrder));

// Get orders (filtered by user role)
router.get('/', asyncHandler(orderController.getOrders));

// Get single order
router.get('/:id', asyncHandler(orderController.getOrderById));

// Update order status (admin only)
router.patch('/:id/status', requireAdmin, asyncHandler(orderController.updateOrderStatus));

// Update payment status (admin only)
router.patch('/:id/payment', requireAdmin, asyncHandler(orderController.updatePaymentStatus));

// Delete order(s) (admin only)
router.delete('/:id', requireAdmin, asyncHandler(orderController.deleteOrder));
router.delete('/', requireAdmin, asyncHandler(orderController.deleteAllOrders));

export default router;
