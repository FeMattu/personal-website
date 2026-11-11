import { createHash } from 'node:crypto'

const MAX_KEY_LENGTH = 300
const SAFE_CHARS = /^[A-Za-z0-9._/-]+$/

/** True when `key` is a relative, traversal-free key made only of [A-Za-z0-9._/-]. */
export function isSafeKey(key: string): boolean {
  if (key.length === 0 || key.length > MAX_KEY_LENGTH) return false
  if (key.startsWith('/') || key.includes('\\')) return false
  if (!SAFE_CHARS.test(key)) return false
  return !key.split('/').some((segment) => segment === '..' || segment === '.' || segment === '')
}

export function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function assertHash(hash: string): void {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Expected a lowercase sha256 hex digest')
}

function cleanExt(ext: string): string {
  const e = ext.replace(/^\./, '').toLowerCase()
  if (!/^[a-z0-9]{1,8}$/.test(e)) throw new Error(`Invalid file extension: ${ext}`)
  return e
}

export function originalKey(sha256: string, ext: string): string {
  assertHash(sha256)
  return `originals/${sha256.slice(0, 2)}/${sha256}.${cleanExt(ext)}`
}

export function variantKey(sha256: string, width: number, format: string): string {
  assertHash(sha256)
  if (!Number.isInteger(width) || width <= 0) throw new Error('Invalid variant width')
  return `v/${sha256}/${width}.${cleanExt(format)}`
}

export function avatarKey(hash: string, ext: string): string {
  assertHash(hash)
  return `uploads/avatar/${hash}.${cleanExt(ext)}`
}

export function coverKey(hash: string, ext: string): string {
  assertHash(hash)
  return `uploads/cover/${hash}.${cleanExt(ext)}`
}

const HASHED_KEY =
  /^(originals\/[a-f0-9]{2}\/[a-f0-9]{64}\.|v\/[a-f0-9]{64}\/|uploads\/(avatar|cover)\/[a-f0-9]{64}\.)/

export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

/** True for keys whose name contains the content hash (so the bytes can never change). */
export function isContentHashed(key: string): boolean {
  return HASHED_KEY.test(key)
}

/** Immutable for content-hashed keys, a short revalidating policy for everything else. */
export function cacheControlFor(key: string): string {
  return isContentHashed(key) ? IMMUTABLE_CACHE_CONTROL : 'public, max-age=300, must-revalidate'
}
