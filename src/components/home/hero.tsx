import { Download, MapPin } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import type { SiteView } from '@/lib/content/types'
import { mediaUrl } from '@/lib/media'
import { Link } from '@/i18n/navigation'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export async function Hero({ site }: { site: SiteView }) {
  const t = await getTranslations('hero')
  return (
    <section aria-labelledby="hero-title" className="reveal pt-16 pb-10 sm:pt-24 sm:pb-14">
      <div className="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm text-muted-foreground">{t('greeting')}</p>
          <h1
            id="hero-title"
            className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
          >
            {site.ownerName}
          </h1>
          <p className="mt-4 text-lg font-medium text-balance text-primary sm:text-xl">
            {site.role}
          </p>
          {site.tagline ? (
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{site.tagline}</p>
          ) : null}
          {site.location ? (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden />
              {site.location}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/#contact">{t('ctaContact')}</Link>
            </Button>
            {site.cvPath ? (
              <Button asChild size="lg" variant="outline">
                <a href={site.cvPath} download>
                  <Download aria-hidden />
                  {t('ctaCv')}
                </a>
              </Button>
            ) : null}
            <Button asChild size="lg" variant="ghost">
              <Link href="/#projects">{t('ctaPortfolio')}</Link>
            </Button>
          </div>
        </div>

        {site.avatarKey ? (
          <Image
            src={mediaUrl(site.avatarKey)}
            alt={t('avatarAlt', { name: site.ownerName })}
            width={160}
            height={160}
            priority
            className="size-28 rounded-full border object-cover sm:size-40"
          />
        ) : (
          <div
            aria-hidden
            className="grid size-28 shrink-0 place-items-center rounded-full border bg-secondary text-3xl font-semibold text-muted-foreground sm:size-40 sm:text-5xl"
          >
            {initials(site.ownerName)}
          </div>
        )}
      </div>
    </section>
  )
}
