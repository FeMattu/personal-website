/** Public URL of a stored file. The DB holds KEYS only; the CDN/base URL comes from the environment. */
export function mediaUrl(key: string): string {
  const base = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? '').replace(/\/$/, '')
  return `${base || '/api/media'}/${key.split('/').map(encodeURIComponent).join('/')}`
}
