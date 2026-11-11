/**
 * Image delivery helpers (pure, no I/O).
 *
 * `sizes` rules for the future UI:
 *  - Photo grid: `GRID_SIZES` (3 columns on desktop, 2 on tablet, 1 on phones).
 *  - Lightbox: `LIGHTBOX_SIZES` (full viewport width).
 *
 * Lazy-loading rules:
 *  - Grid: `loading="lazy"` for every tile except the first row, which is eager with `priority`
 *    (it is the likely LCP). Always pass `blurDataUrl` as the placeholder and set width/height
 *    (or aspect-ratio) from the stored dimensions to avoid layout shift.
 *  - Lightbox: the opened photo is `priority`; neighbours may be prefetched on idle.
 *
 * Keys are content-hashed, so URLs are immutable and the CDN can cache them forever.
 */

export const GRID_SIZES = '(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw'
export const LIGHTBOX_SIZES = '100vw'

export type LoaderFormat = 'avif' | 'webp'

export interface LoaderVariant {
  width: number
  format: string
  storageKey: string
}

const FALLBACK_BASE = '/api/media'

export function imageBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || FALLBACK_BASE).replace(/\/+$/, '')
}

const VARIANT_KEY = /^v\/([a-f0-9]{64})\/(\d+)\.(avif|webp)$/

/** Closest available width: the smallest one >= requested, otherwise the largest. */
export function pickWidth(available: readonly number[], requested: number): number | null {
  if (available.length === 0) return null
  const sorted = [...available].sort((a, b) => a - b)
  return sorted.find((w) => w >= requested) ?? sorted[sorted.length - 1] ?? null
}

/**
 * `next/image` custom loader. `src` is any variant key (`v/<sha>/<w>.<fmt>`); the width is swapped
 * for the closest standard width. Unknown shapes are passed through unchanged under the base URL.
 */
export function cdnImageLoader({
  src,
  width,
  baseUrl = imageBaseUrl(),
  widths = [320, 640, 960, 1440, 2048, 2560],
}: {
  src: string
  width: number
  quality?: number
  baseUrl?: string
  widths?: readonly number[]
}): string {
  const base = baseUrl.replace(/\/+$/, '')
  const match = VARIANT_KEY.exec(src)
  if (!match) return `${base}/${src.replace(/^\/+/, '')}`
  const target = pickWidth(widths, width) ?? width
  return `${base}/v/${match[1]}/${target}.${match[3]}`
}

/** `srcset` string for one format from stored variants, ascending by width. */
export function buildSrcSet(
  variants: readonly LoaderVariant[],
  baseUrl: string,
  format: LoaderFormat = 'webp',
): string {
  const base = baseUrl.replace(/\/+$/, '')
  return variants
    .filter((v) => v.format.toLowerCase() === format)
    .sort((a, b) => a.width - b.width)
    .map((v) => `${base}/${v.storageKey} ${v.width}w`)
    .join(', ')
}
