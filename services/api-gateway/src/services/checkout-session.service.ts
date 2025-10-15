import { PrismaClient } from '@prisma/client';

export interface CreateCheckoutSessionParams {
  merchantId: string;
  paymentLinkId?: string;
  successUrl?: string;
  cancelUrl?: string;
  expiresIn?: number; // seconds, default 1 hour
  metadata?: Record<string, any>;
}

export class CheckoutSessionService {
  constructor(private db: PrismaClient) {}

  async create(params: CreateCheckoutSessionParams) {
    const expiresAt = new Date(
      Date.now() + (params.expiresIn || 3600) * 1000
    );

    const checkoutSession = await this.db.checkoutSession.create({
      data: {
        merchantId: params.merchantId,
        paymentLinkId: params.paymentLinkId,
        status: 'open',
        expiresAt,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        metadata: params.metadata || {},
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
          },
        },
        paymentLink: true,
      },
    });

    return checkoutSession;
  }

  async retrieve(id: string) {
    const checkoutSession = await this.db.checkoutSession.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
          },
        },
        paymentLink: true,
        paymentIntent: {
          include: {
            customer: true,
            product: true,
          },
        },
      },
    });

    if (!checkoutSession) {
      throw new Error('Checkout session not found');
    }

    // Auto-expire if past expiration time
    if (
      checkoutSession.status === 'open' &&
      checkoutSession.expiresAt < new Date()
    ) {
      return this.expire(id);
    }

    return checkoutSession;
  }

  async expire(id: string) {
    const checkoutSession = await this.db.checkoutSession.update({
      where: { id },
      data: { status: 'expired' },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
          },
        },
        paymentLink: true,
        paymentIntent: {
          include: {
            customer: true,
            product: true,
          },
        },
      },
    });

    return checkoutSession;
  }

  async complete(id: string, paymentIntentId: string) {
    const checkoutSession = await this.db.checkoutSession.update({
      where: { id },
      data: {
        status: 'complete',
        paymentIntentId,
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
          },
        },
        paymentLink: true,
        paymentIntent: {
          include: {
            customer: true,
            product: true,
          },
        },
      },
    });

    return checkoutSession;
  }
}
