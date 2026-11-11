'use client'

import { useTranslations } from 'next-intl'
import { SkillLevelDots } from '@/components/skills/skill-level'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Link } from '@/i18n/navigation'
import type { SkillCategoryView, SkillView } from '@/lib/content/types'
import { cn } from '@/lib/utils'

const ALL = 'all'

function SkillChip({ skill }: { skill: SkillView }) {
  const t = useTranslations('skills')
  const levelLabel = skill.level ? `${t('level')}: ${t(`levels.${skill.level}`)}` : t('unrated')
  const first = skill.projects[0]
  const chipClass = cn(
    'inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm',
    first && 'transition-colors hover:border-primary/50',
  )
  const content = (
    <>
      <span>{skill.name}</span>
      <SkillLevelDots level={skill.level} label={levelLabel} />
    </>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {first ? (
          <Link href={`/projects/${first.slug}` as '/'} className={chipClass}>
            {content}
          </Link>
        ) : (
          <span tabIndex={0} className={cn(chipClass, 'cursor-default')}>
            {content}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="font-medium">{skill.name}</p>
        <p className="opacity-80">{levelLabel}</p>
        {skill.description ? <p className="mt-1">{skill.description}</p> : null}
        {skill.projects.length > 0 ? (
          <p className="mt-1">
            {t('relatedProjects')}: {skill.projects.map((p) => p.title).join(', ')}
          </p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  )
}

function SkillList({ skills }: { skills: SkillView[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <li key={s.id}>
          <SkillChip skill={s} />
        </li>
      ))}
    </ul>
  )
}

/** Skills grouped by category with Tabs (All + one per category) and level dots. */
export function SkillsExplorer({ categories }: { categories: SkillCategoryView[] }) {
  const t = useTranslations('skills')
  if (categories.every((c) => c.skills.length === 0)) {
    return <p className="text-muted-foreground">{t('empty')}</p>
  }
  return (
    <Tabs defaultValue={ALL} className="gap-6">
      <TabsList className="h-auto flex-wrap justify-start">
        <TabsTrigger value={ALL}>{t('all')}</TabsTrigger>
        {categories.map((c) => (
          <TabsTrigger key={c.id} value={c.slug}>
            {c.name}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={ALL} className="space-y-6">
        {categories.map((c) => (
          <div key={c.id}>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">{c.name}</h3>
            <SkillList skills={c.skills} />
          </div>
        ))}
      </TabsContent>
      {categories.map((c) => (
        <TabsContent key={c.id} value={c.slug}>
          <SkillList skills={c.skills} />
        </TabsContent>
      ))}
      <p className="text-xs text-muted-foreground">{t('legend')}</p>
    </Tabs>
  )
}
