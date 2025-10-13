import { Router } from 'express';
import { PublicKey, Keypair } from '@solana/web3.js';
import { PayrollService } from '../services/PayrollService';
import { z } from 'zod';

const router = Router();

// Initialize service (would be dependency injected in production)
const PROGRAM_ID = new PublicKey(process.env.NINJA_PAYROLL_PROGRAM_ID || '11111111111111111111111111111111');
const payrollService = new PayrollService(PROGRAM_ID);

// Validation schemas
const processPayrollSchema = z.object({
  recipients: z.array(
    z.object({
      walletAddress: z.string(),
      amount: z.string(),
    })
  ),
  tokenMint: z.string(),
  description: z.string().optional(),
  authorityPrivateKey: z.string(), // In production, use secure key management
});

/**
 * POST /v1/payroll/process
 *
 * Process batch payroll using MagicBlock Ephemeral Rollups
 *
 * Body:
 * {
 *   "recipients": [
 *     { "walletAddress": "...", "amount": "1000000" },
 *     ...
 *   ],
 *   "tokenMint": "...",
 *   "description": "March 2025 Payroll",
 *   "authorityPrivateKey": "..."
 * }
 */
router.post('/process', async (req, res) => {
  try {
    const validated = processPayrollSchema.parse(req.body);

    // Decode authority keypair (in production, use secure key management)
    const authorityKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(validated.authorityPrivateKey))
    );

    // Process payroll
    const result = await payrollService.processBatchPayroll(authorityKeypair, {
      recipients: validated.recipients,
      tokenMint: validated.tokenMint,
      description: validated.description,
    });

    res.json({
      success: result.status === 'success',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /v1/payroll/estimate
 *
 * Estimate costs for batch payroll
 *
 * Body:
 * {
 *   "recipientCount": 100
 * }
 */
router.post('/estimate', (req, res) => {
  const { recipientCount } = req.body;

  if (!recipientCount || typeof recipientCount !== 'number') {
    return res.status(400).json({ error: 'recipientCount is required' });
  }

  const estimate = payrollService.estimateCosts(recipientCount);

  res.json({
    recipientCount,
    costs: estimate,
    methodology: 'MagicBlock Ephemeral Rollups',
    notes: [
      'Traditional: Individual Solana transactions (~$0.01 each)',
      'Ephemeral: Delegation + Settlement only (~$0.02 total)',
      'Savings increase with more recipients',
    ],
  });
});

export default router;
