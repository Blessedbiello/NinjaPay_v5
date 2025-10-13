import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from '@ninjapay/logger';

import payrollRoutes from './routes/payroll';
import batchRoutes from './routes/batch';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const logger = createLogger({ service: 'payroll-service' });
const PORT = process.env.PAYROLL_SERVICE_PORT || 8002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/v1/payroll', payrollRoutes);
app.use('/v1/batch', batchRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Payroll service listening on port ${PORT}`);
  logger.info('MagicBlock Ephemeral Rollups enabled for batch processing');
});

export default app;
