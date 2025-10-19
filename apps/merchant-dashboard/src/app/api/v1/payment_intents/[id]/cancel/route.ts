import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/v1/payment_intents/[id]/cancel
 * Cancel a payment intent
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { id: params.id },
    });

    if (!paymentIntent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment intent not found',
          },
        },
        { status: 404 }
      );
    }

    if (paymentIntent.status === 'FINALIZED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'Cannot cancel finalized payment intent',
          },
        },
        { status: 400 }
      );
    }

    const updated = await prisma.paymentIntent.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
      include: {
        customer: true,
        product: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error cancelling payment intent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to cancel payment intent',
        },
      },
      { status: 500 }
    );
  }
}
