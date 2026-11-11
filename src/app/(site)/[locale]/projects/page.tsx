import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectsExplorer } from '@/components/projects/projects-explorer'
import { getProjects } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sections' })
  return buildMetadata({
    locale,
    path: '/projects',
    title: t('projects.title'),
    description: t('projects.subtitle'),
  })
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('sections')
  const projects = await getProjects(locale)

  const tags = [
    ...new Map(projects.flatMap((p) => p.tags).map((tag) => [tag.slug, tag])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name))
  const items = projects.map((p) => ({
    slug: p.slug,
    tags: p.tags.map((tag) => tag.slug),
    node: <ProjectCard project={p} />,
  }))

  return (
    <section aria-labelledby="projects-title" className="py-12 sm:py-16">
      <h1 id="projects-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('projects.title')}
      </h1>
      <p className="mt-2 mb-8 max-w-xl text-muted-foreground">{t('projects.subtitle')}</p>
      <ProjectsExplorer items={items} tags={tags} />
    </section>
  )
}
