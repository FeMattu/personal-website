import Link from 'next/link'
import { MessagesList } from '@/components/admin/messages-list'
import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { MESSAGE_STATUSES } from '@/lib/admin/schema-content'
import { requireAdmin } from '@/lib/auth/session'
import { adminMessagesRepo } from '@/lib/db/repositories/admin-misc'

type Props = { searchParams: Promise<{ status?: string }> }

export default async function MessagesPage({ searchParams }: Props) {
  await requireAdmin()
  const { status } = await searchParams
  const filter = MESSAGE_STATUSES.find((s) => s === status)
  const [rows, counts] = await Promise.all([
    adminMessagesRepo.list(filter),
    adminMessagesRepo.counts(),
  ])
  const messages = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    body: row.body,
    locale: row.locale,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }))
  const tabs: { label: string; href: string; active: boolean }[] = [
    { label: 'All', href: '/admin/messages', active: !filter },
    ...MESSAGE_STATUSES.map((s) => ({
      label: `${s.charAt(0)}${s.slice(1).toLowerCase()} (${counts[s] ?? 0})`,
      href: `/admin/messages?status=${s}`,
      active: filter === s,
    })),
  ]
  return (
    <>
      <PageHeader title="Messages" description="Messages sent through the contact form." />
      <nav aria-label="Filter messages" className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab.href} asChild variant={tab.active ? 'default' : 'outline'} size="sm">
            <Link href={tab.href} aria-current={tab.active ? 'page' : undefined}>
              {tab.label}
            </Link>
          </Button>
        ))}
      </nav>
      <MessagesList messages={messages} />
    </>
  )
}
