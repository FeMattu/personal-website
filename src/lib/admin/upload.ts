import { z } from 'zod'
import {
  MAX_AVATAR_BYTES,
  MAX_COVER_BYTES,
  ImageValidationError,
  validateImageUpload,
} from '@/lib/photos/validate'
import { getStorage } from '@/lib/storage'
import { IMMUTABLE_CACHE_CONTROL, avatarKey, coverKey, sha256Hex } from '@/lib/storage/keys'
import { AdminError } from './errors'

export type UploadKind = 'avatar' | 'cover'

const LIMITS: Record<UploadKind, number> = { avatar: MAX_AVATAR_BYTES, cover: MAX_COVER_BYTES }

/** Zod schema for a form that carries one uploaded file under `file`. */
export const fileSchema = z.object({ file: z.instanceof(File, { message: 'Choose an image' }) })

/** Reads `file` out of a FormData without throwing on unexpected input. */
export const fileFromForm = (form: unknown): { file: unknown } => ({
  file: form instanceof FormData ? form.get('file') : null,
})

/**
 * Validates the image (type sniffing + size), stores it under a content-hashed key
 * `uploads/<kind>/<sha256>.<ext>` with immutable cache headers and returns ONLY the key.
 * `cover` is also used for project gallery images.
 */
export async function storeImage(file: File, kind: UploadKind): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer())
  let validated: ReturnType<typeof validateImageUpload>
  try {
    validated = validateImageUpload({ bytes, declaredType: file.type, maxBytes: LIMITS[kind] })
  } catch (error) {
    if (error instanceof ImageValidationError) {
      throw new AdminError(error.message, { file: error.message })
    }
    throw error
  }
  const hash = sha256Hex(bytes)
  const key = kind === 'avatar' ? avatarKey(hash, validated.ext) : coverKey(hash, validated.ext)
  await getStorage().put(key, bytes, {
    contentType: validated.mime,
    cacheControl: IMMUTABLE_CACHE_CONTROL,
  })
  return key
}
