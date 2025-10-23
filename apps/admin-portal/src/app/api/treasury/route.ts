import { NextRequest, NextResponse } from 'next/server';
import { getAdminUrl, getAdminSecret } from '@/lib/env';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search;
  const url = `${getAdminUrl()}/treasury${search}`;

  const response = await fetch(url, {
    headers: {
      'x-admin-key': getAdminSecret(),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch treasury metrics' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
