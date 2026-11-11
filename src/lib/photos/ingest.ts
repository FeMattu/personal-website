import { IMMUTABLE_CACHE_CONTROL, originalKey } from '@/lib/storage/keys'
import type { StorageProvider } from '@/lib/storage/types'
import { extractExif, type PhotoExif } from './exif'
import { processImage, type VariantFormat } from './process'
import { MAX_PHOTO_BYTES, validateImageUpload } from './validate'

export interface IngestedVariant {
  width: number
  height: number
  format: 'AVIF' | 'WEBP'
  storageKey: string
  bytes: number
}

/** Plain data shaped for `prisma.photo.create` (+ nested `variants.create`). No Prisma calls here. */
export interface IngestedPhoto extends PhotoExif {
  originalKey: string
  contentHash: string
  width: number
  height: number
  bytes: number
  blurDataUrl: string
  dominantColor: string
  variants: IngestedVariant[]
}

const CONTENT_TYPES: Record<VariantFormat, string> = { avif: 'image/avif', webp: 'image/webp' }

export async function ingestPhoto(input: {
  storage: StorageProvider
  buffer: Buffer
  declaredType?: string | undefined
  maxBytes?: number
}): Promise<IngestedPhoto> {
  const { storage, buffer } = input
  const { ext, mime } = validateImageUpload({
    bytes: buffer,
    declaredType: input.declaredType,
    maxBytes: input.maxBytes ?? MAX_PHOTO_BYTES,
  })
  const exif = await extractExif(buffer)
  const processed = await processImage(buffer)

  const cacheControl = IMMUTABLE_CACHE_CONTROL
  const origKey = originalKey(processed.contentHash, ext)
  await storage.put(origKey, buffer, { contentType: mime, cacheControl })
  for (const v of processed.variants) {
    await storage.put(v.key, v.body, { contentType: CONTENT_TYPES[v.format], cacheControl })
  }

  return {
    ...exif,
    originalKey: origKey,
    contentHash: processed.contentHash,
    width: processed.width,
    height: processed.height,
    bytes: processed.bytes,
    blurDataUrl: processed.blurDataUrl,
    dominantColor: processed.dominantColor,
    variants: processed.variants.map((v) => ({
      width: v.width,
      height: v.height,
      format: v.format === 'avif' ? 'AVIF' : 'WEBP',
      storageKey: v.key,
      bytes: v.bytes,
    })),
  }
}
