import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authService } from '../services/authService';
import { AppError } from '../middleware/errorHandler';

export const authController = {
  async register(req: AuthRequest, res: Response) {
    const { email, password, firstName, lastName, phone, company, position } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Missing required fields', 400);
    }

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      phone,
      company,
      position
    });

    res.status(201).json(result);
  },

  async login(req: AuthRequest, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password required', 400);
    }

    const result = await authService.login({ email, password });
    res.json(result);
  },

  async getProfile(req: AuthRequest, res: Response) {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const profile = await authService.getProfile(req.user.id);
    res.json(profile);
  },

  async updateProfile(req: AuthRequest, res: Response) {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const profile = await authService.updateProfile(req.user.id, req.body);
    res.json(profile);
  }
};
