import {
  Connection,
  Transaction,
  PublicKey,
  TransactionInstruction,
  SendOptions,
  Commitment,
  Keypair,
  TransactionSignature,
} from '@solana/web3.js';
import { createLogger } from '@ninjapay/logger';

const logger = createLogger('solana-transaction');

export interface TransactionResult {
  signature: string;
  confirmed: boolean;
  slot?: number;
  error?: string;
}

export class TransactionUtils {
  /**
   * Build and send transaction
   */
  static async buildAndSendTransaction(
    connection: Connection,
    instructions: TransactionInstruction[],
    payer: PublicKey,
    signers: Keypair[] = [],
    options?: SendOptions
  ): Promise<TransactionResult> {
    try {
      const transaction = new Transaction();
      instructions.forEach((ix) => transaction.add(ix));

      transaction.feePayer = payer;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      if (signers.length > 0) {
        transaction.sign(...signers);
      }

      const signature = await connection.sendTransaction(
        transaction,
        signers,
        options
      );

      logger.info('Transaction sent', { signature });

      return {
        signature,
        confirmed: false,
      };
    } catch (error) {
      logger.error('Failed to send transaction', { error });
      throw error;
    }
  }

  /**
   * Confirm transaction
   */
  static async confirmTransaction(
    connection: Connection,
    signature: TransactionSignature,
    commitment: Commitment = 'confirmed'
  ): Promise<TransactionResult> {
    try {
      const result = await connection.confirmTransaction(signature, commitment);

      return {
        signature,
        confirmed: !result.value.err,
        error: result.value.err ? JSON.stringify(result.value.err) : undefined,
      };
    } catch (error) {
      logger.error('Failed to confirm transaction', { signature, error });
      return {
        signature,
        confirmed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get transaction details
   */
  static async getTransaction(
    connection: Connection,
    signature: string,
    commitment: Commitment = 'confirmed'
  ) {
    try {
      const transaction = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      return transaction;
    } catch (error) {
      logger.error('Failed to get transaction', { signature, error });
      throw error;
    }
  }

  /**
   * Estimate transaction fee
   */
  static async estimateFee(
    connection: Connection,
    transaction: Transaction
  ): Promise<number> {
    try {
      const fee = await transaction.getEstimatedFee(connection);
      return fee || 0;
    } catch (error) {
      logger.error('Failed to estimate fee', { error });
      return 5000; // Default to 0.000005 SOL
    }
  }

  /**
   * Wait for confirmation with retry
   */
  static async waitForConfirmation(
    connection: Connection,
    signature: string,
    maxRetries: number = 30,
    retryDelay: number = 1000
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.confirmTransaction(connection, signature);
      if (result.confirmed) {
        logger.info('Transaction confirmed', { signature, attempts: i + 1 });
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    logger.warn('Transaction confirmation timeout', { signature });
    return false;
  }
}
