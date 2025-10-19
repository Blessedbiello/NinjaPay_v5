import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * POST /api/v1/payment_links/[id]/track
 * Track a conversion and update revenue for a payment link
 * Called when a payment is successfully completed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Valid amount is required',
          },
        },
        { status: 400 }
      );
    }

    // Update payment link with conversion and revenue
    const paymentLink = await prisma.paymentLink.update({
      where: { id },
      data: {
        conversions: {
          increment: 1,
        },
        revenue: {
          increment: new Decimal(amount),
        },
        usageCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        conversions: paymentLink.conversions,
        revenue: paymentLink.revenue.toString(),
        usageCount: paymentLink.usageCount,
      },
    });
  } catch (error) {
    console.error('Error tracking payment link conversion:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to track conversion',
        },
      },
      { status: 500 }
    );
  }
}
