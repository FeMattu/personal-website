import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { PhotosManager, type PhotoRow } from '@/components/admin/photos-manager'
import { Button } from '@/components/ui/button'
import { defaultLocale, locales } from '@/i18n/config'
import { photoToForm } from '@/lib/admin/form-values'
import { translationRows } from '@/lib/admin/mappers'
import { requireAdmin } from '@/lib/auth/session'
import { albumRepo, photoRepo } from '@/lib/db/repositories/admin-photos'
import { missingLocales } from '@/lib/i18n/localize'

export default async function PhotosPage() {
  await requireAdmin()
  const [photoRows, albumRows] = await Promise.all([photoRepo.list(), albumRepo.list()])
  const albums = albumRows.map((a) => ({
    id: a.id,
    title: a.translations.find((t) => t.locale === defaultLocale)?.title || a.slug,
  }))

  const photos: PhotoRow[] = photoRows.map((row) => {
    const thumb = row.variants.find((v) => v.format === 'WEBP') ?? row.variants[0]
    const form = photoToForm(row)
    return {
      id: row.id,
      title:
        row.translations.find((t) => t.locale === defaultLocale)?.title ||
        `Photo ${row.id.slice(-6)}`,
      thumbKey: thumb?.storageKey ?? row.originalKey,
      width: row.width,
      height: row.height,
      status: row.status,
      featured: row.featured,
      albumTitle: albums.find((a) => a.id === row.albumId)?.title ?? null,
      missing: missingLocales(translationRows(form.translations), locales, 'alt'),
      form,
    }
  })

  return (
    <>
      <PageHeader
        title="Photos"
        description="Upload, describe and publish photos. Files go to the configured storage."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/photos/albums">Manage albums</Link>
          </Button>
        }
      />
      <PhotosManager photos={photos} albums={albums} />
    </>
  )
}
