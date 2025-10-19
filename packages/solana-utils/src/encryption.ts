import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';

/**
 * Development-mode encryption for NinjaPay MPC computations
 *
 * ⚠️ WARNING: This is a DEVELOPMENT-MODE encryption implementation
 * Production deployment MUST use RescueCipher from Arcium SDK
 *
 * This module provides:
 * - ChaCha20-Poly1305 AEAD encryption
 * - HKDF-based key derivation per user
 * - Compatible with Rust implementation in arcium-service
 *
 * Security model:
 * - Master key from environment
 * - Per-user keys derived via HKDF(master_key, user_pubkey)
 * - Random nonces for each encryption operation
 * - Authenticated encryption prevents tampering
 *
 * Data format: [nonce (12 bytes)] + [ciphertext] + [auth tag (16 bytes)]
 */

const NONCE_LENGTH = 12; // ChaCha20-Poly1305 standard nonce length
const TAG_LENGTH = 16; // Authentication tag length
const KEY_LENGTH = 32; // 256-bit key

/**
 * Encryption helper for MPC computations
 *
 * Matches the Rust implementation in services/arcium-service/src/mpc/encryption.rs
 */
export class EncryptionHelper {
  private masterKey: Uint8Array;

  /**
   * Create encryption helper with master key
   *
   * @param masterKey - 32-byte (64 hex chars) master encryption key
   */
  constructor(masterKey: string) {
    // Convert hex string to bytes
    if (masterKey.length !== 64) {
      throw new Error('Master key must be 64 hex characters (32 bytes)');
    }
    this.masterKey = hexToBytes(masterKey);
  }

  /**
   * Derive a user-specific encryption key using HKDF
   *
   * Derivation: HKDF-SHA256(master_key, salt=user_pubkey, info="ninjapay-dev-v1")
   *
   * This MUST match the Rust implementation exactly
   */
  private deriveUserKey(userPubkey: string): Uint8Array {
    const salt = new TextEncoder().encode(userPubkey);
    const info = new TextEncoder().encode('ninjapay-dev-v1');

    // HKDF-SHA256 with salt and info
    const derivedKey = hkdf(sha256, this.masterKey, salt, info, KEY_LENGTH);

    return derivedKey;
  }

  /**
   * Encrypt a u64 value (for simulator)
   *
   * Converts number to 8-byte little-endian, then encrypts
   * Returns: [nonce (12)] + [ciphertext (8)] + [tag (16)] = 36 bytes total
   *
   * @param value - Number to encrypt (must fit in u64)
   * @param userPubkey - User's public key for key derivation
   * @returns Base64-encoded encrypted data
   */
  encryptU64(value: number | bigint, userPubkey: string): string {
    // Convert to 8-byte little-endian
    const plaintext = new Uint8Array(8);
    const view = new DataView(plaintext.buffer);
    view.setBigUint64(0, BigInt(value), true); // true = little-endian

    const encrypted = this.encryptBytes(plaintext, userPubkey);
    return bytesToBase64(encrypted);
  }

  /**
   * Decrypt to u64 value (for simulator)
   *
   * Decrypts and converts 8-byte little-endian to number
   *
   * @param encrypted - Base64-encoded encrypted data
   * @param userPubkey - User's public key for key derivation
   * @returns Decrypted number
   */
  decryptToU64(encrypted: string, userPubkey: string): bigint {
    const encryptedBytes = base64ToBytes(encrypted);
    const plaintext = this.decryptBytes(encryptedBytes, userPubkey);

    if (plaintext.length !== 8) {
      throw new Error(
        `Invalid u64 decryption: expected 8 bytes, got ${plaintext.length}`
      );
    }

    const view = new DataView(plaintext.buffer);
    return view.getBigUint64(0, true); // true = little-endian
  }

  /**
   * Encrypt arbitrary bytes
   *
   * Format: [nonce (12 bytes)] + [ciphertext] + [tag (16 bytes)]
   *
   * @param data - Data to encrypt
   * @param userPubkey - User's public key for key derivation
   * @returns Encrypted bytes (nonce + ciphertext + tag)
   */
  encryptBytes(data: Uint8Array, userPubkey: string): Uint8Array {
    // Derive user-specific key
    const userKey = this.deriveUserKey(userPubkey);

    // Generate random nonce
    const nonce = randomBytes(NONCE_LENGTH);

    // Create cipher instance
    const cipher = chacha20poly1305(userKey, nonce);

    // Encrypt (returns ciphertext + tag combined)
    const ciphertext = cipher.encrypt(data);

    // Combine: nonce + ciphertext
    const result = new Uint8Array(NONCE_LENGTH + ciphertext.length);
    result.set(nonce, 0);
    result.set(ciphertext, NONCE_LENGTH);

    return result;
  }

  /**
   * Decrypt arbitrary bytes
   *
   * Expects format: [nonce (12 bytes)] + [ciphertext] + [tag (16 bytes)]
   *
   * @param encrypted - Encrypted data
   * @param userPubkey - User's public key for key derivation
   * @returns Decrypted plaintext
   */
  decryptBytes(encrypted: Uint8Array, userPubkey: string): Uint8Array {
    // Validate minimum length (nonce + tag)
    const minLength = NONCE_LENGTH + TAG_LENGTH;
    if (encrypted.length < minLength) {
      throw new Error(
        `Invalid encrypted data: too short (got ${encrypted.length} bytes, need at least ${minLength})`
      );
    }

    // Extract nonce and ciphertext
    const nonce = encrypted.slice(0, NONCE_LENGTH);
    const ciphertext = encrypted.slice(NONCE_LENGTH);

    // Derive user-specific key
    const userKey = this.deriveUserKey(userPubkey);

    // Create cipher instance
    const cipher = chacha20poly1305(userKey, nonce);

    // Decrypt (will throw if authentication fails)
    try {
      const plaintext = cipher.decrypt(ciphertext);
      return plaintext;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  /**
   * Validate encrypted input format
   *
   * Checks:
   * 1. Not empty
   * 2. Minimum length (nonce + tag = 28 bytes)
   * 3. Proper structure
   *
   * @param encryptedData - Data to validate
   * @returns true if valid format
   */
  validateEncryptedInput(encryptedData: Uint8Array): boolean {
    if (encryptedData.length === 0) {
      console.warn('Validation failed: empty input');
      return false;
    }

    // Minimum: nonce (12) + minimal plaintext (0) + tag (16) = 28 bytes
    const minLength = NONCE_LENGTH + TAG_LENGTH;
    if (encryptedData.length < minLength) {
      console.warn(
        `Validation failed: too short (${encryptedData.length} bytes, need at least ${minLength})`
      );
      return false;
    }

    // For u64 encrypted values, expect exactly 36 bytes
    // nonce (12) + plaintext (8) + tag (16) = 36
    if (encryptedData.length === 36) {
      return true;
    }

    // Other lengths are valid as long as >= 28
    return true;
  }

  /**
   * Prepare encrypted inputs for batching
   *
   * Format: [count (4 bytes)] + [len1 (4)] + [data1] + [len2 (4)] + [data2] + ...
   *
   * @param encryptedValues - Array of encrypted values
   * @returns Batched encrypted data
   */
  prepareBatchInputs(encryptedValues: Uint8Array[]): Uint8Array {
    // Validate all inputs first
    for (let i = 0; i < encryptedValues.length; i++) {
      if (!this.validateEncryptedInput(encryptedValues[i])) {
        throw new Error(`Invalid encrypted input at index ${i}`);
      }
    }

    // Calculate total size
    const count = encryptedValues.length;
    let totalSize = 4; // count
    for (const value of encryptedValues) {
      totalSize += 4 + value.length; // len + data per item
    }

    const result = new Uint8Array(totalSize);
    const view = new DataView(result.buffer);
    let offset = 0;

    // Write count
    view.setUint32(offset, count, true); // little-endian
    offset += 4;

    // Write each value with length prefix
    for (const value of encryptedValues) {
      view.setUint32(offset, value.length, true); // little-endian
      offset += 4;
      result.set(value, offset);
      offset += value.length;
    }

    return result;
  }

  /**
   * Extract individual results from batch computation
   *
   * Expects format: [count (4 bytes)] + [len1 (4)] + [data1] + [len2 (4)] + [data2] + ...
   *
   * @param batchResult - Batched result data
   * @param expectedCount - Expected number of results
   * @returns Array of individual encrypted results
   */
  extractBatchResults(
    batchResult: Uint8Array,
    expectedCount: number
  ): Uint8Array[] {
    if (batchResult.length < 4) {
      throw new Error('Batch result too short: missing count');
    }

    const view = new DataView(batchResult.buffer);
    let offset = 0;

    // Read count
    const count = view.getUint32(offset, true); // little-endian
    offset += 4;

    if (count !== expectedCount) {
      throw new Error(
        `Batch count mismatch: expected ${expectedCount}, got ${count}`
      );
    }

    const results: Uint8Array[] = [];

    // Read each value
    for (let i = 0; i < count; i++) {
      if (offset + 4 > batchResult.length) {
        throw new Error(`Batch result truncated at item ${i}`);
      }

      // Read length
      const len = view.getUint32(offset, true); // little-endian
      offset += 4;

      // Read data
      if (offset + len > batchResult.length) {
        throw new Error(`Batch result truncated: item ${i} data incomplete`);
      }

      const data = batchResult.slice(offset, offset + len);
      results.push(data);
      offset += len;
    }

    return results;
  }
}

/**
 * Utility functions for HTTP API integration
 */
export class EncryptionAPIUtils {
  private encryption: EncryptionHelper;

  constructor(masterKey: string) {
    this.encryption = new EncryptionHelper(masterKey);
  }

  /**
   * Encrypt value for API request
   *
   * @param value - Number to encrypt
   * @param userPubkey - User's public key
   * @returns Base64-encoded encrypted value (ready for JSON/HTTP)
   */
  encryptForAPI(value: number | bigint, userPubkey: string): string {
    return this.encryption.encryptU64(value, userPubkey);
  }

  /**
   * Decrypt value from API response
   *
   * @param encrypted - Base64-encoded encrypted value
   * @param userPubkey - User's public key
   * @returns Decrypted number
   */
  decryptFromAPI(encrypted: string, userPubkey: string): bigint {
    return this.encryption.decryptToU64(encrypted, userPubkey);
  }

  /**
   * Prepare multiple encrypted inputs for API request
   *
   * @param values - Values to encrypt
   * @param userPubkey - User's public key
   * @returns Array of base64-encoded encrypted values
   */
  encryptBatchForAPI(
    values: (number | bigint)[],
    userPubkey: string
  ): string[] {
    return values.map((v) => this.encryption.encryptU64(v, userPubkey));
  }
}

/**
 * Utility: Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Utility: Convert bytes to base64
 */
function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    // Node.js
    return Buffer.from(bytes).toString('base64');
  } else {
    // Browser
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Utility: Convert base64 to bytes
 */
function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    // Node.js
    return new Uint8Array(Buffer.from(base64, 'base64'));
  } else {
    // Browser
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Example usage for merchant dashboard:
 *
 * ```typescript
 * // Initialize encryption helper
 * const masterKey = process.env.ENCRYPTION_MASTER_KEY!;
 * const apiUtils = new EncryptionAPIUtils(masterKey);
 *
 * // Encrypt payment amount
 * const userPubkey = 'user_wallet_address';
 * const amount = 1000; // $10.00 in cents
 * const encryptedAmount = apiUtils.encryptForAPI(amount, userPubkey);
 *
 * // Send to Arcium Service API
 * const response = await fetch('http://localhost:8001/api/computation/invoke', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     computation_type: 'encrypted_transfer',
 *     encrypted_inputs: [encryptedAmount],
 *     user_pubkey: userPubkey,
 *   }),
 * });
 *
 * // Get result
 * const { computation_id } = await response.json();
 *
 * // Poll for result
 * const resultResponse = await fetch(
 *   `http://localhost:8001/api/computation/status?computation_id=${computation_id}`
 * );
 * const { result } = await resultResponse.json();
 *
 * // Decrypt result
 * const decryptedResult = apiUtils.decryptFromAPI(result, userPubkey);
 * console.log('New balance:', decryptedResult);
 * ```
 */
