import express from 'express';
import { accessoryController } from '../controllers/accessoryController';
import { authenticate, requireResource } from '../middleware/auth';
import { sendStoredImage } from '../utils/catalogImages';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public routes (authenticate is soft: it only identifies team members so they get uncached, private responses)
router.use(authenticate);
router.get('/', asyncHandler(accessoryController.getAccessories));
router.get('/:id/image', asyncHandler(sendStoredImage('accessories')));
router.get('/:id', asyncHandler(accessoryController.getAccessoryById));

// Admin routes
router.use(requireResource('accessories'));

router.post('/restore-defaults', asyncHandler(accessoryController.restoreDefaultAccessories));
router.post('/', asyncHandler(accessoryController.createAccessory));
router.put('/:id', asyncHandler(accessoryController.updateAccessory));
router.delete('/:id', asyncHandler(accessoryController.deleteAccessory));

export default router;
