import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, allow all requests - authentication will be handled in pages
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/pages/:path*',
    '/webhooks/:path*',
    '/settings/:path*',
  ],
};