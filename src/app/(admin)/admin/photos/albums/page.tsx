import Link from 'next/link'
import { AlbumsManager } from '@/components/admin/albums-manager'
import { PageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { defaultLocale, locales } from '@/i18n/config'
import { albumToForm, blankAlbum } from '@/lib/admin/form-values'
import { requireAdmin } from '@/lib/auth/session'
import { albumRepo } from '@/lib/db/repositories/admin-photos'
import { missingLocales } from '@/lib/i18n/localize'

export default async function AlbumsPage() {
  await requireAdmin()
  const rows = await albumRepo.list()
  const items = rows.map((row) => ({
    id: row.id,
    title: row.translations.find((t) => t.locale === defaultLocale)?.title || row.slug,
    subtitle: `${row._count.photos} photo${row._count.photos === 1 ? '' : 's'}`,
    status: row.status,
    missing: missingLocales(row.translations, locales, 'title'),
    form: albumToForm(row),
  }))
  return (
    <>
      <PageHeader
        title="Photo albums"
        description="Drag to reorder. Deleting an album keeps its photos."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/photos">Back to photos</Link>
          </Button>
        }
      />
      <AlbumsManager items={items} blank={blankAlbum()} />
    </>
  )
}
