import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import {
  MagicBlockPayrollClient,
  PaymentRecipient,
  createDevnetPayrollClient,
} from '@ninjapay/solana-utils';
import { createLogger } from '@ninjapay/logger';

const logger = createLogger({ service: 'payroll-service' });

export interface PayrollRequest {
  recipients: Array<{
    walletAddress: string;
    amount: string; // Amount in token base units
  }>;
  tokenMint: string;
  description?: string;
}

export interface PayrollResult {
  batchId: string;
  status: 'success' | 'failed';
  totalRecipients: number;
  totalAmount: string;
  transactionSignatures: string[];
  processingTimeMs: number;
  costSavings: string;
}

/**
 * Payroll Service
 *
 * Handles batch payroll processing using MagicBlock Ephemeral Rollups
 * - Processes 100+ payments at 10-50ms each
 * - Cost: ~$0.02 vs ~$1.00 for traditional approach
 * - Private execution available with TEE
 */
export class PayrollService {
  private magicBlockClient: MagicBlockPayrollClient;
  private connection: Connection;

  constructor(programId: PublicKey) {
    this.magicBlockClient = createDevnetPayrollClient(programId);
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    );
  }

  /**
   * Execute batch payroll
   */
  async processBatchPayroll(
    authority: Keypair,
    request: PayrollRequest
  ): Promise<PayrollResult> {
    const startTime = Date.now();

    logger.info('Starting batch payroll', {
      recipients: request.recipients.length,
      tokenMint: request.tokenMint,
    });

    try {
      // Convert recipients to PaymentRecipient format
      const tokenMint = new PublicKey(request.tokenMint);
      const sourceTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        authority.publicKey
      );

      const recipients: PaymentRecipient[] = await Promise.all(
        request.recipients.map(async (r) => {
          const walletPubkey = new PublicKey(r.walletAddress);
          const tokenAccount = await getAssociatedTokenAddress(tokenMint, walletPubkey);

          return {
            tokenAccount,
            amount: BigInt(r.amount),
          };
        })
      );

      // Calculate total amount
      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, BigInt(0));

      // MagicBlock context and program (would be configured via env)
      const magicContextPubkey = new PublicKey(
        process.env.MAGIC_CONTEXT_PUBKEY || Keypair.generate().publicKey.toBase58()
      );
      const magicProgramPubkey = new PublicKey(
        process.env.MAGIC_PROGRAM_PUBKEY || Keypair.generate().publicKey.toBase58()
      );

      // Execute payroll using MagicBlock ephemeral rollups
      const result = await this.magicBlockClient.executePayroll(
        authority,
        sourceTokenAccount,
        recipients,
        magicContextPubkey,
        magicProgramPubkey
      );

      const processingTime = Date.now() - startTime;

      logger.info('Batch payroll completed', {
        batchId: result.batchId.toString(),
        recipients: recipients.length,
        totalAmount: totalAmount.toString(),
        processingTimeMs: processingTime,
        costSavings: result.costSavings,
      });

      return {
        batchId: result.batchId.toString(),
        status: 'success',
        totalRecipients: recipients.length,
        totalAmount: totalAmount.toString(),
        transactionSignatures: [
          result.signatures.initialize,
          result.signatures.delegate,
          ...result.signatures.payments,
          result.signatures.finalize,
        ],
        processingTimeMs: processingTime,
        costSavings: result.costSavings,
      };
    } catch (error: any) {
      logger.error('Batch payroll failed', {
        error: error.message,
        stack: error.stack,
      });

      return {
        batchId: '',
        status: 'failed',
        totalRecipients: request.recipients.length,
        totalAmount: '0',
        transactionSignatures: [],
        processingTimeMs: Date.now() - startTime,
        costSavings: '0%',
      };
    }
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<any> {
    const batch = await this.magicBlockClient.getBatch(BigInt(batchId));

    if (!batch) {
      return null;
    }

    return {
      batchId,
      authority: batch.authority.toBase58(),
      totalRecipients: batch.totalRecipients,
      processedCount: batch.processedCount,
      totalAmount: batch.totalAmount.toString(),
      status: this.mapBatchStatus(batch.status),
      createdAt: new Date(Number(batch.createdAt) * 1000).toISOString(),
    };
  }

  /**
   * Estimate costs for batch payroll
   */
  estimateCosts(recipientCount: number): {
    traditional: string;
    ephemeral: string;
    savings: string;
    savingsPercent: string;
  } {
    const traditionalCost = recipientCount * 0.01; // $0.01 per tx
    const ephemeralCost = 0.02; // $0.02 for delegation + settlement
    const savings = traditionalCost - ephemeralCost;
    const savingsPercent = ((savings / traditionalCost) * 100).toFixed(1);

    return {
      traditional: `$${traditionalCost.toFixed(2)}`,
      ephemeral: `$${ephemeralCost.toFixed(2)}`,
      savings: `$${savings.toFixed(2)}`,
      savingsPercent: `${savingsPercent}%`,
    };
  }

  private mapBatchStatus(status: number): string {
    const statusMap: Record<number, string> = {
      0: 'initialized',
      1: 'delegated',
      2: 'processing',
      3: 'finalized',
      4: 'cancelled',
    };

    return statusMap[status] || 'unknown';
  }
}
