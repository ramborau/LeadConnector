import { NextAuthOptions } from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export const authOptions: NextAuthOptions = {
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
    async session({ session, token, user }: any) {
      if (session.user) {
        session.user.id = user?.id || token?.sub;
        session.user.facebookId = user?.facebookId;
        session.accessToken = token?.accessToken;
      }
      return session;
    },
    async jwt({ token, account, user }: any) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        
        // Store encrypted tokens in database
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              accessToken: encrypt(account.access_token!),
              refreshToken: account.refresh_token ? encrypt(account.refresh_token) : null,
              tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
              lastLogin: new Date(),
            },
          });
        } catch (error) {
          console.error('Error updating user tokens:', error);
        }
      }
      return token;
    },
    async signIn({ user, account, profile }: any) {
      if (!account || !profile) return false;
      
      try {
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
              image: profile.picture?.data?.url,
              accessToken: encrypt(account.access_token!),
              refreshToken: account.refresh_token ? encrypt(account.refresh_token) : null,
              tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
            },
          });
        }
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
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