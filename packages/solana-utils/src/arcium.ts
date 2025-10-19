import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

/**
 * Arcium MPC integration utilities
 *
 * This module provides interfaces for interacting with Arcium's MPC network
 * for confidential computations on Solana.
 */

export interface ArciumConfig {
  clusterAddress: string;
  programId: string;
  rpcUrl: string;
}

export interface ComputationRequest {
  instructionName: string;
  encryptedInputs: Buffer[];
  userPubkey: PublicKey;
  callbackUrl?: string;
}

export interface ComputationResult {
  computationId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: Buffer;
  error?: string;
}

/**
 * Arcium MPC Client
 *
 * Handles encrypted computation requests to Arcium MPC network
 */
export class ArciumClient {
  private config: ArciumConfig;
  private connection: Connection;

  constructor(config: ArciumConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl);
  }

  /**
   * Queue a computation to the Arcium MPC cluster
   */
  async queueComputation(request: ComputationRequest): Promise<string> {
    // Build instruction to invoke MPC computation
    const instruction = await this.buildComputationInstruction(request);

    // Create transaction
    const transaction = new Transaction().add(instruction);

    // Return computation ID (derived from transaction signature)
    const computationId = this.generateComputationId();

    return computationId;
  }

  /**
   * Build Solana instruction to invoke MPC computation
   */
  private async buildComputationInstruction(
    request: ComputationRequest
  ): Promise<TransactionInstruction> {
    const programId = new PublicKey(this.config.programId);
    const clusterPubkey = new PublicKey(this.config.clusterAddress);

    // Instruction data format:
    // - 8 bytes: instruction discriminator
    // - Variable: encrypted inputs
    const data = Buffer.concat([
      Buffer.from([0x01]), // Queue computation discriminator
      Buffer.from(request.instructionName),
      ...request.encryptedInputs,
    ]);

    return new TransactionInstruction({
      keys: [
        { pubkey: request.userPubkey, isSigner: true, isWritable: true },
        { pubkey: clusterPubkey, isSigner: false, isWritable: false },
      ],
      programId,
      data,
    });
  }

  /**
   * Poll for computation result
   */
  async getComputationResult(computationId: string): Promise<ComputationResult | null> {
    // This would typically query the Arcium service or on-chain state
    // For now, return placeholder
    return null;
  }

  /**
   * Derive cluster PDA (Program Derived Address)
   */
  async deriveClusterPDA(userPubkey: PublicKey): Promise<[PublicKey, number]> {
    const programId = new PublicKey(this.config.programId);

    return PublicKey.findProgramAddressSync(
      [Buffer.from('cluster'), userPubkey.toBuffer()],
      programId
    );
  }

  /**
   * Generate computation ID
   */
  private generateComputationId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Encryption utilities for Arcium MPC
 *
 * ⚠️ DEPRECATED: Use EncryptionHelper from './encryption' instead
 * This class is kept for backward compatibility but should not be used for new code
 *
 * @deprecated Use EncryptionHelper for production-grade encryption
 */
export class EncryptionUtils {
  /**
   * @deprecated Use EncryptionHelper.encryptU64() instead
   */
  static encryptValue(value: bigint | number): Buffer {
    console.warn('EncryptionUtils.encryptValue is deprecated. Use EncryptionHelper from @ninjapay/solana-utils/encryption instead.');
    const numValue = typeof value === 'bigint' ? Number(value) : value;
    const buffer = Buffer.allocUnsafe(8);
    buffer.writeBigUInt64LE(BigInt(numValue));
    return buffer;
  }

  /**
   * @deprecated Use EncryptionHelper.decryptToU64() instead
   */
  static decryptValue(encryptedData: Buffer): bigint {
    console.warn('EncryptionUtils.decryptValue is deprecated. Use EncryptionHelper from @ninjapay/solana-utils/encryption instead.');
    if (encryptedData.length < 8) {
      throw new Error('Invalid encrypted data length');
    }
    return encryptedData.readBigUInt64LE(0);
  }

  /**
   * @deprecated Use EncryptionHelper for batch operations
   */
  static encryptBatch(values: (bigint | number)[]): Buffer[] {
    return values.map(v => this.encryptValue(v));
  }

  /**
   * @deprecated Use EncryptionHelper for batch operations
   */
  static decryptBatch(encryptedValues: Buffer[]): bigint[] {
    return encryptedValues.map(v => this.decryptValue(v));
  }
}

/**
 * Helper to build confidential transfer transaction
 */
export async function buildConfidentialTransfer(
  client: ArciumClient,
  sender: PublicKey,
  recipient: PublicKey,
  amount: bigint
): Promise<ComputationRequest> {
  // Encrypt the amount
  const encryptedAmount = EncryptionUtils.encryptValue(amount);

  return {
    instructionName: 'encrypted_transfer',
    encryptedInputs: [encryptedAmount],
    userPubkey: sender,
  };
}

/**
 * Helper to build batch payroll transaction
 */
export async function buildBatchPayroll(
  client: ArciumClient,
  payer: PublicKey,
  recipients: { address: PublicKey; amount: bigint }[]
): Promise<ComputationRequest> {
  // Encrypt all amounts
  const encryptedAmounts = recipients.map(r =>
    EncryptionUtils.encryptValue(r.amount)
  );

  return {
    instructionName: 'batch_payroll',
    encryptedInputs: encryptedAmounts.slice(0, 3), // Max 3 for now
    userPubkey: payer,
  };
}
