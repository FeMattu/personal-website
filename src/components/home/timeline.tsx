import { ArrowUpRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import { formatPeriod } from '@/lib/dates'

export type TimelineEntry = {
  id: string
  href: string
  title: string
  subtitle: string
  location: string | null
  start: string
  end: string | null
  summary: string | null
  tags?: { slug: string; name: string }[]
}

/** Compact, clickable timeline cards (experience and education share the same shape). */
export async function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const locale = await getLocale()
  const t = await getTranslations('common')
  return (
    <ol className="space-y-3">
      {entries.map((e) => (
        <li key={e.id}>
          <Link
            href={e.href as '/'}
            className="group block rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <div>
                <h3 className="font-medium">{e.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {e.subtitle}
                  {e.location ? ` · ${e.location}` : ''}
                </p>
              </div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                <time dateTime={e.start}>{formatPeriod(e.start, e.end, locale, t('present'))}</time>
                <ArrowUpRight
                  className="size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden
                />
              </p>
            </div>
            {e.summary ? (
              <p className="mt-3 text-sm text-pretty text-muted-foreground">{e.summary}</p>
            ) : null}
            {e.tags && e.tags.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {e.tags.map((tag) => (
                  <li key={tag.slug}>
                    <Badge variant="secondary">{tag.name}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </Link>
        </li>
      ))}
    </ol>
  )
}
