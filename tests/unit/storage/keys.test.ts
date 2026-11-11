import { describe, expect, it } from 'vitest'
import {
  avatarKey,
  cacheControlFor,
  coverKey,
  isSafeKey,
  originalKey,
  sha256Hex,
  variantKey,
} from '@/lib/storage/keys'

const H = 'a'.repeat(64)

describe('isSafeKey', () => {
  it.each(['a.jpg', 'v/abc/320.webp', 'originals/aa/x.jpg', 'a-b_c.d/e'])('accepts %s', (k) => {
    expect(isSafeKey(k)).toBe(true)
  })
  it.each([
    '',
    '/a',
    'a/../b',
    '..',
    'a\\b',
    'a\nb',
    'a b',
    'a//b',
    './a',
    'é.jpg',
    'a/',
    'x'.repeat(301),
  ])('rejects %j', (k) => {
    expect(isSafeKey(k)).toBe(false)
  })
})

describe('key builders', () => {
  it('builds keys', () => {
    expect(originalKey(H, 'JPG')).toBe(`originals/aa/${H}.jpg`)
    expect(variantKey(H, 640, 'avif')).toBe(`v/${H}/640.avif`)
    expect(avatarKey(H, '.png')).toBe(`uploads/avatar/${H}.png`)
    expect(coverKey(H, 'webp')).toBe(`uploads/cover/${H}.webp`)
  })
  it('validates inputs', () => {
    expect(() => originalKey('nope', 'jpg')).toThrow()
    expect(() => originalKey(H, '../x')).toThrow()
    expect(() => variantKey(H, 0, 'webp')).toThrow()
    expect(() => variantKey(H, 1.5, 'webp')).toThrow()
  })
  it('hashes', () => {
    expect(sha256Hex(Buffer.from('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
})

describe('cacheControlFor', () => {
  it('is immutable for hashed keys', () => {
    for (const k of [originalKey(H, 'jpg'), variantKey(H, 320, 'webp'), avatarKey(H, 'png')]) {
      expect(cacheControlFor(k)).toBe('public, max-age=31536000, immutable')
    }
  })
  it('revalidates other keys', () => {
    expect(cacheControlFor('misc/cv.pdf')).toContain('must-revalidate')
  })
})
