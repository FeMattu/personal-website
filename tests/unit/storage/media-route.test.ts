import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const storageEnv = { STORAGE_DRIVER: 'local' }

vi.mock('@/lib/storage', () => ({ getStorage: () => ({ get }) }))
vi.mock('@/env', () => ({ env: () => storageEnv }))

import { GET } from '@/app/api/media/[...key]/route'

const H = 'c'.repeat(64)
const call = (segments: string[], headers?: HeadersInit) =>
  GET(new Request('http://localhost/api/media/x', { headers }), {
    params: Promise.resolve({ key: segments }),
  })

beforeEach(() => {
  get.mockReset()
  storageEnv.STORAGE_DRIVER = 'local'
})

describe('GET /api/media/[...key]', () => {
  it('serves hashed files with immutable caching and an ETag', async () => {
    get.mockResolvedValue({ body: Buffer.from('img'), contentType: 'image/webp' })
    const res = await call(['v', H, '320.webp'])
    expect(res.status).toBe(200)
    expect(get).toHaveBeenCalledWith(`v/${H}/320.webp`)
    expect(res.headers.get('content-type')).toBe('image/webp')
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('etag')).toBeTruthy()
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('img')
  })

  it('answers 304 when the ETag matches', async () => {
    get.mockResolvedValue({ body: Buffer.from('img') })
    const first = await call(['v', H, '320.webp'])
    const etag = first.headers.get('etag') ?? ''
    const second = await call(['v', H, '320.webp'], { 'if-none-match': etag })
    expect(second.status).toBe(304)
  })

  it('falls back to extension content type and short cache for unhashed keys', async () => {
    get.mockResolvedValue({ body: Buffer.from('x') })
    const res = await call(['misc', 'a.png'])
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(res.headers.get('cache-control')).toContain('must-revalidate')
    expect(res.headers.get('etag')).toBeNull()
  })

  it('404s on unsafe keys without touching storage', async () => {
    expect((await call(['..', 'etc'])).status).toBe(404)
    expect((await call(['a%2F..%2Fb'])).status).toBe(404)
    expect((await call(['%E0%A4%A'])).status).toBe(404)
    expect(get).not.toHaveBeenCalled()
  })

  it('404s on missing files', async () => {
    get.mockResolvedValue(null)
    expect((await call(['nope.png'])).status).toBe(404)
  })

  it('404s when the driver is not local', async () => {
    storageEnv.STORAGE_DRIVER = 's3'
    expect((await call(['a.png'])).status).toBe(404)
    expect(get).not.toHaveBeenCalled()
  })
})
