import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ninjapay/database';
import { getMerchantId } from '@/lib/auth';
import { getRecentTransactions } from '@/lib/solana';

/**
 * GET /api/v1/wallet/transactions
 * Get wallet transaction history from Solana blockchain
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get merchant info for wallet address
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

    const walletAddress = merchant.user.walletAddress;

    // Fetch real transactions from Solana blockchain
    const blockchainTransactions = await getRecentTransactions(walletAddress, limit);

    // Format blockchain transactions for API response
    const transactions = blockchainTransactions.map((tx) => ({
      id: tx.signature,
      type: tx.type,
      address: '', // Will be extracted from transaction details if needed
      amount: tx.amount.toString(),
      currency: tx.token,
      status: tx.status,
      description: `${tx.type === 'sent' ? 'Sent' : 'Received'} ${tx.amount} ${tx.token}`,
      txSignature: tx.signature,
      date: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : new Date().toISOString(),
      fee: tx.fee,
    }));

    // Count sent vs received
    const totalSent = transactions.filter((tx) => tx.type === 'sent').length;
    const totalReceived = transactions.filter((tx) => tx.type === 'received').length;

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total: transactions.length,
        totalSent,
        totalReceived,
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error.message || 'Failed to fetch transactions',
        },
      },
      { status: 500 }
    );
  }
}
