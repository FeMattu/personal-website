import { Briefcase, Code2, FolderKanban, GraduationCap, type LucideIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export type StatsData = {
  years: number
  experiences: number
  projects: number
  technologies: number
}

/** Four real numbers computed from the database (never invented); zero values are hidden. */
export async function StatsBar({ stats }: { stats: StatsData }) {
  const t = await getTranslations('hero')
  const items: { key: keyof StatsData; icon: LucideIcon; suffix: string }[] = [
    { key: 'years', icon: GraduationCap, suffix: '+' },
    { key: 'experiences', icon: Briefcase, suffix: '' },
    { key: 'projects', icon: FolderKanban, suffix: '' },
    { key: 'technologies', icon: Code2, suffix: '' },
  ]
  const visible = items.filter((i) => stats[i.key] > 0)
  if (visible.length === 0) return null

  return (
    <section aria-label={t('statsLabel')} className="py-2">
      <dl className="grid grid-cols-2 divide-x divide-y rounded-2xl border bg-card sm:grid-cols-4 sm:divide-y-0">
        {visible.map(({ key, icon: Icon, suffix }) => (
          <div key={key} className="flex items-center gap-3 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <dd className="text-2xl font-semibold tabular-nums">
                {stats[key]}
                {suffix}
              </dd>
              <dt className="text-xs text-muted-foreground">{t(`stats.${key}`)}</dt>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
