import { Camera } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { SocialIcon } from '@/components/layout/social-icon'
import { getPhotoAlbums, getSocialLinks } from '@/lib/content'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sections' })
  return buildMetadata({
    locale,
    path: '/photos',
    title: t('photos.title'),
    description: t('photos.subtitle'),
  })
}

/**
 * Placeholder: the data layer (PhotoAlbum/Photo/PhotoVariant), storage abstraction and image loader are
 * ready; real albums, the grid (GRID_SIZES) and the lightbox plug in here once S3/CDN is configured.
 * Albums are listed only when published ones exist, so this page upgrades itself without code changes.
 */
export default async function PhotosPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('photos')
  const ts = await getTranslations('sections')
  const [albums, socials] = await Promise.all([getPhotoAlbums(locale), getSocialLinks()])
  const instagram = socials.find((s) => s.kind === 'INSTAGRAM')

  return (
    <section aria-labelledby="photos-title" className="py-12 sm:py-16">
      <h1 id="photos-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {ts('photos.title')}
      </h1>
      <p className="mt-2 mb-8 max-w-xl text-muted-foreground">{ts('photos.subtitle')}</p>

      {albums.length > 0 ? (
        <ul aria-label={t('albums')} className="mb-10 grid gap-4 sm:grid-cols-3">
          {albums.map((a) => (
            <li key={a.id} className="rounded-xl border bg-card p-5">
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-muted-foreground">
                {t('photoCount', { count: a.photoCount })}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card px-6 py-16 text-center">
        <Camera className="size-10 text-primary" aria-hidden />
        <h2 className="text-xl font-medium">{t('comingSoonTitle')}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t('comingSoonText')}</p>
        {instagram ? (
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <SocialIcon kind="INSTAGRAM" />
            Instagram
          </a>
        ) : null}
      </div>
    </section>
  )
}
