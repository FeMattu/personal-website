import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import { z } from 'zod'
import { env } from '@/env'
import { isAdminEmail } from '@/lib/auth/allowlist'
import { verifyPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'

const credentialsSchema = z.object({ email: z.string(), password: z.string().min(1) })

/**
 * Auth.js v5. JWT sessions + Prisma adapter (OAuth accounts are stored). Only `ADMIN_EMAIL` can sign in:
 * enforced in `signIn` for every provider. Config is lazy so builds do not need auth secrets.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET } = env('auth')
  const providers = []

  if (AUTH_GITHUB_ID && AUTH_GITHUB_SECRET) {
    providers.push(GitHub({ clientId: AUTH_GITHUB_ID, clientSecret: AUTH_GITHUB_SECRET }))
  }
  if (ADMIN_PASSWORD_HASH) {
    providers.push(
      Credentials({
        credentials: { email: {}, password: {} },
        async authorize(raw) {
          const parsed = credentialsSchema.safeParse(raw)
          if (!parsed.success) return null
          if (!isAdminEmail(parsed.data.email, ADMIN_EMAIL)) return null
          if (!(await verifyPassword(parsed.data.password, ADMIN_PASSWORD_HASH))) return null
          return { id: 'admin', email: ADMIN_EMAIL, name: 'Admin' }
        },
      }),
    )
  }

  return {
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
    trustHost: true,
    providers,
    pages: { signIn: '/login' },
    callbacks: {
      signIn: ({ user }) => isAdminEmail(user.email, ADMIN_EMAIL),
      jwt: ({ token }) => {
        token.isAdmin = isAdminEmail(token.email, ADMIN_EMAIL)
        return token
      },
      session: ({ session, token }) => {
        if (session.user) session.user.isAdmin = token.isAdmin === true
        return session
      },
    },
  }
})

export const authProviders = () => {
  const { ADMIN_PASSWORD_HASH, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET } = env('auth')
  return { password: !!ADMIN_PASSWORD_HASH, github: !!(AUTH_GITHUB_ID && AUTH_GITHUB_SECRET) }
}
