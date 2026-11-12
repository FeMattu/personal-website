import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() }))
vi.mock('@/auth', () => auth)
vi.mock('next-auth', () => ({ AuthError: class AuthError extends Error {} }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
}))

import { AuthError } from 'next-auth'
import { loginWithGitHub, loginWithPassword, logout } from '@/actions/auth'
import { assertAdmin, AuthError as GuardError, requireAdmin } from '@/lib/auth/session'

const form = (email: string, password: string) => {
  const f = new FormData()
  f.set('email', email)
  f.set('password', password)
  return f
}

beforeEach(() => {
  auth.signIn.mockReset()
  auth.signOut.mockReset()
  auth.auth.mockReset()
})

describe('login actions', () => {
  it('asks for both fields', async () => {
    expect(await loginWithPassword({}, form('', ''))).toEqual({
      error: 'Enter your e-mail and password.',
    })
    expect(auth.signIn).not.toHaveBeenCalled()
  })

  it('maps an Auth.js failure to a generic message (no user enumeration)', async () => {
    auth.signIn.mockRejectedValue(new AuthError('CredentialsSignin'))
    expect(await loginWithPassword({}, form('a@b.c', 'x'))).toEqual({
      error: 'Invalid e-mail or password.',
    })
  })

  it('lets the success redirect propagate', async () => {
    auth.signIn.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(loginWithPassword({}, form('a@b.c', 'x'))).rejects.toThrow('NEXT_REDIRECT')
  })

  it('signs in with credentials to /admin, github and out', async () => {
    auth.signIn.mockResolvedValue(undefined)
    await loginWithPassword({}, form('a@b.c', 'x'))
    expect(auth.signIn).toHaveBeenCalledWith('credentials', {
      email: 'a@b.c',
      password: 'x',
      redirectTo: '/admin',
    })
    await loginWithGitHub()
    expect(auth.signIn).toHaveBeenCalledWith('github', { redirectTo: '/admin' })
    await logout()
    expect(auth.signOut).toHaveBeenCalledWith({ redirectTo: '/login' })
  })
})

describe('session guards', () => {
  it('requireAdmin redirects without an admin session', async () => {
    auth.auth.mockResolvedValue(null)
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/login')
    auth.auth.mockResolvedValue({ user: { email: 'x', isAdmin: false } })
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/login')
  })

  it('requireAdmin returns the session for an admin', async () => {
    auth.auth.mockResolvedValue({ user: { email: 'a@b.c', isAdmin: true } })
    expect((await requireAdmin()).user.email).toBe('a@b.c')
  })

  it('assertAdmin throws AuthError unless admin', async () => {
    auth.auth.mockResolvedValue(null)
    await expect(assertAdmin()).rejects.toBeInstanceOf(GuardError)
    auth.auth.mockResolvedValue({ user: { isAdmin: true } })
    await expect(assertAdmin()).resolves.toBeTruthy()
  })
})
