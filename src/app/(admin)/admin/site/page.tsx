import { PageHeader } from '@/components/admin/page-header'
import { SiteForm } from '@/components/admin/site-form'
import { siteToForm } from '@/lib/admin/form-values'
import { requireAdmin } from '@/lib/auth/session'
import { siteRepo } from '@/lib/db/repositories/admin-misc'

export default async function SiteSettingsPage() {
  await requireAdmin()
  const row = await siteRepo.get()
  return (
    <>
      <PageHeader
        title="Site settings"
        description="Identity, contact details and the per-language hero and SEO texts."
      />
      <SiteForm initial={siteToForm(row)} avatarKey={row?.avatarKey ?? null} />
    </>
  )
}
