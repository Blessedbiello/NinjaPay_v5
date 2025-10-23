import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateMerchant } from '../middleware/authenticate';
import { PaymentIntentService } from '../services/payment-intent.service';
import { ArciumClientService } from '../services/arcium-client.service';
import { prisma } from '@ninjapay/database';

const router: Router = Router();
const arcium = new ArciumClientService();
const paymentIntentService = new PaymentIntentService(prisma, arcium);

const serializePaymentIntent = (paymentIntent: any) => ({
  id: paymentIntent.id,
  merchant_id: paymentIntent.merchantId,
  customer_id: paymentIntent.customerId,
  product_id: paymentIntent.productId,
  recipient: paymentIntent.recipient,
  amount: null,
  amount_commitment: paymentIntent.amountCommitment,
  encrypted_amount: paymentIntent.encryptedAmount
    ? paymentIntent.encryptedAmount.toString('base64')
    : null,
  encryption_nonce: paymentIntent.encryptionNonce
    ? paymentIntent.encryptionNonce.toString('base64')
    : null,
  encryption_public_key: paymentIntent.encryptionPublicKey
    ? paymentIntent.encryptionPublicKey.toString('base64')
    : null,
  client_public_key: paymentIntent.clientPublicKey
    ? paymentIntent.clientPublicKey.toString('base64')
    : null,
  computation_id: paymentIntent.computationId,
  computation_status: paymentIntent.computationStatus,
  computation_error: paymentIntent.computationError,
  finalized_at: paymentIntent.finalizedAt,
  finalization_signature: paymentIntent.finalizationSignature,
  result_ciphertext: paymentIntent.resultCiphertext
    ? paymentIntent.resultCiphertext.toString('base64')
    : null,
  result_nonce: paymentIntent.resultNonce
    ? paymentIntent.resultNonce.toString('base64')
    : null,
  currency: paymentIntent.currency,
  status: paymentIntent.status.toLowerCase(),
  description: paymentIntent.description,
  tx_signature: paymentIntent.txSignature,
  metadata: paymentIntent.metadata,
  customer: paymentIntent.customer,
  product: paymentIntent.product,
  checkout_session: paymentIntent.checkoutSession,
  created_at: paymentIntent.createdAt,
  updated_at: paymentIntent.updatedAt,
});

// Validation schemas
const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USDC'),
  recipient: z.string(),
  customer_id: z.string().optional(),
  product_id: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updatePaymentIntentSchema = z.object({
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const listPaymentIntentsSchema = z.object({
  customer_id: z.string().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'CONFIRMED', 'FINALIZED', 'FAILED', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// POST /v1/payment_intents - Create payment intent
router.post(
  '/',
  authenticateMerchant,
  asyncHandler(async (req, res) => {
    const body = createPaymentIntentSchema.parse(req.body);

    const paymentIntent = await paymentIntentService.create({
      merchantId: req.merchantId!,
      recipient: body.recipient,
      amount: body.amount,
      currency: body.currency,
      customerId: body.customer_id,
      productId: body.product_id,
      description: body.description,
      metadata: body.metadata,
    });

    res.status(201).json({
      success: true,
      data: serializePaymentIntent(paymentIntent),
      timestamp: Date.now(),
    });
  })
);

// GET /v1/payment_intents/:id - Retrieve payment intent
router.get(
  '/:id',
  authenticateMerchant,
  asyncHandler(async (req, res) => {
    const paymentIntent = await paymentIntentService.retrieve(req.params.id);

    res.json({
      success: true,
      data: serializePaymentIntent(paymentIntent),
      timestamp: Date.now(),
    });
  })
);

// PATCH /v1/payment_intents/:id - Update payment intent
router.patch(
  '/:id',
  authenticateMerchant,
  asyncHandler(async (req, res) => {
    const body = updatePaymentIntentSchema.parse(req.body);

    const paymentIntent = await paymentIntentService.update(req.params.id, {
      description: body.description,
      metadata: body.metadata,
    });

    res.json({
      success: true,
      data: serializePaymentIntent(paymentIntent),
      timestamp: Date.now(),
    });
  })
);

// GET /v1/payment_intents - List payment intents
router.get(
  '/',
  authenticateMerchant,
  asyncHandler(async (req, res) => {
    const query = listPaymentIntentsSchema.parse(req.query);

    const result = await paymentIntentService.list({
      merchantId: req.merchantId!,
      customerId: query.customer_id,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    res.json({
      success: true,
      data: result.data.map(serializePaymentIntent),
      pagination: {
        total: result.total,
        limit: query.limit,
        offset: query.offset,
        has_more: result.hasMore,
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/payment_intents/:id/confirm - Confirm payment intent
router.post(
  '/:id/confirm',
  authenticateMerchant,
  asyncHandler(async (req, res) => {
    const paymentIntent = await paymentIntentService.confirm(req.params.id);

    res.json({
      success: true,
      data: {
        id: paymentIntent.id,
        merchant_id: paymentIntent.merchantId,
        customer_id: paymentIntent.customerId,
        recipient: paymentIntent.recipient,
        amount: null,
        amount_commitment: paymentIntent.amountCommitment,
        currency: paymentIntent.currency,
        status: paymentIntent.status.toLowerCase(),
        created_at: paymentIntent.createdAt,
        updated_at: paymentIntent.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/payment_intents/:id/cancel - Cancel payment intent
router.post(
  '/:id/cancel',
  authenticateMerchant,
  asyncHandler(async (req, res) => {
    const paymentIntent = await paymentIntentService.cancel(req.params.id);

    res.json({
      success: true,
      data: {
        id: paymentIntent.id,
        merchant_id: paymentIntent.merchantId,
        customer_id: paymentIntent.customerId,
        recipient: paymentIntent.recipient,
        amount: null,
        amount_commitment: paymentIntent.amountCommitment,
        currency: paymentIntent.currency,
        status: paymentIntent.status.toLowerCase(),
        created_at: paymentIntent.createdAt,
        updated_at: paymentIntent.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

export default router;
