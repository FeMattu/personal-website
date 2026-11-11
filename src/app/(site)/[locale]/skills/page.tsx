import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { SkillsExplorer } from '@/components/skills/skills-explorer'
import { getSkillCategories } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sections' })
  return buildMetadata({
    locale,
    path: '/skills',
    title: t('skills.title'),
    description: t('skills.subtitle'),
  })
}

export default async function SkillsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('sections')
  const categories = await getSkillCategories(locale)
  return (
    <section aria-labelledby="skills-title" className="py-12 sm:py-16">
      <h1 id="skills-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('skills.title')}
      </h1>
      <p className="mt-2 mb-8 max-w-xl text-muted-foreground">{t('skills.subtitle')}</p>
      <SkillsExplorer categories={categories} />
    </section>
  )
}
