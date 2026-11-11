import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export class AuthError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'AuthError'
  }
}

/** Page guard: redirects to /login without an admin session. Call in EVERY admin page/layout. */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.isAdmin) redirect('/login')
  return session
}

/** Write guard: throws `AuthError` (mapped to an ActionResult failure). Call FIRST in EVERY write action. */
export async function assertAdmin() {
  const session = await auth()
  if (!session?.user?.isAdmin) throw new AuthError()
  return session
}
