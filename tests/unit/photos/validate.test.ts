import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  type ImageValidationError,
  MAX_AVATAR_BYTES,
  MAX_COVER_BYTES,
  MAX_PHOTO_BYTES,
  validateImageUpload,
} from '@/lib/photos/validate'

const raw = { create: { width: 8, height: 8, channels: 3 as const, background: '#f00' } }
const max = 10_000_000

describe('validateImageUpload', () => {
  it('exports limits', () => {
    expect(MAX_PHOTO_BYTES).toBe(40 * 1024 * 1024)
    expect(MAX_AVATAR_BYTES).toBe(5 * 1024 * 1024)
    expect(MAX_COVER_BYTES).toBe(5 * 1024 * 1024)
  })

  it('accepts jpeg, png, webp and avif by magic number', async () => {
    const cases = [
      ['jpg', 'image/jpeg', await sharp(raw).jpeg().toBuffer()],
      ['png', 'image/png', await sharp(raw).png().toBuffer()],
      ['webp', 'image/webp', await sharp(raw).webp().toBuffer()],
      ['avif', 'image/avif', await sharp(raw).avif().toBuffer()],
    ] as const
    for (const [ext, mime, bytes] of cases) {
      expect(validateImageUpload({ bytes, maxBytes: max })).toEqual({ ext, mime })
      expect(
        validateImageUpload({ bytes, declaredType: `${mime}; charset=x`, maxBytes: max }),
      ).toEqual({
        ext,
        mime,
      })
    }
  })

  it('treats image/jpg as jpeg', async () => {
    const bytes = await sharp(raw).jpeg().toBuffer()
    expect(validateImageUpload({ bytes, declaredType: 'image/jpg', maxBytes: max }).ext).toBe('jpg')
  })

  it('rejects empty, oversize, unknown and mismatched files', async () => {
    const jpeg = await sharp(raw).jpeg().toBuffer()
    const code = (fn: () => unknown) => {
      try {
        fn()
      } catch (e) {
        return (e as ImageValidationError).code
      }
      return null
    }
    expect(code(() => validateImageUpload({ bytes: Buffer.alloc(0), maxBytes: max }))).toBe('empty')
    expect(code(() => validateImageUpload({ bytes: jpeg, maxBytes: 10 }))).toBe('too_large')
    expect(
      code(() => validateImageUpload({ bytes: Buffer.from('GIF89a......'), maxBytes: max })),
    ).toBe('unsupported')
    expect(code(() => validateImageUpload({ bytes: Buffer.from('<svg/>'), maxBytes: max }))).toBe(
      'unsupported',
    )
    expect(
      code(() => validateImageUpload({ bytes: jpeg, declaredType: 'image/png', maxBytes: max })),
    ).toBe('mismatch')
  })

  it('does not mistake heic for avif', () => {
    const heic = Buffer.concat([
      Buffer.from([0, 0, 0, 24]),
      Buffer.from('ftypheic'),
      Buffer.alloc(8),
    ])
    expect(() => validateImageUpload({ bytes: heic, maxBytes: max })).toThrow(/Unsupported/)
  })
})
