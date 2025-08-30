import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // If accessing root and authenticated, redirect to dashboard
    if (req.nextUrl.pathname === '/' && req.nextauth.token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to home page for everyone
        if (req.nextUrl.pathname === '/') return true
        // For protected routes, require token
        return !!token
      }
    },
  }
)

export const config = { 
  matcher: [
    '/',
    '/dashboard/:path*',
    '/leads/:path*',
    '/pages/:path*',
    '/webhooks/:path*',
    '/google-sheets/:path*',
    '/settings/:path*'
  ] 
}