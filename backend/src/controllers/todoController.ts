import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { todoService } from '../services/todoService';

export const todoController = {
  async getTodos(req: AuthRequest, res: Response) {
    const { completed } = req.query;
    const filters: any = {};
    if (completed !== undefined) {
      filters.completed = String(completed) === 'true';
    }
    const todos = await todoService.getTodos(filters);
    res.json(todos);
  },

  async createTodo(req: AuthRequest, res: Response) {
    const todo = await todoService.createTodo(req.body);
    res.status(201).json(todo);
  },

  async updateTodo(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const todo = await todoService.updateTodo(parseInt(id, 10), req.body);
    res.json(todo);
  },

  async deleteTodo(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const result = await todoService.deleteTodo(parseInt(id, 10));
    res.json(result);
  }
};

