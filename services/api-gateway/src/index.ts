import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from '@ninjapay/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import paymentRoutes from './routes/payments';
import balanceRoutes from './routes/balance';
import webhookRoutes from './routes/webhooks';
import paymentIntentRoutes from './routes/payment-intents';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import checkoutSessionRoutes from './routes/checkout-sessions';

// Load environment variables
dotenv.config();

const logger = createLogger('api-gateway');
const app = express();
const PORT = process.env.API_PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting (global)
app.use(rateLimiter);

// Routes
app.use('/health', healthRoutes);
app.use('/v1/auth', authRoutes);
app.use('/v1/payments', paymentRoutes);
app.use('/v1/balance', balanceRoutes);
app.use('/v1/webhooks', webhookRoutes);

// sBTC Pay Integration - Stripe-like API
app.use('/v1/payment_intents', paymentIntentRoutes);
app.use('/v1/products', productRoutes);
app.use('/v1/customers', customerRoutes);
app.use('/v1/checkout_sessions', checkoutSessionRoutes);

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 NinjaPay API Gateway running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || '*'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
