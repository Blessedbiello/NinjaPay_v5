import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// In-memory nonce store (in production, use Redis with TTL)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

// Cleanup old nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  for (const [walletAddress, data] of nonceStore.entries()) {
    if (now - data.timestamp > fiveMinutes) {
      nonceStore.delete(walletAddress);
    }
  }
}, 5 * 60 * 1000);

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
    const nonce = `Sign this message to authenticate with NinjaPay:\n\nNonce: ${nanoid(32)}\nTimestamp: ${Date.now()}`;

    // Store nonce with timestamp
    nonceStore.set(walletAddress, {
      nonce,
      timestamp: Date.now(),
    });

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
