export const MAX_PHOTO_BYTES = 40 * 1024 * 1024
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024
export const MAX_COVER_BYTES = 5 * 1024 * 1024

export type ImageExt = 'jpg' | 'png' | 'webp' | 'avif'
export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'

const MIME_BY_EXT: Record<ImageExt, ImageMime> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
}

export class ImageValidationError extends Error {
  constructor(
    message: string,
    readonly code: 'empty' | 'too_large' | 'unsupported' | 'mismatch',
  ) {
    super(message)
    this.name = 'ImageValidationError'
  }
}

function sniff(b: Buffer): ImageExt | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg'
  if (
    b.length >= 8 &&
    b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png'
  }
  if (
    b.length >= 12 &&
    b.toString('ascii', 0, 4) === 'RIFF' &&
    b.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp'
  }
  if (b.length >= 12 && b.toString('ascii', 4, 8) === 'ftyp') {
    const brand = b.toString('ascii', 8, 12)
    if (brand === 'avif' || brand === 'avis') return 'avif'
  }
  return null
}

function normalizeMime(type: string): string {
  const t = type.split(';')[0]?.trim().toLowerCase() ?? ''
  return t === 'image/jpg' ? 'image/jpeg' : t
}

export function validateImageUpload(input: {
  bytes: Buffer
  declaredType?: string | undefined
  maxBytes: number
}): { ext: ImageExt; mime: ImageMime } {
  const { bytes, declaredType, maxBytes } = input
  if (bytes.length === 0) throw new ImageValidationError('Empty file', 'empty')
  if (bytes.length > maxBytes) {
    throw new ImageValidationError(`File exceeds ${maxBytes} bytes`, 'too_large')
  }
  const ext = sniff(bytes)
  if (!ext) {
    throw new ImageValidationError('Unsupported image type (jpeg, png, webp, avif)', 'unsupported')
  }
  const mime = MIME_BY_EXT[ext]
  if (declaredType && normalizeMime(declaredType) !== mime) {
    throw new ImageValidationError(
      `Declared type ${declaredType} does not match ${mime}`,
      'mismatch',
    )
  }
  return { ext, mime }
}
