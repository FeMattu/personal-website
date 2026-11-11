import { getTranslations } from 'next-intl/server'
import { SocialIcon } from '@/components/layout/social-icon'
import type { SocialView } from '@/lib/content/types'

type Props = { ownerName: string; socials: SocialView[] }

export async function SiteFooter({ ownerName, socials }: Props) {
  const t = await getTranslations()
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6">
        <p className="text-muted-foreground">
          {t('footer.rights', { year: new Date().getFullYear(), name: ownerName })}
        </p>
        <ul className="flex items-center gap-1">
          {socials.map((s) => (
            <li key={s.id}>
              <a
                href={s.url}
                aria-label={`${t(`social.${s.kind}`)}`}
                target={s.url.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <SocialIcon kind={s.kind} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
