import { notFound } from 'next/navigation'
import { CertificationForm } from '@/components/admin/certification-form'
import { PageHeader } from '@/components/admin/page-header'
import { blankCertification, certificationToForm } from '@/lib/admin/form-values'
import { requireAdmin } from '@/lib/auth/session'
import { certificationRepo } from '@/lib/db/repositories/admin-cv'

export default async function EditCertificationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  if (id === 'new') {
    return (
      <>
        <PageHeader title="New certification" />
        <CertificationForm id={null} initial={blankCertification()} />
      </>
    )
  }
  const row = await certificationRepo.get(id)
  if (!row) notFound()
  return (
    <>
      <PageHeader title="Edit certification" />
      <CertificationForm id={row.id} initial={certificationToForm(row)} />
    </>
  )
}
