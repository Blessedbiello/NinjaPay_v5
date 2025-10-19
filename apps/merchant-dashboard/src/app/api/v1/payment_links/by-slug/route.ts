import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';

/**
 * GET /api/v1/payment_links/[slug]
 * Fetch payment link details by slug (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Extract slug from the URL path
    const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_LINK_BASE_URL || 'https://pay.ninjapay.xyz';
    const fullUrl = `${baseUrl}/${slug}`;

    // Find payment link by URL
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        url: fullUrl,
        active: true,
      },
    });

    if (!paymentLink) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LINK_NOT_FOUND',
            message: 'Payment link not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    // Check if link has expired
    if (paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LINK_EXPIRED',
            message: 'This payment link has expired',
          },
        },
        { status: 410 }
      );
    }

    // Check if max uses reached
    if (paymentLink.maxUses && paymentLink.usageCount >= paymentLink.maxUses) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MAX_USES_REACHED',
            message: 'This payment link has reached its maximum number of uses',
          },
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: paymentLink,
    });
  } catch (error) {
    console.error('Error fetching payment link:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch payment link',
        },
      },
      { status: 500 }
    );
  }
}
