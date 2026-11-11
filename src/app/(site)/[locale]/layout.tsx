import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { locales } from '@/i18n/config'
import { routing } from '@/i18n/routing'
import { getSite, getSocialLinks } from '@/lib/content'
import { buildMetadata, siteOrigin } from '@/lib/seo'
import '@/app/globals.css'

// Pages render on request from tag-cached data (see lib/content): the build never needs a database.
export const dynamic = 'force-dynamic'

type Props = { children: ReactNode; params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'meta' })
  const site = await getSite(locale)
  const name = site?.ownerName ?? t('siteName')
  const defaultTitle = site?.seoTitle ?? `${name}${site?.role ? `: ${site.role}` : ''}`
  return {
    ...buildMetadata({
      locale,
      path: '/',
      title: defaultTitle,
      description: site?.seoDescription ?? t('defaultDescription'),
    }),
    metadataBase: new URL(siteOrigin),
    title: { default: defaultTitle, template: `%s · ${name}` },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const [messages, site, socials, t] = await Promise.all([
    getMessages(),
    getSite(locale),
    getSocialLinks(),
    getTranslations({ locale, namespace: 'a11y' }),
  ])
  const ownerName = site?.ownerName ?? 'Federico Mattucci'

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <TooltipProvider delayDuration={150}>
              <a
                href="#main"
                className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
              >
                {t('skipToContent')}
              </a>
              <SiteHeader siteName={ownerName} />
              <main id="main" className="mx-auto max-w-5xl px-4 sm:px-6">
                {children}
              </main>
              <SiteFooter ownerName={ownerName} socials={socials} />
              <Toaster richColors closeButton />
            </TooltipProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
