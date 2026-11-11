import { getTranslations } from 'next-intl/server'
import { ContactForm } from '@/components/home/contact-form'
import { SocialIcon } from '@/components/layout/social-icon'
import type { SocialView } from '@/lib/content/types'

/** Compact clickable contact cards + the contact form. */
export async function ContactBlock({ socials }: { socials: SocialView[] }) {
  const t = await getTranslations('contact')
  const ts = await getTranslations('social')
  return (
    <div className="grid gap-10 md:grid-cols-5">
      <div className="md:col-span-2">
        <h3 className="mb-4 text-sm font-medium">{t('orReach')}</h3>
        <ul className="grid gap-2">
          {socials.map((s) => (
            <li key={s.id}>
              <a
                href={s.url}
                target={s.url.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/40"
              >
                <SocialIcon kind={s.kind} className="size-5 text-primary" />
                <span className="font-medium">{ts(s.kind)}</span>
                <span className="ml-auto truncate text-muted-foreground">
                  {s.kind === 'PHONE' || s.kind === 'EMAIL' ? s.label : ''}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-3">
        <h3 className="mb-4 text-sm font-medium">{t('title')}</h3>
        <ContactForm />
      </div>
    </div>
  )
}
