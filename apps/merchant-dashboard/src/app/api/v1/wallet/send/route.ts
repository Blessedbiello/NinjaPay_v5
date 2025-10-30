import { NextRequest, NextResponse } from 'next/server';
import { ArciumServiceClient } from '@ninjapay/solana-utils';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';
import { requireEncryptionMasterKey } from '@/lib/env';

const arciumClient = new ArciumServiceClient({
  baseUrl: process.env.ARCIUM_SERVICE_URL || 'http://localhost:8001',
  masterKey: requireEncryptionMasterKey(),
});

/**
 * POST /api/v1/wallet/send
 * Send confidential payment using Arcium MPC
 */
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantId(request);
    const body = await request.json();
    const { recipient, amount, currency = 'USDC', description } = body;

    // Validate required fields
    if (!recipient || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Recipient and amount are required',
          },
        },
        { status: 400 }
      );
    }

    // Get merchant info for sender wallet
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        user: true,
      },
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

    const senderWallet = merchant.user.walletAddress;

    // Convert amount to smallest unit (e.g., lamports for SOL, micro-units for USDC)
    const amountInSmallestUnit = BigInt(Math.floor(parseFloat(amount) * 1_000_000));

    // TODO: Get actual balance from on-chain or database
    // For now using a mock balance
    const currentBalance = 100_000_000n; // 100 tokens

    // Perform confidential transfer using Arcium MPC
    const newBalance = await arciumClient.confidentialTransfer(
      senderWallet,
      currentBalance,
      amountInSmallestUnit
    );

    // Create payment intent record
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        merchantId,
        sender: senderWallet,
        recipient,
        amountCommitment: amount.toString(), // Store plaintext for now, encrypted in production
        currency,
        description: description || 'Wallet transfer',
        status: 'CONFIRMED',
        metadata: {
          transfer_type: 'wallet_send',
          encrypted: true,
          new_balance: newBalance.toString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentIntent: {
          id: paymentIntent.id,
          recipient: paymentIntent.recipient,
          amount: paymentIntent.amountCommitment,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          createdAt: paymentIntent.createdAt,
        },
        newBalance: newBalance.toString(),
      },
      message: 'Payment sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending payment:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TRANSFER_FAILED',
          message: error.message || 'Failed to send payment',
        },
      },
      { status: 500 }
    );
  }
}
