import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET environment variable must be defined and at least 32 characters');
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/nonce',
  '/api/auth/verify',
  '/api/auth/logout',
  '/pay/', // Payment link checkout pages
  '/_next/',
  '/favicon.ico',
];

interface JWTPayload {
  userId: string;
  merchantId?: string;
  walletAddress: string;
  email?: string;
}

async function verifyJwt(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secretKey);
  return payload as JWTPayload;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if this is an API route
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No authentication token provided'
          }
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = await verifyJwt(token);

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-wallet-address', decoded.walletAddress);
      if (decoded.merchantId) {
        requestHeaders.set('x-merchant-id', decoded.merchantId);
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired authentication token'
          }
        },
        { status: 401 }
      );
    }
  }

  // For non-API routes (dashboard pages), check if user is authenticated
  const cookieToken = request.cookies.get('auth_token')?.value;

  if (!cookieToken && pathname.startsWith('/dashboard')) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[middleware] Missing auth token for dashboard access');
    }
    // Redirect to home/login page
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (cookieToken && pathname.startsWith('/dashboard')) {
    try {
      await verifyJwt(cookieToken);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[middleware] Invalid auth token', error);
      }
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
  ],
};
