import exifr from 'exifr'

export interface PhotoExif {
  cameraMake: string | null
  cameraModel: string | null
  lensModel: string | null
  focalLength: number | null
  aperture: number | null
  exposureTime: number | null
  iso: number | null
  capturedAt: Date | null
}

const EMPTY: PhotoExif = {
  cameraMake: null,
  cameraModel: null,
  lensModel: null,
  focalLength: null,
  aperture: null,
  exposureTime: null,
  iso: null,
  capturedAt: null,
}

function str(value: unknown): string | null {
  const v = Array.isArray(value) ? value[0] : value
  if (typeof v !== 'string') return null
  const t = v.replace(/\0/g, '').trim()
  return t === '' ? null : t
}

function num(value: unknown): number | null {
  const v = Array.isArray(value) ? value[0] : value
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function date(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/** Reads camera metadata only. GPS tags are never requested nor returned. */
export async function extractExif(buffer: Buffer): Promise<PhotoExif> {
  let raw: Record<string, unknown> | undefined
  try {
    raw = (await exifr.parse(buffer, {
      gps: false,
      tiff: true,
      exif: true,
      ifd1: false,
      xmp: false,
      icc: false,
      iptc: false,
    })) as Record<string, unknown> | undefined
  } catch {
    return { ...EMPTY }
  }
  if (!raw) return { ...EMPTY }
  const iso = num(raw.ISO)
  return {
    cameraMake: str(raw.Make),
    cameraModel: str(raw.Model),
    lensModel: str(raw.LensModel),
    focalLength: num(raw.FocalLength),
    aperture: num(raw.FNumber),
    exposureTime: num(raw.ExposureTime),
    iso: iso === null ? null : Math.round(iso),
    capturedAt: date(raw.DateTimeOriginal) ?? date(raw.CreateDate),
  }
}

/** 0.004 -> "1/250", 2 -> "2s", 1.5 -> "1.5s". */
export function formatExposure(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  if (seconds >= 1) return `${Number.isInteger(seconds) ? seconds : Number(seconds.toFixed(1))}s`
  return `1/${Math.round(1 / seconds)}`
}

/** 1.8 -> "f/1.8", 8 -> "f/8". */
export function formatAperture(fNumber: number): string {
  if (!Number.isFinite(fNumber) || fNumber <= 0) return ''
  return `f/${Number(fNumber.toFixed(1))}`
}
