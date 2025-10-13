import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@ninjapay/database';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    arciumKeyId: string;
  };
  merchant?: {
    id: string;
    apiKey: string;
  };
}

// JWT authentication for users
export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      walletAddress: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
      arciumKeyId: user.arciumKeyId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

// API key authentication for merchants
export const authenticateMerchant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AppError('API key required', 401);
    }

    // Find merchant by API key (hashed in DB)
    const merchant = await prisma.merchant.findUnique({
      where: { apiKey },
    });

    if (!merchant) {
      throw new AppError('Invalid API key', 401);
    }

    req.merchant = {
      id: merchant.id,
      apiKey: merchant.apiKey,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (allows both authenticated and anonymous requests)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      walletAddress: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (user) {
      req.user = {
        id: user.id,
        walletAddress: user.walletAddress,
        arciumKeyId: user.arciumKeyId,
      };
    }

    next();
  } catch (error) {
    // Invalid token, but that's okay for optional auth
    next();
  }
};
