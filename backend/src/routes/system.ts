import express from 'express';
import { systemController } from '../controllers/systemController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public route to check system status (for order page)
router.get('/status', asyncHandler(systemController.getSystemStatus));
router.get('/closed-dates', asyncHandler(systemController.getClosedDates));

// Admin routes
router.use(authenticate);
router.use(requireAdmin);

router.put('/status', asyncHandler(systemController.updateSystemStatus));
router.post('/closed-dates', asyncHandler(systemController.createClosedDate));
router.delete('/closed-dates/:id', asyncHandler(systemController.deleteClosedDate));

export default router;
