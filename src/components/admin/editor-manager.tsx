'use client'

import { Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ResourceList, type ResourceActions, type ResourceRow } from './resource-list'

export type EditorRow<F> = ResourceRow & { form: F }

export type DialogFormProps<F> = {
  /** `null` when creating. */
  id: string | null
  initial: F
  onDone: () => void
}

type Props<F> = {
  noun: string
  items: EditorRow<F>[]
  blank: F
  actions: ResourceActions
  renderForm: (props: DialogFormProps<F>) => ReactNode
  deleteWarning?: string
}

/** List with an add/edit dialog: used by resources small enough to be edited in place. */
export function EditorManager<F>({
  noun,
  items,
  blank,
  actions,
  renderForm,
  deleteWarning,
}: Props<F>) {
  const [editing, setEditing] = useState<{ id: string | null } | null>(null)
  const current = editing?.id ? items.find((item) => item.id === editing.id) : undefined
  const close = () => setEditing(null)

  return (
    <div className="grid gap-4">
      <div>
        <Button onClick={() => setEditing({ id: null })}>
          <Plus /> Add {noun}
        </Button>
      </div>
      <ResourceList
        items={items}
        noun={noun}
        actions={actions}
        onEdit={(id) => setEditing({ id })}
        {...(deleteWarning ? { deleteWarning } : {})}
      />
      <Dialog open={editing !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? `Edit ${noun}` : `New ${noun}`}</DialogTitle>
            <DialogDescription>
              Changes are saved to the database and published immediately if the status is
              Published.
            </DialogDescription>
          </DialogHeader>
          {editing
            ? renderForm({
                id: editing.id,
                initial: current?.form ?? blank,
                onDone: close,
              })
            : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
