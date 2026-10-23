import express from 'express';
import { accessoryController } from '../controllers/accessoryController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public routes
router.get('/', asyncHandler(accessoryController.getAccessories));
router.get('/:id', asyncHandler(accessoryController.getAccessoryById));

// Admin routes
router.use(authenticate);
router.use(requireAdmin);

router.post('/restore-defaults', asyncHandler(accessoryController.restoreDefaultAccessories));
router.post('/', asyncHandler(accessoryController.createAccessory));
router.put('/:id', asyncHandler(accessoryController.updateAccessory));
router.delete('/:id', asyncHandler(accessoryController.deleteAccessory));

export default router;
