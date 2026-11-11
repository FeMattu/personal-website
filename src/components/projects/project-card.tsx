import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import type { ProjectView } from '@/lib/content/types'
import { mediaUrl } from '@/lib/media'

/** Website card: cover, title, description, tech tags, live/repo links. The whole card opens the detail page. */
export async function ProjectCard({ project }: { project: ProjectView }) {
  const t = await getTranslations('projects')
  const tc = await getTranslations('common')
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40">
      <div className="relative aspect-[16/10] overflow-hidden border-b bg-muted">
        {project.coverKey ? (
          <Image
            src={mediaUrl(project.coverKey)}
            alt={t('coverAlt', { title: project.title })}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            {t('noCover')}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-medium">
          <Link
            href={`/projects/${project.slug}` as '/'}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {project.title}
          </Link>
        </h3>
        {project.summary ? (
          <p className="line-clamp-3 text-sm text-pretty text-muted-foreground">
            {project.summary}
          </p>
        ) : null}
        {project.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <li key={tag.slug}>
                <Badge variant="secondary">{tag.name}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
        {project.liveUrl || project.repoUrl ? (
          <div className="relative z-10 mt-auto flex gap-4 pt-2 text-sm">
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {tc('live')}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : null}
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
              >
                {tc('repo')}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}
