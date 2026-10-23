import express from 'express';
import { reportsController } from '../controllers/reportsController';
import { authenticate, requireResource } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.use(authenticate);
router.use(requireResource('reports'));

router.get('/revenue', asyncHandler(reportsController.getRevenueReport));
router.get('/popular-items', asyncHandler(reportsController.getPopularItems));
router.get('/customers', asyncHandler(reportsController.getCustomerAnalytics));

export default router;
