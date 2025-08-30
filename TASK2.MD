# Task 2: Authentication System

## Status: PENDING

## Overview
Implement a secure authentication system using NextAuth.js with Facebook OAuth integration, including login/signup pages, session management, and user profile handling.

## Prerequisites
- Task 1 completed (Project setup)
- Facebook Developer Account
- Facebook App created (will be detailed in FB.MD)

## Subtasks

### 2.1 Create Authentication Library
Create `lib/auth.ts`:
```typescript
import { NextAuthOptions } from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email,pages_show_list,leads_retrieval,pages_read_engagement,ads_management,pages_manage_metadata',
          auth_type: 'rerequest',
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          facebookId: profile.id,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.facebookId = (user as any).facebookId;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        
        // Store encrypted tokens in database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            accessToken: encrypt(account.access_token!),
            refreshToken: account.refresh_token ? encrypt(account.refresh_token) : null,
            tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
            lastLogin: new Date(),
          },
        });
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      if (!account || !profile) return false;
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { facebookId: profile.id },
      });
      
      if (!existingUser) {
        // Create new user
        await prisma.user.create({
          data: {
            email: profile.email!,
            name: profile.name,
            facebookId: profile.id,
            image: (profile as any).picture?.data?.url,
            accessToken: encrypt(account.access_token!),
            refreshToken: account.refresh_token ? encrypt(account.refresh_token) : null,
            tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
          },
        });
      }
      
      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### 2.2 Create NextAuth API Route
Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 2.3 Create Encryption Utility
Create `lib/encryption.ts`:
```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 2.4 Create Session Provider
Create `components/providers/session-provider.tsx`:
```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

### 2.5 Create Login Page
Create `app/(auth)/login/page.tsx`:
```typescript
'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Facebook, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleFacebookLogin = async () => {
    await signIn('facebook', { callbackUrl: '/dashboard' });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary/20 to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-dark">LeadConnector</CardTitle>
          <CardDescription>
            Connect your Facebook Lead Ads and automate your lead management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleFacebookLogin}
            className="w-full bg-[#1877F2] hover:bg-[#1664D8] text-white"
            size="lg"
          >
            <Facebook className="mr-2 h-5 w-5" />
            Continue with Facebook
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>By continuing, you agree to our</p>
            <div className="flex justify-center gap-2">
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>
              <span>and</span>
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-2">Required Permissions:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Access to your Facebook Pages</li>
              <li>• Permission to retrieve lead data</li>
              <li>• Ability to manage page webhooks</li>
              <li>• Read page engagement metrics</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.6 Create Signup Page
Create `app/(auth)/signup/page.tsx`:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login as we use Facebook OAuth
    router.push('/login');
  }, [router]);

  return null;
}
```

### 2.7 Create Auth Layout
Create `app/(auth)/layout.tsx`:
```typescript
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
```

### 2.8 Create Middleware for Auth Protection
Create `middleware.ts`:
```typescript
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
```

### 2.9 Create Auth Hook
Create `hooks/use-auth.ts`:
```typescript
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = useCallback(async () => {
    await signIn('facebook', { callbackUrl: '/dashboard' });
  }, []);

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/login' });
    router.push('/login');
  }, [router]);

  const isAuthenticated = !!session;
  const isLoading = status === 'loading';

  return {
    user: session?.user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
```

### 2.10 Update Root Layout
Update `app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LeadConnector - Facebook Lead Ads Integration',
  description: 'Automate your Facebook Lead Ads with webhook integrations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
```

## Verification Steps
1. [ ] NextAuth configuration working
2. [ ] Facebook OAuth login functional
3. [ ] Session management working
4. [ ] User data encrypted in database
5. [ ] Protected routes redirecting to login
6. [ ] Logout functionality working
7. [ ] Token refresh mechanism in place

## Security Checklist
- [ ] Encryption keys generated and stored securely
- [ ] HTTPS enforced in production
- [ ] Session cookies secure
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all forms

## Next Steps
- Proceed to Task 3: Database and Models
- Test Facebook OAuth flow
- Configure Facebook App permissions

## Notes
- Facebook App configuration required (see FB.MD)
- Ensure NEXTAUTH_SECRET is strong and unique
- Test token refresh mechanism thoroughly
- Monitor authentication errors in production