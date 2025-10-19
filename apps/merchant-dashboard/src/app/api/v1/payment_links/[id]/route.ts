import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';

/**
 * GET /api/v1/payment_links/[id]
 * Fetch payment link details by slug (the id param is actually the slug from the URL)
 * This endpoint supports both ID-based and slug-based lookups
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Try to find by ID first, then by URL slug
    let paymentLink = await prisma.paymentLink.findUnique({
      where: { id },
    });

    // If not found by ID, try to find by URL slug
    if (!paymentLink) {
      const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_LINK_BASE_URL || 'https://pay.ninjapay.xyz';
      const fullUrl = `${baseUrl}/${id}`;

      paymentLink = await prisma.paymentLink.findFirst({
        where: {
          url: fullUrl,
          active: true,
        },
      });
    }

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

    // Track view - increment view count (fire and forget, don't block response)
    prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        views: {
          increment: 1,
        },
      },
    }).catch((err) => console.error('Failed to track view:', err));

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

/**
 * PATCH /api/v1/payment_links/:id
 * Update a payment link
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { active, maxUses, expiresAt, description, metadata } = body;

    const paymentLink = await prisma.paymentLink.update({
      where: { id: params.id },
      data: {
        ...(active !== undefined && { active }),
        ...(maxUses !== undefined && { maxUses }),
        ...(expiresAt !== undefined && { expiresAt: new Date(expiresAt) }),
        ...(description !== undefined && { description }),
        ...(metadata !== undefined && { metadata }),
      },
    });

    return NextResponse.json({
      success: true,
      data: paymentLink,
    });
  } catch (error) {
    console.error('Error updating payment link:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update payment link',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/payment_links/:id
 * Delete a payment link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.paymentLink.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment link deleted',
    });
  } catch (error) {
    console.error('Error deleting payment link:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete payment link',
        },
      },
      { status: 500 }
    );
  }
}
