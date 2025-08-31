import NextAuth from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            return null
          }

          // For local users, password hash is stored in accessToken field temporarily
          // Check if this is a local user (facebookId starts with 'local-')
          if (!user.facebookId?.startsWith('local-')) {
            return null // Not a local user
          }

          if (!user.accessToken) {
            return null // No password hash stored
          }

          // Check password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.accessToken)
          
          if (!isPasswordValid) {
            return null
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
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
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && account.provider === 'facebook') {
        token.accessToken = account.access_token
        token.facebookId = account.providerAccountId
        
        // Store Facebook user in database
        if (user) {
          await prisma.user.upsert({
            where: { email: user.email! },
            update: { 
              facebookId: account.providerAccountId,
              accessToken: account.access_token!,
              lastLogin: new Date()
            },
            create: {
              email: user.email!,
              name: user.name || user.email!.split('@')[0],
              facebookId: account.providerAccountId!,
              accessToken: account.access_token!,
            }
          })
        }
      }
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.userId = token.userId as string
      session.facebookId = token.facebookId as string
      return session
    },
  },
})

export { handler as GET, handler as POST }