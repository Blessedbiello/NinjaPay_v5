import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { ArciumServiceClient } from '@ninjapay/solana-utils';
import { requireEncryptionMasterKey } from '@/lib/env';

const arciumClient = new ArciumServiceClient({
  baseUrl: process.env.NEXT_PUBLIC_ARCIUM_SERVICE_URL || 'http://localhost:8002',
  masterKey: requireEncryptionMasterKey(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/v1/payment_intents/[id]/process
 * Process payment through Arcium MPC
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json();
    const { userPubkey, balance } = body;

    console.log(`[Process Payment] Starting Arcium MPC for payment intent ${params.id}`);

    // Get payment intent
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
            message: `Cannot process payment intent in ${paymentIntent.status} state`,
          },
        },
        { status: 400 }
      );
    }

    // Extract encrypted amount from metadata
    const metadata = paymentIntent.metadata as any;
    const encryptedAmount = metadata?.encrypted_amount;
    const encryptionKey = metadata?.encryption_key;

    if (!encryptedAmount || !encryptionKey) {
      console.error('[Process Payment] Missing encryption data in payment intent metadata');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ENCRYPTION_DATA',
            message: 'Payment intent missing encryption data',
          },
        },
        { status: 400 }
      );
    }

    console.log('[Process Payment] Encrypted amount found, processing through Arcium MPC...');

    // Convert amount to smallest unit (assuming cents or micro-units)
    // The encrypted amount is already in the payment link metadata
    const amountInSmallestUnit = Math.floor(parseFloat(paymentIntent.amountCommitment || '0') * 1_000_000);
    const currentBalance = balance ? BigInt(balance) : BigInt(100_000_000); // Default 100 tokens if not provided

    console.log(`[Process Payment] Amount: ${amountInSmallestUnit}, Balance: ${currentBalance}`);

    try {
      // Process through Arcium MPC
      console.log('[Process Payment] Calling Arcium MPC confidentialTransfer...');

      const newBalance = await arciumClient.confidentialTransfer(
        userPubkey || encryptionKey,
        currentBalance,
        BigInt(amountInSmallestUnit),
        {
          userSignature: metadata?.merchantSignature,
        }
      );

      console.log(`[Process Payment] Arcium MPC completed. New balance: ${newBalance}`);

      // Update payment intent with computation details
      const updated = await prisma.paymentIntent.update({
        where: { id: params.id },
        data: {
          computationStatus: 'COMPLETED',
          metadata: {
            ...metadata,
            arcium_processed: true,
            new_balance: newBalance.toString(),
            processed_at: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          paymentIntent: updated,
          newBalance: newBalance.toString(),
          arciumProcessed: true,
        },
      });
    } catch (arciumError: any) {
      console.error('[Process Payment] Arcium MPC error:', arciumError);

      // Update payment intent with error
      await prisma.paymentIntent.update({
        where: { id: params.id },
        data: {
          computationStatus: 'FAILED',
          computationError: arciumError.message,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ARCIUM_ERROR',
            message: `Arcium MPC processing failed: ${arciumError.message}`,
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Process Payment] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to process payment',
        },
      },
      { status: 500 }
    );
  }
}
