import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { CheckoutSessionService } from '../services/checkout-session.service';
import { prisma } from '@ninjapay/database';

const router: Router = Router();
const checkoutSessionService = new CheckoutSessionService(prisma);

// Validation schemas
const createCheckoutSessionSchema = z.object({
  payment_link_id: z.string().optional(),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  expires_in: z.number().int().positive().default(3600), // 1 hour default
  metadata: z.record(z.any()).optional(),
});

// POST /v1/checkout_sessions - Create checkout session
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createCheckoutSessionSchema.parse(req.body);

    // TODO: Get merchantId from auth middleware
    const merchantId = 'temp-merchant-id';

    const checkoutSession = await checkoutSessionService.create({
      merchantId,
      paymentLinkId: body.payment_link_id,
      successUrl: body.success_url,
      cancelUrl: body.cancel_url,
      expiresIn: body.expires_in,
      metadata: body.metadata,
    });

    res.status(201).json({
      success: true,
      data: {
        id: checkoutSession.id,
        merchant_id: checkoutSession.merchantId,
        payment_link_id: checkoutSession.paymentLinkId,
        payment_intent_id: checkoutSession.paymentIntentId,
        status: checkoutSession.status,
        expires_at: checkoutSession.expiresAt,
        success_url: checkoutSession.successUrl,
        cancel_url: checkoutSession.cancelUrl,
        metadata: checkoutSession.metadata,
        merchant: checkoutSession.merchant,
        payment_link: checkoutSession.paymentLink,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/checkout/${checkoutSession.id}`,
        created_at: checkoutSession.createdAt,
        updated_at: checkoutSession.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// GET /v1/checkout_sessions/:id - Retrieve checkout session
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const checkoutSession = await checkoutSessionService.retrieve(
      req.params.id
    );

    res.json({
      success: true,
      data: {
        id: checkoutSession.id,
        merchant_id: checkoutSession.merchantId,
        payment_link_id: checkoutSession.paymentLinkId,
        payment_intent_id: checkoutSession.paymentIntentId,
        status: checkoutSession.status,
        expires_at: checkoutSession.expiresAt,
        success_url: checkoutSession.successUrl,
        cancel_url: checkoutSession.cancelUrl,
        metadata: checkoutSession.metadata,
        merchant: checkoutSession.merchant,
        payment_link: checkoutSession.paymentLink,
        payment_intent: checkoutSession.paymentIntent
          ? {
              id: checkoutSession.paymentIntent.id,
              amount_commitment: checkoutSession.paymentIntent.amountCommitment,
              currency: checkoutSession.paymentIntent.currency,
              status: checkoutSession.paymentIntent.status.toLowerCase(),
              created_at: checkoutSession.paymentIntent.createdAt,
            }
          : null,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/checkout/${checkoutSession.id}`,
        created_at: checkoutSession.createdAt,
        updated_at: checkoutSession.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/checkout_sessions/:id/expire - Expire checkout session
router.post(
  '/:id/expire',
  asyncHandler(async (req, res) => {
    const checkoutSession = await checkoutSessionService.expire(req.params.id);

    res.json({
      success: true,
      data: {
        id: checkoutSession.id,
        merchant_id: checkoutSession.merchantId,
        status: checkoutSession.status,
        expires_at: checkoutSession.expiresAt,
        created_at: checkoutSession.createdAt,
        updated_at: checkoutSession.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

export default router;
