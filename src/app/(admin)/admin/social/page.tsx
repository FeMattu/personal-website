import { PageHeader } from '@/components/admin/page-header'
import { SocialManager } from '@/components/admin/social-manager'
import { blankSocial, socialToForm } from '@/lib/admin/form-values'
import { requireAdmin } from '@/lib/auth/session'
import { socialRepo } from '@/lib/db/repositories/admin-misc'

export default async function SocialPage() {
  await requireAdmin()
  const rows = await socialRepo.list()
  const items = rows.map((row) => ({
    id: row.id,
    title: row.label || row.kind.charAt(0) + row.kind.slice(1).toLowerCase(),
    subtitle: row.url,
    status: row.status,
    missing: [],
    form: socialToForm(row),
  }))
  return (
    <>
      <PageHeader title="Social links" description="Drag to reorder. Drafts are hidden." />
      <SocialManager items={items} blank={blankSocial()} />
    </>
  )
}
