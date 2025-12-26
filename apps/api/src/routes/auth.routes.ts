import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

export const authRouter = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /auth/register
 * Register a new user
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Invalid input', validation.error.errors);
  }

  const { email, password } = validation.data;
  const result = await authService.register(email, password);

  res.status(201).json({
    message: 'Registration successful',
    ...result,
  });
});

/**
 * POST /auth/login
 * Login user
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Invalid input', validation.error.errors);
  }

  const { email, password } = validation.data;
  const result = await authService.login(email, password);

  res.json({
    message: 'Login successful',
    ...result,
  });
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const validation = refreshSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Invalid input', validation.error.errors);
  }

  const { refreshToken } = validation.data;
  const result = await authService.refreshToken(refreshToken);

  res.json(result);
});

/**
 * GET /auth/me
 * Get current user profile
 */
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const profile = await authService.getProfile(userId);

  res.json(profile);
});

/**
 * POST /auth/logout
 * Logout user (client-side token removal)
 */
authRouter.post('/logout', authenticate, (_req: Request, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // For added security, you could add the token to a blocklist
  res.json({ message: 'Logged out successfully' });
});
