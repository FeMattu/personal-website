'use server'

import type { ActionResult } from '@/lib/action-result'
import { crud, reorderWith } from '@/lib/admin/crud'
import type { ContentStatusValue } from '@/lib/admin/schema-common'
import { certificationSchema, type CertificationInput } from '@/lib/admin/schema-cv'
import { certificationRepo } from '@/lib/db/repositories/admin-cv'

const certification = crud(certificationRepo, certificationSchema)

export async function createCertification(
  input: CertificationInput,
): Promise<ActionResult<{ id: string }>> {
  return certification.create(input)
}
export async function updateCertification(
  id: string,
  input: CertificationInput,
): Promise<ActionResult<{ id: string }>> {
  return certification.update(id, input)
}
export async function deleteCertification(id: string): Promise<ActionResult> {
  return certification.remove(id)
}
export async function duplicateCertification(id: string): Promise<ActionResult<{ id: string }>> {
  return certification.duplicate(id)
}
export async function setCertificationStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return certification.setStatus(id, status)
}
export async function reorderCertification(ids: string[]): Promise<ActionResult> {
  return reorderWith(certificationRepo.reorder, ids)
}
