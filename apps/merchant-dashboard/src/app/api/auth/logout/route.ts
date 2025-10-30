import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Clears the auth cookie so middleware no longer treats the user as authenticated.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set('auth_token', '', {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
