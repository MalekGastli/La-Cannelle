import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

const toOptionalString = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
};

export type TodoCreateInput = {
  text: string;
};

export type TodoUpdateInput = Partial<{
  text: string;
  completed: boolean;
}>;

export const todoService = {
  async getTodos(filters?: { completed?: boolean }) {
    const where: any = {};
    if (filters?.completed !== undefined) {
      where.completed = filters.completed;
    }

    return prisma.todo.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { updatedAt: 'desc' }
      ]
    });
  },

  async createTodo(data: TodoCreateInput) {
    const text = toOptionalString(data.text);
    if (!text) {
      throw new AppError('text is required', 400);
    }
    if (text.length > 500) {
      throw new AppError('text is too long (max 500 characters)', 400);
    }

    return prisma.todo.create({
      data: {
        text,
        completed: false
      }
    });
  },

  async updateTodo(id: number, data: TodoUpdateInput) {
    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Todo not found', 404);
    }

    const update: any = {};
    if (data.text !== undefined) {
      const text = toOptionalString(data.text);
      if (!text) throw new AppError('text cannot be empty', 400);
      if (text.length > 500) throw new AppError('text is too long (max 500 characters)', 400);
      update.text = text;
    }
    if (data.completed !== undefined) {
      update.completed = Boolean(data.completed);
    }

    if (Object.keys(update).length === 0) {
      return existing;
    }

    return prisma.todo.update({
      where: { id },
      data: update
    });
  },

  async deleteTodo(id: number) {
    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Todo not found', 404);
    }
    await prisma.todo.delete({ where: { id } });
    return { deleted: true };
  }
};

