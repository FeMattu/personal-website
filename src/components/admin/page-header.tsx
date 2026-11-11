import type { ReactNode } from 'react'

type Props = { title: string; description?: string; action?: ReactNode }

/** Page title (the only `<h1>`) with an optional description and primary action. */
export function PageHeader({ title, description, action }: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </header>
  )
}
