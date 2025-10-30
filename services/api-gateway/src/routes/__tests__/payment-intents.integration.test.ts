import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import paymentIntentRoutes from '../payment-intents';
import { prisma } from '@ninjapay/database';
import { ApiKeyService } from '../../services/api-key.service';

// Mock Arcium client service to avoid external dependencies
vi.mock('../../services/arcium-client.service', () => ({
  ArciumClientService: vi.fn().mockImplementation(() => ({
    encryptAmount: vi.fn().mockResolvedValue({
      ciphertext: Buffer.from('encrypted-amount-test-data-12345'),
      commitment: 'commitment-hash-abc123',
      proofs: [],
      nonce: Buffer.from('test-nonce-data'),
      publicKey: Buffer.from('test-public-key-data'),
      clientPublicKey: Buffer.from('test-client-public-key'),
    }),
    queuePaymentIntentSettlement: vi.fn().mockResolvedValue({
      computationId: 'comp-test-123456',
    }),
  })),
}));

describe('Payment Intents API Integration Tests', () => {
  let app: express.Application;
  let testMerchantId: string;
  let testApiKey: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.upsert({
      where: { walletAddress: 'TestWallet1234567890123456789012345' },
      update: {},
      create: {
        walletAddress: 'TestWallet1234567890123456789012345',
        email: 'test-integration@merchant.com',
        arciumKeyId: 'test-arcium-key-integration-123',
      },
    });

    // Generate API key for merchant
    const generatedApiKey = ApiKeyService.generateApiKey(true);
    const hashedApiKey = await ApiKeyService.hashApiKey(generatedApiKey);

    const merchant = await prisma.merchant.upsert({
      where: { email: 'test-integration@merchant.com' },
      update: { apiKey: hashedApiKey },
      create: {
        userId: user.id,
        businessName: 'Test Integration Business',
        email: 'test-integration@merchant.com',
        apiKey: hashedApiKey,
      },
    });

    testMerchantId = merchant.id;
    testApiKey = generatedApiKey;

    // Setup express app with authentication middleware
    app = express();
    app.use(express.json());
    app.use('/v1/payment_intents', paymentIntentRoutes);
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.paymentIntent.deleteMany({ where: { merchantId: testMerchantId } });
    await prisma.merchant.deleteMany({ where: { id: testMerchantId } });
    await prisma.user.deleteMany({ where: { email: 'test-integration@merchant.com' } });
    await prisma.$disconnect();
  });

  describe('POST /v1/payment_intents', () => {
    it('should create a payment intent successfully with API key', async () => {
      const response = await request(app)
        .post('/v1/payment_intents')
        .set('X-API-Key', testApiKey)
        .send({
          amount: 1000,
          currency: 'USDC',
          recipient: 'RecipientWallet123456789012345678901',
          description: 'Test payment',
        })
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toMatch(/^pi_/);
      expect(response.body.data.merchant_id).toBe(testMerchantId);
      expect(response.body.data.recipient).toBe('RecipientWallet123456789012345678901');
      expect(response.body.data.currency).toBe('USDC');
      expect(response.body.data.status).toBe('pending');
    });

    it('should reject request without API key', async () => {
      await request(app)
        .post('/v1/payment_intents')
        .send({
          amount: 1000,
          currency: 'USDC',
          recipient: 'RecipientWallet123456789012345678901',
        })
        .expect(401);
    });

    it('should validate amount is positive', async () => {
      const response = await request(app)
        .post('/v1/payment_intents')
        .set('X-API-Key', testApiKey)
        .send({
          amount: -100,
          currency: 'USDC',
          recipient: 'RecipientWallet123456789012345678901',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /v1/payment_intents/:id', () => {
    it('should retrieve payment intent by ID', async () => {
      // First create a payment intent
      const createResponse = await request(app)
        .post('/v1/payment_intents')
        .set('X-API-Key', testApiKey)
        .send({
          amount: 2000,
          currency: 'USDC',
          recipient: 'TestRecipient123456789012345678901',
        })
        .expect(201);

      const paymentIntentId = createResponse.body.data.id;

      // Then retrieve it
      const response = await request(app)
        .get(`/v1/payment_intents/${paymentIntentId}`)
        .set('X-API-Key', testApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(paymentIntentId);
      expect(response.body.data.merchant_id).toBe(testMerchantId);
    });

    it('should return 404 for non-existent payment intent', async () => {
      await request(app)
        .get('/v1/payment_intents/pi_nonexistent123')
        .set('X-API-Key', testApiKey)
        .expect(404);
    });
  });

  describe('GET /v1/payment_intents', () => {
    it('should list payment intents with pagination', async () => {
      // Create a few payment intents
      await request(app)
        .post('/v1/payment_intents')
        .set('X-API-Key', testApiKey)
        .send({
          amount: 1000,
          currency: 'USDC',
          recipient: 'Recipient1234567890123456789012345',
        });

      await request(app)
        .post('/v1/payment_intents')
        .set('X-API-Key', testApiKey)
        .send({
          amount: 2000,
          currency: 'USDC',
          recipient: 'Recipient2345678901234567890123456',
        });

      const response = await request(app)
        .get('/v1/payment_intents')
        .set('X-API-Key', testApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });
  });
});
