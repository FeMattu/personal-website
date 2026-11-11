'use server'

import { AuthError } from 'next-auth'
import { z } from 'zod'
import { signIn, signOut } from '@/auth'

export type LoginState = { error?: string }

const schema = z.object({ email: z.string().trim().min(1), password: z.string().min(1) })

/** Password sign-in (only `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` can pass). Redirects to /admin on success. */
export async function loginWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: 'Enter your e-mail and password.' }
  try {
    await signIn('credentials', { ...parsed.data, redirectTo: '/admin' })
  } catch (error) {
    if (error instanceof AuthError) return { error: 'Invalid e-mail or password.' }
    throw error // the NEXT_REDIRECT on success must propagate
  }
  return {}
}

export async function loginWithGitHub(): Promise<void> {
  await signIn('github', { redirectTo: '/admin' })
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: '/login' })
}
