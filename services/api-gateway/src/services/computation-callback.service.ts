import { PrismaClient, ComputationStatus, TxStatus } from '@prisma/client';
import { createLogger } from '@ninjapay/logger';

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

  constructor(private readonly db: PrismaClient) {}

  async handleCallback(payload: ComputationCallbackPayload) {
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

