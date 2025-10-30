import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@ninjapay/database';
import { Prisma } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateUser, authenticateMerchant } from '../middleware/authenticate';
import { z } from 'zod';
import { WalletUtils } from '@ninjapay/solana-utils';
import { authNonceService } from '../services/auth-nonce.service';
import { getJwtSecret } from '../utils/jwt';

const router: Router = Router();
// Lazy-load JWT_SECRET to ensure dotenv is loaded first
let _jwtSecret: string | null = null;
function getJwtSecretCached(): string {
  if (!_jwtSecret) {
    _jwtSecret = getJwtSecret();
  }
  return _jwtSecret;
}
const MIN_SIGNATURE_LENGTH = 64;

// Validation schemas
const nonceSchema = z.object({
  walletAddress: z.string().min(32).max(44),
});

const walletAuthSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  signature: z.string().min(MIN_SIGNATURE_LENGTH),
  message: z.string().min(32),
});

const loginSchema = walletAuthSchema;

const registerSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  signature: z.string().min(MIN_SIGNATURE_LENGTH),
  message: z.string().min(32),
  arciumKeyId: z.string(),
  email: z.string().email().optional(),
});

const merchantAuthSchema = z.object({
  businessName: z.string().min(1),
  email: z.string().email(),
  walletAddress: z.string().min(32).max(44),
  signature: z.string().min(MIN_SIGNATURE_LENGTH),
  message: z.string().min(32),
});

const merchantLoginSchema = z.object({
  email: z.string().email(),
  walletAddress: z.string().min(32).max(44),
  signature: z.string().min(MIN_SIGNATURE_LENGTH),
  message: z.string().min(32),
});

type DevAuthRecord = {
  userId: string;
  merchantId: string;
  businessName: string;
  email: string;
};

const devAuthStore = new Map<string, DevAuthRecord>();

function issueToken(payload: Record<string, unknown>, options?: jwt.SignOptions) {
  return jwt.sign(payload, getJwtSecretCached(), options);
}

function assertValidWallet(address: string) {
  if (!WalletUtils.isValidAddress(address)) {
    throw new AppError('Invalid wallet address', 400);
  }
}

function verifyWalletAuth({
  walletAddress,
  signature,
  message,
}: z.infer<typeof walletAuthSchema>) {
  assertValidWallet(walletAddress);

  const nonceValid = authNonceService.consume(walletAddress, message);
  if (!nonceValid) {
    throw new AppError('Invalid or expired authentication nonce', 401);
  }

  const signatureValid = WalletUtils.verifySignature(message, signature, walletAddress);
  if (!signatureValid) {
    throw new AppError('Invalid wallet signature', 401);
  }
}

// POST /v1/auth/nonce - Issue authentication nonce
router.post(
  '/nonce',
  asyncHandler(async (req, res) => {
    const { walletAddress } = nonceSchema.parse(req.body ?? {});
    assertValidWallet(walletAddress);

    const { message, expiresIn } = authNonceService.generate(walletAddress);

    res.json({
      success: true,
      data: {
        nonce: message,
        expiresIn,
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/auth/register - Register new user
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    verifyWalletAuth(body);

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
    const token = issueToken({ userId: user.id, walletAddress: user.walletAddress });

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

    verifyWalletAuth(body);

    const walletAddress = body.walletAddress.trim();

    try {
      let user = await prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            walletAddress,
            arciumKeyId: `arcium_${walletAddress.substring(0, 8)}`,
          },
        });
      }

      let merchant = await prisma.merchant.findFirst({
        where: { userId: user.id },
      });

      if (!merchant) {
        merchant = await prisma.merchant.create({
          data: {
            userId: user.id,
            businessName: `Merchant ${walletAddress.substring(0, 8)}`,
            email: user.email ?? `merchant_${walletAddress.substring(0, 8)}@ninjapay.xyz`,
            apiKey: `nj_${Math.random().toString(36).slice(2, 12)}${Math.random()
              .toString(36)
              .slice(2, 12)}`,
            kycStatus: 'PENDING',
          },
        });
      }

      const token = issueToken({
        userId: user.id,
        walletAddress: user.walletAddress,
        merchantId: merchant?.id,
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            walletAddress: user.walletAddress,
            email: user.email,
            merchantId: merchant?.id ?? null,
            businessName: merchant?.businessName ?? null,
            kycStatus: merchant?.kycStatus ?? null,
          },
          merchant: merchant
            ? {
                id: merchant.id,
                businessName: merchant.businessName,
                email: merchant.email,
                kycStatus: merchant.kycStatus,
              }
            : null,
          token,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError) {
        const existing = devAuthStore.get(walletAddress);
        if (!existing) {
          const fallback: DevAuthRecord = {
            userId: `dev_user_${walletAddress.slice(0, 8)}`,
            merchantId: `dev_merchant_${walletAddress.slice(0, 8)}`,
            businessName: `Dev Merchant ${walletAddress.slice(0, 6)}`,
            email: `dev_${walletAddress.slice(0, 8)}@ninjapay.local`,
          };
          devAuthStore.set(walletAddress, fallback);
        }
        const record = devAuthStore.get(walletAddress)!;
        const token = issueToken({
          userId: record.userId,
          walletAddress,
          merchantId: record.merchantId,
          devFallback: true,
        });
        return res.json({
          success: true,
          data: {
            user: {
              id: record.userId,
              walletAddress,
              email: record.email,
              merchantId: record.merchantId,
              businessName: record.businessName,
              kycStatus: 'PENDING',
            },
            merchant: {
              id: record.merchantId,
              businessName: record.businessName,
              email: record.email,
              kycStatus: 'PENDING',
            },
            token,
            devFallback: true,
          },
          timestamp: Date.now(),
        });
      }
      throw error;
    }
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
    const body = merchantAuthSchema.parse(req.body);
    verifyWalletAuth(body);

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
    const token = issueToken(
      { userId: user.id, merchantId: merchant.id, walletAddress: user.walletAddress },
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
    const body = merchantLoginSchema.parse(req.body);
    verifyWalletAuth(body);

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
    const token = issueToken(
      { userId: merchant.userId, merchantId: merchant.id, walletAddress: merchant.user.walletAddress },
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
