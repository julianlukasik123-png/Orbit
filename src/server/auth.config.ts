import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({ authorize: async () => null }),
  ],
  callbacks: {
    jwt({ token }) { return token },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string | undefined
        session.user.role = token.role as string | undefined
      }
      return session
    },
  },
}
