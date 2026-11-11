// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDelete } from '@/components/admin/confirm-delete'

function setup(onConfirm = vi.fn()) {
  render(
    <ConfirmDelete
      label="Acme"
      title='Delete "Acme"?'
      description="This cannot be undone."
      onConfirm={onConfirm}
    />,
  )
  return onConfirm
}

describe('ConfirmDelete', () => {
  it('does nothing until the dialog is confirmed', async () => {
    const onConfirm = setup()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Delete Acme' }))
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('This cannot be undone.')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cancel closes without deleting', async () => {
    const onConfirm = setup()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Delete Acme' }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('confirm runs the callback once and closes', async () => {
    const onConfirm = setup()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Delete Acme' }))
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })
})
