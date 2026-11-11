import { Camera } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { About } from '@/components/home/about'
import { ContactBlock } from '@/components/home/contact-section'
import { Hero } from '@/components/home/hero'
import { Section } from '@/components/home/section'
import { Timeline } from '@/components/home/timeline'
import { ProjectCard } from '@/components/projects/project-card'
import { SkillsExplorer } from '@/components/skills/skills-explorer'
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

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('sections')
  const tn = await getTranslations('nav')
  const tp = await getTranslations('photos')

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

  return (
    <>
      {site ? <Hero site={site} /> : null}
      {site ? <About site={site} languages={languages} certifications={certifications} /> : null}

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

      <Section id="skills" title={t('skills.title')} subtitle={t('skills.subtitle')}>
        <SkillsExplorer categories={categories} />
      </Section>

      <Section
        id="projects"
        title={t('projects.title')}
        subtitle={t('projects.subtitle')}
        action={
          projects.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects">{tn('projects')} →</Link>
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
          <p className="text-muted-foreground">—</p>
        )}
      </Section>

      <Section id="photos" title={t('photos.title')} subtitle={t('photos.subtitle')}>
        <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center">
          <Camera className="size-8 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-medium">{tp('comingSoonTitle')}</p>
            <p className="text-sm text-muted-foreground">{tp('comingSoonText')}</p>
          </div>
          <Button asChild variant="outline" className="sm:ml-auto">
            <Link href="/photos">{tn('photos')}</Link>
          </Button>
        </div>
      </Section>

      <Section id="contact" title={t('contact.title')} subtitle={t('contact.subtitle')}>
        <ContactBlock socials={socials} />
      </Section>
    </>
  )
}
