import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/nonce',
  '/api/auth/verify',
  '/pay/', // Payment link checkout pages
  '/_next/',
  '/favicon.ico',
];

interface JWTPayload {
  userId: string;
  merchantId: string;
  walletAddress: string;
  email: string;
}

export function middleware(request: NextRequest) {
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
      const decoded = verify(token, JWT_SECRET) as JWTPayload;

      // Create a new response with the user info in headers
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded.userId);
      response.headers.set('x-merchant-id', decoded.merchantId);
      response.headers.set('x-wallet-address', decoded.walletAddress);

      return response;
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
  // Check both cookie and localStorage (via checking if we're accessing dashboard)
  const cookieToken = request.cookies.get('auth_token')?.value;

  if (!cookieToken && pathname.startsWith('/dashboard')) {
    // Redirect to home/login page
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If authenticated, set cookie for future requests
  if (cookieToken && pathname.startsWith('/dashboard')) {
    const response = NextResponse.next();
    response.cookies.set('auth_token', cookieToken, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
  ],
};
