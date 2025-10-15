import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@ninjapay/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateUser, authenticateMerchant } from '../middleware/authenticate';
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
  authenticateUser,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/auth/merchant/register - Register new merchant
router.post(
  '/merchant/register',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      businessName: z.string().min(1),
      email: z.string().email(),
      walletAddress: z.string().min(32).max(44),
    });

    const body = schema.parse(req.body);

    // Check if merchant already exists
    const existing = await prisma.merchant.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      throw new AppError('Merchant already exists', 409);
    }

    // Create or find user
    let user = await prisma.user.findUnique({
      where: { walletAddress: body.walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: body.walletAddress,
          email: body.email,
          arciumKeyId: `arcium_key_${Date.now()}`, // Placeholder
        },
      });
    }

    // Generate API key
    const apiKey = `nj_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Create merchant
    const merchant = await prisma.merchant.create({
      data: {
        userId: user.id,
        businessName: body.businessName,
        email: body.email,
        apiKey: apiKey,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, merchantId: merchant.id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET || 'default-secret-change-this',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          email: merchant.email,
        },
        apiKey: apiKey,
        token,
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/auth/merchant/login - Merchant login
router.post(
  '/merchant/login',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      walletAddress: z.string().min(32).max(44),
    });

    const body = schema.parse(req.body);

    // Find merchant
    const merchant = await prisma.merchant.findUnique({
      where: { email: body.email },
      include: { user: true },
    });

    if (!merchant) {
      throw new AppError('Merchant not found', 404);
    }

    if (merchant.user.walletAddress !== body.walletAddress) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: merchant.userId, merchantId: merchant.id, walletAddress: merchant.user.walletAddress },
      process.env.JWT_SECRET || 'default-secret-change-this',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          email: merchant.email,
          kycStatus: merchant.kycStatus,
        },
        token,
      },
      timestamp: Date.now(),
    });
  })
);

export default router;
