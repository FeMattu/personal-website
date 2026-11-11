'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export type ExplorerItem = {
  slug: string
  tags: string[] // tag slugs
  node: ReactNode // server-rendered card
}

type Props = { items: ExplorerItem[]; tags: { slug: string; name: string }[] }

/** Tag filter over server-rendered cards (the cards stay Server Components). */
export function ProjectsExplorer({ items, tags }: Props) {
  const t = useTranslations('projects')
  const [active, setActive] = useState<string | null>(null)
  const visible = useMemo(
    () => (active ? items.filter((i) => i.tags.includes(active)) : items),
    [items, active],
  )

  if (items.length === 0) return <p className="text-muted-foreground">{t('empty')}</p>

  return (
    <div className="space-y-6">
      {tags.length > 0 ? (
        <div role="group" aria-label={t('filterLabel')} className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={active === null ? 'default' : 'outline'}
            aria-pressed={active === null}
            onClick={() => setActive(null)}
          >
            {t('all')}
          </Button>
          {tags.map((tag) => (
            <Button
              key={tag.slug}
              size="sm"
              variant={active === tag.slug ? 'default' : 'outline'}
              aria-pressed={active === tag.slug}
              onClick={() => setActive(active === tag.slug ? null : tag.slug)}
            >
              {tag.name}
            </Button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-muted-foreground">{t('emptyFiltered')}</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((i) => (
            <li key={i.slug}>{i.node}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
