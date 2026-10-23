import express from 'express';
import { serviceController } from '../controllers/serviceController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public routes
router.get('/', asyncHandler(serviceController.getServices));
router.get('/:id', asyncHandler(serviceController.getServiceById));

// Admin routes
router.use(authenticate);
router.use(requireAdmin);

router.post('/restore-defaults', asyncHandler(serviceController.restoreDefaultServices));
router.post('/', asyncHandler(serviceController.createService));
router.put('/:id', asyncHandler(serviceController.updateService));
router.delete('/:id', asyncHandler(serviceController.deleteService));

export default router;
