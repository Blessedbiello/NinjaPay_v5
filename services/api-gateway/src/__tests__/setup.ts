/**
 * Test setup and utilities for integration tests
 */
import { beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '@ninjapay/database';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
process.env.JWT_SECRET = 'test-jwt-secret-32-characters-long-minimum';
process.env.ENCRYPTION_MASTER_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.ARCIUM_CALLBACK_SECRET = '4b9c87c6a5f3d20419b2e0b9876543214b9c87c6a5f3d20419b2e0b987654321';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
process.env.SOLANA_NETWORK = 'devnet';
process.env.API_PORT = '8001';
process.env.ARCIUM_SERVICE_PORT = '8002';
process.env.CORS_ORIGIN = 'http://localhost:3001';
process.env.RATE_LIMIT_WINDOW = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Clean up database before all tests
beforeAll(async () => {
  // In a real test environment, you might want to:
  // 1. Create a separate test database
  // 2. Run migrations
  // 3. Seed test data
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data if needed
  // await prisma.paymentIntent.deleteMany({ where: { /* test data */ } });
});

// Disconnect from database after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Test data factories
 */
export const TestData = {
  merchant: {
    id: 'test-merchant-123',
    businessName: 'Test Business',
    email: 'test@merchant.com',
    user: {
      id: 'test-user-123',
      walletAddress: 'TestWallet1234567890123456789012345',
      email: 'test@user.com',
    },
  },

  apiKey: {
    id: 'test-key-123',
    name: 'Test API Key',
    active: true,
    rawKey: 'test_key_mock_value_for_testing',
  },

  paymentIntent: {
    id: 'pi_test_123',
    merchantId: 'test-merchant-123',
    sender: 'TestSender1234567890123456789012345',
    recipient: 'TestRecipient123456789012345678901',
    encryptedAmount: Buffer.from('encrypted-data'),
    amountCommitment: 'commitment-hash-123',
    currency: 'USDC',
    status: 'PENDING' as const,
    computationStatus: 'QUEUED' as const,
    metadata: {
      amount: 1000,
      encrypted: true,
    },
  },

  user: {
    id: 'test-user-456',
    walletAddress: 'TestWallet9876543210987654321098765',
    email: 'testuser@example.com',
  },
};

/**
 * JWT token generator for tests
 */
export function generateTestToken(payload: {
  userId: string;
  walletAddress: string;
  merchantId?: string;
}): string {
  // In real tests, use jsonwebtoken to generate actual tokens
  // For now, return a mock token
  const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `test.${base64}.signature`;
}

/**
 * Create a test merchant in the database
 */
export async function createTestMerchant() {
  const user = await prisma.user.upsert({
    where: { id: TestData.merchant.user.id },
    update: {},
    create: {
      id: TestData.merchant.user.id,
      walletAddress: TestData.merchant.user.walletAddress,
      email: TestData.merchant.user.email,
    },
  });

  const merchant = await prisma.merchant.upsert({
    where: { id: TestData.merchant.id },
    update: {},
    create: {
      id: TestData.merchant.id,
      userId: user.id,
      businessName: TestData.merchant.businessName,
      email: TestData.merchant.email,
    },
  });

  return { user, merchant };
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  // Delete in reverse order of dependencies
  await prisma.apiKey.deleteMany({ where: { merchantId: TestData.merchant.id } });
  await prisma.paymentIntent.deleteMany({ where: { merchantId: TestData.merchant.id } });
  await prisma.merchant.deleteMany({ where: { id: TestData.merchant.id } });
  await prisma.user.deleteMany({ where: { id: TestData.merchant.user.id } });
}
