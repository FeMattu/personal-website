'use client'

import { Download, Menu } from 'lucide-react'
import NextLink from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { activeKeyForPath, NAV_ITEMS, SPY_SECTIONS, type NavKey } from '@/lib/navigation'

type Props = { siteName: string; cvPath?: string | null }

/** Sticky top navigation bar: the ONLY navigation of the public site (no sidebar). */
export function SiteHeader({ siteName, cvPath }: Props) {
  const t = useTranslations()
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isAdmin = useIsAdmin()
  const [spy, setSpy] = useState<NavKey | null>(null)
  const [open, setOpen] = useState(false)

  // Scroll-spy: highlights the home section currently crossing the upper third of the viewport.
  useEffect(() => {
    if (!isHome) return
    const targets = SPY_SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el,
    )
    if (targets.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        const first = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (first) setSpy(first.target.id as NavKey)
      },
      { rootMargin: '-20% 0px -65% 0px' },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [isHome])

  const active: NavKey | null = isHome ? spy : activeKeyForPath(pathname)

  const links = NAV_ITEMS.map((item) => {
    const href = item.kind === 'page' ? item.href : (`/#${item.key}` as const)
    return { key: item.key, href, label: t(`nav.${item.key}`), current: active === item.key }
  })

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-6">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 rounded-full border bg-background/75 px-3 shadow-xs backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sm:px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:ring-ring"
        >
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
          >
            FM
          </span>
          <span className="sr-only sm:not-sr-only">{siteName}</span>
        </Link>

        <nav aria-label={t('a11y.mainNav')} className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.key}>
                <Link
                  href={l.href}
                  aria-current={l.current ? 'true' : undefined}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
                    l.current && 'bg-accent font-medium text-foreground',
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {isAdmin ? (
              <li>
                <NextLink
                  href="/admin"
                  className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
                >
                  {t('nav.admin')}
                </NextLink>
              </li>
            ) : null}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          {cvPath ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden rounded-full lg:inline-flex"
            >
              <a href={cvPath} download>
                {t('hero.ctaCv')}
                <Download aria-hidden />
              </a>
            </Button>
          ) : null}
          <LanguageSwitcher />
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={t('a11y.openMenu')}
              >
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{t('a11y.menuTitle')}</SheetTitle>
                <SheetDescription className="sr-only">{t('a11y.mainNav')}</SheetDescription>
              </SheetHeader>
              <nav aria-label={t('a11y.mainNav')} className="px-4">
                <ul className="flex flex-col gap-1">
                  <li>
                    <SheetClose asChild>
                      <Link
                        href="/"
                        className="block rounded-md px-3 py-2.5 text-base hover:bg-accent"
                      >
                        {t('nav.home')}
                      </Link>
                    </SheetClose>
                  </li>
                  {links.map((l) => (
                    <li key={l.key}>
                      <SheetClose asChild>
                        <Link
                          href={l.href}
                          aria-current={l.current ? 'true' : undefined}
                          className={cn(
                            'block rounded-md px-3 py-2.5 text-base hover:bg-accent',
                            l.current && 'bg-accent font-medium',
                          )}
                        >
                          {l.label}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                  {isAdmin ? (
                    <li>
                      <NextLink
                        href="/admin"
                        className="block rounded-md px-3 py-2.5 text-base font-medium text-primary hover:bg-accent"
                      >
                        {t('nav.admin')}
                      </NextLink>
                    </li>
                  ) : null}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
