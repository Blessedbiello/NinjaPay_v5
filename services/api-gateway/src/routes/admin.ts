import { Router, Request, Response, NextFunction } from 'express';
import { prisma, KYCStatus, ComputationStatus, TxStatus } from '@ninjapay/database';
import { createLogger } from '@ninjapay/logger';

const router: Router = Router();
const logger = createLogger('admin-routes');
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  throw new Error('ADMIN_API_KEY environment variable must be configured for admin routes');
}

// Simple admin authentication middleware (in production, use proper JWT/OAuth)
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminKey = req.headers['x-admin-key'];

  if (adminKey !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// Apply admin authentication to all routes
router.use(adminAuth);

const BUCKETS = 12;
const BUCKET_MS = 5 * 60 * 1000;

const computeTimeline = (payments: { createdAt: Date; finalizedAt: Date | null }[], now: Date) => {
  const start = new Date(now.getTime() - BUCKET_MS * BUCKETS);
  const buckets = Array.from({ length: BUCKETS }, (_, idx) => {
    const minutesAgo = (BUCKETS - idx - 1) * 5;
    return {
      label: minutesAgo === 0 ? 'now' : `${minutesAgo}m ago`,
      from: new Date(start.getTime() + idx * BUCKET_MS),
      to: new Date(start.getTime() + (idx + 1) * BUCKET_MS),
      tpsCount: 0,
      latencySamples: [] as number[],
    };
  });

  for (const payment of payments) {
    const bucketIndex = Math.min(
      BUCKETS - 1,
      Math.max(
        0,
        Math.floor((payment.createdAt.getTime() - start.getTime()) / BUCKET_MS)
      )
    );
    const bucket = buckets[bucketIndex];
    bucket.tpsCount += 1;
    if (payment.finalizedAt) {
      bucket.latencySamples.push(payment.finalizedAt.getTime() - payment.createdAt.getTime());
    }
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    tps: Math.round(bucket.tpsCount / (BUCKET_MS / 1000)),
    latency: bucket.latencySamples.length
      ? Math.round(
          bucket.latencySamples.reduce((total, value) => total + value, 0) / bucket.latencySamples.length
        )
      : 0,
  }));
};

const computeP95 = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(0.95 * (sorted.length - 1));
  return sorted[index];
};

const ACTIVE_COMPUTATION_STATUSES = new Set<ComputationStatus>([
  ComputationStatus.QUEUED,
  ComputationStatus.RUNNING,
]);

const isActiveComputationStatus = (status: ComputationStatus | null): boolean =>
  Boolean(status && ACTIVE_COMPUTATION_STATUSES.has(status));

const alertsEstimate = (
  activity: { computationStatus: ComputationStatus | null }[]
): number =>
  activity.filter((item) => isActiveComputationStatus(item.computationStatus)).length;

router.get('/overview', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const [
      merchantsPendingKyc,
      paymentIntentsLastHour,
      webhookErrors,
      recentwebhooks,
      merchantPending,
      latestApiLog,
    ] = await Promise.all([
      prisma.merchant.count({ where: { kycStatus: KYCStatus.PENDING } }),
      prisma.paymentIntent.findMany({
        where: { createdAt: { gte: oneHourAgo } },
        select: {
          id: true,
          status: true,
          computationStatus: true,
          computationError: true,
          createdAt: true,
          finalizedAt: true,
        },
      }),
      prisma.webhookDelivery.findMany({
        where: {
          OR: [
            { responseStatus: { gte: 400 } },
            { deliveredAt: null, attempts: { gt: 0 } },
          ],
          createdAt: { gte: oneHourAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.webhookDelivery.findMany({
        where: { createdAt: { gte: oneHourAgo } },
        select: { id: true },
      }),
      prisma.merchant.findMany({
        where: { kycStatus: KYCStatus.PENDING },
        select: { id: true, businessName: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 3,
      }),
      prisma.apiRequestLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const timeline = computeTimeline(
      paymentIntentsLastHour.map((item) => ({
        createdAt: item.createdAt,
        finalizedAt: item.finalizedAt,
      })),
      now
    );

    const latestBucket = timeline[timeline.length - 1] ?? { tps: 0, latency: 0 };
    const previousBucket = timeline[timeline.length - 2] ?? { tps: 0, latency: 0 };
    const latencies = paymentIntentsLastHour
      .filter((intent) => intent.finalizedAt)
      .map((intent) => intent.finalizedAt!.getTime() - intent.createdAt.getTime());

    const failedPayments = paymentIntentsLastHour.filter(
      (intent) =>
        intent.status === TxStatus.FAILED ||
        intent.computationStatus === ComputationStatus.FAILED ||
        intent.computationStatus === ComputationStatus.CANCELLED
    );

    res.json({
      metrics: {
        encryptedTps: latestBucket.tps,
        tpsDelta:
          previousBucket.tps === 0
            ? 0
            : (latestBucket.tps - previousBucket.tps) / Math.max(previousBucket.tps, 1),
        openAlerts: webhookErrors.length + failedPayments.length,
        ackNeeded: webhookErrors.filter((delivery) => !delivery.deliveredAt).length,
        arciumLatencyP95: computeP95(latencies),
        latencyDelta:
          previousBucket.latency === 0
            ? 0
            : (latestBucket.latency - previousBucket.latency) / Math.max(previousBucket.latency, 1),
        netFlows: paymentIntentsLastHour.length - failedPayments.length * 2,
        treasuryNote:
          failedPayments.length > 0
            ? 'Monitoring elevated failure rate in last hour'
            : 'Flows match expected baseline',
      },
      timeline,
      incidents: [
        ...webhookErrors.map((delivery) => ({
          id: delivery.id,
          title: delivery.responseStatus
            ? `Webhook responded with ${delivery.responseStatus}`
            : 'Webhook awaiting delivery',
          severity: delivery.responseStatus && delivery.responseStatus >= 500 ? 'high' : 'medium',
          owner: 'Platform Ops',
          detectedAt: delivery.createdAt.toISOString(),
        })),
        ...failedPayments.slice(0, 3).map((intent) => ({
          id: intent.id,
          title: intent.computationError || 'Payment intent failed',
          severity: 'high',
          owner: 'Risk Ops',
          detectedAt: intent.createdAt.toISOString(),
        })),
      ].slice(0, 5),
      tasks: merchantPending.map((merchant) => ({
        id: merchant.id,
        label: `Verify KYC for ${merchant.businessName}`,
        due: merchant.createdAt.toISOString(),
      })),
      uptime: [
        {
          name: 'API Gateway',
          status: 'Operational',
          latency: Math.max(1, now.getTime() - (latestApiLog?.createdAt?.getTime() ?? now.getTime())),
        },
        {
          name: 'Arcium Bridge',
          status: failedPayments.length > 0 ? 'Degraded' : 'Operational',
          latency: latestBucket.latency,
        },
        {
          name: 'MagicBlock Payroll',
          status: paymentIntentsLastHour.filter((intent) =>
            isActiveComputationStatus(intent.computationStatus)
          ).length > 5
            ? 'Degraded'
            : 'Operational',
          latency: timeline.reduce((sum, item) => sum + item.latency, 0) / Math.max(timeline.length, 1),
        },
        {
          name: 'Webhook Delivery',
          status: webhookErrors.length > 0 ? 'Degraded' : 'Operational',
          latency: recentwebhooks.length,
        },
      ],
    });
  } catch (error) {
    logger.error('Error fetching overview metrics', error);
    res.status(500).json({ error: 'Failed to fetch overview metrics' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    res.json({
      error: 'Deprecated endpoint. Use /v1/admin/overview instead.',
    });
  } catch (error) {
    logger.error('Error fetching admin stats', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /v1/admin/merchants
 * Get all merchants with pagination
 */
router.get('/merchants', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              walletAddress: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              products: true,
              customers: true,
              checkoutSessions: true,
              paymentLinks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.merchant.count(),
    ]);

    const normalized = merchants.map((merchant) => {
      const riskScore =
        (merchant._count.checkoutSessions + merchant._count.paymentLinks + merchant._count.products) * 5;
      return {
        id: merchant.id,
        name: merchant.businessName,
        status: merchant.kycStatus === KYCStatus.APPROVED ? 'Active' : 'Onboarding',
        kyc: merchant.kycStatus,
        risk: riskScore > 60 ? 'Critical' : riskScore > 30 ? 'Moderate' : 'Low',
        createdAt: merchant.createdAt,
        walletAddress: merchant.user?.walletAddress,
        metrics: merchant._count,
      };
    });

    res.json({
      merchants: normalized,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching merchants', error);
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
});

/**
 * GET /v1/admin/merchants/:id
 * Get detailed merchant information
 */
router.get('/merchants/:id', async (req: Request, res: Response) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        products: { take: 10, orderBy: { createdAt: 'desc' } },
        customers: { take: 10, orderBy: { createdAt: 'desc' } },
        apiKeys: { select: { id: true, name: true, active: true, lastUsedAt: true, createdAt: true } },
        webhooks: true,
        _count: {
          select: {
            products: true,
            customers: true,
            checkoutSessions: true,
            paymentLinks: true,
          },
        },
      },
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Get payment stats for this merchant
    const paymentStats = await prisma.paymentIntent.groupBy({
      by: ['status'],
      where: { merchantId: merchant.id },
      _count: true,
    });

    res.json({
      merchant,
      paymentStats,
    });
  } catch (error) {
    logger.error('Error fetching merchant details', error);
    res.status(500).json({ error: 'Failed to fetch merchant details' });
  }
});

/**
 * PATCH /v1/admin/merchants/:id
 * Update merchant KYC status or settings
 */
router.patch('/merchants/:id', async (req: Request, res: Response) => {
  try {
    const { kycStatus, settings } = req.body;
    const updates: any = {};

    if (kycStatus && Object.values(KYCStatus).includes(kycStatus)) {
      updates.kycStatus = kycStatus;
    }

    if (settings) {
      updates.settings = settings;
    }

    const merchant = await prisma.merchant.update({
      where: { id: req.params.id },
      data: updates,
    });

    logger.info(`Merchant ${req.params.id} updated`, updates);

    res.json(merchant);
  } catch (error) {
    logger.error('Error updating merchant', error);
    res.status(500).json({ error: 'Failed to update merchant' });
  }
});

/**
 * GET /v1/admin/payments
 * Get recent payments with filtering
 */
router.get('/payments', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.paymentIntent.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              email: true,
              name: true,
            },
          },
          product: {
            select: {
              name: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paymentIntent.count({ where }),
    ]);

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching payments', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/**
 * GET /v1/admin/payments/:id
 * Get detailed payment information
 */
router.get('/payments/:id', async (req: Request, res: Response) => {
  try {
    const payment = await prisma.paymentIntent.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        product: true,
        checkoutSession: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    logger.error('Error fetching payment details', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

/**
 * GET /v1/admin/api-logs
 * Get API request logs
 */
router.get('/api-logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.apiRequestLog.findMany({
        skip,
        take: limit,
        include: {
          merchant: {
            select: {
              businessName: true,
              id: true,
            },
          },
          apiKey: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.apiRequestLog.count(),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching API logs', error);
    res.status(500).json({ error: 'Failed to fetch API logs' });
  }
});

/**
 * GET /v1/admin/webhook-deliveries
 * Get webhook delivery status
 */
router.get('/webhook-deliveries', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        skip,
        take: limit,
        include: {
          webhook: {
            include: {
              merchant: {
                select: {
                  businessName: true,
                  id: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.webhookDelivery.count(),
    ]);

    res.json({
      deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching webhook deliveries', error);
    res.status(500).json({ error: 'Failed to fetch webhook deliveries' });
  }
});

router.get('/risk', async (req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const failedIntents = await prisma.paymentIntent.findMany({
      where: {
        OR: [
          { status: TxStatus.FAILED },
          { computationStatus: { in: [ComputationStatus.FAILED, ComputationStatus.CANCELLED] } },
        ],
        updatedAt: { gte: since },
      },
      select: {
        id: true,
        recipient: true,
        status: true,
        computationStatus: true,
        computationError: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 25,
    });

    const alerts = failedIntents.map((intent) => {
      const severity = intent.computationStatus === ComputationStatus.FAILED ? 90 : 70;
      const deltaMs = intent.updatedAt.getTime() - intent.createdAt.getTime();
      const normalizedScore = Math.min(100, severity + Math.min(deltaMs / 1000, 25));

      return {
        id: intent.id,
        type: 'Payment Failure',
        entity: intent.recipient,
        score: Math.round(normalizedScore),
        status: intent.computationStatus || intent.status,
        detectedAt: intent.updatedAt.toISOString(),
      };
    });

    res.json({ alerts });
  } catch (error) {
    logger.error('Error fetching risk alerts', error);
    res.status(500).json({ error: 'Failed to fetch risk alerts' });
  }
});

router.get('/agents', async (req: Request, res: Response) => {
  try {
    const recentActivity = await prisma.paymentIntent.findMany({
      where: { updatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      select: {
        id: true,
        computationStatus: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const queueDepth = recentActivity.filter((item) =>
      isActiveComputationStatus(item.computationStatus)
    ).length;

    const succeeded = recentActivity.filter(
      (item) => item.computationStatus === ComputationStatus.SUCCEEDED
    );

    const agents = [
      {
        id: 'arcium-worker',
        name: 'Arcium Worker',
        status: queueDepth > 5 ? 'Running with backlog' : 'Running',
        queueDepth,
        lastHeartbeat: recentActivity[0]?.updatedAt.toISOString() ?? null,
        lastRun: succeeded[0]?.id ?? '—',
      },
      {
        id: 'risk-agent',
        name: 'Risk Agent',
        status: recentActivity.length > 25 ? 'Running' : 'Idle',
        queueDepth: Math.max(0, alertsEstimate(recentActivity)),
        lastHeartbeat: recentActivity[0]?.updatedAt.toISOString() ?? null,
        lastRun: succeeded[0]?.id ?? '—',
      },
      {
        id: 'analytics-agent',
        name: 'Analytics Agent',
        status: 'Paused',
        queueDepth: 0,
        lastHeartbeat: null,
        lastRun: 'Awaiting schedule',
      },
    ];

    res.json({ agents });
  } catch (error) {
    logger.error('Error fetching agent telemetry', error);
    res.status(500).json({ error: 'Failed to fetch agent telemetry' });
  }
});

router.get('/treasury', async (req: Request, res: Response) => {
  try {
    const byCurrency = await prisma.paymentIntent.groupBy({
      by: ['currency', 'status'],
      _count: true,
    });

    const ledgerMap = new Map<string, { confirmed: number; failed: number }>();

    byCurrency.forEach((entry) => {
      const bucket = ledgerMap.get(entry.currency) ?? { confirmed: 0, failed: 0 };
      if (entry.status === TxStatus.CONFIRMED || entry.status === TxStatus.FINALIZED) {
        bucket.confirmed += entry._count;
      }
      if (entry.status === TxStatus.FAILED) {
        bucket.failed += entry._count;
      }
      ledgerMap.set(entry.currency, bucket);
    });

    const ledgers = Array.from(ledgerMap.entries()).map(([currency, stats]) => {
      const balance = stats.confirmed * 1_000; // Placeholder conversion
      const trend = stats.failed === 0 ? 0.02 : -stats.failed / Math.max(stats.confirmed, 1);
      return {
        id: currency,
        balance,
        trend,
        description: `${stats.confirmed} confirmed, ${stats.failed} failed`,
      };
    });

    res.json({ ledgers });
  } catch (error) {
    logger.error('Error fetching treasury metrics', error);
    res.status(500).json({ error: 'Failed to fetch treasury metrics' });
  }
});

/**
 * POST /v1/admin/auth/login
 * Admin login endpoint (simplified for demo)
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // In production, implement proper authentication
    // For now, just check against environment variable
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      res.json({
        success: true,
        session: 'admin_session_token_' + Date.now(),
        user: {
          email,
          role: 'admin',
        },
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error('Error during admin login', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
