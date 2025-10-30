import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiKeyService } from '../api-key.service';
import bcrypt from 'bcrypt';

// Mock Prisma
vi.mock('@ninjapay/database', () => ({
  prisma: {
    apiKey: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    merchant: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@ninjapay/database';

describe('ApiKeyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateApiKey', () => {
    it('should generate API key with correct prefix for production', () => {
      const key = ApiKeyService.generateApiKey(false);
      expect(key).toMatch(/^sk_live_/);
      expect(key.length).toBeGreaterThan(20);
    });

    it('should generate API key with test prefix', () => {
      const key = ApiKeyService.generateApiKey(true);
      expect(key).toMatch(/^sk_test_/);
    });

    it('should generate unique keys', () => {
      const key1 = ApiKeyService.generateApiKey();
      const key2 = ApiKeyService.generateApiKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('hashApiKey', () => {
    it('should hash API key using bcrypt', async () => {
      const rawKey = 'sk_live_test123456789';
      const hashed = await ApiKeyService.hashApiKey(rawKey);

      expect(hashed).toMatch(/^\$2b\$/); // bcrypt hash starts with $2b
      expect(hashed).not.toBe(rawKey);
      expect(hashed.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should produce different hashes for same key', async () => {
      const rawKey = 'sk_live_test123456789';
      const hash1 = await ApiKeyService.hashApiKey(rawKey);
      const hash2 = await ApiKeyService.hashApiKey(rawKey);

      expect(hash1).not.toBe(hash2); // Salt is random
    });
  });

  describe('verifyApiKey', () => {
    it('should verify correct API key', async () => {
      const rawKey = 'sk_live_test123456789';
      const hashedKey = await ApiKeyService.hashApiKey(rawKey);

      const isValid = await ApiKeyService.verifyApiKey(rawKey, hashedKey);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect API key', async () => {
      const rawKey = 'sk_live_test123456789';
      const wrongKey = 'sk_live_wrong987654321';
      const hashedKey = await ApiKeyService.hashApiKey(rawKey);

      const isValid = await ApiKeyService.verifyApiKey(wrongKey, hashedKey);
      expect(isValid).toBe(false);
    });
  });

  describe('createApiKey', () => {
    it('should create API key with hashed value', async () => {
      const mockApiKey = {
        id: 'key-123',
        name: 'Test Key',
        active: true,
        createdAt: new Date(),
      };

      (prisma.apiKey.create as any).mockResolvedValue(mockApiKey);

      const result = await ApiKeyService.createApiKey('merchant-123', 'Test Key', false);

      expect(result.rawKey).toMatch(/^sk_live_/);
      expect(result.apiKey).toEqual(mockApiKey);

      expect(prisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            merchantId: 'merchant-123',
            name: 'Test Key',
            active: true,
            key: expect.stringMatching(/^\$2b\$/), // Hashed key
          }),
        })
      );
    });

    it('should create test API key', async () => {
      (prisma.apiKey.create as any).mockResolvedValue({
        id: 'key-123',
        name: 'Test Key',
        active: true,
        createdAt: new Date(),
      });

      const result = await ApiKeyService.createApiKey('merchant-123', 'Test Key', true);

      expect(result.rawKey).toMatch(/^sk_test_/);
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key and return merchant', async () => {
      const rawKey = 'sk_live_test123456789';
      const hashedKey = await ApiKeyService.hashApiKey(rawKey);

      const mockMerchants = [
        {
          id: 'merchant-123',
          businessName: 'Test Business',
          email: 'test@example.com',
          apiKey: hashedKey,
        },
      ];

      (prisma.merchant.findMany as any).mockResolvedValue(mockMerchants);
      (prisma.merchant.update as any).mockResolvedValue({});

      const result = await ApiKeyService.validateApiKey(rawKey);

      expect(result).toEqual({
        id: 'merchant-123',
        businessName: 'Test Business',
        email: 'test@example.com',
      });

      // Should update merchant's updatedAt timestamp
      expect(prisma.merchant.update).toHaveBeenCalledWith({
        where: { id: 'merchant-123' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should return null for invalid API key', async () => {
      (prisma.merchant.findMany as any).mockResolvedValue([]);

      const result = await ApiKeyService.validateApiKey('sk_live_invalid');

      expect(result).toBeNull();
    });

    it('should handle multiple keys and find correct match', async () => {
      const correctKey = 'sk_live_correct123';
      const hashedCorrect = await ApiKeyService.hashApiKey(correctKey);
      const hashedWrong = await ApiKeyService.hashApiKey('sk_live_wrong456');

      const mockMerchants = [
        {
          id: 'merchant-wrong',
          businessName: 'Wrong Business',
          email: 'wrong@example.com',
          apiKey: hashedWrong,
        },
        {
          id: 'merchant-correct',
          businessName: 'Correct Business',
          email: 'correct@example.com',
          apiKey: hashedCorrect,
        },
      ];

      (prisma.merchant.findMany as any).mockResolvedValue(mockMerchants);
      (prisma.merchant.update as any).mockResolvedValue({});

      const result = await ApiKeyService.validateApiKey(correctKey);

      expect(result?.id).toBe('merchant-correct');
    });
  });

  describe('revokeApiKey', () => {
    it('should deactivate API key', async () => {
      (prisma.apiKey.update as any).mockResolvedValue({});

      await ApiKeyService.revokeApiKey('key-123');

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-123' },
        data: { active: false },
      });
    });
  });

  describe('maskApiKey', () => {
    it('should mask API key for display', () => {
      const rawKey = 'sk_live_1234567890abcdef';
      const masked = ApiKeyService.maskApiKey(rawKey);

      expect(masked).toBe('sk_live_...cdef');
    });

    it('should handle short keys', () => {
      const shortKey = 'short';
      const masked = ApiKeyService.maskApiKey(shortKey);

      expect(masked).toBe('***');
    });

    it('should mask test keys correctly', () => {
      const testKey = 'sk_test_abcdefghijklmnop';
      const masked = ApiKeyService.maskApiKey(testKey);

      expect(masked).toBe('sk_test_...mnop');
    });
  });
});
