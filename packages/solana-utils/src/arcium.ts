import { Connection, PublicKey } from '@solana/web3.js';
import { ArciumServiceClient } from './arcium-service-client';
import { EncryptionAPIUtils } from './encryption';

export type ComputationLifecycleStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ComputationResult {
  computationId: string;
  status: ComputationLifecycleStatus;
  result?: Buffer;
  error?: string;
  createdAt?: number;
  completedAt?: number;
}

export interface QueueComputationParams {
  computationType: string;
  encryptedInputs: Array<Buffer | string>;
  userPubkey: PublicKey | string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
  entityType?: string;
  referenceId?: string;
  userSignature?: string;
}

export interface ConfidentialTransferParams {
  userPubkey: PublicKey | string;
  balance: bigint;
  amount: bigint;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
  entityType?: string;
  referenceId?: string;
  userSignature?: string;
}

export interface BatchPayrollParams {
  userPubkey: PublicKey | string;
  balance: bigint;
  amounts: bigint[];
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
  entityType?: string;
  referenceId?: string;
  userSignature?: string;
}

export interface ArciumClientConfig {
  /**
   * 64 character hex master key shared with the Rust service.
   */
  masterKey: string;
  /**
   * Base URL of the Rust Arcium Service (default http://localhost:8001)
   */
  baseUrl?: string;
  /**
   * Optional Solana RPC – only required when using deriveClusterPDA.
   */
  rpcUrl?: string;
  /**
   * Optional program id – only required when using deriveClusterPDA.
   */
  programId?: string;
}

/**
 * Thin wrapper around the Rust Arcium Service HTTP API that presents a
 * convenient TypeScript interface for confidential computations.
 */
export class ArciumClient {
  private readonly api: ArciumServiceClient;
  private readonly encryption: EncryptionAPIUtils;
  private readonly connection?: Connection;
  private readonly programId?: PublicKey;

  constructor(config: ArciumClientConfig) {
    if (!config.masterKey || config.masterKey.length !== 64) {
      throw new Error(
        'ArciumClient requires a 64 character hex ENCRYPTION_MASTER_KEY.'
      );
    }

    this.api = new ArciumServiceClient({
      baseUrl: config.baseUrl ?? 'http://localhost:8001',
      masterKey: config.masterKey,
    });

    this.encryption = new EncryptionAPIUtils(config.masterKey);

    if (config.rpcUrl) {
      this.connection = new Connection(config.rpcUrl);
    }

    if (config.programId) {
      this.programId = new PublicKey(config.programId);
    }
  }

  /**
   * Low-level helper to invoke any computation exposed by the Arcium service.
   */
  async queueComputation(params: QueueComputationParams): Promise<string> {
    const encryptedInputs = params.encryptedInputs.map((value) =>
      typeof value === 'string' ? value : Buffer.from(value).toString('base64')
    );

    const response = await this.api.invokeComputation({
      computation_type: params.computationType,
      encrypted_inputs: encryptedInputs,
      user_pubkey:
        typeof params.userPubkey === 'string'
          ? params.userPubkey
          : params.userPubkey.toBase58(),
      metadata: params.metadata,
      callback_url: params.callbackUrl,
      entity_type: params.entityType,
      reference_id: params.referenceId,
      user_signature: params.userSignature,
    });

    return response.computation_id;
  }

  /**
   * Queue a confidential transfer without waiting for completion.
   */
  async queueConfidentialTransfer(
    params: ConfidentialTransferParams
  ): Promise<{ computationId: string }> {
    const userPubkey =
      typeof params.userPubkey === 'string'
        ? params.userPubkey
        : params.userPubkey.toBase58();

    return this.api.queueConfidentialTransfer({
      userPubkey,
      balance: params.balance,
      amount: params.amount,
      metadata: params.metadata,
      callbackUrl: params.callbackUrl,
      entityType: params.entityType,
      referenceId: params.referenceId,
      userSignature: params.userSignature,
    });
  }

  /**
   * Execute a confidential transfer and decrypt the new balance when completed.
   */
  async confidentialTransfer(
    params: ConfidentialTransferParams
  ): Promise<bigint> {
    const userPubkey =
      typeof params.userPubkey === 'string'
        ? params.userPubkey
        : params.userPubkey.toBase58();

    return this.api.confidentialTransfer(userPubkey, params.balance, params.amount, {
      userSignature: params.userSignature,
    });
  }

  /**
   * Queue a batch payroll computation.
   */
  async queueBatchPayroll(params: BatchPayrollParams): Promise<string> {
    const userPubkey =
      typeof params.userPubkey === 'string'
        ? params.userPubkey
        : params.userPubkey.toBase58();

    const encryptedInputs = [
      this.encryption.encryptForAPI(params.balance, userPubkey),
      ...this.encryption.encryptBatchForAPI(params.amounts, userPubkey),
    ];

    return this.queueComputation({
      computationType: 'batch_payroll',
      encryptedInputs,
      userPubkey,
      metadata: params.metadata,
      callbackUrl: params.callbackUrl,
      entityType: params.entityType,
      referenceId: params.referenceId,
      userSignature: params.userSignature,
    });
  }

  /**
   * Retrieve computation status (base64 result converted to Buffer).
   */
  async getComputationResult(
    computationId: string
  ): Promise<ComputationResult | null> {
    const status = await this.api.getComputationStatus(computationId);

    if (!status) {
      return null;
    }

    return {
      computationId: status.computation_id,
      status: status.status,
      result: status.result ? Buffer.from(status.result, 'base64') : undefined,
      error: status.error,
      createdAt: status.created_at,
      completedAt: status.completed_at,
    };
  }

  /**
    * Wait until the computation completes or fails.
    */
  async waitForCompletion(
    computationId: string,
    options?: { timeoutMs?: number; pollIntervalMs?: number }
  ): Promise<ComputationResult> {
    const status = await this.api.waitForCompletion(computationId, options);

    return {
      computationId: status.computation_id,
      status: status.status,
      result: status.result ? Buffer.from(status.result, 'base64') : undefined,
      error: status.error,
      createdAt: status.created_at,
      completedAt: status.completed_at,
    };
  }

  /**
   * Convenience helper to derive the cluster PDA, if programId was supplied.
   */
  deriveClusterPDA(userPubkey: PublicKey): [PublicKey, number] {
    if (!this.programId) {
      throw new Error(
        'deriveClusterPDA requires programId to be supplied to ArciumClient.'
      );
    }

    return PublicKey.findProgramAddressSync(
      [Buffer.from('cluster'), userPubkey.toBuffer()],
      this.programId
    );
  }

  /**
   * Access to the underlying HTTP client (advanced use-cases only).
   */
  get service(): ArciumServiceClient {
    return this.api;
  }

  /**
   * Optional access to the Solana connection when rpcUrl is configured.
   */
  get solanaConnection(): Connection | undefined {
    return this.connection;
  }
}
