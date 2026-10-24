import express from 'express';
import { serviceController } from '../controllers/serviceController';
import { authenticate, requireResource } from '../middleware/auth';
import { sendStoredImage } from '../utils/catalogImages';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public routes (authenticate is soft: it only identifies team members so they get uncached, private responses)
router.use(authenticate);
router.get('/', asyncHandler(serviceController.getServices));
router.get('/:id/image', asyncHandler(sendStoredImage('services')));
router.get('/:id', asyncHandler(serviceController.getServiceById));

// Admin routes
router.use(requireResource('services'));

router.post('/restore-defaults', asyncHandler(serviceController.restoreDefaultServices));
router.post('/', asyncHandler(serviceController.createService));
router.put('/:id', asyncHandler(serviceController.updateService));
router.delete('/:id', asyncHandler(serviceController.deleteService));

export default router;
