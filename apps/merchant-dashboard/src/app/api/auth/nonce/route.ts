import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { storeNonce } from '@/lib/auth/nonce-store';

/**
 * POST /api/auth/nonce
 * Generate a nonce for wallet authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_WALLET', message: 'Valid wallet address is required' } },
        { status: 400 }
      );
    }

    // Generate a unique nonce
    const nonce = `Sign this message to authenticate with NinjaPay:\n\nNonce: ${nanoid(
      32
    )}\nTimestamp: ${Date.now()}`;

    storeNonce(walletAddress, nonce);

    return NextResponse.json({
      success: true,
      data: {
        nonce,
        expiresIn: 300, // 5 minutes
      },
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate nonce' } },
      { status: 500 }
    );
  }
}
