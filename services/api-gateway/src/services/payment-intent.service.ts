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
  userSignature?: string;
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
    const merchantContext = await this.resolveMerchantContext(
      params.merchantId,
      params.sender
    );

    const amountValue = this.normalizeAmount(params.amount);

    // 1. Encrypt amount using Arcium MPC
    const {
      ciphertext,
      commitment,
      proofs,
      nonce,
      publicKey,
      clientPublicKey,
    } = await this.arcium.encryptAmount(amountValue, {
      userPubkey: merchantContext.wallet,
      metadata: {
        merchantId: params.merchantId,
        recipient: params.recipient,
      },
    });

    // 2. Create payment intent in database
    const metadata: Record<string, any> = {
      ...(params.metadata ?? {}),
      arciumProofs: proofs,
      encrypted: true,
      encryption_key: merchantContext.wallet,
      amount: params.amount,
      amountMinor: amountValue.toString(),
    };

    if (params.userSignature) {
      metadata.merchantSignature = params.userSignature;
    }

    const paymentIntent = await this.db.paymentIntent.create({
      data: {
        merchantId: params.merchantId,
        sender: params.sender ?? merchantContext.wallet,
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
        clientPublicKey: clientPublicKey,
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

    // Submit to blockchain if not already queued
    if (!paymentIntent.computationId) {
      await this.submitToBlockchain(id);
    }

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
    try {
      const paymentIntent = await this.db.paymentIntent.findUnique({
        where: { id: paymentIntentId },
      });

      if (!paymentIntent) {
        console.warn(
          `Payment intent ${paymentIntentId} not found while queuing computation`
        );
        return;
      }

      if (!paymentIntent.merchantId) {
        console.warn(
          `Payment intent ${paymentIntentId} has no merchant associated`
        );
        return;
      }

      const merchant = await this.db.merchant.findUnique({
        where: { id: paymentIntent.merchantId },
        include: {
          user: {
            select: {
              walletAddress: true,
            },
          },
        },
      });

      if (!merchant || !merchant.user?.walletAddress) {
        throw new Error(
          `Merchant wallet not found for payment intent ${paymentIntentId}`
        );
      }

      const metadata = (paymentIntent.metadata as Record<string, any>) || {};
      const merchantSignature =
        metadata.merchantSignature ??
        metadata.userSignature ??
        metadata.merchant_signature;

      const amountRaw = metadata.amountMinor ?? metadata.amount;

      if (amountRaw === undefined) {
        throw new Error(
          `Payment intent ${paymentIntentId} missing amount metadata`
        );
      }

      const amount = this.normalizeAmount(amountRaw);
      const availableBalance = metadata.availableBalance
        ? this.normalizeAmount(metadata.availableBalance)
        : undefined;

      const { computationId } = await this.arcium.queuePaymentIntentSettlement({
        paymentIntentId: paymentIntent.id,
        merchantWallet: merchant.user.walletAddress,
        amount,
        recipient: paymentIntent.recipient,
        currency: paymentIntent.currency,
        merchantId: paymentIntent.merchantId,
        metadata,
        availableBalance,
        userSignature: merchantSignature,
      });

      await this.db.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          computationId,
          computationStatus: 'QUEUED',
          status: 'PROCESSING',
        },
      });
    } catch (error) {
      console.error(
        'Failed to queue payment intent settlement:',
        (error as Error).message
      );

      await this.db.paymentIntent.update({
        where: { id: paymentIntentId },
        data: {
          computationStatus: 'FAILED',
          computationError: (error as Error).message,
        },
      }).catch(() => {
        // Best-effort update – ignore secondary failures
      });
    }
  }

  private async resolveMerchantContext(
    merchantId?: string,
    sender?: string
  ): Promise<{ wallet: string }> {
    let walletAddress = sender ?? null;

    if (merchantId) {
      const merchant = await this.db.merchant.findUnique({
        where: { id: merchantId },
        include: {
          user: {
            select: {
              walletAddress: true,
            },
          },
        },
      });

      if (!merchant) {
        throw new Error(`Merchant ${merchantId} not found`);
      }

      walletAddress = merchant.user?.walletAddress ?? walletAddress;
    }

    if (!walletAddress) {
      throw new Error('Unable to resolve merchant wallet address');
    }

    return { wallet: walletAddress };
  }

  private normalizeAmount(value: number | string | bigint): bigint {
    if (typeof value === 'bigint') {
      return value;
    }

    if (typeof value === 'string') {
      if (value.trim() === '') {
        throw new Error('Amount string cannot be empty');
      }
      return BigInt(value);
    }

    if (!Number.isFinite(value)) {
      throw new Error('Amount must be a finite number');
    }

    return BigInt(Math.round(value));
  }
}
