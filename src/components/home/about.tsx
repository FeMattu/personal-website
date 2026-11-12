import { ArrowRight, Download } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { SkillLevelDots } from '@/components/skills/skill-level'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type {
  CertificationView,
  SiteView,
  SkillCategoryView,
  SpokenLanguageView,
} from '@/lib/content/types'

type Props = {
  site: SiteView
  categories: SkillCategoryView[]
  languages: SpokenLanguageView[]
  certifications: CertificationView[]
}

/** "About me" and "My skills" side by side (skills as chips with level dots, never percentages). */
export async function AboutSkills({ site, categories, languages, certifications }: Props) {
  const t = await getTranslations('sections')
  const ts = await getTranslations('skills')
  const tl = await getTranslations('languages.proficiency')
  const ta = await getTranslations('about')
  const hasSkills = categories.some((c) => c.skills.length > 0)
  if (site.bio.length === 0 && !hasSkills) return null

  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-24 py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-5">
          <h2 id="about-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
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

          {languages.length > 0 ? (
            <ul className="flex flex-wrap gap-2 text-sm">
              {languages.map((l) => (
                <li key={l.code}>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-sm font-normal">
                    <span lang={l.code}>{l.name}</span>
                    <span className="text-muted-foreground">
                      {' · '}
                      {tl(l.proficiency)}
                      {l.detail ? ` (${l.detail})` : ''}
                    </span>
                  </Badge>
                </li>
              ))}
              {certifications.map((c) => (
                <li key={c.id}>
                  <Badge
                    variant="secondary"
                    asChild
                    className="rounded-full px-3 py-1 text-sm font-normal"
                  >
                    <Link href={`/certifications/${c.slug}`}>{c.name}</Link>
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}

          {site.cvPath ? (
            <Button asChild variant="outline" className="rounded-full">
              <a href={site.cvPath} download>
                {ta('viewMore')}
                <Download aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>

        {hasSkills ? (
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('skills.title')}
              </h2>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/skills">
                  {ts('viewAll')}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
            <div id="skills" className="scroll-mt-24 space-y-5">
              {categories
                .filter((c) => c.skills.length > 0)
                .map((c) => (
                  <div key={c.id}>
                    <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {c.name}
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {c.skills.map((s) => (
                        <li
                          key={s.id}
                          className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm"
                        >
                          {s.name}
                          <SkillLevelDots
                            level={s.level}
                            label={s.level ? `${ts('level')}: ${ts(`levels.${s.level}`)}` : ''}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              <p className="text-xs text-muted-foreground">{ts('legend')}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
