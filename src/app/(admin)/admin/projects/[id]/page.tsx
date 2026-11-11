import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/page-header'
import { ProjectForm } from '@/components/admin/project-form'
import { ProjectMedia } from '@/components/admin/project-media'
import { blankProject, projectToForm } from '@/lib/admin/form-values'
import { requireAdmin } from '@/lib/auth/session'
import { projectRepo } from '@/lib/db/repositories/admin-projects'
import { skillRepo } from '@/lib/db/repositories/admin-skills'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const skills = (await skillRepo.listAll()).map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category.slug,
  }))

  if (id === 'new') {
    return (
      <>
        <PageHeader title="New project" description="Save the project first to add images." />
        <ProjectForm id={null} initial={blankProject()} skills={skills} />
      </>
    )
  }

  const row = await projectRepo.get(id)
  if (!row) notFound()
  return (
    <div className="grid gap-10">
      <div>
        <PageHeader title="Edit project" />
        <ProjectForm id={row.id} initial={projectToForm(row)} skills={skills} />
      </div>
      <ProjectMedia projectId={row.id} coverKey={row.coverKey} images={row.images} />
    </div>
  )
}
