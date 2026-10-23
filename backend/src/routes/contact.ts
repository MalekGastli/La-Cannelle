import { Router } from 'express';
import { sendContact } from '../controllers/contactController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/', asyncHandler(sendContact));

export default router;
