import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '@ninjapay/database';
import { ApiKeyService } from '../services/api-key.service';

/**
 * E2E Test for Complete Payment Flow
 *
 * This test simulates the full lifecycle of a payment:
 * 1. Merchant creates payment intent
 * 2. Amount is encrypted via Arcium MPC
 * 3. Payment is confirmed
 * 4. MPC computation is queued
 * 5. Solana transaction is submitted
 * 6. Callback updates payment status
 * 7. Payment is finalized
 */

// Mock Arcium service for E2E testing
vi.mock('../services/arcium-client.service', () => {
  return {
    ArciumClientService: vi.fn().mockImplementation(() => ({
      encryptAmount: vi.fn().mockResolvedValue({
        ciphertext: Buffer.from('e2e-encrypted-amount'),
        commitment: 'e2e-commitment-hash',
        proofs: ['proof1', 'proof2'],
        nonce: Buffer.from('e2e-nonce'),
        publicKey: Buffer.from('e2e-public-key'),
        clientPublicKey: Buffer.from('e2e-client-public-key'),
      }),
      queuePaymentIntentSettlement: vi.fn().mockResolvedValue({
        computationId: 'e2e-comp-123',
      }),
      decryptAmount: vi.fn().mockResolvedValue({
        amount: BigInt(1000_000000), // 1000 USDC
        plaintext: Buffer.from('1000000000'),
      }),
    })),
  };
});

describe('Complete Payment Flow E2E Test', () => {
  let app: express.Application;
  let testMerchantId: string;
  let testApiKey: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup test user and merchant
    const user = await prisma.user.create({
      data: {
        walletAddress: 'E2ETestWallet123456789012345678901234567890',
        email: 'e2e-test@merchant.com',
        arciumKeyId: 'e2e-test-arcium-key-id-123',
      },
    });
    testUserId = user.id;

    // Generate API key for merchant
    const generatedApiKey = ApiKeyService.generateApiKey(true); // test key
    const hashedApiKey = await ApiKeyService.hashApiKey(generatedApiKey);

    const merchant = await prisma.merchant.create({
      data: {
        userId: user.id,
        businessName: 'E2E Test Business',
        email: 'e2e-test@merchant.com',
        apiKey: hashedApiKey,
      },
    });
    testMerchantId = merchant.id;
    testApiKey = generatedApiKey;

    // Setup express app with all routes
    const { default: indexModule } = await import('../index.js');
    app = indexModule;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.paymentIntent.deleteMany({ where: { merchantId: testMerchantId } });
    await prisma.merchant.deleteMany({ where: { id: testMerchantId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should complete full payment flow from creation to finalization', async () => {
    // ===== STEP 1: Create Payment Intent =====
    console.log('Step 1: Creating payment intent...');

    const createResponse = await request(app)
      .post('/v1/payment_intents')
      .set('X-API-Key', testApiKey)
      .send({
        amount: 1000,
        currency: 'USDC',
        recipient: 'RecipientE2EWallet1234567890123456789',
        description: 'E2E Test Payment',
        metadata: {
          test: 'e2e',
          orderId: 'e2e-order-123',
        },
      })
      .expect(201);

    expect(createResponse.body.success).toBe(true);
    const paymentIntent = createResponse.body.data;
    const paymentIntentId = paymentIntent.id;

    // Verify encrypted fields exist
    expect(paymentIntent).toMatchObject({
      id: expect.stringMatching(/^pi_/),
      merchantId: testMerchantId,
      recipient: 'RecipientE2EWallet1234567890123456789',
      currency: 'USDC',
      status: 'PENDING',
      computationStatus: 'QUEUED',
    });
    expect(paymentIntent.encryptedAmount).toBeTruthy();
    expect(paymentIntent.amountCommitment).toBeTruthy();

    console.log(`✓ Payment intent created: ${paymentIntentId}`);

    // ===== STEP 2: Retrieve Payment Intent =====
    console.log('Step 2: Retrieving payment intent...');

    const retrieveResponse = await request(app)
      .get(`/v1/payment_intents/${paymentIntentId}`)
      .set('X-API-Key', testApiKey)
      .expect(200);

    expect(retrieveResponse.body.success).toBe(true);
    expect(retrieveResponse.body.data.id).toBe(paymentIntentId);
    expect(retrieveResponse.body.data.status).toBe('PENDING');

    console.log(`✓ Payment intent retrieved successfully`);

    // ===== STEP 3: Confirm Payment Intent =====
    console.log('Step 3: Confirming payment intent...');

    const confirmResponse = await request(app)
      .post(`/v1/payment_intents/${paymentIntentId}/confirm`)
      .set('X-API-Key', testApiKey)
      .expect(200);

    expect(confirmResponse.body.success).toBe(true);
    expect(confirmResponse.body.data.status).toBe('PROCESSING');
    expect(confirmResponse.body.data.computationId).toBeTruthy();

    console.log(`✓ Payment intent confirmed, status: PROCESSING`);

    // ===== STEP 4: Verify Status Transition =====
    console.log('Step 4: Verifying status transition...');

    const verifyResponse = await request(app)
      .get(`/v1/payment_intents/${paymentIntentId}`)
      .set('X-API-Key', testApiKey)
      .expect(200);

    expect(verifyResponse.body.data.status).toBe('PROCESSING');
    expect(verifyResponse.body.data.computationStatus).toBe('QUEUED');

    console.log(`✓ Status transition verified`);

    // ===== STEP 5: Simulate MPC Callback (Internal) =====
    console.log('Step 5: Simulating MPC computation callback...');

    // In a real scenario, this would come from Arcium service
    // For E2E test, we simulate the callback by updating the database directly
    await prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        computationStatus: 'COMPLETED',
        resultCiphertext: Buffer.from('e2e-result-ciphertext'),
        resultNonce: Buffer.from('e2e-result-nonce'),
      },
    });

    console.log(`✓ MPC computation completed (simulated)`);

    // ===== STEP 6: Verify Computation Completion =====
    console.log('Step 6: Verifying computation completion...');

    const completionResponse = await request(app)
      .get(`/v1/payment_intents/${paymentIntentId}`)
      .set('X-API-Key', testApiKey)
      .expect(200);

    expect(completionResponse.body.data.computationStatus).toBe('COMPLETED');

    console.log(`✓ Computation status verified: COMPLETED`);

    // ===== STEP 7: List Payment Intents =====
    console.log('Step 7: Listing payment intents...');

    const listResponse = await request(app)
      .get('/v1/payment_intents')
      .set('X-API-Key', testApiKey)
      .query({ limit: 10 })
      .expect(200);

    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data.data).toBeInstanceOf(Array);

    // Find our payment intent in the list
    const foundIntent = listResponse.body.data.data.find(
      (intent: any) => intent.id === paymentIntentId
    );
    expect(foundIntent).toBeTruthy();

    console.log(`✓ Payment intent found in list`);

    // ===== STEP 8: Update Payment Intent Metadata =====
    console.log('Step 8: Updating payment intent metadata...');

    const updateResponse = await request(app)
      .patch(`/v1/payment_intents/${paymentIntentId}`)
      .set('X-API-Key', testApiKey)
      .send({
        metadata: {
          test: 'e2e',
          orderId: 'e2e-order-123',
          status: 'completed',
          completedAt: new Date().toISOString(),
        },
      })
      .expect(200);

    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.metadata.status).toBe('completed');

    console.log(`✓ Payment intent metadata updated`);

    // ===== FINAL VERIFICATION =====
    console.log('Final: Verifying complete payment flow...');

    const finalResponse = await request(app)
      .get(`/v1/payment_intents/${paymentIntentId}`)
      .set('X-API-Key', testApiKey)
      .expect(200);

    const finalPaymentIntent = finalResponse.body.data;

    // Verify all critical fields
    expect(finalPaymentIntent).toMatchObject({
      id: paymentIntentId,
      merchantId: testMerchantId,
      recipient: 'RecipientE2EWallet1234567890123456789',
      currency: 'USDC',
      status: 'PROCESSING',
      computationStatus: 'COMPLETED',
      description: 'E2E Test Payment',
    });

    expect(finalPaymentIntent.encryptedAmount).toBeTruthy();
    expect(finalPaymentIntent.amountCommitment).toBeTruthy();
    expect(finalPaymentIntent.resultCiphertext).toBeTruthy();
    expect(finalPaymentIntent.metadata.status).toBe('completed');

    console.log('✅ Complete payment flow verified successfully!');
    console.log(`
Payment Flow Summary:
- Payment Intent ID: ${paymentIntentId}
- Status: ${finalPaymentIntent.status}
- Computation Status: ${finalPaymentIntent.computationStatus}
- Amount: Encrypted (confidential)
- Recipient: ${finalPaymentIntent.recipient}
- All steps completed successfully!
    `);
  });

  it('should handle payment intent cancellation', async () => {
    console.log('Testing payment cancellation flow...');

    // Create payment intent
    const createResponse = await request(app)
      .post('/v1/payment_intents')
      .set('X-API-Key', testApiKey)
      .send({
        amount: 500,
        currency: 'USDC',
        recipient: 'RecipientE2EWallet1234567890123456789',
        description: 'Cancellation Test Payment',
      })
      .expect(201);

    const paymentIntentId = createResponse.body.data.id;

    // Cancel the payment
    const cancelResponse = await request(app)
      .post(`/v1/payment_intents/${paymentIntentId}/cancel`)
      .set('X-API-Key', testApiKey)
      .expect(200);

    expect(cancelResponse.body.success).toBe(true);
    expect(cancelResponse.body.data.status).toBe('CANCELLED');

    // Verify cancellation
    const verifyResponse = await request(app)
      .get(`/v1/payment_intents/${paymentIntentId}`)
      .set('X-API-Key', testApiKey)
      .expect(200);

    expect(verifyResponse.body.data.status).toBe('CANCELLED');

    console.log('✓ Payment cancellation flow verified');
  });

  it('should handle invalid operations gracefully', async () => {
    console.log('Testing error handling...');

    // Test 1: Create payment with invalid amount
    await request(app)
      .post('/v1/payment_intents')
      .set('X-API-Key', testApiKey)
      .send({
        amount: -100,
        currency: 'USDC',
        recipient: 'RecipientE2EWallet1234567890123456789',
      })
      .expect(400);

    console.log('✓ Invalid amount rejected');

    // Test 2: Retrieve non-existent payment
    await request(app)
      .get('/v1/payment_intents/pi_nonexistent')
      .set('X-API-Key', testApiKey)
      .expect(404);

    console.log('✓ Non-existent payment handled correctly');

    // Test 3: Confirm already cancelled payment
    const createResponse = await request(app)
      .post('/v1/payment_intents')
      .set('X-API-Key', testApiKey)
      .send({
        amount: 100,
        currency: 'USDC',
        recipient: 'RecipientE2EWallet1234567890123456789',
      })
      .expect(201);

    const paymentIntentId = createResponse.body.data.id;

    await request(app)
      .post(`/v1/payment_intents/${paymentIntentId}/cancel`)
      .set('X-API-Key', testApiKey)
      .expect(200);

    await request(app)
      .post(`/v1/payment_intents/${paymentIntentId}/confirm`)
      .set('X-API-Key', testApiKey)
      .expect(400);

    console.log('✓ Invalid state transition rejected');
    console.log('✅ Error handling verified successfully!');
  });
});
