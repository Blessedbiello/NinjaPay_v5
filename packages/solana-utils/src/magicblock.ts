import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * MagicBlock Ephemeral Rollup Integration
 *
 * Enables high-speed, low-cost batch processing on Solana
 * - 10-50ms transaction latency
 * - Zero fees during ephemeral session
 * - Predictable costs (~$0.02 for 100+ payments)
 */

export interface MagicBlockConfig {
  /** Magic Router RPC endpoint */
  rpcUrl: string;
  /** Ephemeral validator public key (Asia/EU/US) */
  validatorPubkey?: PublicKey;
  /** Ninja Payroll program ID */
  programId: PublicKey;
}

export interface PayrollBatch {
  batchId: bigint;
  authority: PublicKey;
  totalRecipients: number;
  processedCount: number;
  totalAmount: bigint;
  status: BatchStatus;
  createdAt: bigint;
  finalizedAt: bigint | null;
}

export enum BatchStatus {
  Initialized = 0,
  Delegated = 1,
  Processing = 2,
  Finalized = 3,
  Cancelled = 4,
}

export interface PaymentRecipient {
  tokenAccount: PublicKey;
  amount: bigint;
}

/**
 * MagicBlock Ephemeral Rollup Client for Batch Payroll
 */
export class MagicBlockPayrollClient {
  private connection: Connection;
  private config: MagicBlockConfig;

  // MagicBlock devnet validators
  static readonly VALIDATORS = {
    ASIA: new PublicKey('MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57'),
    EU: new PublicKey('MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e'),
    US: new PublicKey('MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd'),
  };

  // Magic Router devnet endpoint
  static readonly MAGIC_ROUTER_DEVNET = 'https://devnet-router.magicblock.app';
  static readonly ER_DEVNET = 'https://devnet.magicblock.app';

  constructor(config: MagicBlockConfig) {
    this.config = config;
    // Use Magic Router for automatic transaction routing
    this.connection = new Connection(config.rpcUrl);
  }

  /**
   * Derive batch PDA address
   */
  async deriveBatchAddress(batchId: bigint): Promise<[PublicKey, number]> {
    const batchIdBuffer = Buffer.allocUnsafe(8);
    batchIdBuffer.writeBigUInt64LE(batchId);

    return PublicKey.findProgramAddressSync(
      [Buffer.from('payroll_batch'), batchIdBuffer],
      this.config.programId
    );
  }

  /**
   * Initialize a new payroll batch
   */
  async initializeBatch(
    authority: Keypair,
    batchId: bigint,
    totalRecipients: number
  ): Promise<string> {
    const [batchPda] = await this.deriveBatchAddress(batchId);

    const batchIdBuffer = Buffer.allocUnsafe(8);
    batchIdBuffer.writeBigUInt64LE(batchId);

    const totalRecipientsBuffer = Buffer.allocUnsafe(2);
    totalRecipientsBuffer.writeUInt16LE(totalRecipients);

    // Build instruction data
    const data = Buffer.concat([
      Buffer.from([0]), // Instruction discriminator for initialize_batch
      batchIdBuffer,
      totalRecipientsBuffer,
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: batchPda, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: false },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.config.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await this.connection.sendTransaction(transaction, [authority]);

    return signature;
  }

  /**
   * Delegate batch to ephemeral rollup
   *
   * This transitions the batch into high-speed processing mode
   */
  async delegateBatch(authority: Keypair, batchId: bigint): Promise<string> {
    const [batchPda] = await this.deriveBatchAddress(batchId);

    const data = Buffer.from([1]); // Instruction discriminator for delegate_batch

    const keys = [
      { pubkey: batchPda, isSigner: false, isWritable: true },
      { pubkey: authority.publicKey, isSigner: true, isWritable: false },
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
    ];

    // Add validator as remaining account if specified
    if (this.config.validatorPubkey) {
      keys.push({
        pubkey: this.config.validatorPubkey,
        isSigner: false,
        isWritable: false,
      });
    }

    const instruction = new TransactionInstruction({
      keys,
      programId: this.config.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await this.connection.sendTransaction(transaction, [authority]);

    console.log(`Batch ${batchId} delegated to ephemeral rollup: ${signature}`);
    return signature;
  }

  /**
   * Process a single payment in the batch
   *
   * This executes at 10-50ms latency in the ephemeral rollup
   */
  async processPayment(
    authority: Keypair,
    batchId: bigint,
    sourceTokenAccount: PublicKey,
    recipientTokenAccount: PublicKey,
    amount: bigint,
    recipientIndex: number
  ): Promise<string> {
    const [batchPda] = await this.deriveBatchAddress(batchId);

    const amountBuffer = Buffer.allocUnsafe(8);
    amountBuffer.writeBigUInt64LE(amount);

    const indexBuffer = Buffer.allocUnsafe(2);
    indexBuffer.writeUInt16LE(recipientIndex);

    const data = Buffer.concat([
      Buffer.from([2]), // Instruction discriminator for process_payment
      amountBuffer,
      indexBuffer,
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: batchPda, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: false },
        { pubkey: sourceTokenAccount, isSigner: false, isWritable: true },
        { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: this.config.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await this.connection.sendTransaction(transaction, [authority]);

    return signature;
  }

  /**
   * Process multiple payments in a batch
   *
   * Efficiently batches multiple payment instructions together
   */
  async processBatchPayments(
    authority: Keypair,
    batchId: bigint,
    sourceTokenAccount: PublicKey,
    recipients: PaymentRecipient[]
  ): Promise<string[]> {
    const signatures: string[] = [];

    console.log(`Processing ${recipients.length} payments in ephemeral rollup...`);

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const signature = await this.processPayment(
        authority,
        batchId,
        sourceTokenAccount,
        recipient.tokenAccount,
        recipient.amount,
        i
      );

      signatures.push(signature);

      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1}/${recipients.length} payments`);
      }
    }

    console.log(`All ${recipients.length} payments processed!`);
    return signatures;
  }

  /**
   * Commit intermediate state (optional during long batches)
   */
  async commitBatch(
    authority: Keypair,
    batchId: bigint,
    magicContextPubkey: PublicKey,
    magicProgramPubkey: PublicKey
  ): Promise<string> {
    const [batchPda] = await this.deriveBatchAddress(batchId);

    const data = Buffer.from([3]); // Instruction discriminator for commit_batch

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: batchPda, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: magicContextPubkey, isSigner: false, isWritable: false },
        { pubkey: magicProgramPubkey, isSigner: false, isWritable: false },
      ],
      programId: this.config.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await this.connection.sendTransaction(transaction, [authority]);

    return signature;
  }

  /**
   * Finalize batch and settle to Solana
   *
   * Commits final state and undelegates accounts
   */
  async finalizeBatch(
    authority: Keypair,
    batchId: bigint,
    magicContextPubkey: PublicKey,
    magicProgramPubkey: PublicKey
  ): Promise<string> {
    const [batchPda] = await this.deriveBatchAddress(batchId);

    const data = Buffer.from([4]); // Instruction discriminator for finalize_batch

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: batchPda, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: false },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: magicContextPubkey, isSigner: false, isWritable: false },
        { pubkey: magicProgramPubkey, isSigner: false, isWritable: false },
      ],
      programId: this.config.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await this.connection.sendTransaction(transaction, [authority]);

    console.log(`Batch ${batchId} finalized and settled to Solana: ${signature}`);
    return signature;
  }

  /**
   * Get batch account data
   */
  async getBatch(batchId: bigint): Promise<PayrollBatch | null> {
    const [batchPda] = await this.deriveBatchAddress(batchId);
    const accountInfo = await this.connection.getAccountInfo(batchPda);

    if (!accountInfo) {
      return null;
    }

    // Parse account data (simplified - would use Anchor's deserializer in production)
    const data = accountInfo.data;

    return {
      batchId,
      authority: new PublicKey(data.slice(8, 40)),
      totalRecipients: data.readUInt16LE(48),
      processedCount: data.readUInt16LE(50),
      totalAmount: data.readBigUInt64LE(52),
      status: data[60] as BatchStatus,
      createdAt: data.readBigInt64LE(61),
      finalizedAt: null, // Would parse optional field properly
    };
  }

  /**
   * Complete end-to-end payroll flow
   *
   * Handles: Initialize → Delegate → Process Payments → Finalize
   */
  async executePayroll(
    authority: Keypair,
    sourceTokenAccount: PublicKey,
    recipients: PaymentRecipient[],
    magicContextPubkey: PublicKey,
    magicProgramPubkey: PublicKey
  ): Promise<{
    batchId: bigint;
    signatures: {
      initialize: string;
      delegate: string;
      payments: string[];
      finalize: string;
    };
    costSavings: string;
  }> {
    const batchId = BigInt(Date.now());

    console.log(`\n🚀 Starting payroll for ${recipients.length} recipients`);
    console.log(`Batch ID: ${batchId}`);

    // Step 1: Initialize batch on Solana
    console.log('\n1️⃣  Initializing batch on Solana...');
    const initSig = await this.initializeBatch(authority, batchId, recipients.length);
    console.log(`   ✅ Initialized: ${initSig}`);

    // Step 2: Delegate to ephemeral rollup
    console.log('\n2️⃣  Delegating to ephemeral rollup...');
    const delegateSig = await this.delegateBatch(authority, batchId);
    console.log(`   ✅ Delegated: ${delegateSig}`);

    // Step 3: Process payments at high speed
    console.log('\n3️⃣  Processing payments in ephemeral rollup (10-50ms each)...');
    const startTime = Date.now();
    const paymentSigs = await this.processBatchPayments(
      authority,
      batchId,
      sourceTokenAccount,
      recipients
    );
    const processingTime = Date.now() - startTime;
    console.log(`   ✅ All payments processed in ${processingTime}ms`);

    // Step 4: Finalize and settle to Solana
    console.log('\n4️⃣  Finalizing and settling to Solana...');
    const finalizeSig = await this.finalizeBatch(
      authority,
      batchId,
      magicContextPubkey,
      magicProgramPubkey
    );
    console.log(`   ✅ Finalized: ${finalizeSig}`);

    // Calculate cost savings
    const traditionalCost = recipients.length * 0.01; // $0.01 per transaction
    const ephemeralCost = 0.02; // ~$0.02 for delegation + settlement
    const savings = ((traditionalCost - ephemeralCost) / traditionalCost * 100).toFixed(1);

    console.log(`\n💰 Cost Analysis:`);
    console.log(`   Traditional: $${traditionalCost.toFixed(2)}`);
    console.log(`   Ephemeral:   $${ephemeralCost.toFixed(2)}`);
    console.log(`   Savings:     ${savings}% ($${(traditionalCost - ephemeralCost).toFixed(2)})`);

    return {
      batchId,
      signatures: {
        initialize: initSig,
        delegate: delegateSig,
        payments: paymentSigs,
        finalize: finalizeSig,
      },
      costSavings: `${savings}% savings`,
    };
  }
}

/**
 * Helper to create MagicBlock client for devnet
 */
export function createDevnetPayrollClient(programId: PublicKey): MagicBlockPayrollClient {
  return new MagicBlockPayrollClient({
    rpcUrl: MagicBlockPayrollClient.MAGIC_ROUTER_DEVNET,
    validatorPubkey: MagicBlockPayrollClient.VALIDATORS.US, // Choose based on region
    programId,
  });
}
