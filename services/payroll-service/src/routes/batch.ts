import { Router } from 'express';
import { PublicKey } from '@solana/web3.js';
import { PayrollService } from '../services/PayrollService';

const router = Router();

// Initialize service
const PROGRAM_ID = new PublicKey(process.env.NINJA_PAYROLL_PROGRAM_ID || '11111111111111111111111111111111');
const payrollService = new PayrollService(PROGRAM_ID);

/**
 * GET /v1/batch/:batchId
 *
 * Get batch status and details
 */
router.get('/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await payrollService.getBatchStatus(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    res.json({
      success: true,
      data: batch,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /v1/batch/:batchId/status
 *
 * Get just the status of a batch
 */
router.get('/:batchId/status', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await payrollService.getBatchStatus(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
      });
    }

    res.json({
      success: true,
      batchId,
      status: batch.status,
      progress: {
        processed: batch.processedCount,
        total: batch.totalRecipients,
        percentage: ((batch.processedCount / batch.totalRecipients) * 100).toFixed(1),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
