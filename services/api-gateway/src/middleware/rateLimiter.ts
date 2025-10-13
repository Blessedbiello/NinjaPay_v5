import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Global rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60'), // 60 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
    timestamp: Date.now(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API key specific rate limiter (stricter)
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute for API keys
  keyGenerator: (req) => {
    return req.headers['x-api-key'] as string || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'API rate limit exceeded.',
    },
    timestamp: Date.now(),
  },
});

// Redis-based rate limiting helper
export class RedisRateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = redis;
  }

  async checkLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const currentCount = await this.redis.incr(key);

    if (currentCount === 1) {
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
    }

    return currentCount <= limit;
  }

  async getRemainingRequests(key: string, limit: number): Promise<number> {
    const currentCount = await this.redis.get(key);
    return Math.max(0, limit - parseInt(currentCount || '0'));
  }
}

export const redisRateLimiter = new RedisRateLimiter();
