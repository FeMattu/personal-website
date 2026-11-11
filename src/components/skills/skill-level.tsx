import type { SkillLevel } from '@prisma/client'
import { cn } from '@/lib/utils'

export const LEVEL_VALUE: Record<SkillLevel, number> = {
  BASIC: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
}
export const LEVEL_MAX = 4

type Props = { level: SkillLevel | null; label: string; className?: string }

/** Level as dots (never percentages). Unrated skills render nothing. `label` is the accessible name. */
export function SkillLevelDots({ level, label, className }: Props) {
  if (!level) return null
  const filled = LEVEL_VALUE[level]
  return (
    <span
      role="img"
      aria-label={label}
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {Array.from({ length: LEVEL_MAX }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            'size-1.5 rounded-full',
            i < filled ? 'bg-primary' : 'bg-muted-foreground/30',
          )}
        />
      ))}
    </span>
  )
}
