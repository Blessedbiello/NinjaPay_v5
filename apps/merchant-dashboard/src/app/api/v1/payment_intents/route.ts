import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';
import { requireEncryptionMasterKey } from '@/lib/env';
import { EncryptionAPIUtils } from '@ninjapay/solana-utils';

// Initialize encryption helper
const encryptionUtils = new EncryptionAPIUtils(
  requireEncryptionMasterKey()
);

/**
 * GET /api/v1/payment_intents
 * List all payment intents for the authenticated merchant
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantId(request);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const decrypt = searchParams.get('decrypt') === 'true';

    // Build where clause
    const where: any = { merchantId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    // Fetch payment intents
    const [items, total] = await Promise.all([
      prisma.paymentIntent.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          product: true,
        },
      }),
      prisma.paymentIntent.count({ where }),
    ]);

    // Decrypt amounts if requested
    const processedItems = items.map((item) => {
      if (decrypt && item.amountCommitment && item.metadata) {
        try {
          const metadata = item.metadata as any;
          const encryptionKey = metadata.encryption_key;

          if (encryptionKey && metadata.encrypted) {
            const decryptedAmount = encryptionUtils.decryptFromAPI(
              item.amountCommitment,
              encryptionKey
            );

            return {
              ...item,
              amount: Number(decryptedAmount), // Amount in cents
            };
          }
        } catch (error) {
          console.error('Error decrypting amount:', error);
          // Return item without decrypted amount
        }
      }
      return item;
    });

    return NextResponse.json({
      success: true,
      data: { items: processedItems, total },
    });
  } catch (error) {
    console.error('Error fetching payment intents:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch payment intents',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/payment_intents
 * Create a new payment intent
 */
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantId(request);

    const body = await request.json();
    const {
      amount,
      currency = 'USDC',
      customerId,
      productId,
      description,
      metadata,
      userPubkey, // Wallet address for encryption
      recipient,
      userSignature,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Amount must be greater than 0',
          },
        },
        { status: 400 }
      );
    }

    // Get merchant wallet for encryption key derivation
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { user: true },
    });

    if (!merchant || !merchant.user.walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Merchant wallet not configured',
          },
        },
        { status: 400 }
      );
    }

    // Use customer wallet or merchant wallet for encryption
    const encryptionKey = userPubkey || merchant.user.walletAddress;

    // Convert amount to smallest unit (cents to avoid decimals)
    const amountInCents = Math.floor(parseFloat(amount.toString()) * 100);

    // Encrypt the amount
    const encryptedAmount = encryptionUtils.encryptForAPI(
      amountInCents,
      encryptionKey
    );

    const metadataPayload: Record<string, unknown> = {
      ...metadata,
      encrypted: true,
      encryption_key: encryptionKey,
    };

    if (userSignature) {
      metadataPayload.merchantSignature = userSignature;
    }

    // Create payment intent
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        merchantId,
        customerId,
        productId,
        recipient: recipient || userPubkey || customerId || 'unknown',
        amountCommitment: encryptedAmount,
        currency,
        description,
        status: 'PENDING',
        metadata: metadataPayload,
      },
      include: {
        customer: true,
        product: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: paymentIntent,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create payment intent',
        },
      },
      { status: 500 }
    );
  }
}
