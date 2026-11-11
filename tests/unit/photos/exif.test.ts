import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { extractExif, formatAperture, formatExposure } from '@/lib/photos/exif'

describe('extractExif', () => {
  it('returns nulls for files without EXIF', async () => {
    const png = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#000' },
    })
      .png()
      .toBuffer()
    expect(await extractExif(png)).toEqual({
      cameraMake: null,
      cameraModel: null,
      lensModel: null,
      focalLength: null,
      aperture: null,
      exposureTime: null,
      iso: null,
      capturedAt: null,
    })
  })

  it('tolerates garbage', async () => {
    expect((await extractExif(Buffer.from('not an image'))).cameraMake).toBeNull()
  })

  it('reads camera data from a JPEG', async () => {
    const jpeg = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#888' },
    })
      .withExif({ IFD0: { Make: 'ACME', Model: 'Cam 1' } })
      .jpeg()
      .toBuffer()
    const exif = await extractExif(jpeg)
    expect(exif.cameraMake).toBe('ACME')
    expect(exif.cameraModel).toBe('Cam 1')
    expect(exif.iso).toBeNull()
  })
})

describe('formatters', () => {
  it('formats exposure', () => {
    expect(formatExposure(0.004)).toBe('1/250')
    expect(formatExposure(2)).toBe('2s')
    expect(formatExposure(1.5)).toBe('1.5s')
    expect(formatExposure(0)).toBe('')
    expect(formatExposure(Number.NaN)).toBe('')
  })
  it('formats aperture', () => {
    expect(formatAperture(1.8)).toBe('f/1.8')
    expect(formatAperture(8)).toBe('f/8')
    expect(formatAperture(-1)).toBe('')
  })
})
