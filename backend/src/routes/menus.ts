import express from 'express';
import { menuController } from '../controllers/menuController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public routes
router.get('/', asyncHandler(menuController.getMenus));
router.get('/:id', asyncHandler(menuController.getMenuById));

// Admin routes
router.use(authenticate);
router.use(requireAdmin);

router.post('/restore-defaults', asyncHandler(menuController.restoreDefaultMenus));
router.post('/restore-legacy', asyncHandler(menuController.restoreLegacyMenusFromBackup));
router.post('/', asyncHandler(menuController.createMenu));
router.put('/:id', asyncHandler(menuController.updateMenu));
router.delete('/:id', asyncHandler(menuController.deleteMenu));

export default router;
