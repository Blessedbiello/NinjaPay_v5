import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.API_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8001';

/**
 * POST /api/auth/nonce
 * Generate a nonce for wallet authentication
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_WALLET', message: 'Valid wallet address is required' } },
        { status: 400 }
      );
    }

    const upstreamResponse = await fetch(`${API_BASE_URL}/v1/auth/nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok || !payload?.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: payload?.error?.code || 'NONCE_ERROR',
            message: payload?.error?.message || 'Failed to obtain authentication nonce',
          },
        },
        { status: upstreamResponse.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payload.data ?? payload,
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate nonce' } },
      { status: 500 }
    );
  }
}
