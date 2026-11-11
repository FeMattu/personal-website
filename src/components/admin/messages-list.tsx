'use client'

import { Archive, Mail, MailOpen, Reply } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { deleteMessage, setMessageStatus } from '@/actions/admin/messages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { MESSAGE_STATUSES } from '@/lib/admin/schema-content'
import { ConfirmDelete } from './confirm-delete'

type MessageStatusValue = (typeof MESSAGE_STATUSES)[number]

export type MessageRow = {
  id: string
  name: string
  email: string
  subject: string | null
  body: string
  locale: string | null
  status: MessageStatusValue
  /** ISO timestamp. */
  createdAt: string
}

const STATUS_LABEL: Record<MessageStatusValue, string> = {
  NEW: 'New',
  READ: 'Read',
  ARCHIVED: 'Archived',
}

export function MessagesList({ messages }: { messages: MessageRow[] }) {
  const [pending, startTransition] = useTransition()

  function setStatus(id: string, status: MessageStatusValue) {
    startTransition(async () => {
      const result = await setMessageStatus(id, status)
      if (result.ok) toast.success(`Marked as ${STATUS_LABEL[status].toLowerCase()}`)
      else toast.error(result.error)
    })
  }

  if (messages.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        No messages.
      </p>
    )
  }

  return (
    <ul className="grid gap-3">
      {messages.map((message) => (
        <li key={message.id}>
          <Card>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {message.name}{' '}
                    <span className="font-normal text-muted-foreground">
                      &lt;{message.email}&gt;
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={message.createdAt}>
                      {new Date(message.createdAt).toLocaleString('en-GB')}
                    </time>
                    {message.locale ? ` · ${message.locale.toUpperCase()}` : ''}
                  </p>
                </div>
                <Badge variant={message.status === 'NEW' ? 'default' : 'secondary'}>
                  {STATUS_LABEL[message.status]}
                </Badge>
              </div>
              {message.subject ? <p className="text-sm font-medium">{message.subject}</p> : null}
              <p className="text-sm whitespace-pre-wrap">{message.body}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject ?? 'Your message'}`)}`}
                  >
                    <Reply /> Reply
                  </a>
                </Button>
                {message.status !== 'READ' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => setStatus(message.id, 'READ')}
                  >
                    <MailOpen /> Mark read
                  </Button>
                ) : null}
                {message.status !== 'NEW' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => setStatus(message.id, 'NEW')}
                  >
                    <Mail /> Mark unread
                  </Button>
                ) : null}
                {message.status !== 'ARCHIVED' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => setStatus(message.id, 'ARCHIVED')}
                  >
                    <Archive /> Archive
                  </Button>
                ) : null}
                <ConfirmDelete
                  label={`message from ${message.name}`}
                  title="Delete this message?"
                  description="The message is permanently deleted."
                  onConfirm={async () => {
                    const result = await deleteMessage(message.id)
                    if (result.ok) toast.success('Message deleted')
                    else toast.error(result.error)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
