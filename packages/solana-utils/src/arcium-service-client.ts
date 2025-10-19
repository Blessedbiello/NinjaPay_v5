import { EncryptionAPIUtils } from './encryption';

/**
 * HTTP client for Arcium Service API
 *
 * Provides high-level interface for confidential computations
 * via the Rust Arcium Service backend
 */

export interface ArciumServiceConfig {
  /**
   * Arcium Service base URL
   * @default 'http://localhost:8001'
   */
  baseUrl: string;

  /**
   * Encryption master key (64 hex chars = 32 bytes)
   * Should match ENCRYPTION_MASTER_KEY in Arcium Service .env
   */
  masterKey: string;
}

export interface InvokeComputationRequest {
  computation_type: 'encrypted_transfer' | 'batch_payroll' | 'balance_query' | string;
  encrypted_inputs: string[]; // Base64-encoded encrypted values
  user_pubkey: string; // Solana wallet address
  metadata?: Record<string, any>;
}

export interface InvokeComputationResponse {
  computation_id: string;
  status: string;
  message: string;
}

export interface ComputationStatusResponse {
  computation_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: string; // Base64-encoded encrypted result
  error?: string;
  created_at?: number;
  completed_at?: number;
}

/**
 * Arcium Service HTTP Client
 *
 * Usage:
 * ```typescript
 * const client = new ArciumServiceClient({
 *   baseUrl: 'http://localhost:8001',
 *   masterKey: process.env.ENCRYPTION_MASTER_KEY!,
 * });
 *
 * // Send confidential transfer
 * const result = await client.confidentialTransfer(
 *   'user_wallet_address',
 *   1000, // balance
 *   500   // transfer amount
 * );
 * ```
 */
export class ArciumServiceClient {
  private config: ArciumServiceConfig;
  private encryption: EncryptionAPIUtils;

  constructor(config: ArciumServiceConfig) {
    this.config = config;
    this.encryption = new EncryptionAPIUtils(config.masterKey);
  }

  /**
   * Invoke a generic computation
   */
  async invokeComputation(
    request: InvokeComputationRequest
  ): Promise<InvokeComputationResponse> {
    const response = await fetch(`${this.config.baseUrl}/api/computation/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Computation failed: ${error.error || response.statusText}`);
    }

    return response.json() as Promise<InvokeComputationResponse>;
  }

  /**
   * Get computation status and result
   */
  async getComputationStatus(
    computationId: string
  ): Promise<ComputationStatusResponse> {
    const response = await fetch(
      `${this.config.baseUrl}/api/computation/status?computation_id=${computationId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json() as Promise<ComputationStatusResponse>;
  }

  /**
   * Wait for computation to complete
   *
   * Polls the computation status until it's completed or fails
   */
  async waitForCompletion(
    computationId: string,
    options: {
      timeoutMs?: number;
      pollIntervalMs?: number;
    } = {}
  ): Promise<ComputationStatusResponse> {
    const { timeoutMs = 30000, pollIntervalMs = 1000 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getComputationStatus(computationId);

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(`Computation failed: ${status.error || 'Unknown error'}`);
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Computation timed out after ${timeoutMs}ms`);
  }

  /**
   * Send confidential transfer
   *
   * @param userPubkey - User's wallet address
   * @param balance - Current balance (will be encrypted)
   * @param amount - Transfer amount (will be encrypted)
   * @returns Decrypted new balance
   */
  async confidentialTransfer(
    userPubkey: string,
    balance: number | bigint,
    amount: number | bigint
  ): Promise<bigint> {
    // Encrypt inputs
    const encryptedBalance = this.encryption.encryptForAPI(balance, userPubkey);
    const encryptedAmount = this.encryption.encryptForAPI(amount, userPubkey);

    // Invoke computation
    const { computation_id } = await this.invokeComputation({
      computation_type: 'encrypted_transfer',
      encrypted_inputs: [encryptedBalance, encryptedAmount],
      user_pubkey: userPubkey,
      metadata: {
        operation: 'confidential_transfer',
        timestamp: Date.now(),
      },
    });

    // Wait for result
    const result = await this.waitForCompletion(computation_id);

    if (!result.result) {
      throw new Error('No result returned from computation');
    }

    // Decrypt result
    return this.encryption.decryptFromAPI(result.result, userPubkey);
  }

  /**
   * Send batch payroll
   *
   * @param userPubkey - Payer's wallet address
   * @param balance - Current balance
   * @param amounts - Array of payment amounts
   * @returns Decrypted new balance after all payments
   */
  async batchPayroll(
    userPubkey: string,
    balance: number | bigint,
    amounts: (number | bigint)[]
  ): Promise<bigint> {
    // Encrypt balance and all amounts
    const encryptedInputs = [
      this.encryption.encryptForAPI(balance, userPubkey),
      ...this.encryption.encryptBatchForAPI(amounts.map(BigInt), userPubkey),
    ];

    // Invoke computation
    const { computation_id } = await this.invokeComputation({
      computation_type: 'batch_payroll',
      encrypted_inputs: encryptedInputs,
      user_pubkey: userPubkey,
      metadata: {
        operation: 'batch_payroll',
        recipient_count: amounts.length,
        timestamp: Date.now(),
      },
    });

    // Wait for result
    const result = await this.waitForCompletion(computation_id);

    if (!result.result) {
      throw new Error('No result returned from computation');
    }

    // Decrypt result
    return this.encryption.decryptFromAPI(result.result, userPubkey);
  }

  /**
   * Query encrypted balance
   *
   * @param userPubkey - User's wallet address
   * @param encryptedBalance - Encrypted balance to query
   * @returns Decrypted balance
   */
  async queryBalance(
    userPubkey: string,
    encryptedBalance: number | bigint
  ): Promise<bigint> {
    const encrypted = this.encryption.encryptForAPI(encryptedBalance, userPubkey);

    const { computation_id } = await this.invokeComputation({
      computation_type: 'balance_query',
      encrypted_inputs: [encrypted],
      user_pubkey: userPubkey,
    });

    const result = await this.waitForCompletion(computation_id);

    if (!result.result) {
      throw new Error('No result returned from computation');
    }

    return this.encryption.decryptFromAPI(result.result, userPubkey);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.config.baseUrl}/api/health`);
    return response.json() as Promise<{ status: string }>;
  }
}

/**
 * Example usage for merchant dashboard:
 *
 * ```typescript
 * // Initialize client
 * const arciumClient = new ArciumServiceClient({
 *   baseUrl: process.env.ARCIUM_SERVICE_URL || 'http://localhost:8001',
 *   masterKey: process.env.ENCRYPTION_MASTER_KEY!,
 * });
 *
 * // Send confidential transfer
 * const userWallet = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK';
 * const currentBalance = 10000n; // $100.00 in cents
 * const transferAmount = 2500n;  // $25.00 in cents
 *
 * try {
 *   const newBalance = await arciumClient.confidentialTransfer(
 *     userWallet,
 *     currentBalance,
 *     transferAmount
 *   );
 *   console.log('New balance:', newBalance); // 7500n
 * } catch (error) {
 *   console.error('Transfer failed:', error);
 * }
 *
 * // Send batch payroll
 * const payrollAmounts = [
 *   5000n, // Employee 1: $50.00
 *   7500n, // Employee 2: $75.00
 *   6000n, // Employee 3: $60.00
 * ];
 *
 * const balanceAfterPayroll = await arciumClient.batchPayroll(
 *   userWallet,
 *   currentBalance,
 *   payrollAmounts
 * );
 * console.log('Balance after payroll:', balanceAfterPayroll);
 * ```
 */
