import { PrismaClient, ComputationStatus, TxStatus } from '@prisma/client';
import { createLogger } from '@ninjapay/logger';
import { AppError } from '../middleware/errorHandler';
import { createHmac, timingSafeEqual } from 'crypto';

interface CallbackResultPayload {
  ciphertext?: string;
  nonce?: string;
  public_key?: string;
  encryption_public_key?: string;
  commitment?: string;
  signature?: string;
  amount_commitment?: string;
  [key: string]: unknown;
}

export interface CallbackVerificationContext {
  signature?: string | null;
  timestamp?: string | null;
  rawBody: string;
}

export interface ComputationCallbackPayload {
  computation_id: string;
  entity_type?: 'payment_intent' | 'transaction';
  status: ComputationStatus | string;
  finalized_at?: string;
  finalization_signature?: string;
  tx_signature?: string;
  error?: string | null;
  result?: CallbackResultPayload;
  metadata?: Record<string, unknown>;
}

const decodeBase64 = (value?: string | null): Buffer | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    return Buffer.from(value, 'base64');
  } catch (error) {
    return undefined;
  }
};

const mapComputationToTxStatus = (status: ComputationStatus): TxStatus | undefined => {
  switch (status) {
    case 'SUCCEEDED':
      return 'FINALIZED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return undefined;
  }
};

export class ComputationCallbackService {
  private readonly logger = createLogger('computation-callback');
  private readonly hmacSecret: Buffer;
  private readonly toleranceSeconds: number;

  constructor(private readonly db: PrismaClient) {
    const secret = process.env.ARCIUM_CALLBACK_SECRET?.trim();
    if (!secret) {
      throw new Error('ARCIUM_CALLBACK_SECRET must be defined');
    }

    const normalized = secret.startsWith('0x') ? secret.slice(2) : secret;
    if (!/^[0-9a-fA-F]+$/.test(normalized) || normalized.length % 2 !== 0) {
      throw new Error('ARCIUM_CALLBACK_SECRET must be a hex-encoded string');
    }

    this.hmacSecret = Buffer.from(normalized, 'hex');
    const tolerance = Number(process.env.ARCIUM_CALLBACK_TOLERANCE_SECONDS ?? '300');
    this.toleranceSeconds = Number.isFinite(tolerance) && tolerance > 0 ? tolerance : 300;
  }

  async handleCallback(payload: ComputationCallbackPayload, context: CallbackVerificationContext) {
    this.verifySignature(context);
    const status = (payload.status as string).toUpperCase() as ComputationStatus;

    // Try to resolve the entity explicitly first
    if (payload.entity_type === 'payment_intent') {
      const found = await this.updatePaymentIntent(payload, status);
      if (found) {
        return;
      }
    } else if (payload.entity_type === 'transaction') {
      const found = await this.updateTransaction(payload, status);
      if (found) {
        return;
      }
    } else {
      const found = await this.updatePaymentIntent(payload, status);
      if (found) {
        return;
      }

      const transactionFound = await this.updateTransaction(payload, status);
      if (transactionFound) {
        return;
      }
    }

    this.logger.warn('Received computation callback for unknown entity', {
      computationId: payload.computation_id,
      status,
    });
  }

  private verifySignature({ signature, timestamp, rawBody }: CallbackVerificationContext) {
    if (!signature) {
      throw new AppError('Missing callback signature', 401);
    }

    if (!timestamp) {
      throw new AppError('Missing callback timestamp', 401);
    }

    const parsedTimestamp = Number(timestamp);
    if (!Number.isFinite(parsedTimestamp)) {
      throw new AppError('Invalid callback timestamp', 401);
    }

    const nowSeconds = Date.now() / 1000;
    if (Math.abs(nowSeconds - parsedTimestamp) > this.toleranceSeconds) {
      throw new AppError('Callback timestamp outside accepted window', 401);
    }

    const normalizedSignature = signature.trim().toLowerCase();
    if (!/^[0-9a-f]+$/.test(normalizedSignature) || normalizedSignature.length % 2 !== 0) {
      throw new AppError('Invalid callback signature format', 401);
    }

    const expectedHex = createHmac('sha256', this.hmacSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

    const expected = Buffer.from(expectedHex, 'hex');
    const provided = Buffer.from(normalizedSignature, 'hex');

    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      throw new AppError('Invalid callback signature', 401);
    }
  }

  private async updatePaymentIntent(
    payload: ComputationCallbackPayload,
    status: ComputationStatus
  ): Promise<boolean> {
    const paymentIntent = await this.db.paymentIntent.findFirst({
      where: { computationId: payload.computation_id },
    });

    if (!paymentIntent) {
      return false;
    }

    const updateData: any = {
      computationStatus: status,
      computationError: payload.error ?? null,
    };

    if (payload.finalized_at) {
      updateData.finalizedAt = new Date(payload.finalized_at);
    }

    if (payload.finalization_signature) {
      updateData.finalizationSignature = payload.finalization_signature;
    }

    if (payload.tx_signature) {
      updateData.txSignature = payload.tx_signature;
    }

    const result = payload.result ?? {};
    const ciphertext = decodeBase64(result.ciphertext);
    const nonce = decodeBase64(result.nonce);
    const publicKey = decodeBase64(result.public_key ?? result.encryption_public_key);

    if (ciphertext) {
      updateData.resultCiphertext = ciphertext;
    }

    if (nonce) {
      updateData.resultNonce = nonce;
    }

    if (publicKey) {
      updateData.encryptionPublicKey = publicKey;
    }

    if (result.amount_commitment) {
      updateData.amountCommitment = result.amount_commitment;
    }

    const txStatus = mapComputationToTxStatus(status);
    if (txStatus) {
      updateData.status = txStatus;
    }

    await this.db.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: updateData,
    });

    this.logger.info('Updated payment intent from computation callback', {
      computationId: payload.computation_id,
      paymentIntentId: paymentIntent.id,
      status,
      hasCiphertext: Boolean(ciphertext),
    });

    return true;
  }

  private async updateTransaction(
    payload: ComputationCallbackPayload,
    status: ComputationStatus
  ): Promise<boolean> {
    const transaction = await this.db.transaction.findFirst({
      where: { computationId: payload.computation_id },
    });

    if (!transaction) {
      return false;
    }

    const updateData: any = {
      computationStatus: status,
      computationError: payload.error ?? null,
    };

    if (payload.finalized_at) {
      updateData.finalizedAt = new Date(payload.finalized_at);
    }

    if (payload.finalization_signature) {
      updateData.finalizationSignature = payload.finalization_signature;
    }

    if (payload.tx_signature) {
      updateData.signature = payload.tx_signature;
    }

    const result = payload.result ?? {};
    const ciphertext = decodeBase64(result.ciphertext);
    const nonce = decodeBase64(result.nonce);
    const publicKey = decodeBase64(result.public_key ?? result.encryption_public_key);

    if (ciphertext) {
      updateData.encryptedAmount = ciphertext;
    }

    if (nonce) {
      updateData.encryptionNonce = nonce;
    }

    if (publicKey) {
      updateData.encryptionPublicKey = publicKey;
    }

    const txStatus = mapComputationToTxStatus(status);
    if (txStatus) {
      updateData.status = txStatus;
    }

    await this.db.transaction.update({
      where: { id: transaction.id },
      data: updateData,
    });

    this.logger.info('Updated transaction from computation callback', {
      computationId: payload.computation_id,
      transactionId: transaction.id,
      status,
      hasCiphertext: Boolean(ciphertext),
    });

    return true;
  }
}

