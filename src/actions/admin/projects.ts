'use server'

import type { ActionResult } from '@/lib/action-result'
import { z } from 'zod'
import { crud, reorderWith } from '@/lib/admin/crud'
import { runVoid, runWrite } from '@/lib/admin/run-action'
import { idSchema, reorderSchema } from '@/lib/admin/schema-common'
import { fileFromForm, fileSchema, storeImage } from '@/lib/admin/upload'
import type { ContentStatusValue } from '@/lib/admin/schema-common'
import { projectSchema, type ProjectInput } from '@/lib/admin/schema-content'
import { projectRepo } from '@/lib/db/repositories/admin-projects'

const project = crud(projectRepo, projectSchema)

export async function createProject(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  return project.create(input)
}
export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<ActionResult<{ id: string }>> {
  return project.update(id, input)
}
export async function deleteProject(id: string): Promise<ActionResult> {
  return project.remove(id)
}
export async function duplicateProject(id: string): Promise<ActionResult<{ id: string }>> {
  return project.duplicate(id)
}
export async function setProjectStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return project.setStatus(id, status)
}
export async function reorderProject(ids: string[]): Promise<ActionResult> {
  return reorderWith(projectRepo.reorder, ids)
}

const projectIdSchema = z.object({ projectId: idSchema })
const imageRefSchema = z.object({ projectId: idSchema, imageId: idSchema })
const imageOrderSchema = z.object({ projectId: idSchema, ids: reorderSchema })

/** Form data: `file` (image, max 5 MB). Replaces the cover; the old object stays in storage. */
export async function uploadProjectCover(
  projectId: string,
  formData: FormData,
): Promise<ActionResult<{ key: string }>> {
  return runWrite(
    fileSchema.extend(projectIdSchema.shape),
    { ...fileFromForm(formData), projectId },
    async ({ file, projectId: id }) => {
      const key = await storeImage(file, 'cover')
      await projectRepo.setCover(id, key)
      return { key }
    },
  )
}

export async function removeProjectCover(projectId: string): Promise<ActionResult> {
  return runVoid(idSchema, projectId, (id) => projectRepo.setCover(id, null))
}

/** Form data: `file` (image, max 5 MB). Appends a gallery image. */
export async function addProjectImage(
  projectId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; key: string }>> {
  return runWrite(
    fileSchema.extend(projectIdSchema.shape),
    { ...fileFromForm(formData), projectId },
    async ({ file, projectId: id }) => {
      const key = await storeImage(file, 'cover')
      const image = await projectRepo.addImage(id, key)
      return { id: image.id, key }
    },
  )
}

export async function removeProjectImage(
  projectId: string,
  imageId: string,
): Promise<ActionResult> {
  return runVoid(imageRefSchema, { projectId, imageId }, (v) =>
    projectRepo.removeImage(v.projectId, v.imageId),
  )
}

export async function reorderProjectImages(
  projectId: string,
  ids: string[],
): Promise<ActionResult> {
  return runVoid(imageOrderSchema, { projectId, ids }, (v) =>
    projectRepo.reorderImages(v.projectId, v.ids),
  )
}
