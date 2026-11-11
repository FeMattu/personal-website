'use client'

import { Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type Props = {
  /** Accessible name of the trigger, e.g. the item title. */
  label: string
  title?: string
  description: ReactNode
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  /** Custom trigger content; defaults to an icon button. */
  children?: ReactNode
}

/** Delete confirmation (shadcn AlertDialog). The action only runs after an explicit confirm. */
export function ConfirmDelete({
  label,
  title = 'Delete this item?',
  description,
  confirmLabel = 'Delete',
  onConfirm,
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${label}`}>
            <Trash2 />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void onConfirm()}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
