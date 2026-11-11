import sharp from 'sharp'
import { beforeEach, describe, expect, it } from 'vitest'
import { ingestPhoto } from '@/lib/photos/ingest'
import type { PutOptions, StorageProvider } from '@/lib/storage/types'

class MemoryStorage implements StorageProvider {
  files = new Map<string, { body: Buffer; opts: PutOptions }>()
  async put(key: string, body: Buffer, opts: PutOptions) {
    this.files.set(key, { body, opts })
  }
  async get(key: string) {
    const f = this.files.get(key)
    return f ? { body: f.body, contentType: f.opts.contentType } : null
  }
  async delete(key: string) {
    this.files.delete(key)
  }
  async exists(key: string) {
    return this.files.has(key)
  }
  publicUrl(key: string) {
    return `/m/${key}`
  }
}

let storage: MemoryStorage
let jpeg: Buffer

beforeEach(async () => {
  storage = new MemoryStorage()
  jpeg = await sharp({ create: { width: 700, height: 500, channels: 3, background: '#aa5500' } })
    .withExif({ IFD0: { Make: 'ACME' } })
    .jpeg()
    .toBuffer()
})

describe('ingestPhoto', () => {
  it('stores the original and every variant with immutable caching', async () => {
    const photo = await ingestPhoto({ storage, buffer: jpeg, declaredType: 'image/jpeg' })
    expect(photo.originalKey).toBe(
      `originals/${photo.contentHash.slice(0, 2)}/${photo.contentHash}.jpg`,
    )
    expect(photo.width).toBe(700)
    expect(photo.cameraMake).toBe('ACME')
    expect(photo.variants.length).toBe(4)
    expect(photo.variants.map((v) => v.format)).toEqual(['AVIF', 'WEBP', 'AVIF', 'WEBP'])
    expect(storage.files.size).toBe(1 + photo.variants.length)
    for (const f of storage.files.values()) {
      expect(f.opts.cacheControl).toBe('public, max-age=31536000, immutable')
    }
    expect(storage.files.get(photo.originalKey)?.opts.contentType).toBe('image/jpeg')
    const first = photo.variants[0]
    expect(storage.files.get(first?.storageKey ?? '')?.opts.contentType).toBe('image/avif')
    expect(storage.files.get(photo.variants[1]?.storageKey ?? '')?.opts.contentType).toBe(
      'image/webp',
    )
  })

  it('is idempotent: same bytes, same keys', async () => {
    const a = await ingestPhoto({ storage, buffer: jpeg })
    const sizeAfterFirst = storage.files.size
    const b = await ingestPhoto({ storage, buffer: jpeg })
    expect(b.originalKey).toBe(a.originalKey)
    expect(b.variants.map((v) => v.storageKey)).toEqual(a.variants.map((v) => v.storageKey))
    expect(storage.files.size).toBe(sizeAfterFirst)
  })

  it('rejects invalid uploads before writing anything', async () => {
    await expect(ingestPhoto({ storage, buffer: Buffer.from('nope') })).rejects.toThrow(
      /Unsupported/,
    )
    await expect(ingestPhoto({ storage, buffer: jpeg, declaredType: 'image/png' })).rejects.toThrow(
      /match/,
    )
    await expect(ingestPhoto({ storage, buffer: jpeg, maxBytes: 5 })).rejects.toThrow(/exceeds/)
    expect(storage.files.size).toBe(0)
  })
})
