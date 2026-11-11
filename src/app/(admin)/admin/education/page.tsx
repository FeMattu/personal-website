import { defaultLocale, locales } from '@/i18n/config'
import {
  deleteEducation,
  duplicateEducation,
  reorderEducation,
  setEducationStatus,
} from '@/actions/admin/education'
import { NewLink } from '@/components/admin/new-link'
import { PageHeader } from '@/components/admin/page-header'
import { ResourceList, type ResourceRow } from '@/components/admin/resource-list'
import { requireAdmin } from '@/lib/auth/session'
import { educationRepo } from '@/lib/db/repositories/admin-cv'
import { missingLocales } from '@/lib/i18n/localize'

export default async function EducationListPage() {
  await requireAdmin()
  const rows = await educationRepo.list()
  const items: ResourceRow[] = rows.map((row) => ({
    id: row.id,
    title: row.translations.find((t) => t.locale === defaultLocale)?.title || row.institution,
    subtitle: row.institution,
    status: row.status,
    missing: missingLocales(row.translations, locales, 'title'),
  }))

  return (
    <>
      <PageHeader
        title="Education"
        description="Drag to reorder. Drafts are hidden from the public site."
        action={<NewLink href="/admin/education/new" label="New education" />}
      />
      <ResourceList
        items={items}
        noun="education"
        editHref={(id) => `/admin/education/${id}`}
        actions={{
          reorder: reorderEducation,
          remove: deleteEducation,
          duplicate: duplicateEducation,
          setStatus: setEducationStatus,
        }}
      />
    </>
  )
}
