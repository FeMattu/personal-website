import { ArrowUp } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { SocialIcon } from '@/components/layout/social-icon'
import { Link } from '@/i18n/navigation'
import type { SocialView } from '@/lib/content/types'
import { NAV_ITEMS } from '@/lib/navigation'

type Props = { ownerName: string; socials: SocialView[] }

/** Minimal footer: wordmark + copyright, the same links as the navbar, socials, back to top. */
export async function SiteFooter({ ownerName, socials }: Props) {
  const t = await getTranslations()
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 text-sm sm:px-6 lg:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            FM
          </span>
          <div>
            <p className="font-semibold">{ownerName}</p>
            <p className="text-xs text-muted-foreground">
              {t('footer.rights', { year: new Date().getFullYear(), name: ownerName })}
            </p>
          </div>
        </div>

        <nav aria-label={t('footer.navigate')}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.kind === 'page' ? item.href : (`/#${item.key}` as '/')}
                  className="transition-colors hover:text-foreground"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <ul aria-label={t('footer.social')} className="flex items-center gap-1">
            {socials.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  aria-label={t(`social.${s.kind}`)}
                  target={s.url.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <SocialIcon kind={s.kind} />
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#main"
            aria-label={t('a11y.backToTop')}
            className="grid size-9 place-items-center rounded-full border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowUp className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  )
}
