import { notFound } from 'next/navigation'
import { ExperienceForm } from '@/components/admin/experience-form'
import { PageHeader } from '@/components/admin/page-header'
import { blankExperience, experienceToForm } from '@/lib/admin/form-values'
import { requireAdmin } from '@/lib/auth/session'
import { experienceRepo } from '@/lib/db/repositories/admin-cv'

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (id === 'new') {
    return (
      <>
        <PageHeader title="New experience" />
        <ExperienceForm id={null} initial={blankExperience()} />
      </>
    )
  }
  const row = await experienceRepo.get(id)
  if (!row) notFound()
  return (
    <>
      <PageHeader title="Edit experience" />
      <ExperienceForm id={row.id} initial={experienceToForm(row)} />
    </>
  )
}
