'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/action-result'
import { crud, reorderWith } from '@/lib/admin/crud'
import { runVoid, runWrite } from '@/lib/admin/run-action'
import { idSchema, withId, type ContentStatusValue } from '@/lib/admin/schema-common'
import {
  albumSchema,
  photoSchema,
  type AlbumInput,
  type PhotoInput,
} from '@/lib/admin/schema-content'
import { fileFromForm, fileSchema } from '@/lib/admin/upload'
import { albumRepo, photoRepo } from '@/lib/db/repositories/admin-photos'
import { ingestPhoto } from '@/lib/photos/ingest'
import { getStorage } from '@/lib/storage'

const album = crud(albumRepo, albumSchema)

export async function createAlbum(input: AlbumInput): Promise<ActionResult<{ id: string }>> {
  return album.create(input)
}
export async function updateAlbum(
  id: string,
  input: AlbumInput,
): Promise<ActionResult<{ id: string }>> {
  return album.update(id, input)
}
export async function deleteAlbum(id: string): Promise<ActionResult> {
  return album.remove(id)
}
export async function duplicateAlbum(id: string): Promise<ActionResult<{ id: string }>> {
  return album.duplicate(id)
}
export async function setAlbumStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return album.setStatus(id, status)
}
export async function reorderAlbums(ids: string[]): Promise<ActionResult> {
  return reorderWith(albumRepo.reorder, ids)
}

const uploadSchema = fileSchema.extend({ albumId: z.string().max(64) })

/**
 * Form data: `file` (jpeg/png/webp/avif, max 40 MB) and optional `albumId`.
 * The photo is processed by `ingestPhoto`, stored via `getStorage()` and created as DRAFT.
 */
export async function uploadPhoto(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const albumId = formData instanceof FormData ? formData.get('albumId') : null
  return runWrite(
    uploadSchema,
    { ...fileFromForm(formData), albumId: typeof albumId === 'string' ? albumId : '' },
    async ({ file, albumId: album }) => {
      const ingested = await ingestPhoto({
        storage: getStorage(),
        buffer: Buffer.from(await file.arrayBuffer()),
        declaredType: file.type || undefined,
      })
      return photoRepo.createFromIngest(ingested, album === '' ? null : album)
    },
  )
}

export async function updatePhoto(
  id: string,
  input: PhotoInput,
): Promise<ActionResult<{ id: string }>> {
  return runWrite(withId(photoSchema), { id, data: input }, (v) => photoRepo.update(v.id, v.data))
}

export async function deletePhoto(id: string): Promise<ActionResult> {
  return runVoid(idSchema, id, (value) => photoRepo.remove(value))
}

export async function setPhotoStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return runVoid(
    z.object({ id: idSchema, status: z.enum(['DRAFT', 'PUBLISHED']) }),
    { id, status },
    (v) => photoRepo.setStatus(v.id, v.status),
  )
}

export async function setPhotoFeatured(id: string, featured: boolean): Promise<ActionResult> {
  return runVoid(z.object({ id: idSchema, featured: z.boolean() }), { id, featured }, (v) =>
    photoRepo.setFeatured(v.id, v.featured),
  )
}
