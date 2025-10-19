import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/v1/payment_intents/[id]
 * Get a specific payment intent
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        product: true,
      },
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

    return NextResponse.json({
      success: true,
      data: paymentIntent,
    });
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch payment intent',
        },
      },
      { status: 500 }
    );
  }
}
