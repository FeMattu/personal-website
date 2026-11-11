// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderPublic } from './test-utils'

const nav = vi.hoisted(() => ({ pathname: '/', replace: vi.fn() }))

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')
  return {
    Link: ({ href, children, ...rest }: { href: unknown; children: React.ReactNode }) =>
      React.createElement('a', { href: typeof href === 'string' ? href : '#', ...rest }, children),
    usePathname: () => nav.pathname,
    useRouter: () => ({ replace: nav.replace }),
  }
})
vi.mock('next/navigation', () => ({ useParams: () => ({ locale: 'en' }), usePathname: () => '/' }))
vi.mock('next/link', async () => {
  const React = await import('react')
  return {
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
      React.createElement('a', { href, ...rest }, children),
  }
})

import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { SiteHeader } from '@/components/layout/site-header'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { ADMIN_HINT_KEY } from '@/lib/navigation'

beforeEach(() => {
  nav.pathname = '/'
  nav.replace.mockReset()
  window.localStorage.clear()
  document.documentElement.className = ''
})

describe('SiteHeader (top navbar)', () => {
  it('shows every section link in a labelled nav and never renders an aside/sidebar', () => {
    const { container } = renderPublic(<SiteHeader siteName="Federico Mattucci" />)
    const navEl = screen.getAllByRole('navigation', { name: 'Main navigation' })[0]!
    for (const label of ['Experience', 'Education', 'Skills', 'Projects', 'Photos', 'Contact']) {
      expect(within(navEl).getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(container.querySelector('aside')).toBeNull()
    expect(container.querySelector('[data-sidebar]')).toBeNull()
  })

  it('links home sections as anchors and photos as a page', () => {
    renderPublic(<SiteHeader siteName="x" />)
    const navEl = screen.getAllByRole('navigation')[0]!
    expect(within(navEl).getByRole('link', { name: 'Skills' })).toHaveAttribute('href', '/#skills')
    expect(within(navEl).getByRole('link', { name: 'Photos' })).toHaveAttribute('href', '/photos')
  })

  it('marks the current page as active', () => {
    nav.pathname = '/projects'
    renderPublic(<SiteHeader siteName="x" />)
    const navEl = screen.getAllByRole('navigation')[0]!
    expect(within(navEl).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('collapses into a menu button for mobile', () => {
    renderPublic(<SiteHeader siteName="x" />)
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })

  it('shows the Admin entry only when the admin hint is set', () => {
    const first = renderPublic(<SiteHeader siteName="x" />)
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull()
    first.unmount()
    window.localStorage.setItem(ADMIN_HINT_KEY, '1')
    renderPublic(<SiteHeader siteName="x" />)
    expect(screen.getAllByRole('link', { name: 'Admin' }).length).toBeGreaterThan(0)
  })
})

describe('ThemeToggle', () => {
  it('switches to dark and back to light', async () => {
    const user = userEvent.setup()
    renderPublic(<ThemeToggle />)
    await user.click(screen.getByRole('button', { name: 'Change theme' }))
    await user.click(await screen.findByRole('menuitemradio', { name: /dark/i }))
    expect(document.documentElement).toHaveClass('dark')

    await user.click(screen.getByRole('button', { name: 'Change theme' }))
    await user.click(await screen.findByRole('menuitemradio', { name: /light/i }))
    expect(document.documentElement).not.toHaveClass('dark')
  })
})

describe('LanguageSwitcher', () => {
  it('lists the configured locales and switches language keeping the path', async () => {
    const user = userEvent.setup()
    renderPublic(<LanguageSwitcher />)
    await user.click(screen.getByRole('button', { name: 'Change language' }))
    expect(await screen.findByRole('menuitemradio', { name: 'English' })).toBeChecked()
    await user.click(screen.getByRole('menuitemradio', { name: 'Italiano' }))
    expect(nav.replace).toHaveBeenCalledWith('/', { locale: 'it' })
  })
})
