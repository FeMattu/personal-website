import { ArrowRight, Camera } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AboutSkills } from '@/components/home/about'
import { ContactBlock } from '@/components/home/contact-section'
import { Hero } from '@/components/home/hero'
import { Section } from '@/components/home/section'
import { StatsBar } from '@/components/home/stats-bar'
import { Timeline } from '@/components/home/timeline'
import { ProjectCard } from '@/components/projects/project-card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import {
  getCertifications,
  getEducations,
  getExperiences,
  getProjects,
  getSite,
  getSkillCategories,
  getSocialLinks,
  getSpokenLanguages,
} from '@/lib/content'
import { yearsSince } from '@/lib/dates'

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('sections')
  const tn = await getTranslations('nav')
  const tp = await getTranslations('photos')
  const tpr = await getTranslations('projects')

  const [site, experiences, educations, categories, projects, socials, languages, certifications] =
    await Promise.all([
      getSite(locale),
      getExperiences(locale),
      getEducations(locale),
      getSkillCategories(locale),
      getProjects(locale),
      getSocialLinks(),
      getSpokenLanguages(locale),
      getCertifications(locale),
    ])

  const featured = projects.filter((p) => p.featured)
  const shownProjects = (featured.length > 0 ? featured : projects).slice(0, 3)

  // Real numbers only: derived from the published content.
  const earliest = experiences.map((e) => e.startDate).sort()[0]
  const stats = {
    years: earliest ? yearsSince(earliest) : 0,
    experiences: experiences.length,
    projects: projects.length,
    technologies: categories.reduce((sum, c) => sum + c.skills.length, 0),
  }

  return (
    <>
      {site ? <Hero site={site} socials={socials} stats={stats} /> : null}
      <StatsBar stats={stats} />
      {site ? (
        <AboutSkills
          site={site}
          categories={categories}
          languages={languages}
          certifications={certifications}
        />
      ) : null}

      <div className="grid gap-x-14 lg:grid-cols-2">
        <Section id="experience" title={t('experience.title')} subtitle={t('experience.subtitle')}>
          <Timeline
            entries={experiences.map((e) => ({
              id: e.id,
              href: `/experience/${e.slug}`,
              title: e.role,
              subtitle: e.organization,
              location: e.location,
              start: e.startDate,
              end: e.endDate,
              summary: e.summary,
              tags: e.tags,
            }))}
          />
        </Section>

        <Section id="education" title={t('education.title')} subtitle={t('education.subtitle')}>
          <Timeline
            entries={educations.map((e) => ({
              id: e.id,
              href: `/education/${e.slug}`,
              title: e.title,
              subtitle: e.institution,
              location: e.location,
              start: e.startDate,
              end: e.endDate,
              summary: e.summary,
            }))}
          />
        </Section>
      </div>

      <Section
        id="projects"
        title={t('projects.title')}
        subtitle={t('projects.subtitle')}
        action={
          projects.length > 0 ? (
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/projects">
                {tn('projects')}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : undefined
        }
      >
        {shownProjects.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shownProjects.map((p) => (
              <li key={p.id}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{tpr('empty')}</p>
        )}
      </Section>

      <Section id="photos" title={t('photos.title')} subtitle={t('photos.subtitle')}>
        <div className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <Camera className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium">{tp('comingSoonTitle')}</p>
            <p className="text-sm text-muted-foreground">{tp('comingSoonText')}</p>
          </div>
          <Button asChild variant="outline" className="rounded-full sm:ml-auto">
            <Link href="/photos">{tn('photos')}</Link>
          </Button>
        </div>
      </Section>

      <Section id="contact" title={t('contact.title')} subtitle={t('contact.subtitle')}>
        <ContactBlock socials={socials} site={site} />
      </Section>
    </>
  )
}
