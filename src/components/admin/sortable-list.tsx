'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { ActionResult } from '@/lib/action-result'
import { moveItem } from '@/lib/admin/ordering'
import { cn } from '@/lib/utils'

type Props<T extends { id: string }> = {
  items: readonly T[]
  /** Accessible name of an item (used by the handle and the move buttons). */
  getLabel: (item: T) => string
  /** Persists the new order; must return a failure instead of throwing. */
  onReorder: (ids: string[]) => Promise<ActionResult>
  renderItem: (item: T) => ReactNode
  className?: string
}

type RowProps = {
  id: string
  label: string
  index: number
  count: number
  onMove: (from: number, to: number) => void
  children: ReactNode
}

function SortableRow({ id, label, index, count, onMove, children }: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card p-2 text-card-foreground',
        isDragging && 'relative z-10 shadow-md',
      )}
    >
      <Button
        ref={setActivatorNodeRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        className="cursor-grab touch-none"
        aria-label={`Drag to reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical />
      </Button>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${label} up`}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ChevronUp />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Move ${label} down`}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ChevronDown />
        </Button>
      </div>
    </li>
  )
}

/**
 * Drag-and-drop (pointer + keyboard) reorderable list with optimistic UI: the new order is shown
 * immediately and rolled back, with a toast, if the server rejects it. The up/down buttons are an
 * always-available accessible alternative to dragging.
 */
export function SortableList<T extends { id: string }>({
  items,
  getLabel,
  onReorder,
  renderItem,
  className,
}: Props<T>) {
  const [order, setOrder] = useState<readonly T[]>(items)
  const [source, setSource] = useState<readonly T[]>(items)
  // Re-sync when the server data changes (adjusting state during render, no effect needed).
  if (source !== items) {
    setSource(items)
    setOrder(items)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function commit(next: T[]) {
    const previous = order
    setOrder(next)
    const result = await onReorder(next.map((item) => item.id))
    if (!result.ok) {
      setOrder(previous)
      toast.error(result.error)
    } else {
      toast.success('Order saved')
    }
  }

  function move(from: number, to: number) {
    if (from === to) return
    void commit(moveItem(order, from, to))
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    move(
      order.findIndex((item) => item.id === active.id),
      order.findIndex((item) => item.id === over.id),
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className={cn('grid gap-2', className)}>
          {order.map((item, index) => (
            <SortableRow
              key={item.id}
              id={item.id}
              label={getLabel(item)}
              index={index}
              count={order.length}
              onMove={move}
            >
              {renderItem(item)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
