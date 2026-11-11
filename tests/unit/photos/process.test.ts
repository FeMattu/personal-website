import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { processImage, selectWidths } from '@/lib/photos/process'
import { sha256Hex } from '@/lib/storage/keys'

const make = (width: number, height: number, orientation?: number) => {
  const img = sharp({ create: { width, height, channels: 3, background: '#3366cc' } })
  return (orientation ? img.withMetadata({ orientation }) : img).jpeg().toBuffer()
}

describe('selectWidths', () => {
  it('never upscales and keeps the largest fitting width', () => {
    expect(selectWidths([320, 640, 960], 700)).toEqual([320, 640])
    expect(selectWidths([960, 320, 320], 5000)).toEqual([320, 960])
  })
  it('falls back to the original width for tiny images', () => {
    expect(selectWidths([320, 640], 100)).toEqual([100])
  })
})

describe('processImage', () => {
  it('produces variants, placeholder and color', async () => {
    const buf = await make(700, 400)
    const out = await processImage(buf, { widths: [320, 640, 960] })
    expect(out.width).toBe(700)
    expect(out.height).toBe(400)
    expect(out.bytes).toBe(buf.length)
    expect(out.contentHash).toBe(sha256Hex(buf))
    expect(out.variants.map((v) => `${v.width}.${v.format}`)).toEqual([
      '320.avif',
      '320.webp',
      '640.avif',
      '640.webp',
    ])
    for (const v of out.variants) {
      expect(v.key).toBe(`v/${out.contentHash}/${v.width}.${v.format}`)
      expect(v.bytes).toBe(v.body.length)
      expect((await sharp(v.body).metadata()).width).toBe(v.width)
    }
    expect(out.dominantColor).toMatch(/^#[0-9a-f]{6}$/)
    expect(out.blurDataUrl.startsWith('data:image/webp;base64,')).toBe(true)
    expect(out.blurDataUrl.length).toBeLessThan(1500)
  })

  it('reads dimensions after auto-rotation', async () => {
    const out = await processImage(await make(200, 100, 6), { widths: [64], formats: ['webp'] })
    expect(out.width).toBe(100)
    expect(out.height).toBe(200)
    expect(out.variants[0]).toMatchObject({ width: 64, height: 128, format: 'webp' })
  })

  it('uses default widths and formats', async () => {
    const out = await processImage(await make(1000, 500))
    expect([...new Set(out.variants.map((v) => v.width))]).toEqual([320, 640, 960])
    expect([...new Set(out.variants.map((v) => v.format))]).toEqual(['avif', 'webp'])
  })

  it('handles images smaller than the smallest width', async () => {
    const out = await processImage(await make(100, 50), { formats: ['webp'] })
    expect(out.variants).toHaveLength(1)
    expect(out.variants[0]?.width).toBe(100)
  })
})
