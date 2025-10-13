import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@ninjapay/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router: Router = Router();

// Validation schemas
const loginSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  signature: z.string(), // Wallet signature for verification
  message: z.string(),
});

const registerSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  arciumKeyId: z.string(),
  email: z.string().email().optional(),
});

// POST /v1/auth/register - Register new user
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { walletAddress: body.walletAddress },
    });

    if (existing) {
      throw new AppError('User already exists', 409);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        walletAddress: body.walletAddress,
        arciumKeyId: body.arciumKeyId,
        email: body.email,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET || 'default-secret-change-this'
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          createdAt: user.createdAt,
        },
        token,
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/auth/login - Login with wallet signature
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);

    // TODO: Verify wallet signature (will implement with Solana Web3.js)
    // For now, just check if user exists
    const user = await prisma.user.findUnique({
      where: { walletAddress: body.walletAddress },
    });

    if (!user) {
      throw new AppError('User not found. Please register first.', 404);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET || 'default-secret-change-this'
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          email: user.email,
        },
        token,
      },
      timestamp: Date.now(),
    });
  })
);

// GET /v1/auth/me - Get current user
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    // TODO: Add authenticateUser middleware
    res.json({
      success: true,
      data: {
        message: 'Authentication endpoint ready',
        note: 'Requires authenticateUser middleware (to be added)',
      },
      timestamp: Date.now(),
    });
  })
);

export default router;
