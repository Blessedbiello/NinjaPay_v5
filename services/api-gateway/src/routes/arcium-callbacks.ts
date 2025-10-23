import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ComputationCallbackService, ComputationCallbackPayload } from '../services/computation-callback.service';
import { prisma } from '@ninjapay/database';

const router: Router = Router();
const callbackService = new ComputationCallbackService(prisma);

const callbackSchema = z.object({
  computation_id: z.string(),
  entity_type: z.enum(['payment_intent', 'transaction']).optional(),
  status: z.enum(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED']),
  finalized_at: z.string().optional(),
  finalization_signature: z.string().optional(),
  tx_signature: z.string().optional(),
  error: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional(),
  result: z
    .object({
      ciphertext: z.string().optional(),
      nonce: z.string().optional(),
      public_key: z.string().optional(),
      encryption_public_key: z.string().optional(),
      commitment: z.string().optional(),
      amount_commitment: z.string().optional(),
      signature: z.string().optional(),
    })
    .optional(),
});

router.post(
  '/callbacks',
  asyncHandler(async (req, res) => {
    const payload = callbackSchema.parse(req.body) as ComputationCallbackPayload;
    await callbackService.handleCallback(payload);

    res.json({
      success: true,
    });
  })
);

export default router;

