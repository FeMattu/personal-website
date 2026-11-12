'use client'

import { Copy, Eye, EyeOff, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { ActionResult } from '@/lib/action-result'
import type { ContentStatusValue } from '@/lib/admin/schema-common'
import { ConfirmDelete } from './confirm-delete'
import { SortableList } from './sortable-list'
import { MissingBadge, StatusBadge } from './status-badge'

export type ResourceRow = {
  id: string
  title: string
  subtitle?: string | undefined
  status: ContentStatusValue
  /** Locales whose required text is missing (from `missingLocales()`). */
  missing: string[]
}

export type ResourceActions = {
  reorder: (ids: string[]) => Promise<ActionResult>
  remove: (id: string) => Promise<ActionResult>
  duplicate: (id: string) => Promise<ActionResult<{ id: string }>>
  setStatus: (id: string, status: ContentStatusValue) => Promise<ActionResult>
}

type Props = {
  items: ResourceRow[]
  /** Singular noun for messages, e.g. "experience". */
  noun: string
  actions: ResourceActions
  /** Edit as a page link... */
  /** Base path; the edit link is `<editBase>/<id>` (a string, because functions cannot cross the server/client boundary). */
  editBase?: string
  /** ...or through a callback (dialog editors). */
  onEdit?: (id: string) => void
  deleteWarning?: string
}

/** Edit / publish toggle / duplicate / delete (confirmed) buttons for one row. */
export function RowActions({
  item,
  noun,
  actions,
  editBase,
  onEdit,
  deleteWarning,
}: Omit<Props, 'items'> & { item: ResourceRow }) {
  const [pending, startTransition] = useTransition()
  const published = item.status === 'PUBLISHED'

  function run(work: () => Promise<ActionResult<unknown>>, success: string) {
    startTransition(async () => {
      const result = await work()
      if (result.ok) toast.success(success)
      else toast.error(result.error)
    })
  }

  return (
    <div className="flex items-center">
      {editBase ? (
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`${editBase}/${item.id}`} aria-label={`Edit ${item.title}`}>
            <Pencil />
          </Link>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${item.title}`}
          onClick={() => onEdit?.(item.id)}
        >
          <Pencil />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={`${published ? 'Unpublish' : 'Publish'} ${item.title}`}
        onClick={() =>
          run(
            () => actions.setStatus(item.id, published ? 'DRAFT' : 'PUBLISHED'),
            published ? 'Moved to draft' : 'Published',
          )
        }
      >
        {published ? <EyeOff /> : <Eye />}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={`Duplicate ${item.title}`}
        onClick={() => run(() => actions.duplicate(item.id), 'Duplicated as draft')}
      >
        <Copy />
      </Button>
      <ConfirmDelete
        label={item.title}
        title={`Delete "${item.title}"?`}
        description={
          deleteWarning ?? `This permanently removes this ${noun} and all its translations.`
        }
        onConfirm={() => run(() => actions.remove(item.id), 'Deleted')}
      />
    </div>
  )
}

/** Title (optionally a link) with status / missing-translation badges. */
export function RowHeading({ item, href }: { item: ResourceRow; href?: string | undefined }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        {href ? (
          <Link href={href} className="truncate font-medium hover:underline">
            {item.title}
          </Link>
        ) : (
          <span className="truncate font-medium">{item.title}</span>
        )}
        <StatusBadge status={item.status} />
        <MissingBadge missing={item.missing} />
      </div>
      {item.subtitle ? (
        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
      ) : null}
    </div>
  )
}

/** Sortable list with the shared row actions. */
export function ResourceList({ items, noun, actions, editBase, onEdit, deleteWarning }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        No {noun} yet.
      </p>
    )
  }
  return (
    <SortableList
      items={items}
      getLabel={(item) => item.title}
      onReorder={actions.reorder}
      renderItem={(item) => (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <RowHeading item={item} href={editBase ? `${editBase}/${item.id}` : undefined} />
          <RowActions
            item={item}
            noun={noun}
            actions={actions}
            editBase={editBase}
            onEdit={onEdit}
            deleteWarning={deleteWarning}
          />
        </div>
      )}
    />
  )
}
