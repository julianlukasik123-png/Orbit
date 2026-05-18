import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/server/db'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return user
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in, attach user id and look up tenant membership
      if (user?.id) {
        token.id = user.id
        try {
          const membership = await db.tenantMember.findFirst({
            where: { userId: user.id },
            orderBy: { invitedAt: 'asc' },
          })
          if (membership) {
            token.tenantId = membership.tenantId
            token.role = membership.role
          }
        } catch {
          // DB lookup failed — token still valid, user will be routed to onboarding
        }
      }
      // Allow session updates to refresh tenantId (e.g. after onboarding)
      if (trigger === 'update' && token.id) {
        try {
          const membership = await db.tenantMember.findFirst({
            where: { userId: token.id as string },
            orderBy: { invitedAt: 'asc' },
          })
          if (membership) {
            token.tenantId = membership.tenantId
            token.role = membership.role
          }
        } catch {
          // ignore
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string | undefined
        session.user.role = token.role as string | undefined
      }
      return session
    },
  },
})
