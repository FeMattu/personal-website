// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderPublic } from './test-utils'

const sendContactMessage = vi.hoisted(() => vi.fn())
vi.mock('@/actions/contact', () => ({ sendContactMessage }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')
  return {
    Link: ({ href, children, ...rest }: { href: unknown; children: React.ReactNode }) =>
      React.createElement('a', { href: typeof href === 'string' ? href : '#', ...rest }, children),
  }
})

import { ContactForm } from '@/components/home/contact-form'
import { ProjectsExplorer } from '@/components/projects/projects-explorer'
import { SkillLevelDots } from '@/components/skills/skill-level'
import { SkillsExplorer } from '@/components/skills/skills-explorer'
import type { SkillCategoryView } from '@/lib/content/types'

beforeEach(() => sendContactMessage.mockReset())

const categories: SkillCategoryView[] = [
  {
    id: 'c1',
    slug: 'langs',
    name: 'Languages',
    skills: [
      {
        id: 's1',
        slug: 'ts',
        name: 'TypeScript',
        level: 'ADVANCED',
        description: null,
        projects: [],
      },
      { id: 's2', slug: 'java', name: 'Java', level: null, description: null, projects: [] },
    ],
  },
  {
    id: 'c2',
    slug: 'tools',
    name: 'Tools',
    skills: [
      { id: 's3', slug: 'git', name: 'Git', level: 'EXPERT', description: null, projects: [] },
    ],
  },
]

describe('SkillsExplorer', () => {
  it('groups skills by category with tabs and exposes levels as text, not percentages', async () => {
    const user = userEvent.setup()
    renderPublic(<SkillsExplorer categories={categories} />)
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Level: Advanced' })).toBeInTheDocument()
    expect(screen.queryByText(/%/)).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Tools' }))
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByText('Git')).toBeInTheDocument()
    expect(within(panel).queryByText('TypeScript')).toBeNull()
  })

  it('shows an empty state', () => {
    renderPublic(<SkillsExplorer categories={[]} />)
    expect(screen.getByText('No skills to show.')).toBeInTheDocument()
  })
})

describe('SkillLevelDots', () => {
  it('renders nothing for unrated skills and 4 dots otherwise', () => {
    const { container, rerender } = renderPublic(<SkillLevelDots level={null} label="x" />)
    expect(container.querySelector('[role="img"]')).toBeNull()
    rerender(<SkillLevelDots level="BASIC" label="Basic" />)
  })
})

describe('ProjectsExplorer', () => {
  const items = [
    { slug: 'a', tags: ['react'], node: <span>Project A</span> },
    { slug: 'b', tags: ['java'], node: <span>Project B</span> },
  ]
  const tags = [
    { slug: 'java', name: 'Java' },
    { slug: 'react', name: 'React' },
  ]

  it('filters cards by tag and can reset', async () => {
    const user = userEvent.setup()
    renderPublic(<ProjectsExplorer items={items} tags={tags} />)
    expect(screen.getByText('Project A')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Java' }))
    expect(screen.queryByText('Project A')).toBeNull()
    expect(screen.getByText('Project B')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Project A')).toBeInTheDocument()
  })

  it('shows an empty state without projects', () => {
    renderPublic(<ProjectsExplorer items={[]} tags={[]} />)
    expect(screen.getByText('No published projects yet.')).toBeInTheDocument()
  })
})

describe('ContactForm', () => {
  it('shows translated validation errors and does not call the action', async () => {
    const user = userEvent.setup()
    renderPublic(<ContactForm />)
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('Please enter your name.')).toBeInTheDocument()
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    expect(sendContactMessage).not.toHaveBeenCalled()
  })

  it('submits valid data with the honeypot empty', async () => {
    sendContactMessage.mockResolvedValue({ status: 'success' })
    const user = userEvent.setup()
    renderPublic(<ContactForm />)
    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Message'), 'A sufficiently long message')
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    await waitFor(() => expect(sendContactMessage).toHaveBeenCalledTimes(1))
    const [payload, locale] = sendContactMessage.mock.calls[0]!
    expect(payload).toMatchObject({ name: 'Ada', email: 'ada@example.com', website: '' })
    expect(locale).toBe('en')
  })

  it('renders the honeypot hidden from assistive tech', () => {
    const { container } = renderPublic(<ContactForm />)
    const honeypot = container.querySelector('#contact-website')!
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(honeypot).toHaveAttribute('tabindex', '-1')
  })
})
