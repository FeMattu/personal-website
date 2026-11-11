import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** Home/page section: anchor id (scroll-spy target), heading, optional subtitle + action link. */
export function Section({ id, title, subtitle, action, children, className }: Props) {
  const headingId = `${id}-title`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('scroll-mt-20 py-14 sm:py-20', className)}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {subtitle ? <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
