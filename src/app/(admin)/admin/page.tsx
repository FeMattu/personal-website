import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/session'
import { getDashboardCounts } from '@/lib/db/repositories/dashboard'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboard() {
  await requireAdmin()
  const c = await getDashboardCounts()
  const cards = [
    { href: '/admin/experience', label: 'Experience', value: c.experiences },
    { href: '/admin/education', label: 'Education', value: c.education },
    { href: '/admin/skills', label: 'Skills', value: c.skills },
    {
      href: '/admin/projects',
      label: 'Projects',
      value: c.projects,
      hint: c.projectsDraft > 0 ? `${c.projectsDraft} draft` : undefined,
    },
    { href: '/admin/photos', label: 'Photos', value: c.photos },
    {
      href: '/admin/messages',
      label: 'Messages',
      value: c.messagesNew,
      hint: 'new',
    },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="block rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{card.value}</p>
              {card.hint ? <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
