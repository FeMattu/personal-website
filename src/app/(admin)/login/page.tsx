import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, authProviders } from '@/auth'
import { LoginForm } from '@/components/admin/login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage() {
  const session = await auth()
  if (session?.user?.isAdmin) redirect('/admin')
  const providers = authProviders()

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-6 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage the site.</p>
        </div>
        <LoginForm password={providers.password} github={providers.github} />
      </div>
    </main>
  )
}
