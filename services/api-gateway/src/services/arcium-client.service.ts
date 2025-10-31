import { createHash } from 'crypto';
import {
  ArciumServiceClient,
  EncryptionAPIUtils,
} from '@ninjapay/solana-utils';

export interface EncryptedAmount {
  ciphertext: Buffer;
  commitment: string;
  proofs: Record<string, any>;
  nonce: Buffer;
  publicKey: Buffer;
  clientPublicKey?: Buffer;
  computationId?: string;
}

interface EncryptAmountOptions {
  userPubkey: string;
  metadata?: Record<string, any>;
  commitmentSalt?: string;
}

interface QueuePaymentIntentOptions {
  paymentIntentId: string;
  merchantWallet: string;
  amount: bigint;
  recipient: string;
  currency: string;
  merchantId?: string | null;
  metadata?: Record<string, any>;
  availableBalance?: bigint;
  userSignature?: string;
}

export class ArciumClientService {
  private readonly client: ArciumServiceClient;
  private readonly encryption: EncryptionAPIUtils;
  private readonly callbackUrl: string;

  constructor() {
    const baseUrl = process.env.ARCIUM_SERVICE_URL || 'http://localhost:8001';
    const masterKey = this.resolveMasterKey();

    this.client = new ArciumServiceClient({
      baseUrl,
      masterKey,
    });
    this.encryption = new EncryptionAPIUtils(masterKey);

    const explicitCallback = process.env.ARCIUM_CALLBACK_URL;
    if (explicitCallback) {
      this.callbackUrl = explicitCallback.replace(/\/$/, '');
    } else {
      const base = this.buildDefaultBaseUrl(process.env.API_PORT);
      this.callbackUrl = `${base}/v1/arcium/callbacks`;
    }
  }

  private resolveMasterKey(): string {
    const candidate =
      process.env.ENCRYPTION_MASTER_KEY || process.env.ARCIUM_MASTER_KEY;

    if (!candidate) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY must be supplied via a secret manager before starting the API gateway'
      );
    }

    if (candidate.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(candidate)) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY must be a 64 character hex string'
      );
    }

    const normalized = candidate.toLowerCase();
    const unsafeDefaults = new Set([
      '0'.repeat(64),
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    ]);

    if (unsafeDefaults.has(normalized)) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY is set to a known placeholder value; provision a unique secret in your secret manager'
      );
    }

    return normalized;
  }

  /**
   * Encrypt an amount for confidential processing.
   * Amounts should be provided in their smallest currency unit (e.g. cents).
   */
  async encryptAmount(
    amount: number | bigint,
    options: EncryptAmountOptions
  ): Promise<EncryptedAmount> {
    const value = this.normalizeAmount(amount);

    if (!options.userPubkey) {
      throw new Error('userPubkey is required to encrypt amounts');
    }

    const encryptedBase64 = this.encryption.encryptForAPI(
      value,
      options.userPubkey
    );
    const encryptedBytes = Buffer.from(encryptedBase64, 'base64');
    const nonce = encryptedBytes.subarray(0, 12);

    const commitment = this.computeCommitment(
      encryptedBytes,
      options.commitmentSalt
    );

    return {
      ciphertext: Buffer.from(encryptedBytes),
      commitment,
      proofs: {
        scheme: 'arcium-dev-chacha20',
        derivation: 'hkdf-sha256',
        metadata: options.metadata ?? {},
      },
      nonce: Buffer.from(nonce),
      publicKey: Buffer.from(options.userPubkey),
      clientPublicKey: Buffer.from(options.userPubkey),
    };
  }

  /**
   * Queue a confidential transfer computation for a payment intent.
   * Returns the computation ID that will be referenced in callbacks.
   */
  async queuePaymentIntentSettlement(
    params: QueuePaymentIntentOptions
  ): Promise<{ computationId: string }> {
    const fallbackBalance =
      params.availableBalance && params.availableBalance > params.amount
        ? params.availableBalance
        : params.amount * 10n;

    const balance = await this.resolveAvailableBalance(
      params.merchantWallet,
      fallbackBalance,
      params.metadata
    );

    const metadata = {
      payment_intent_id: params.paymentIntentId,
      merchant_wallet: params.merchantWallet,
      merchant_id: params.merchantId,
      recipient: params.recipient,
      currency: params.currency,
      amount: params.amount.toString(),
      balance: balance.toString(),
      ...(params.metadata ?? {}),
    };

    const { computationId } = await this.client.queueConfidentialTransfer({
      userPubkey: params.merchantWallet,
      balance,
      amount: params.amount,
      metadata,
      callbackUrl: this.callbackUrl,
      entityType: 'payment_intent',
      referenceId: params.paymentIntentId,
      userSignature: params.userSignature,
    });

    return { computationId };
  }

  private normalizeAmount(amount: number | bigint): bigint {
    if (typeof amount === 'bigint') {
      return amount;
    }

    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a finite number');
    }

    if (Math.abs(amount) > Number.MAX_SAFE_INTEGER) {
      throw new Error('Amount exceeds safe integer range');
    }

    return BigInt(Math.round(amount));
  }

  private computeCommitment(ciphertext: Buffer, salt?: string): string {
    const hash = createHash('sha256');
    if (salt) {
      hash.update(salt);
    }
    hash.update(ciphertext);
    return `0x${hash.digest('hex')}`;
  }

  private buildDefaultBaseUrl(apiPort?: string): string {
    const port = apiPort || '3000';
    return `http://localhost:${port}`;
  }

  private async resolveAvailableBalance(
    merchantWallet: string,
    fallback: bigint,
    metadata?: Record<string, any>
  ): Promise<bigint> {
    const candidate =
      this.extractBalanceCandidate(metadata?.availableBalance) ??
      this.extractBalanceCandidate(metadata?.currentBalance) ??
      this.extractBalanceCandidate(metadata?.balance);

    if (candidate !== undefined) {
      return candidate;
    }

    try {
      // TODO: integrate real ledger lookup. For now return fallback to preserve behaviour.
      return fallback;
    } catch (error) {
      console.warn(
        `Failed to resolve balance for ${merchantWallet}, using fallback:`,
        (error as Error).message
      );
      return fallback;
    }
  }

  private extractBalanceCandidate(value: unknown): bigint | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    try {
      if (typeof value === 'bigint') {
        return value;
      }
      if (typeof value === 'number') {
        return this.normalizeAmount(value);
      }
      if (typeof value === 'string' && value.trim() !== '') {
        return BigInt(value);
      }
    } catch (error) {
      console.warn('Failed to parse balance candidate:', error);
    }
    return undefined;
  }
}
