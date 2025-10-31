import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/v1/payment_intents/[id]/confirm
 * Confirm a payment intent
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json();
    const { txSignature } = body;

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

    if (paymentIntent.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: `Cannot confirm payment intent in ${paymentIntent.status} state`,
          },
        },
        { status: 400 }
      );
    }

    // Update payment intent with transaction signature
    const updateData: any = {
      status: 'CONFIRMED',
      finalizedAt: new Date(),
    };

    if (txSignature) {
      updateData.finalizationSignature = txSignature;
      updateData.metadata = {
        ...paymentIntent.metadata,
        transaction_signature: txSignature,
        confirmed_at: new Date().toISOString(),
      };
    }

    const updated = await prisma.paymentIntent.update({
      where: { id: params.id },
      data: updateData,
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
    console.error('Error confirming payment intent:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to confirm payment intent',
        },
      },
      { status: 500 }
    );
  }
}
