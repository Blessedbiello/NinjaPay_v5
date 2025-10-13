import { Router } from "express";
import { prisma } from '@ninjapay/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import crypto from 'crypto';

const router: Router = Router();

// Validation schema
const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  description: z.string().optional(),
});

// POST /v1/webhooks - Create webhook
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createWebhookSchema.parse(req.body);

    // TODO: Get merchant ID from auth middleware
    const merchantId = 'temp-merchant-id'; // Placeholder

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        merchantId,
        url: body.url,
        events: body.events,
        secret,
        description: body.description,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        enabled: webhook.enabled,
        createdAt: webhook.createdAt,
      },
      timestamp: Date.now(),
    });
  })
);

// GET /v1/webhooks - List webhooks
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // TODO: Get merchant ID from auth middleware
    const merchantId = 'temp-merchant-id';

    const webhooks = await prisma.webhook.findMany({
      where: { merchantId },
      select: {
        id: true,
        url: true,
        events: true,
        enabled: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: webhooks,
      timestamp: Date.now(),
    });
  })
);

// DELETE /v1/webhooks/:id - Delete webhook
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.webhook.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      data: {
        message: 'Webhook deleted successfully',
      },
      timestamp: Date.now(),
    });
  })
);

export default router;
