import { Router, Request } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ComputationCallbackService, ComputationCallbackPayload, CallbackVerificationContext } from '../services/computation-callback.service';
import { prisma } from '@ninjapay/database';

const router: Router = Router();
// Lazy-load callback service to ensure dotenv is loaded first
let _callbackService: ComputationCallbackService | null = null;
function getCallbackService(): ComputationCallbackService {
  if (!_callbackService) {
    _callbackService = new ComputationCallbackService(prisma);
  }
  return _callbackService;
}

type RequestWithRawBody = Request & { rawBody?: string };

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
    const requestWithRaw = req as RequestWithRawBody;
    const verificationContext: CallbackVerificationContext = {
      signature: req.header('x-arcium-signature'),
      timestamp: req.header('x-arcium-timestamp'),
      rawBody: requestWithRaw.rawBody ?? JSON.stringify(req.body),
    };

    await getCallbackService().handleCallback(payload, verificationContext);

    res.json({
      success: true,
    });
  })
);

export default router;

