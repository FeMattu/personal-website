import { notFound } from 'next/navigation'
import { EducationForm } from '@/components/admin/education-form'
import { PageHeader } from '@/components/admin/page-header'
import { blankEducation, educationToForm } from '@/lib/admin/form-values'
import { requireAdmin } from '@/lib/auth/session'
import { educationRepo } from '@/lib/db/repositories/admin-cv'

export default async function EditEducationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (id === 'new') {
    return (
      <>
        <PageHeader title="New education" />
        <EducationForm id={null} initial={blankEducation()} />
      </>
    )
  }
  const row = await educationRepo.get(id)
  if (!row) notFound()
  return (
    <>
      <PageHeader title="Edit education" />
      <EducationForm id={row.id} initial={educationToForm(row)} />
    </>
  )
}
