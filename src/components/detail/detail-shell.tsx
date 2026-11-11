import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'

type Props = {
  backHref: string
  backLabel: string
  title: string
  eyebrow?: string
  meta?: ReactNode
  children: ReactNode
}

/** Shared frame of every detail page: back link, title, meta line, body. */
export async function DetailShell({ backHref, backLabel, title, eyebrow, meta, children }: Props) {
  const t = await getTranslations('common')
  return (
    <article className="mx-auto max-w-3xl py-12 sm:py-16">
      <Link
        href={backHref as '/'}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        <span className="sr-only">{t('back')}: </span>
        {backLabel}
      </Link>
      <header className="mb-8 space-y-2">
        {eyebrow ? <p className="text-sm font-medium text-primary">{eyebrow}</p> : null}
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {meta ? <div className="text-sm text-muted-foreground">{meta}</div> : null}
      </header>
      <div className="space-y-8">{children}</div>
    </article>
  )
}

export function Paragraphs({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-4">
      {items.map((p) => (
        <p key={p} className="leading-relaxed text-pretty">
          {p}
        </p>
      ))}
    </div>
  )
}

export function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </section>
  )
}
