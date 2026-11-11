'use server'

import type { ActionResult } from '@/lib/action-result'
import { crud, reorderWith } from '@/lib/admin/crud'
import type { ContentStatusValue } from '@/lib/admin/schema-common'
import { educationSchema, type EducationInput } from '@/lib/admin/schema-cv'
import { educationRepo } from '@/lib/db/repositories/admin-cv'

const education = crud(educationRepo, educationSchema)

export async function createEducation(
  input: EducationInput,
): Promise<ActionResult<{ id: string }>> {
  return education.create(input)
}
export async function updateEducation(
  id: string,
  input: EducationInput,
): Promise<ActionResult<{ id: string }>> {
  return education.update(id, input)
}
export async function deleteEducation(id: string): Promise<ActionResult> {
  return education.remove(id)
}
export async function duplicateEducation(id: string): Promise<ActionResult<{ id: string }>> {
  return education.duplicate(id)
}
export async function setEducationStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return education.setStatus(id, status)
}
export async function reorderEducation(ids: string[]): Promise<ActionResult> {
  return reorderWith(educationRepo.reorder, ids)
}
