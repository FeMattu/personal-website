import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import type { CertificationView, SiteView, SpokenLanguageView } from '@/lib/content/types'

type Props = {
  site: SiteView
  languages: SpokenLanguageView[]
  certifications: CertificationView[]
}

export async function About({ site, languages, certifications }: Props) {
  const t = await getTranslations('sections')
  const tl = await getTranslations('languages.proficiency')
  if (site.bio.length === 0 && languages.length === 0 && certifications.length === 0) return null

  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-20 py-10 sm:py-14">
      <div className="grid gap-10 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <h2 id="about-title" className="text-2xl font-semibold tracking-tight">
            {t('about.title')}
          </h2>
          {site.bio.map((p) => (
            <p key={p} className="leading-relaxed text-pretty text-muted-foreground">
              {p}
            </p>
          ))}
          {site.interests ? (
            <p className="text-sm">
              <span className="font-medium">{t('interests.title')}: </span>
              <span className="text-muted-foreground">{site.interests}</span>
            </p>
          ) : null}
        </div>

        <div className="space-y-8">
          {languages.length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-medium">{t('languages.title')}</h3>
              <ul className="space-y-2 text-sm">
                {languages.map((l) => (
                  <li key={l.code} className="flex items-baseline justify-between gap-3">
                    <span lang={l.code}>{l.name}</span>
                    <span className="text-muted-foreground">
                      {tl(l.proficiency)}
                      {l.detail ? ` · ${l.detail}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {certifications.length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-medium">{t('certifications.title')}</h3>
              <ul className="flex flex-wrap gap-2">
                {certifications.map((c) => (
                  <li key={c.id}>
                    <Badge variant="secondary" asChild>
                      <Link href={`/certifications/${c.slug}`}>{c.name}</Link>
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
