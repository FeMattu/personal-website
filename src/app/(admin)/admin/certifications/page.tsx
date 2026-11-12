import { defaultLocale, locales } from '@/i18n/config'
import {
  deleteCertification,
  duplicateCertification,
  reorderCertification,
  setCertificationStatus,
} from '@/actions/admin/certifications'
import { NewLink } from '@/components/admin/new-link'
import { PageHeader } from '@/components/admin/page-header'
import { ResourceList, type ResourceRow } from '@/components/admin/resource-list'
import { requireAdmin } from '@/lib/auth/session'
import { certificationRepo } from '@/lib/db/repositories/admin-cv'
import { missingLocales } from '@/lib/i18n/localize'

export default async function CertificationListPage() {
  await requireAdmin()
  const rows = await certificationRepo.list()
  const items: ResourceRow[] = rows.map((row) => ({
    id: row.id,
    title: row.translations.find((t) => t.locale === defaultLocale)?.name || row.slug,
    subtitle: row.issuer ?? undefined,
    status: row.status,
    missing: missingLocales(row.translations, locales, 'name'),
  }))

  return (
    <>
      <PageHeader
        title="Certifications"
        description="Drag to reorder. Drafts are hidden from the public site."
        action={<NewLink href="/admin/certifications/new" label="New certification" />}
      />
      <ResourceList
        items={items}
        noun="certifications"
        editBase="/admin/certifications"
        actions={{
          reorder: reorderCertification,
          remove: deleteCertification,
          duplicate: duplicateCertification,
          setStatus: setCertificationStatus,
        }}
      />
    </>
  )
}
