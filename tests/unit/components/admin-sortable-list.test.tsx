// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

import { SortableList } from '@/components/admin/sortable-list'
import type { ActionResult } from '@/lib/action-result'

type Item = { id: string; title: string }
const items: Item[] = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
  { id: 'c', title: 'Gamma' },
]

const titles = () =>
  screen.getAllByRole('listitem').map((li) => within(li).getByText(/Alpha|Beta|Gamma/).textContent)

function setup(onReorder: (ids: string[]) => Promise<ActionResult>) {
  render(
    <SortableList
      items={items}
      getLabel={(item) => item.title}
      onReorder={onReorder}
      renderItem={(item) => <span>{item.title}</span>}
    />,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('SortableList', () => {
  it('exposes a drag handle and move buttons per item, with sensible disabled edges', () => {
    setup(async () => ({ ok: true }))
    expect(screen.getByRole('button', { name: 'Drag to reorder Beta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move Alpha up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Gamma down' })).toBeDisabled()
  })

  it('reorders with the keyboard and persists the new id order (optimistic)', async () => {
    const onReorder = vi.fn(async (): Promise<ActionResult> => ({ ok: true }))
    const user = userEvent.setup()
    setup(onReorder)

    screen.getByRole('button', { name: 'Move Alpha down' }).focus()
    await user.keyboard('{Enter}')

    expect(titles()).toEqual(['Beta', 'Alpha', 'Gamma'])
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c'])
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })

  it('moves an item up', async () => {
    const onReorder = vi.fn(async (): Promise<ActionResult> => ({ ok: true }))
    const user = userEvent.setup()
    setup(onReorder)
    await user.click(screen.getByRole('button', { name: 'Move Gamma up' }))
    expect(onReorder).toHaveBeenCalledWith(['a', 'c', 'b'])
  })

  it('rolls back and shows an error toast when the server rejects the order', async () => {
    const onReorder = vi.fn(async (): Promise<ActionResult> => ({ ok: false, error: 'Stale list' }))
    const user = userEvent.setup()
    setup(onReorder)

    await user.click(screen.getByRole('button', { name: 'Move Alpha down' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Stale list'))
    expect(titles()).toEqual(['Alpha', 'Beta', 'Gamma'])
  })
})
