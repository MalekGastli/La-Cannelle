import express from 'express';
import { customerController } from '../controllers/customerController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', asyncHandler(customerController.getCustomers));
router.get('/:id', asyncHandler(customerController.getCustomerById));

export default router;
