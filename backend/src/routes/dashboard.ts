import express from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticate, requireStaff } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.use(authenticate);
router.use(requireStaff);

router.get('/', asyncHandler(dashboardController.getDashboard));

export default router;
