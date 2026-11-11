import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const put = vi.hoisted(() => vi.fn())
vi.mock('@/lib/storage', () => ({ getStorage: () => ({ put }) }))

import { AdminError } from '@/lib/admin/errors'
import { fileFromForm, fileSchema, storeImage } from '@/lib/admin/upload'
import { MAX_AVATAR_BYTES } from '@/lib/photos/validate'
import { IMMUTABLE_CACHE_CONTROL } from '@/lib/storage/keys'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const png = Buffer.concat([PNG_SIGNATURE, Buffer.alloc(32, 1)])
const asFile = (bytes: Buffer, name = 'a.png', type = 'image/png') =>
  new File([new Uint8Array(bytes)], name, { type })

beforeEach(() => put.mockReset())

describe('storeImage', () => {
  it('stores under a content-hashed key with immutable caching and returns only the key', async () => {
    const hash = createHash('sha256').update(png).digest('hex')
    const key = await storeImage(asFile(png), 'avatar')
    expect(key).toBe(`uploads/avatar/${hash}.png`)
    expect(put).toHaveBeenCalledWith(key, png, {
      contentType: 'image/png',
      cacheControl: IMMUTABLE_CACHE_CONTROL,
    })
  })

  it('uses the cover namespace for covers and gallery images', async () => {
    expect(await storeImage(asFile(png), 'cover')).toMatch(/^uploads\/cover\/[a-f0-9]{64}\.png$/)
  })

  it('rejects files that are not images (sniffed, not trusted from the name)', async () => {
    const fake = asFile(Buffer.from('<?php echo 1; ?>'), 'evil.png')
    await expect(storeImage(fake, 'avatar')).rejects.toBeInstanceOf(AdminError)
    expect(put).not.toHaveBeenCalled()
  })

  it('rejects a declared type that does not match the bytes', async () => {
    await expect(storeImage(asFile(png, 'a.jpg', 'image/jpeg'), 'cover')).rejects.toBeInstanceOf(
      AdminError,
    )
  })

  it('enforces the 5 MB limit and exposes a file field error', async () => {
    const big = Buffer.concat([PNG_SIGNATURE, Buffer.alloc(MAX_AVATAR_BYTES)])
    await expect(storeImage(asFile(big), 'avatar')).rejects.toMatchObject({
      fieldErrors: { file: expect.stringContaining('exceeds') },
    })
    expect(put).not.toHaveBeenCalled()
  })

  it('rejects an empty file', async () => {
    await expect(storeImage(asFile(Buffer.alloc(0)), 'cover')).rejects.toBeInstanceOf(AdminError)
  })
})

describe('form helpers', () => {
  it('fileFromForm reads the file entry and tolerates garbage', () => {
    const form = new FormData()
    const file = asFile(png)
    form.set('file', file)
    expect((fileFromForm(form).file as File).name).toBe('a.png')
    expect(fileFromForm(undefined)).toEqual({ file: null })
  })

  it('fileSchema requires a File', () => {
    expect(fileSchema.safeParse({ file: asFile(png) }).success).toBe(true)
    expect(fileSchema.safeParse({ file: 'text' }).success).toBe(false)
    expect(fileSchema.safeParse({ file: null }).success).toBe(false)
  })
})
