import express from 'express';
import { phoneController } from '../controllers/phoneController';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Public endpoint: resolve "+XX..." into country/flag data.
router.get('/country-flag', asyncHandler(phoneController.getCountryFlag));

export default router;

