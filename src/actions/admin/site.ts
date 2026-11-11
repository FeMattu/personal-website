'use server'

import type { ActionResult } from '@/lib/action-result'
import { runVoid, runWrite } from '@/lib/admin/run-action'
import { siteSchema, type SiteInput } from '@/lib/admin/schema-content'
import { fileFromForm, fileSchema, storeImage } from '@/lib/admin/upload'
import { siteRepo } from '@/lib/db/repositories/admin-misc'
import { z } from 'zod'

export async function saveSite(input: SiteInput): Promise<ActionResult> {
  return runVoid(siteSchema, input, (data) => siteRepo.save(data))
}

/** Expects a `file` entry in the form data. Stores the image and saves only its key. */
export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ key: string }>> {
  return runWrite(fileSchema, fileFromForm(formData), async ({ file }) => {
    const key = await storeImage(file, 'avatar')
    await siteRepo.setAvatar(key)
    return { key }
  })
}

export async function removeAvatar(): Promise<ActionResult> {
  return runVoid(z.undefined(), undefined, () => siteRepo.setAvatar(null))
}
