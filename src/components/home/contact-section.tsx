import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ContactForm } from '@/components/home/contact-form'
import { SocialIcon } from '@/components/layout/social-icon'
import { Button } from '@/components/ui/button'
import type { SiteView, SocialView } from '@/lib/content/types'

type Props = { socials: SocialView[]; site: SiteView | null }

/** "Let's work together" strip (email / phone / place + CTA), then socials and the contact form. */
export async function ContactBlock({ socials, site }: Props) {
  const t = await getTranslations('contact')
  const ts = await getTranslations('social')
  const email = site?.email ?? socials.find((s) => s.kind === 'EMAIL')?.url.replace('mailto:', '')
  const phone = site?.phone
  const details = [
    email ? { icon: Mail, label: t('emailLabel'), value: email, href: `mailto:${email}` } : null,
    phone
      ? {
          icon: Phone,
          label: t('phoneLabel'),
          value: phone,
          href: `tel:${phone.replace(/\s/g, '')}`,
        }
      : null,
    site?.location
      ? { icon: MapPin, label: t('locationLabel'), value: site.location, href: null }
      : null,
  ].filter((d): d is NonNullable<typeof d> => d !== null)

  return (
    <div className="space-y-10">
      <div className="grid items-center gap-6 rounded-2xl border bg-card p-6 sm:p-8 lg:grid-cols-[1.1fr_1.6fr_auto]">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <Send className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-semibold">{t('ctaTitle')}</h3>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">{t('ctaText')}</p>
          </div>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          {details.map(({ icon: Icon, label, value, href }) => (
            <div key={label}>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Icon className="size-3.5" aria-hidden />
                {label}
              </dt>
              <dd className="mt-1 break-words">
                {href ? (
                  <a href={href} className="underline-offset-4 hover:text-primary hover:underline">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
        {email ? (
          <Button asChild size="lg" className="rounded-full">
            <a href={`mailto:${email}`}>
              {t('ctaButton')}
              <Send aria-hidden />
            </a>
          </Button>
        ) : null}
      </div>

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
    </div>
  )
}
