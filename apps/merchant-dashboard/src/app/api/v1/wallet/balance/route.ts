import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';
import { getAllTokenBalances } from '@/lib/solana';

/**
 * GET /api/v1/wallet/balance
 * Get merchant wallet balance from Solana blockchain
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantId(request);

    // Get merchant info
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

    // Fetch real on-chain balances from Solana
    const balances = await getAllTokenBalances(merchant.user.walletAddress);

    // Get total transaction count from database
    const totalReceived = await prisma.paymentIntent.aggregate({
      where: {
        merchantId,
        status: 'CONFIRMED',
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        walletAddress: merchant.user.walletAddress,
        balances,
        totalTransactions: totalReceived._count,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching balance:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BALANCE_FETCH_FAILED',
          message: error.message || 'Failed to fetch balance',
        },
      },
      { status: 500 }
    );
  }
}
