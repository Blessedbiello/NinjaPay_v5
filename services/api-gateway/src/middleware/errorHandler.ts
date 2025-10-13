import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@ninjapay/logger';

const logger = createLogger('error-handler');

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn('Operational error', {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: 'OPERATIONAL_ERROR',
        message: err.message,
      },
      timestamp: Date.now(),
    });
  }

  // Unknown error
  logger.error('Unexpected error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
    timestamp: Date.now(),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
