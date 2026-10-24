import express from 'express';
import { menuController } from '../controllers/menuController';
import { authenticate, requireResource } from '../middleware/auth';
import { sendStoredImage } from '../utils/catalogImages';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public routes (authenticate is soft: it only identifies team members so they get uncached, private responses)
router.use(authenticate);
router.get('/', asyncHandler(menuController.getMenus));
router.get('/:id/image', asyncHandler(sendStoredImage('menus')));
router.get('/:id', asyncHandler(menuController.getMenuById));

// Admin routes
router.use(requireResource('menus'));

router.post('/restore-defaults', asyncHandler(menuController.restoreDefaultMenus));
router.post('/restore-legacy', asyncHandler(menuController.restoreLegacyMenusFromBackup));
router.post('/:id/duplicate', asyncHandler(menuController.duplicateMenu));
router.post('/', asyncHandler(menuController.createMenu));
router.put('/:id', asyncHandler(menuController.updateMenu));
router.delete('/:id', asyncHandler(menuController.deleteMenu));

export default router;
