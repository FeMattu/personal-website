import { env } from '@/env'
import { getStorage } from '@/lib/storage'
import { cacheControlFor, isContentHashed, isSafeKey } from '@/lib/storage/keys'
import { contentTypeFromKey } from '@/lib/storage/local'

export const dynamic = 'force-dynamic'

const notFound = () => new Response('Not found', { status: 404 })

/** Serves stored files for the local driver only; with S3 the CDN serves them directly. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  if (env('storage').STORAGE_DRIVER !== 'local') return notFound()

  const { key: segments } = await params
  let key: string
  try {
    key = segments.map((s) => decodeURIComponent(s)).join('/')
  } catch {
    return notFound()
  }
  if (!isSafeKey(key)) return notFound()

  const object = await getStorage().get(key)
  if (!object) return notFound()

  const headers = new Headers({
    'Content-Type': object.contentType ?? contentTypeFromKey(key),
    'Cache-Control': cacheControlFor(key),
    'X-Content-Type-Options': 'nosniff',
  })
  if (isContentHashed(key)) {
    const etag = `"${key.replace(/[^A-Za-z0-9]/g, '')}"`
    headers.set('ETag', etag)
    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers })
    }
  }
  return new Response(new Uint8Array(object.body), { status: 200, headers })
}
