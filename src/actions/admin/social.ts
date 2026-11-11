'use server'

import type { ActionResult } from '@/lib/action-result'
import { crud, reorderWith } from '@/lib/admin/crud'
import type { ContentStatusValue } from '@/lib/admin/schema-common'
import { socialSchema, type SocialInput } from '@/lib/admin/schema-content'
import { socialRepo } from '@/lib/db/repositories/admin-misc'

const social = crud(socialRepo, socialSchema)

export async function createSocial(input: SocialInput): Promise<ActionResult<{ id: string }>> {
  return social.create(input)
}
export async function updateSocial(
  id: string,
  input: SocialInput,
): Promise<ActionResult<{ id: string }>> {
  return social.update(id, input)
}
export async function deleteSocial(id: string): Promise<ActionResult> {
  return social.remove(id)
}
export async function duplicateSocial(id: string): Promise<ActionResult<{ id: string }>> {
  return social.duplicate(id)
}
export async function setSocialStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return social.setStatus(id, status)
}
export async function reorderSocial(ids: string[]): Promise<ActionResult> {
  return reorderWith(socialRepo.reorder, ids)
}
