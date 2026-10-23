import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  position?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterData) {
    const { email, password, firstName, lastName, phone, company, position } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        company,
        position,
        role: 'CLIENT'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        position: true,
        role: true,
        createdAt: true
      }
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET as Secret,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    return { user, token };
  },

  async login(data: LoginData) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET as Secret,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        company: user.company,
        position: user.position,
        role: user.role,
        tier: user.tier,
        location: user.location,
        preferences: user.preferences,
        allergies: user.allergies
      },
      token
    };
  },

  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        position: true,
        role: true,
        tier: true,
        location: true,
        preferences: true,
        allergies: true,
        notes: true,
        status: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  },

  async updateProfile(userId: number, data: Partial<RegisterData & { location?: string; preferences?: string[]; allergies?: string[]; notes?: string }>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.preferences !== undefined && { preferences: data.preferences }),
        ...(data.allergies !== undefined && { allergies: data.allergies }),
        ...(data.notes !== undefined && { notes: data.notes })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        position: true,
        role: true,
        tier: true,
        location: true,
        preferences: true,
        allergies: true,
        notes: true,
        status: true
      }
    });

    return user;
  }
};
