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
 * GET /api/v1/payment_links
 * List all payment links for the authenticated merchant
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantId(request);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const active = searchParams.get('active');

    // Build where clause
    const where: any = { merchantId };
    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    // Fetch payment links (no product relation - it's a snapshot)
    const [items, total] = await Promise.all([
      prisma.paymentLink.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.paymentLink.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, total },
    });
  } catch (error) {
    console.error('Error fetching payment links:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch payment links',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/payment_links
 * Create a new payment link
 */
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantId(request);

    const body = await request.json();
    const {
      productId, // Still accepted from frontend for product lookup
      customUrl,
      expiresAt,
      maxUses,
      description,
      metadata,
    } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PRODUCT',
            message: 'Product ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to merchant (for snapshot)
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        merchantId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
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

    // Encrypt the product price using merchant wallet
    const encryptionKey = merchant.user.walletAddress;
    const amountInCents = Math.floor(product.price * 100); // Convert to cents
    const encryptedAmount = encryptionUtils.encryptForAPI(
      amountInCents,
      encryptionKey
    );

    // Generate URL slug from product name if custom URL not provided
    const slug = customUrl || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Get base URL from environment (defaults to production)
    const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_LINK_BASE_URL || 'https://pay.ninjapay.xyz';

    // Create payment link (with product snapshot - no productId foreign key)
    const paymentLink = await prisma.paymentLink.create({
      data: {
        merchantId,
        url: `${baseUrl}/${slug}`,
        productName: product.name,
        amount: product.price, // Store plaintext for backwards compatibility
        currency: product.currency || 'USDC',
        active: true,
        maxUses: maxUses ? parseInt(maxUses.toString()) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        description: description || product.description,
        metadata: {
          ...metadata,
          encrypted_amount: encryptedAmount,
          encryption_key: encryptionKey,
          encrypted: true,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: paymentLink,
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create payment link',
        },
      },
      { status: 500 }
    );
  }
}
