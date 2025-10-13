import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = Router();

// POST /v1/payments - Create payment
router.post(
  '/',
  asyncHandler(async (req, res) => {
    // TODO: Implement payment creation with Arcium
    res.json({
      success: true,
      data: {
        message: 'Payment endpoint ready',
        note: 'Will implement with Arcium integration (Days 3-6)',
      },
      timestamp: Date.now(),
    });
  })
);

// GET /v1/payments/:id - Get payment status
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        status: 'pending',
        note: 'Payment tracking to be implemented',
      },
      timestamp: Date.now(),
    });
  })
);

// POST /v1/payments/batch - Batch payments (payroll)
router.post(
  '/batch',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Batch payment endpoint ready',
        note: 'Will implement batch Arcium transfers',
      },
      timestamp: Date.now(),
    });
  })
);

export default router;
