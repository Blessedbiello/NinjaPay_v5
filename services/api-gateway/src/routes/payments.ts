import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticateUser, authenticateMerchant } from '../middleware/authenticate';
import { ArciumClientService } from '../services/arcium-client.service';
import { prisma } from '@ninjapay/database';

const router: Router = Router();
const arcium = new ArciumClientService();

// Validation schemas
const createPaymentSchema = z.object({
  recipient: z.string().min(32).max(44), // Solana wallet address
  amount: z.number().positive(),
  currency: z.string().default('USDC'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const listPaymentsSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'CONFIRMED', 'FINALIZED', 'FAILED', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// POST /v1/payments - Create payment (P2P)
router.post(
  '/',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const body = createPaymentSchema.parse(req.body);

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Get user's wallet address as sender
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Encrypt amount using Arcium
    const {
      ciphertext,
      commitment,
      proofs,
      nonce,
      publicKey,
      computationId,
    } = await arcium.encryptAmount(body.amount);

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        sender: user.walletAddress,
        recipient: body.recipient,
        encryptedAmount: ciphertext,
        amountCommitment: commitment,
        proofs: proofs,
        status: 'PENDING',
        layer: 'L1',
        encryptionNonce: nonce,
        encryptionPublicKey: publicKey,
        computationId,
        computationStatus: 'QUEUED',
      },
    });

    // TODO: Submit to Solana blockchain
    // This will be implemented with actual Solana transaction creation
    // For now, we create the database record

    res.status(201).json({
      success: true,
      data: {
        id: transaction.id,
        sender: transaction.sender,
        recipient: transaction.recipient,
        amount: null, // Privacy: never return plaintext
        amount_commitment: transaction.amountCommitment,
        encrypted_amount: transaction.encryptedAmount.toString('base64'),
        encryption_nonce: transaction.encryptionNonce ? transaction.encryptionNonce.toString('base64') : null,
        encryption_public_key: transaction.encryptionPublicKey ? transaction.encryptionPublicKey.toString('base64') : null,
        computation_id: transaction.computationId,
        computation_status: transaction.computationStatus,
        computation_error: transaction.computationError,
        finalized_at: transaction.finalizedAt,
        finalization_signature: transaction.finalizationSignature,
        status: transaction.status.toLowerCase(),
        description: body.description,
        metadata: body.metadata,
        created_at: transaction.createdAt,
      },
      timestamp: Date.now(),
    });
  })
);

// GET /v1/payments/:id - Get payment status
router.get(
  '/:id',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Payment not found', 404);
    }

    // Verify user owns this transaction
    if (req.user && transaction.userId !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    res.json({
      success: true,
      data: {
        id: transaction.id,
        sender: transaction.sender,
        recipient: transaction.recipient,
        amount: null,
        amount_commitment: transaction.amountCommitment,
        encrypted_amount: transaction.encryptedAmount.toString('base64'),
        encryption_nonce: transaction.encryptionNonce ? transaction.encryptionNonce.toString('base64') : null,
        encryption_public_key: transaction.encryptionPublicKey ? transaction.encryptionPublicKey.toString('base64') : null,
        computation_id: transaction.computationId,
        computation_status: transaction.computationStatus,
        computation_error: transaction.computationError,
        status: transaction.status.toLowerCase(),
        signature: transaction.signature,
        session_id: transaction.sessionId,
        layer: transaction.layer,
        finalized_at: transaction.finalizedAt,
        finalization_signature: transaction.finalizationSignature,
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

// GET /v1/payments - List user's payments
router.get(
  '/',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const query = listPaymentsSchema.parse(req.query);

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const where: any = {
      userId: req.user.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: transactions.map((tx) => ({
        id: tx.id,
        sender: tx.sender,
        recipient: tx.recipient,
        amount: null,
        amount_commitment: tx.amountCommitment,
        encrypted_amount: tx.encryptedAmount.toString('base64'),
        encryption_nonce: tx.encryptionNonce ? tx.encryptionNonce.toString('base64') : null,
        encryption_public_key: tx.encryptionPublicKey ? tx.encryptionPublicKey.toString('base64') : null,
        computation_id: tx.computationId,
        computation_status: tx.computationStatus,
        status: tx.status.toLowerCase(),
        signature: tx.signature,
        layer: tx.layer,
        created_at: tx.createdAt,
      })),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        has_more: query.offset + query.limit < total,
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/payments/batch - Batch payments (payroll)
router.post(
  '/batch',
  authenticateMerchant,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      recipients: z.array(
        z.object({
          wallet: z.string().min(32).max(44),
          amount: z.number().positive(),
        })
      ).min(1).max(1000),
      currency: z.string().default('USDC'),
      description: z.string().optional(),
    });

    const body = schema.parse(req.body);

    if (!req.merchantId) {
      throw new AppError('Merchant authentication required', 401);
    }

    // TODO: Integrate with MagicBlock Payroll Service
    // For now, create pending transaction records

    const totalAmount = body.recipients.reduce((sum, r) => sum + r.amount, 0);
    const { ciphertext, commitment } = await arcium.encryptAmount(totalAmount);

    // Create PaymentIntent for batch
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        merchantId: req.merchantId,
        recipient: body.recipients[0].wallet, // First recipient as primary
        encryptedAmount: ciphertext,
        amountCommitment: commitment,
        currency: body.currency,
        status: 'PENDING',
        metadata: {
          batch: true,
          recipientCount: body.recipients.length,
          recipients: body.recipients,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: paymentIntent.id,
        recipient_count: body.recipients.length,
        total_amount_commitment: commitment,
        status: 'pending',
        note: 'Batch payment created. Use MagicBlock Payroll Service for execution.',
        created_at: paymentIntent.createdAt,
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/payments/:id/confirm - Confirm payment (simulate blockchain confirmation)
router.post(
  '/:id/confirm',
  authenticateUser,
  asyncHandler(async (req, res) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    });

    if (!transaction) {
      throw new AppError('Payment not found', 404);
    }

    if (req.user && transaction.userId !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    if (transaction.status !== 'PENDING') {
      throw new AppError('Payment cannot be confirmed in current status', 400);
    }

    // Update status to CONFIRMED
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        status: 'CONFIRMED',
        signature: `${Math.random().toString(36).substring(2)}${Date.now()}`, // Mock signature
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status.toLowerCase(),
        signature: updated.signature,
        updated_at: updated.updatedAt,
      },
      timestamp: Date.now(),
    });
  })
);

export default router;
