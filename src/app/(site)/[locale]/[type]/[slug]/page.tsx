import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { BulletList, DetailShell, Paragraphs } from '@/components/detail/detail-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCertification, getEducation, getExperience, getProject } from '@/lib/content'
import { formatMonthYear, formatPeriod } from '@/lib/dates'
import { mediaUrl } from '@/lib/media'
import { buildMetadata } from '@/lib/seo'

const DETAIL_TYPES = ['experience', 'education', 'projects', 'certifications'] as const
type DetailType = (typeof DETAIL_TYPES)[number]
const isType = (v: string): v is DetailType => (DETAIL_TYPES as readonly string[]).includes(v)

type Props = { params: Promise<{ locale: string; type: string; slug: string }> }

async function load(type: DetailType, slug: string, locale: string) {
  switch (type) {
    case 'experience':
      return { type, data: await getExperience(slug, locale) } as const
    case 'education':
      return { type, data: await getEducation(slug, locale) } as const
    case 'projects':
      return { type, data: await getProject(slug, locale) } as const
    case 'certifications':
      return { type, data: await getCertification(slug, locale) } as const
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, type, slug } = await params
  if (!isType(type)) return {}
  const loaded = await load(type, slug, locale)
  if (!loaded.data) return {}
  const path = `/${type}/${slug}`
  const base = { locale, path, type: 'article' } as const
  switch (loaded.type) {
    case 'experience':
      return buildMetadata({
        ...base,
        title: `${loaded.data.role} · ${loaded.data.organization}`,
        description: loaded.data.summary,
      })
    case 'education':
      return buildMetadata({ ...base, title: loaded.data.title, description: loaded.data.summary })
    case 'projects':
      return buildMetadata({
        ...base,
        title: loaded.data.title,
        description: loaded.data.summary,
        image: loaded.data.coverKey ? mediaUrl(loaded.data.coverKey) : null,
      })
    case 'certifications':
      return buildMetadata({ ...base, title: loaded.data.name, description: loaded.data.issuer })
  }
}

export default async function DetailPage({ params }: Props) {
  const { locale, type, slug } = await params
  setRequestLocale(locale)
  if (!isType(type)) notFound()
  const loaded = await load(type, slug, locale)
  if (!loaded.data) notFound()

  const t = await getTranslations('common')
  const tn = await getTranslations('nav')
  const tp = await getTranslations('projects')

  if (loaded.type === 'experience') {
    const e = loaded.data
    return (
      <DetailShell
        backHref="/#experience"
        backLabel={tn('experience')}
        eyebrow={e.organization}
        title={e.role}
        meta={
          <>
            <time dateTime={e.startDate}>
              {formatPeriod(e.startDate, e.endDate, locale, t('present'))}
            </time>
            {e.location ? ` · ${e.location}` : ''}
          </>
        }
      >
        <Paragraphs items={e.summary ? [e.summary, ...e.description] : e.description} />
        <BulletList title={t('highlights')} items={e.highlights} />
        {e.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={t('tags')}>
            {e.tags.map((tag) => (
              <li key={tag.slug}>
                <Badge variant="secondary">{tag.name}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
        {e.url ? (
          <Button asChild variant="outline">
            <a href={e.url} target="_blank" rel="noopener noreferrer">
              {t('visit')} <ExternalLink aria-hidden />
            </a>
          </Button>
        ) : null}
      </DetailShell>
    )
  }

  if (loaded.type === 'education') {
    const e = loaded.data
    return (
      <DetailShell
        backHref="/#education"
        backLabel={tn('education')}
        eyebrow={e.institution}
        title={e.title}
        meta={
          <>
            <time dateTime={e.startDate}>
              {formatPeriod(e.startDate, e.endDate, locale, t('present'))}
            </time>
            {e.location ? ` · ${e.location}` : ''}
          </>
        }
      >
        <Paragraphs items={e.summary ? [e.summary, ...e.description] : e.description} />
        <BulletList title={t('highlights')} items={e.highlights} />
      </DetailShell>
    )
  }

  if (loaded.type === 'certifications') {
    const c = loaded.data
    return (
      <DetailShell
        backHref="/#about"
        backLabel={tn('education')}
        eyebrow={c.issuer ?? undefined}
        title={c.name}
        meta={
          c.issuedAt ? (
            <time dateTime={c.issuedAt}>{formatMonthYear(c.issuedAt, locale)}</time>
          ) : undefined
        }
      >
        <Paragraphs items={c.description} />
        {c.url ? (
          <Button asChild variant="outline">
            <a href={c.url} target="_blank" rel="noopener noreferrer">
              {t('visit')} <ExternalLink aria-hidden />
            </a>
          </Button>
        ) : null}
      </DetailShell>
    )
  }

  const p = loaded.data
  return (
    <DetailShell
      backHref="/projects"
      backLabel={tn('projects')}
      title={p.title}
      meta={p.summary ?? undefined}
    >
      {p.coverKey ? (
        <Image
          src={mediaUrl(p.coverKey)}
          alt={tp('coverAlt', { title: p.title })}
          width={1200}
          height={750}
          priority
          sizes="(min-width: 768px) 768px, 100vw"
          className="w-full rounded-xl border object-cover"
        />
      ) : null}
      <div className="flex flex-wrap gap-3">
        {p.liveUrl ? (
          <Button asChild>
            <a href={p.liveUrl} target="_blank" rel="noopener noreferrer">
              {t('live')} <ExternalLink aria-hidden />
            </a>
          </Button>
        ) : null}
        {p.repoUrl ? (
          <Button asChild variant="outline">
            <a href={p.repoUrl} target="_blank" rel="noopener noreferrer">
              {t('repo')} <ExternalLink aria-hidden />
            </a>
          </Button>
        ) : null}
      </div>
      <Paragraphs items={p.description} />
      {p.goals.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-medium">{tp('goals')}</h2>
          <Paragraphs items={p.goals} />
        </section>
      ) : null}
      {p.tags.length > 0 || p.skills.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-medium">{tp('stack')}</h2>
          <ul className="flex flex-wrap gap-1.5">
            {p.tags.map((tag) => (
              <li key={tag.slug}>
                <Badge variant="secondary">{tag.name}</Badge>
              </li>
            ))}
            {p.skills.map((s) => (
              <li key={s.slug}>
                <Badge variant="outline">{s.name}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {p.images.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-medium">{tp('gallery')}</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {p.images.map((img, index) => (
              <li key={img.id}>
                <Image
                  src={mediaUrl(img.key)}
                  alt={tp('galleryImageAlt', { title: p.title, index: index + 1 })}
                  width={800}
                  height={500}
                  loading="lazy"
                  sizes="(min-width: 640px) 380px, 100vw"
                  className="w-full rounded-lg border object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </DetailShell>
  )
}
