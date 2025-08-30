import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/pages/:path*',
    '/webhooks/:path*',
    '/settings/:path*',
    '/api/facebook/:path*',
    '/api/leads/:path*',
    '/api/webhooks/:path*',
  ],
};