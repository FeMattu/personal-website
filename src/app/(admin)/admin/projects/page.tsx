import { defaultLocale, locales } from '@/i18n/config'
import {
  deleteProject,
  duplicateProject,
  reorderProject,
  setProjectStatus,
} from '@/actions/admin/projects'
import { NewLink } from '@/components/admin/new-link'
import { PageHeader } from '@/components/admin/page-header'
import { ResourceList, type ResourceRow } from '@/components/admin/resource-list'
import { requireAdmin } from '@/lib/auth/session'
import { projectRepo } from '@/lib/db/repositories/admin-projects'
import { missingLocales } from '@/lib/i18n/localize'

export default async function ProjectListPage() {
  await requireAdmin()
  const rows = await projectRepo.list()
  const items: ResourceRow[] = rows.map((row) => ({
    id: row.id,
    title: row.translations.find((t) => t.locale === defaultLocale)?.title || row.slug,
    subtitle: `/${row.slug}`,
    status: row.status,
    missing: missingLocales(row.translations, locales, 'title'),
  }))

  return (
    <>
      <PageHeader
        title="Projects"
        description="Drag to reorder. Drafts are hidden from the public site."
        action={<NewLink href="/admin/projects/new" label="New project" />}
      />
      <ResourceList
        items={items}
        noun="projects"
        editHref={(id) => `/admin/projects/${id}`}
        actions={{
          reorder: reorderProject,
          remove: deleteProject,
          duplicate: duplicateProject,
          setStatus: setProjectStatus,
        }}
      />
    </>
  )
}
