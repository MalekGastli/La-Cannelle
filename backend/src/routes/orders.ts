import express from 'express';
import { orderController } from '../controllers/orderController';
import { Response, NextFunction } from 'express';
import { authenticate, requirePermission, requireAuth, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.use(authenticate);

// Customers read their own orders; the team needs orders.view. Anonymous callers get nothing.
const readOrders = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === 'CLIENT') return next();
  if (!req.user) return requireAuth(req, res, next);
  return requirePermission('orders.view')(req, res, next);
};

// Create order (client or guest)
router.post('/', asyncHandler(orderController.createOrder));

// Get orders (filtered by user role)
router.get('/', readOrders, asyncHandler(orderController.getOrders));

// Get single order
router.get('/:id', readOrders, asyncHandler(orderController.getOrderById));

// Update order status (admin only)
router.patch('/:id/status', requirePermission('orders.edit'), asyncHandler(orderController.updateOrderStatus));

// Update payment status (admin only)
router.patch('/:id/payment', requirePermission('orders.edit'), asyncHandler(orderController.updatePaymentStatus));

// Delete order(s) (admin only)
router.delete('/:id', requirePermission('orders.delete'), asyncHandler(orderController.deleteOrder));
router.delete('/', requirePermission('orders.delete'), asyncHandler(orderController.deleteAllOrders));

export default router;
