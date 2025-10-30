import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PaymentIntentService } from '../payment-intent.service';
import { ArciumClientService } from '../arcium-client.service';

// Mock Prisma Client
const mockPrismaClient = {
  paymentIntent: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  merchant: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock Arcium Client
const mockArciumClient = {
  encryptAmount: vi.fn(),
  queuePaymentIntentSettlement: vi.fn(),
} as unknown as ArciumClientService;

describe('PaymentIntentService', () => {
  let service: PaymentIntentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentIntentService(mockPrismaClient, mockArciumClient);
  });

  describe('create', () => {
    it('should create a payment intent with encrypted amount', async () => {
      // Arrange
      const mockMerchant = {
        id: 'merchant-123',
        user: {
          walletAddress: 'wallet-address-123',
        },
      };

      const mockEncryptionResult = {
        ciphertext: Buffer.from('encrypted-data'),
        commitment: 'commitment-hash',
        proofs: ['proof1', 'proof2'],
        nonce: Buffer.from('nonce'),
        publicKey: Buffer.from('public-key'),
        clientPublicKey: Buffer.from('client-public-key'),
      };

      const mockPaymentIntent = {
        id: 'pi_123',
        merchantId: 'merchant-123',
        sender: 'wallet-address-123',
        recipient: 'recipient-wallet',
        encryptedAmount: mockEncryptionResult.ciphertext,
        amountCommitment: mockEncryptionResult.commitment,
        currency: 'USDC',
        status: 'PENDING',
        computationStatus: 'QUEUED',
        createdAt: new Date(),
      };

      mockPrismaClient.merchant.findUnique = vi.fn().mockResolvedValue(mockMerchant);
      (mockArciumClient.encryptAmount as any) = vi.fn().mockResolvedValue(mockEncryptionResult);
      mockPrismaClient.paymentIntent.create = vi.fn().mockResolvedValue(mockPaymentIntent);

      // Act
      const result = await service.create({
        merchantId: 'merchant-123',
        recipient: 'recipient-wallet',
        amount: 1000,
        currency: 'USDC',
      });

      // Assert
      expect(mockArciumClient.encryptAmount).toHaveBeenCalledWith(
        BigInt(1000),
        expect.objectContaining({
          userPubkey: 'wallet-address-123',
        })
      );

      expect(mockPrismaClient.paymentIntent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            merchantId: 'merchant-123',
            recipient: 'recipient-wallet',
            encryptedAmount: mockEncryptionResult.ciphertext,
            amountCommitment: mockEncryptionResult.commitment,
            status: 'PENDING',
            computationStatus: 'QUEUED',
          }),
        })
      );

      expect(result).toEqual(mockPaymentIntent);
    });

    it('should throw error if merchant not found', async () => {
      // Arrange
      mockPrismaClient.merchant.findUnique = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.create({
          merchantId: 'non-existent-merchant',
          recipient: 'recipient-wallet',
          amount: 1000,
          currency: 'USDC',
        })
      ).rejects.toThrow('Merchant non-existent-merchant not found');
    });

    it('should normalize amount correctly', async () => {
      // Arrange
      const mockMerchant = {
        id: 'merchant-123',
        user: { walletAddress: 'wallet-123' },
      };

      const mockEncryptionResult = {
        ciphertext: Buffer.from('encrypted-data'),
        commitment: 'commitment-hash',
        proofs: [],
        nonce: Buffer.from('nonce'),
        publicKey: Buffer.from('public-key'),
        clientPublicKey: Buffer.from('client-public-key'),
      };

      mockPrismaClient.merchant.findUnique = vi.fn().mockResolvedValue(mockMerchant);
      (mockArciumClient.encryptAmount as any) = vi.fn().mockResolvedValue(mockEncryptionResult);
      mockPrismaClient.paymentIntent.create = vi.fn().mockResolvedValue({
        id: 'pi_123',
      });

      // Act
      await service.create({
        merchantId: 'merchant-123',
        recipient: 'recipient-wallet',
        amount: 1000.5, // Float amount
        currency: 'USDC',
      });

      // Assert
      expect(mockArciumClient.encryptAmount).toHaveBeenCalledWith(
        BigInt(1001), // Should be rounded
        expect.any(Object)
      );
    });
  });

  describe('retrieve', () => {
    it('should retrieve payment intent by ID', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_123',
        merchantId: 'merchant-123',
        status: 'PENDING',
      };

      mockPrismaClient.paymentIntent.findUnique = vi.fn().mockResolvedValue(mockPaymentIntent);

      // Act
      const result = await service.retrieve('pi_123');

      // Assert
      expect(mockPrismaClient.paymentIntent.findUnique).toHaveBeenCalledWith({
        where: { id: 'pi_123' },
        include: {
          customer: true,
          product: true,
          checkoutSession: true,
        },
      });
      expect(result).toEqual(mockPaymentIntent);
    });

    it('should throw error if payment intent not found', async () => {
      // Arrange
      mockPrismaClient.paymentIntent.findUnique = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.retrieve('non-existent-id')).rejects.toThrow(
        'Payment intent not found'
      );
    });
  });

  describe('update', () => {
    it('should update payment intent', async () => {
      // Arrange
      const mockUpdatedIntent = {
        id: 'pi_123',
        description: 'Updated description',
        metadata: { key: 'value' },
      };

      mockPrismaClient.paymentIntent.update = vi.fn().mockResolvedValue(mockUpdatedIntent);

      // Act
      const result = await service.update('pi_123', {
        description: 'Updated description',
        metadata: { key: 'value' },
      });

      // Assert
      expect(mockPrismaClient.paymentIntent.update).toHaveBeenCalledWith({
        where: { id: 'pi_123' },
        data: {
          description: 'Updated description',
          metadata: { key: 'value' },
        },
        include: {
          customer: true,
          product: true,
        },
      });
      expect(result).toEqual(mockUpdatedIntent);
    });
  });

  describe('list', () => {
    it('should list payment intents with pagination', async () => {
      // Arrange
      const mockIntents = [
        { id: 'pi_1', status: 'PENDING' },
        { id: 'pi_2', status: 'PROCESSING' },
      ];

      mockPrismaClient.paymentIntent.findMany = vi.fn().mockResolvedValue(mockIntents);
      mockPrismaClient.paymentIntent.count = vi.fn().mockResolvedValue(10);

      // Act
      const result = await service.list({
        merchantId: 'merchant-123',
        limit: 2,
        offset: 0,
      });

      // Assert
      expect(mockPrismaClient.paymentIntent.findMany).toHaveBeenCalledWith({
        where: { merchantId: 'merchant-123' },
        include: {
          customer: true,
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 0,
      });

      expect(result).toEqual({
        data: mockIntents,
        total: 10,
        hasMore: true,
      });
    });

    it('should filter by status', async () => {
      // Arrange
      mockPrismaClient.paymentIntent.findMany = vi.fn().mockResolvedValue([]);
      mockPrismaClient.paymentIntent.count = vi.fn().mockResolvedValue(0);

      // Act
      await service.list({
        status: 'FINALIZED',
      });

      // Assert
      expect(mockPrismaClient.paymentIntent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'FINALIZED' },
        })
      );
    });
  });

  describe('confirm', () => {
    it('should confirm payment intent and start processing', async () => {
      // Arrange
      const mockPendingIntent = {
        id: 'pi_123',
        status: 'PENDING',
        merchantId: 'merchant-123',
        computationId: null,
      };

      const mockConfirmedIntent = {
        ...mockPendingIntent,
        status: 'PROCESSING',
      };

      mockPrismaClient.paymentIntent.findUnique = vi.fn().mockResolvedValue(mockPendingIntent);
      mockPrismaClient.paymentIntent.update = vi.fn().mockResolvedValue(mockConfirmedIntent);

      // Mock submitToBlockchain (private method)
      // We'll verify it was called by checking the update
      mockPrismaClient.merchant.findUnique = vi.fn().mockResolvedValue({
        id: 'merchant-123',
        user: { walletAddress: 'wallet-123' },
      });
      (mockArciumClient.queuePaymentIntentSettlement as any) = vi.fn().mockResolvedValue({
        computationId: 'comp-123',
      });

      // Act
      const result = await service.confirm('pi_123');

      // Assert
      expect(mockPrismaClient.paymentIntent.update).toHaveBeenCalled();
      expect(result.status).toBe('PROCESSING');
    });

    it('should throw error if payment intent not in PENDING status', async () => {
      // Arrange
      mockPrismaClient.paymentIntent.findUnique = vi.fn().mockResolvedValue({
        id: 'pi_123',
        status: 'FINALIZED', // Already finalized
      });

      // Act & Assert
      await expect(service.confirm('pi_123')).rejects.toThrow(
        'Payment intent cannot be confirmed in status: FINALIZED'
      );
    });
  });

  describe('cancel', () => {
    it('should cancel payment intent', async () => {
      // Arrange
      const mockPendingIntent = {
        id: 'pi_123',
        status: 'PENDING',
      };

      const mockCancelledIntent = {
        ...mockPendingIntent,
        status: 'CANCELLED',
      };

      mockPrismaClient.paymentIntent.findUnique = vi.fn().mockResolvedValue(mockPendingIntent);
      mockPrismaClient.paymentIntent.update = vi.fn().mockResolvedValue(mockCancelledIntent);

      // Act
      const result = await service.cancel('pi_123');

      // Assert
      expect(mockPrismaClient.paymentIntent.update).toHaveBeenCalledWith({
        where: { id: 'pi_123' },
        data: { status: 'CANCELLED' },
        include: {
          customer: true,
          product: true,
        },
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw error if payment intent cannot be cancelled', async () => {
      // Arrange
      mockPrismaClient.paymentIntent.findUnique = vi.fn().mockResolvedValue({
        id: 'pi_123',
        status: 'FINALIZED', // Cannot cancel finalized payment
      });

      // Act & Assert
      await expect(service.cancel('pi_123')).rejects.toThrow(
        'Payment intent cannot be cancelled in status: FINALIZED'
      );
    });
  });
});
