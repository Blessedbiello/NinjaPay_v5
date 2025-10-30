import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.API_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8001';

/**
 * POST /api/auth/verify
 * Verify wallet signature and issue JWT
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { walletAddress, signature, message } = body;

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Wallet address, signature, and message are required'
          }
        },
        { status: 400 }
      );
    }

    const upstreamResponse = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress, signature, message }),
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok || !payload?.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: payload?.error?.code || 'AUTH_FAILED',
            message: payload?.error?.message || 'Authentication failed',
          },
        },
        { status: upstreamResponse.status || 500 }
      );
    }

    const response = NextResponse.json(payload);
    const token = payload?.data?.token;

    if (token) {
      response.cookies.set('auth_token', token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify signature' } },
      { status: 500 }
    );
  }
}
