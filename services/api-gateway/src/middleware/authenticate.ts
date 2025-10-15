import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@ninjapay/database';
import { AppError } from './errorHandler';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        email?: string | null;
      };
      merchantId?: string;
    }
  }
}

interface JWTPayload {
  userId: string;
  walletAddress: string;
  merchantId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate users via JWT token
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-this'
    ) as JWTPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        walletAddress: true,
        email: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid authentication token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Authentication token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to authenticate merchants via API key or JWT
 */
export const authenticateMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for API key first
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
      // Validate API key from database
      const merchant = await prisma.merchant.findFirst({
        where: {
          apiKeys: {
            some: {
              key: apiKey,
              active: true,
            },
          },
        },
        select: {
          id: true,
          businessName: true,
          email: true,
        },
      });

      if (!merchant) {
        throw new AppError('Invalid API key', 401);
      }

      req.merchantId = merchant.id;
      next();
      return;
    }

    // Fall back to JWT authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication credentials provided', 401);
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-this'
    ) as JWTPayload;

    // Get merchant from database
    const merchant = await prisma.merchant.findUnique({
      where: { id: decoded.merchantId || decoded.userId },
      select: {
        id: true,
        businessName: true,
        email: true,
      },
    });

    if (!merchant) {
      throw new AppError('Merchant not found', 404);
    }

    req.merchantId = merchant.id;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid authentication token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Authentication token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't throw error if no token
 */
export const authenticateOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-this'
    ) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        walletAddress: true,
        email: true,
      },
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
