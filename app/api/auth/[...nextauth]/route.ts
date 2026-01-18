import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const isProduction = process.env.NODE_ENV === 'production'

// Generate a unique session token for single-session enforcement
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() }
          })
          
          if (!user || !user.password) {
            // Use constant-time comparison to prevent timing attacks
            await bcrypt.compare(credentials.password, '$2b$10$dummyhashtopreventtimingattacks')
            return null
          }
          
          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )
          
          if (!isPasswordValid) {
            return null
          }

          // Generate new session token - this invalidates any existing sessions
          const sessionToken = generateSessionToken()
          
          // Update user with new session token
          await prisma.user.update({
            where: { id: user.id },
            data: { sessionToken }
          })
          
          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role,
            sessionToken,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Refresh token every 60 minutes
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.sessionToken = user.sessionToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.sessionToken = token.sessionToken as string
        
        // Validate session token against database
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { sessionToken: true }
          })
          
          // If session tokens don't match, invalidate the session
          if (!user || user.sessionToken !== token.sessionToken) {
            throw new Error('SessionInvalidated')
          }
        } catch (error) {
          console.error('Session validation error:', error)
          throw new Error('SessionInvalidated')
        }
      }
      return session
    },
  },
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
