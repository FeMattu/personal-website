import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ContactBlock } from '@/components/home/contact-section'
import { getSite, getSocialLinks } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sections' })
  return buildMetadata({
    locale,
    path: '/contact',
    title: t('contact.title'),
    description: t('contact.subtitle'),
  })
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('sections')
  const [socials, site] = await Promise.all([getSocialLinks(), getSite(locale)])
  return (
    <section aria-labelledby="contact-title" className="py-12 sm:py-16">
      <h1 id="contact-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('contact.title')}
      </h1>
      <p className="mt-2 mb-8 max-w-xl text-muted-foreground">{t('contact.subtitle')}</p>
      <ContactBlock socials={socials} site={site} />
    </section>
  )
}
