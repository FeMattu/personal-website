import { defaultLocale, locales } from '@/i18n/config'
import {
  deleteExperience,
  duplicateExperience,
  reorderExperience,
  setExperienceStatus,
} from '@/actions/admin/experience'
import { NewLink } from '@/components/admin/new-link'
import { PageHeader } from '@/components/admin/page-header'
import { ResourceList, type ResourceRow } from '@/components/admin/resource-list'
import { requireAdmin } from '@/lib/auth/session'
import { experienceRepo } from '@/lib/db/repositories/admin-cv'
import { missingLocales } from '@/lib/i18n/localize'

export default async function ExperienceListPage() {
  await requireAdmin()
  const rows = await experienceRepo.list()
  const items: ResourceRow[] = rows.map((row) => ({
    id: row.id,
    title: row.translations.find((t) => t.locale === defaultLocale)?.role || row.organization,
    subtitle: row.organization,
    status: row.status,
    missing: missingLocales(row.translations, locales, 'role'),
  }))

  return (
    <>
      <PageHeader
        title="Experience"
        description="Drag to reorder. Drafts are hidden from the public site."
        action={<NewLink href="/admin/experience/new" label="New experience" />}
      />
      <ResourceList
        items={items}
        noun="experience"
        editHref={(id) => `/admin/experience/${id}`}
        actions={{
          reorder: reorderExperience,
          remove: deleteExperience,
          duplicate: duplicateExperience,
          setStatus: setExperienceStatus,
        }}
      />
    </>
  )
}
