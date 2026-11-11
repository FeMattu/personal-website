// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({ createExperience: vi.fn(), updateExperience: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }))
vi.mock('@/actions/admin/experience', () => actions)
vi.mock('sonner', () => ({ toast }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

import { ExperienceForm } from '@/components/admin/experience-form'
import { defaultLocale } from '@/i18n/config'
import { blankExperience } from '@/lib/admin/form-values'

// Radix primitives (Switch) observe element size.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub

beforeEach(() => vi.clearAllMocks())

const field = (label: string) => screen.getAllByLabelText(label)[0] as HTMLElement

describe('ExperienceForm', () => {
  it('shows validation errors and does not call the action', async () => {
    const user = userEvent.setup()
    render(<ExperienceForm id={null} initial={blankExperience()} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
    expect(
      screen.getByText('Required for the default language (' + defaultLocale.toUpperCase() + ')'),
    ).toBeInTheDocument()
    expect(actions.createExperience).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
  })

  it('suggests a slug from the organization name', async () => {
    const user = userEvent.setup()
    render(<ExperienceForm id={null} initial={blankExperience()} />)
    await user.type(field('Organization'), 'Acme Corp & Co')
    await user.tab()
    expect(field('Slug')).toHaveValue('acme-corp-and-co')
  })

  it('submits the typed payload to createExperience and navigates to the new row', async () => {
    actions.createExperience.mockResolvedValue({ ok: true, data: { id: 'new1' } })
    const user = userEvent.setup()
    render(<ExperienceForm id={null} initial={blankExperience()} />)

    await user.type(field('Organization'), 'Acme')
    await user.type(field('Role'), 'Developer')
    fireEvent.change(field('Start date'), { target: { value: '2022-01-01' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(actions.createExperience).toHaveBeenCalledTimes(1))
    const payload = actions.createExperience.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      slug: 'acme',
      organization: 'Acme',
      startDate: '2022-01-01',
      status: 'DRAFT',
    })
    expect(payload.translations[defaultLocale].role).toBe('Developer')
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/experience/new1'))
    expect(toast.success).toHaveBeenCalled()
  })

  it('updates an existing row and maps server field errors onto the form', async () => {
    actions.updateExperience.mockResolvedValue({
      ok: false,
      error: 'A record with this value already exists',
      fieldErrors: { slug: 'Already in use' },
    })
    const user = userEvent.setup()
    const initial = blankExperience()
    initial.slug = 'taken'
    initial.organization = 'Acme'
    initial.startDate = '2022-01-01'
    initial.translations[defaultLocale] = {
      role: 'Dev',
      summary: '',
      description: '',
      highlights: '',
    }
    render(<ExperienceForm id="row1" initial={initial} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(actions.updateExperience).toHaveBeenCalledWith('row1', expect.any(Object)),
    )
    expect(await screen.findByText('Already in use')).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith('A record with this value already exists')
  })
})
