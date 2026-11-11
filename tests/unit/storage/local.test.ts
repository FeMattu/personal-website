import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageProvider, contentTypeFromKey } from '@/lib/storage/local'

let dir: string
let storage: LocalStorageProvider

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'storage-'))
  storage = new LocalStorageProvider({ dir })
})
afterEach(() => rm(dir, { recursive: true, force: true }))

describe('LocalStorageProvider', () => {
  it('round-trips put/get/exists/delete', async () => {
    const body = Buffer.from('hello')
    await storage.put('a/b/c.png', body, { contentType: 'image/png' })
    expect(await storage.exists('a/b/c.png')).toBe(true)
    const got = await storage.get('a/b/c.png')
    expect(got?.body.equals(body)).toBe(true)
    expect(got?.contentType).toBe('image/png')
    await storage.delete('a/b/c.png')
    expect(await storage.exists('a/b/c.png')).toBe(false)
    expect(await storage.get('a/b/c.png')).toBeNull()
    await storage.delete('a/b/c.png')
  })

  it('rejects unsafe keys', async () => {
    await expect(storage.put('../evil', Buffer.from('x'), { contentType: 'x' })).rejects.toThrow(
      /Unsafe/,
    )
    await expect(storage.get('/etc/passwd')).rejects.toThrow(/Unsafe/)
    await expect(storage.exists('a/../../x')).rejects.toThrow(/Unsafe/)
    expect(() => storage.publicUrl('..')).toThrow(/Unsafe/)
  })

  it('treats a directory as not existing', async () => {
    await storage.put('d/f.txt', Buffer.from('x'), { contentType: 'text/plain' })
    expect(await storage.exists('d')).toBe(false)
  })

  it('builds public URLs', () => {
    expect(storage.publicUrl('v/x/1.webp')).toBe('/api/media/v/x/1.webp')
    const cdn = new LocalStorageProvider({ dir, publicBaseUrl: 'https://cdn.example.com/' })
    expect(cdn.publicUrl('v/x/1.webp')).toBe('https://cdn.example.com/api/media/v/x/1.webp')
  })

  it('maps extensions to content types', () => {
    expect(contentTypeFromKey('a.AVIF')).toBe('image/avif')
    expect(contentTypeFromKey('a.unknown')).toBe('application/octet-stream')
  })
})
