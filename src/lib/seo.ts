import type { Metadata } from 'next'
import { defaultLocale, locales } from '@/i18n/config'

const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

/** `/it/projects/x` for a locale-less path `/projects/x` (home is `/it`). */
export const localizedPath = (locale: string, path: string): string =>
  `/${locale}${path === '/' ? '' : path}`

type Input = {
  locale: string
  /** Locale-less path, e.g. `/projects/foo` or `/`. */
  path: string
  title: string
  description?: string | null
  image?: string | null
  type?: 'website' | 'article'
}

/** Canonical + hreflang (incl. x-default) + Open Graph for one page. */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = 'website',
}: Input): Metadata {
  const url = `${ORIGIN}${localizedPath(locale, path)}`
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${ORIGIN}${localizedPath(l, path)}`]),
  ) as Record<string, string>
  languages['x-default'] = `${ORIGIN}${localizedPath(defaultLocale, path)}`
  return {
    title,
    description: description ?? undefined,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description: description ?? undefined,
      url,
      type,
      locale,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description: description ?? undefined,
    },
  }
}

export const siteOrigin = ORIGIN
