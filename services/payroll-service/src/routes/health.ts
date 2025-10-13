import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payroll-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', (req, res) => {
  // Check if service is ready (connections established, etc.)
  res.json({ ready: true });
});

export default router;
