'use server'

import type { ActionResult } from '@/lib/action-result'
import { crud, reorderWith } from '@/lib/admin/crud'
import type { ContentStatusValue } from '@/lib/admin/schema-common'
import { spokenLanguageSchema, type SpokenLanguageInput } from '@/lib/admin/schema-content'
import { spokenLanguageRepo } from '@/lib/db/repositories/admin-misc'

const language = crud(spokenLanguageRepo, spokenLanguageSchema)

export async function createLanguage(
  input: SpokenLanguageInput,
): Promise<ActionResult<{ id: string }>> {
  return language.create(input)
}
export async function updateLanguage(
  id: string,
  input: SpokenLanguageInput,
): Promise<ActionResult<{ id: string }>> {
  return language.update(id, input)
}
export async function deleteLanguage(id: string): Promise<ActionResult> {
  return language.remove(id)
}
export async function duplicateLanguage(id: string): Promise<ActionResult<{ id: string }>> {
  return language.duplicate(id)
}
export async function setLanguageStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return language.setStatus(id, status)
}
export async function reorderLanguage(ids: string[]): Promise<ActionResult> {
  return reorderWith(spokenLanguageRepo.reorder, ids)
}
