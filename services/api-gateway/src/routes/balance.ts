import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = Router();

// GET /v1/balance - Get decrypted balance
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // TODO: Implement balance decryption with Arcium
    res.json({
      success: true,
      data: {
        walletAddress: req.query.walletAddress || 'unknown',
        encryptedBalance: '***',
        decryptedBalance: null,
        note: 'Balance decryption requires Arcium MPC integration',
      },
      timestamp: Date.now(),
    });
  })
);

export default router;
