import express from 'express';
import { todoController } from '../controllers/todoController';
import { authenticate, requireStaff } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.use(authenticate);
router.use(requireStaff);

router.get('/', asyncHandler(todoController.getTodos));
router.post('/', asyncHandler(todoController.createTodo));
router.put('/:id', asyncHandler(todoController.updateTodo));
router.delete('/:id', asyncHandler(todoController.deleteTodo));

export default router;

