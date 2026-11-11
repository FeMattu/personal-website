import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  GRID_SIZES,
  LIGHTBOX_SIZES,
  buildSrcSet,
  cdnImageLoader,
  imageBaseUrl,
  pickWidth,
} from '@/lib/photos/loader'

const H = 'b'.repeat(64)

afterEach(() => vi.unstubAllEnvs())

describe('loader', () => {
  it('documents sizes', () => {
    expect(GRID_SIZES).toBe('(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw')
    expect(LIGHTBOX_SIZES).toBe('100vw')
  })

  it('picks the closest available width', () => {
    expect(pickWidth([], 100)).toBeNull()
    expect(pickWidth([640, 320, 960], 500)).toBe(640)
    expect(pickWidth([640, 320], 5000)).toBe(640)
    expect(pickWidth([640, 320], 10)).toBe(320)
  })

  it('resolves base URL from env', () => {
    vi.stubEnv('NEXT_PUBLIC_IMAGE_BASE_URL', '')
    expect(imageBaseUrl()).toBe('/api/media')
    vi.stubEnv('NEXT_PUBLIC_IMAGE_BASE_URL', 'https://cdn.example.com/')
    expect(imageBaseUrl()).toBe('https://cdn.example.com')
  })

  it('maps requested width to a variant url', () => {
    vi.stubEnv('NEXT_PUBLIC_IMAGE_BASE_URL', '')
    expect(cdnImageLoader({ src: `v/${H}/960.webp`, width: 700 })).toBe(
      `/api/media/v/${H}/960.webp`,
    )
    expect(cdnImageLoader({ src: `v/${H}/320.avif`, width: 9999, baseUrl: 'https://c.io/' })).toBe(
      `https://c.io/v/${H}/2560.avif`,
    )
  })

  it('passes other keys through under the base url', () => {
    expect(
      cdnImageLoader({ src: '/uploads/cover/x.png', width: 100, baseUrl: 'https://c.io' }),
    ).toBe('https://c.io/uploads/cover/x.png')
  })

  it('builds srcset per format, ascending', () => {
    const variants = [
      { width: 640, format: 'WEBP', storageKey: `v/${H}/640.webp` },
      { width: 320, format: 'WEBP', storageKey: `v/${H}/320.webp` },
      { width: 320, format: 'AVIF', storageKey: `v/${H}/320.avif` },
    ]
    expect(buildSrcSet(variants, 'https://c.io/')).toBe(
      `https://c.io/v/${H}/320.webp 320w, https://c.io/v/${H}/640.webp 640w`,
    )
    expect(buildSrcSet(variants, '/api/media', 'avif')).toBe(`/api/media/v/${H}/320.avif 320w`)
  })
})
