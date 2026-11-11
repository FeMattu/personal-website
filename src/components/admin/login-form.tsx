'use client'

import { useActionState } from 'react'
import { loginWithGitHub, loginWithPassword, type LoginState } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = { password: boolean; github: boolean }

export function LoginForm({ password, github }: Props) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginWithPassword, {})

  if (!password && !github) {
    return (
      <p role="alert" className="text-sm text-destructive">
        No sign-in method is configured. Set ADMIN_PASSWORD_HASH or AUTH_GITHUB_ID /
        AUTH_GITHUB_SECRET in .env.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {password ? (
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <Input id="login-email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      ) : null}

      {github ? (
        <form action={loginWithGitHub}>
          <Button type="submit" variant="outline" className="w-full">
            Continue with GitHub
          </Button>
        </form>
      ) : null}
    </div>
  )
}
