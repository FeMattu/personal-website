import { ArrowRight, Hand } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { SocialIcon } from '@/components/layout/social-icon'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { SiteView, SocialView } from '@/lib/content/types'
import { mediaUrl } from '@/lib/media'

export type HeroStats = { years: number; projects: number }

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Splits "Federico Mattucci" into a plain head and an accented last word. */
function splitName(name: string): { head: string; tail: string } {
  const parts = name.trim().split(/\s+/)
  return { head: parts.slice(0, -1).join(' '), tail: parts.at(-1) ?? name }
}

function FloatingStat({
  value,
  label,
  className,
}: {
  value: string
  label: string
  className: string
}) {
  return (
    <div
      className={`absolute rounded-2xl border bg-card/80 px-4 py-3 shadow-sm backdrop-blur ${className}`}
    >
      <p className="text-2xl font-semibold text-primary tabular-nums">{value}</p>
      <p className="max-w-24 text-xs leading-tight text-muted-foreground">{label}</p>
    </div>
  )
}

type Props = { site: SiteView; socials: SocialView[]; stats: HeroStats }

export async function Hero({ site, socials, stats }: Props) {
  const t = await getTranslations('hero')
  const { head, tail } = splitName(site.ownerName)
  const intro = site.tagline ?? site.bio[0]?.split(/(?<=[.!?])\s/)[0] ?? null
  const networks = socials.filter((s) => ['GITHUB', 'LINKEDIN', 'INSTAGRAM'].includes(s.kind))

  return (
    <section
      aria-labelledby="hero-title"
      className="hero-glow reveal pt-14 pb-10 sm:pt-20 sm:pb-14"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-muted-foreground">
            <Hand className="size-4 text-primary" aria-hidden />
            {t('greeting')}
          </p>
          <h1
            id="hero-title"
            className="mt-6 text-5xl leading-[0.92] font-semibold tracking-tighter uppercase sm:text-7xl lg:text-8xl"
          >
            {head ? <span className="block">{head}</span> : null}
            <span className="block text-primary">{tail}</span>
          </h1>
          <p className="mt-6 text-xl font-medium text-balance sm:text-2xl">{site.role}</p>
          {intro ? (
            <p className="mt-3 max-w-md text-pretty text-muted-foreground">{intro}</p>
          ) : null}
          {site.location ? (
            <p className="mt-2 text-sm text-muted-foreground">{site.location}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/#contact">
                {t('ctaContact')}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/#projects">{t('ctaPortfolio')}</Link>
            </Button>
          </div>

          {networks.length > 0 ? (
            <div className="mt-8 flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{t('followMe')}</span>
              <ul className="flex gap-1">
                {networks.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <SocialIcon kind={s.kind} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-sm lg:max-w-md">
          <div aria-hidden className="absolute inset-[6%] rounded-full bg-primary/90" />
          {site.avatarKey ? (
            <Image
              src={mediaUrl(site.avatarKey)}
              alt={t('avatarAlt', { name: site.ownerName })}
              width={480}
              height={480}
              priority
              className="absolute inset-[6%] size-[88%] rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-[6%] grid place-items-center rounded-full text-7xl font-semibold tracking-tighter text-primary-foreground"
            >
              {initials(site.ownerName)}
            </div>
          )}
          {stats.years > 0 ? (
            <FloatingStat
              value={`${stats.years}+`}
              label={t('stats.years')}
              className="top-[12%] left-0"
            />
          ) : null}
          {stats.projects > 0 ? (
            <FloatingStat
              value={String(stats.projects)}
              label={t('stats.projects')}
              className="right-0 bottom-[10%]"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}
