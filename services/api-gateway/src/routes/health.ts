import { Router } from "express";
import { prisma } from '@ninjapay/database';
import Redis from 'ioredis';

const router: Router = Router();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Basic health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'ninjapay-api-gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// Detailed health check with dependencies
router.get('/detailed', async (req, res) => {
  const checks = {
    database: 'unknown',
    redis: 'unknown',
    solana: 'unknown',
  };

  // Check PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
  }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = 'healthy';
  } catch (error) {
    checks.redis = 'unhealthy';
  }

  // Check Solana RPC
  try {
    const response = await fetch(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth',
      }),
    });
    const data: any = await response.json();
    checks.solana = data.result === 'ok' ? 'healthy' : 'degraded';
  } catch (error) {
    checks.solana = 'unhealthy';
  }

  const allHealthy = Object.values(checks).every((status) => status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    data: {
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'ninjapay-api-gateway',
      version: '1.0.0',
      checks,
      timestamp: new Date().toISOString(),
    },
  });
});

// Readiness probe (for K8s/Docker)
router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// Liveness probe (for K8s/Docker)
router.get('/live', (req, res) => {
  res.status(200).json({ alive: true });
});

export default router;
