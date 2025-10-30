import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from '@ninjapay/database';

const BCRYPT_ROUNDS = 10;
const API_KEY_PREFIX = 'sk_live_';
const API_KEY_TEST_PREFIX = 'sk_test_';

/**
 * Service for managing API keys with bcrypt hashing
 */
export class ApiKeyService {
  /**
   * Generate a new API key with the specified prefix
   * @param isTest Whether this is a test key
   * @returns The raw API key (only shown once)
   */
  static generateApiKey(isTest: boolean = false): string {
    const randomPart = randomBytes(24).toString('base64url'); // URL-safe base64
    const prefix = isTest ? API_KEY_TEST_PREFIX : API_KEY_PREFIX;
    return `${prefix}${randomPart}`;
  }

  /**
   * Hash an API key using bcrypt
   * @param rawKey The plaintext API key
   * @returns The hashed key
   */
  static async hashApiKey(rawKey: string): Promise<string> {
    return await bcrypt.hash(rawKey, BCRYPT_ROUNDS);
  }

  /**
   * Verify an API key against a hashed value
   * @param rawKey The plaintext API key to verify
   * @param hashedKey The hashed key from database
   * @returns True if the key matches
   */
  static async verifyApiKey(rawKey: string, hashedKey: string): Promise<boolean> {
    return await bcrypt.compare(rawKey, hashedKey);
  }

  /**
   * Create a new API key for a merchant
   * @param merchantId The merchant ID
   * @param name Friendly name for the key
   * @param isTest Whether this is a test key
   * @returns Object with the raw key (to show to merchant) and database record
   */
  static async createApiKey(
    merchantId: string,
    name: string,
    isTest: boolean = false
  ): Promise<{
    rawKey: string;
    apiKey: { id: string; name: string; active: boolean; createdAt: Date };
  }> {
    // Generate raw key
    const rawKey = this.generateApiKey(isTest);

    // Hash it
    const hashedKey = await this.hashApiKey(rawKey);

    // Store hashed version in database
    const apiKey = await prisma.apiKey.create({
      data: {
        merchantId,
        key: hashedKey, // Store hashed, not plaintext
        name,
        active: true,
        permissions: ['read', 'write'],
      },
      select: {
        id: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });

    // Return raw key (only shown once) + DB record
    return {
      rawKey, // This is what merchant sees: sk_live_xxxxx
      apiKey,
    };
  }

  /**
   * Verify an API key and return the associated merchant
   * @param rawKey The API key from the request header
   * @returns Merchant if key is valid, null otherwise
   */
  static async validateApiKey(rawKey: string): Promise<{
    id: string;
    businessName: string;
    email: string;
  } | null> {
    // Get all merchants with their hashed API keys
    // Note: We can't query by hashed key directly, so we need to check all merchants
    // For better performance, consider adding a key prefix index or use a different approach
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        businessName: true,
        email: true,
        apiKey: true,
      },
    });

    // Check each merchant's hashed API key
    for (const merchant of merchants) {
      const isValid = await this.verifyApiKey(rawKey, merchant.apiKey);
      if (isValid) {
        // Update merchant's last activity timestamp
        await prisma.merchant.update({
          where: { id: merchant.id },
          data: { updatedAt: new Date() },
        });

        return {
          id: merchant.id,
          businessName: merchant.businessName,
          email: merchant.email,
        };
      }
    }

    return null;
  }

  /**
   * Revoke (deactivate) an API key
   * @param apiKeyId The API key ID to revoke
   */
  static async revokeApiKey(apiKeyId: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { active: false },
    });
  }

  /**
   * Mask an API key for display (show only last 4 characters)
   * @param rawKey The raw API key
   * @returns Masked key like "sk_live_...abc123"
   */
  static maskApiKey(rawKey: string): string {
    if (rawKey.length < 12) {
      return '***';
    }
    const prefix = rawKey.substring(0, 8); // sk_live_ or sk_test_
    const lastFour = rawKey.slice(-4);
    return `${prefix}...${lastFour}`;
  }
}
