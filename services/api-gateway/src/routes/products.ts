import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ProductService } from '../services/product.service';
import { prisma } from '@ninjapay/database';

const router: Router = Router();
const productService = new ProductService(prisma);

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().default('USDC'),
  images: z.array(z.string().url()).optional(),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const listProductsSchema = z.object({
  active: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// POST /v1/products - Create product
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createProductSchema.parse(req.body);

    // TODO: Get merchantId from auth middleware
    const merchantId = 'temp-merchant-id';

    const product = await productService.create({
      merchantId,
      name: body.name,
      description: body.description,
      price: body.price,
      currency: body.currency,
      images: body.images,
      active: body.active,
      metadata: body.metadata,
    });

    res.status(201).json({
      success: true,
      data: {
        id: product.id,
        merchant_id: product.merchantId,
        name: product.name,
        description: product.description,
        price: product.price.toNumber(),
        currency: product.currency,
        images: product.images,
        active: product.active,
        metadata: product.metadata,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// GET /v1/products/:id - Retrieve product
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await productService.retrieve(req.params.id);

    res.json({
      success: true,
      data: {
        id: product.id,
        merchant_id: product.merchantId,
        name: product.name,
        description: product.description,
        price: product.price.toNumber(),
        currency: product.currency,
        images: product.images,
        active: product.active,
        metadata: product.metadata,
        merchant: product.merchant,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// PATCH /v1/products/:id - Update product
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = updateProductSchema.parse(req.body);

    const product = await productService.update(req.params.id, {
      name: body.name,
      description: body.description,
      price: body.price,
      currency: body.currency,
      images: body.images,
      active: body.active,
      metadata: body.metadata,
    });

    res.json({
      success: true,
      data: {
        id: product.id,
        merchant_id: product.merchantId,
        name: product.name,
        description: product.description,
        price: product.price.toNumber(),
        currency: product.currency,
        images: product.images,
        active: product.active,
        metadata: product.metadata,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// DELETE /v1/products/:id - Delete product
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await productService.delete(req.params.id);

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

// GET /v1/products - List products
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listProductsSchema.parse(req.query);

    // TODO: Get merchantId from auth middleware
    const merchantId = 'temp-merchant-id';

    const result = await productService.list({
      merchantId,
      active: query.active,
      limit: query.limit,
      offset: query.offset,
    });

    res.json({
      success: true,
      data: result.data.map((product) => ({
        id: product.id,
        merchant_id: product.merchantId,
        name: product.name,
        description: product.description,
        price: product.price.toNumber(),
        currency: product.currency,
        images: product.images,
        active: product.active,
        metadata: product.metadata,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
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
