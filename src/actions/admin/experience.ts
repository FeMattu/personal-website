'use server'

import type { ActionResult } from '@/lib/action-result'
import { crud, reorderWith } from '@/lib/admin/crud'
import type { ContentStatusValue } from '@/lib/admin/schema-common'
import { experienceSchema, type ExperienceInput } from '@/lib/admin/schema-cv'
import { experienceRepo } from '@/lib/db/repositories/admin-cv'

const experience = crud(experienceRepo, experienceSchema)

export async function createExperience(
  input: ExperienceInput,
): Promise<ActionResult<{ id: string }>> {
  return experience.create(input)
}
export async function updateExperience(
  id: string,
  input: ExperienceInput,
): Promise<ActionResult<{ id: string }>> {
  return experience.update(id, input)
}
export async function deleteExperience(id: string): Promise<ActionResult> {
  return experience.remove(id)
}
export async function duplicateExperience(id: string): Promise<ActionResult<{ id: string }>> {
  return experience.duplicate(id)
}
export async function setExperienceStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return experience.setStatus(id, status)
}
export async function reorderExperience(ids: string[]): Promise<ActionResult> {
  return reorderWith(experienceRepo.reorder, ids)
}
