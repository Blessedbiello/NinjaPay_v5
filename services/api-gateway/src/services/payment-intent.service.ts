import { PrismaClient, TxStatus } from '@prisma/client';
import { ArciumClientService } from './arcium-client.service';

export interface CreatePaymentIntentParams {
  merchantId?: string;
  sender?: string;
  recipient: string;
  amount: number;
  currency: string;
  customerId?: string;
  productId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentIntentParams {
  description?: string;
  metadata?: Record<string, any>;
}

export interface ListPaymentIntentsParams {
  merchantId?: string;
  customerId?: string;
  status?: TxStatus;
  limit?: number;
  offset?: number;
}

export class PaymentIntentService {
  constructor(
    private db: PrismaClient,
    private arcium: ArciumClientService
  ) {}

  async create(params: CreatePaymentIntentParams) {
    // 1. Encrypt amount using Arcium MPC
    const {
      ciphertext,
      commitment,
      proofs,
      nonce,
      publicKey,
      computationId,
    } = await this.arcium.encryptAmount(params.amount);

    // 2. Create payment intent in database
    const metadata = {
      ...(params.metadata ?? {}),
      arciumProofs: proofs,
    };

    const paymentIntent = await this.db.paymentIntent.create({
      data: {
        merchantId: params.merchantId,
        sender: params.sender,
        recipient: params.recipient,
        customerId: params.customerId,
        productId: params.productId,
        description: params.description,
        encryptedAmount: ciphertext,
        amountCommitment: commitment,
        currency: params.currency,
        status: 'PENDING',
        metadata,
        encryptionNonce: nonce,
        encryptionPublicKey: publicKey,
        computationId,
        computationStatus: 'QUEUED',
      },
      include: {
        customer: true,
        product: true,
      },
    });

    // 3. Submit to blockchain (async - don't await)
    this.submitToBlockchain(paymentIntent.id).catch((error) => {
      console.error('Failed to submit payment to blockchain:', error);
    });

    return paymentIntent;
  }

  async retrieve(id: string) {
    const paymentIntent = await this.db.paymentIntent.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        checkoutSession: true,
      },
    });

    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    return paymentIntent;
  }

  async update(id: string, params: UpdatePaymentIntentParams) {
    const paymentIntent = await this.db.paymentIntent.update({
      where: { id },
      data: {
        description: params.description,
        metadata: params.metadata,
      },
      include: {
        customer: true,
        product: true,
      },
    });

    return paymentIntent;
  }

  async list(params: ListPaymentIntentsParams) {
    const where: any = {};

    if (params.merchantId) {
      where.merchantId = params.merchantId;
    }

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.status) {
      where.status = params.status;
    }

    const [paymentIntents, total] = await Promise.all([
      this.db.paymentIntent.findMany({
        where,
        include: {
          customer: true,
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit || 50,
        skip: params.offset || 0,
      }),
      this.db.paymentIntent.count({ where }),
    ]);

    return {
      data: paymentIntents,
      total,
      hasMore: (params.offset || 0) + paymentIntents.length < total,
    };
  }

  async confirm(id: string) {
    const paymentIntent = await this.db.paymentIntent.findUnique({
      where: { id },
    });

    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    if (paymentIntent.status !== 'PENDING') {
      throw new Error(
        `Payment intent cannot be confirmed in status: ${paymentIntent.status}`
      );
    }

    // Update status to processing
    const updated = await this.db.paymentIntent.update({
      where: { id },
      data: { status: 'PROCESSING' },
      include: {
        customer: true,
        product: true,
      },
    });

    // Submit to blockchain
    await this.submitToBlockchain(id);

    return updated;
  }

  async cancel(id: string) {
    const paymentIntent = await this.db.paymentIntent.findUnique({
      where: { id },
    });

    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    if (
      paymentIntent.status !== 'PENDING' &&
      paymentIntent.status !== 'PROCESSING'
    ) {
      throw new Error(
        `Payment intent cannot be cancelled in status: ${paymentIntent.status}`
      );
    }

    const updated = await this.db.paymentIntent.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        customer: true,
        product: true,
      },
    });

    return updated;
  }

  private async submitToBlockchain(paymentIntentId: string) {
    // TODO: Implement blockchain submission
    // 1. Get payment intent from database
    // 2. Create Solana transaction with encrypted amount
    // 3. Submit to Solana blockchain
    // 4. Update payment intent with txSignature
    // 5. Poll for confirmation
    // 6. Update status to CONFIRMED/FINALIZED

    console.log(`[TODO] Submit payment intent ${paymentIntentId} to blockchain`);
  }
}
