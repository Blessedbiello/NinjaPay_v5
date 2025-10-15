import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { CustomerService } from '../services/customer.service';

const router: Router = Router();
const prisma = new PrismaClient();
const customerService = new CustomerService(prisma);

// Validation schemas
const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  wallet_address: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().optional(),
  wallet_address: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const listCustomersSchema = z.object({
  email: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// POST /v1/customers - Create customer
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createCustomerSchema.parse(req.body);

    // TODO: Get merchantId from auth middleware
    const merchantId = 'temp-merchant-id';

    const customer = await customerService.create({
      merchantId,
      email: body.email,
      name: body.name,
      walletAddress: body.wallet_address,
      metadata: body.metadata,
    });

    res.status(201).json({
      success: true,
      data: {
        id: customer.id,
        merchant_id: customer.merchantId,
        email: customer.email,
        name: customer.name,
        wallet_address: customer.walletAddress,
        metadata: customer.metadata,
        created_at: customer.createdAt,
        updated_at: customer.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// GET /v1/customers/:id - Retrieve customer
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await customerService.retrieve(req.params.id);

    res.json({
      success: true,
      data: {
        id: customer.id,
        merchant_id: customer.merchantId,
        email: customer.email,
        name: customer.name,
        wallet_address: customer.walletAddress,
        metadata: customer.metadata,
        merchant: customer.merchant,
        payment_intents: customer.paymentIntents.map((pi) => ({
          id: pi.id,
          amount_commitment: pi.amountCommitment,
          currency: pi.currency,
          status: pi.status.toLowerCase(),
          created_at: pi.createdAt,
        })),
        created_at: customer.createdAt,
        updated_at: customer.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// PATCH /v1/customers/:id - Update customer
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = updateCustomerSchema.parse(req.body);

    const customer = await customerService.update(req.params.id, {
      name: body.name,
      walletAddress: body.wallet_address,
      metadata: body.metadata,
    });

    res.json({
      success: true,
      data: {
        id: customer.id,
        merchant_id: customer.merchantId,
        email: customer.email,
        name: customer.name,
        wallet_address: customer.walletAddress,
        metadata: customer.metadata,
        created_at: customer.createdAt,
        updated_at: customer.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// DELETE /v1/customers/:id - Delete customer
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await customerService.delete(req.params.id);

    res.json({
      success: true,
      data: {
        id: req.params.id,
        deleted: true,
      },
      timestamp: Date.now(),
    });
  })
);

// GET /v1/customers - List customers
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listCustomersSchema.parse(req.query);

    // TODO: Get merchantId from auth middleware
    const merchantId = 'temp-merchant-id';

    const result = await customerService.list({
      merchantId,
      email: query.email,
      limit: query.limit,
      offset: query.offset,
    });

    res.json({
      success: true,
      data: result.data.map((customer) => ({
        id: customer.id,
        merchant_id: customer.merchantId,
        email: customer.email,
        name: customer.name,
        wallet_address: customer.walletAddress,
        metadata: customer.metadata,
        created_at: customer.createdAt,
        updated_at: customer.updatedAt,
      })),
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

export default router;
