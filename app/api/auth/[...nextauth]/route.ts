import NextAuth from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          // Create or find user in database
          const user = await prisma.user.upsert({
            where: { email: credentials.email },
            update: { lastLogin: new Date() },
            create: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
              facebookId: `demo-${Date.now()}`, // Temporary ID for demo users
              accessToken: 'demo-token',
            }
          })
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        }
        return null
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
      }
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.userId = token.userId as string
      return session
    },
  },
})

export { handler as GET, handler as POST }