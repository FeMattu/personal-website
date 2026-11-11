import sharp from 'sharp'
import { sha256Hex, variantKey } from '@/lib/storage/keys'

export type VariantFormat = 'avif' | 'webp'

export const DEFAULT_WIDTHS = [320, 640, 960, 1440, 2048, 2560] as const
export const DEFAULT_FORMATS: readonly VariantFormat[] = ['avif', 'webp']

const QUALITY: Record<VariantFormat, number> = { avif: 55, webp: 78 }

export interface ProcessedVariant {
  width: number
  height: number
  format: VariantFormat
  bytes: number
  key: string
  body: Buffer
}

export interface ProcessedImage {
  width: number
  height: number
  bytes: number
  contentHash: string
  blurDataUrl: string
  dominantColor: string
  variants: ProcessedVariant[]
}

export interface ProcessOptions {
  widths?: readonly number[]
  formats?: readonly VariantFormat[]
}

/** Widths to generate: never upscale, but always include the largest allowed width <= original. */
export function selectWidths(widths: readonly number[], originalWidth: number): number[] {
  const sorted = [...new Set(widths)].filter((w) => w > 0).sort((a, b) => a - b)
  const fitting = sorted.filter((w) => w <= originalWidth)
  return fitting.length > 0 ? fitting : [originalWidth]
}

const hex = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0')

export async function processImage(
  buffer: Buffer,
  options: ProcessOptions = {},
): Promise<ProcessedImage> {
  const widths = options.widths ?? DEFAULT_WIDTHS
  const formats = options.formats ?? DEFAULT_FORMATS

  // Bake the EXIF orientation into pixels once; every derivative starts from this buffer.
  const { data: oriented, info } = await sharp(buffer)
    .rotate()
    .toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const contentHash = sha256Hex(buffer)

  const variants: ProcessedVariant[] = []
  for (const w of selectWidths(widths, width)) {
    for (const format of formats) {
      const pipeline = sharp(oriented).resize({ width: w, withoutEnlargement: true })
      const out = await (
        format === 'avif'
          ? pipeline.avif({ quality: QUALITY.avif })
          : pipeline.webp({ quality: QUALITY.webp })
      ).toBuffer({ resolveWithObject: true })
      variants.push({
        width: out.info.width,
        height: out.info.height,
        format,
        bytes: out.data.length,
        key: variantKey(contentHash, out.info.width, format),
        body: out.data,
      })
    }
  }

  const blur = await sharp(oriented)
    .resize({ width: 16, withoutEnlargement: true })
    .webp({ quality: 40 })
    .toBuffer()
  const blurDataUrl = `data:image/webp;base64,${blur.toString('base64')}`

  const stats = await sharp(oriented).stats()
  const [r, g, b] = stats.channels.map((c) => c.mean)
  const dominantColor = `#${hex(r ?? 0)}${hex(g ?? 0)}${hex(b ?? 0)}`

  return {
    width,
    height,
    bytes: buffer.length,
    contentHash,
    blurDataUrl,
    dominantColor,
    variants,
  }
}
