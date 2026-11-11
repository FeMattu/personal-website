import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { S3StorageProvider } from '@/lib/storage/s3'

const send = vi.fn()
const base = { bucket: 'b', region: 'eu-south-1', publicBaseUrl: 'https://cdn.example.com/' }
let s3: S3StorageProvider

beforeEach(() => {
  send.mockReset()
  s3 = new S3StorageProvider({ ...base, client: { send } as unknown as S3Client })
})

describe('S3StorageProvider', () => {
  it('requires config', () => {
    expect(() => new S3StorageProvider({ ...base, bucket: '' })).toThrow(/S3_BUCKET/)
    expect(() => new S3StorageProvider({ ...base, region: '' })).toThrow(/AWS_REGION/)
    expect(() => new S3StorageProvider({ ...base, publicBaseUrl: '' })).toThrow(
      /STORAGE_PUBLIC_BASE_URL/,
    )
  })

  it('creates its own client when none is injected', () => {
    const own = new S3StorageProvider({
      ...base,
      endpoint: 'http://localhost:9000',
      forcePathStyle: true,
    })
    expect(own.publicUrl('a.jpg')).toBe('https://cdn.example.com/a.jpg')
    expect(() => new S3StorageProvider(base)).not.toThrow()
  })

  it('puts with content type and cache control', async () => {
    send.mockResolvedValue({})
    await s3.put('a.jpg', Buffer.from('x'), { contentType: 'image/jpeg', cacheControl: 'cc' })
    const cmd = send.mock.calls[0]?.[0] as PutObjectCommand
    expect(cmd).toBeInstanceOf(PutObjectCommand)
    expect(cmd.input).toMatchObject({
      Bucket: 'b',
      Key: 'a.jpg',
      ContentType: 'image/jpeg',
      CacheControl: 'cc',
    })
    await s3.put('b.jpg', Buffer.from('x'), { contentType: 'image/jpeg' })
    expect((send.mock.calls[1]?.[0] as PutObjectCommand).input.CacheControl).toBeUndefined()
  })

  it('gets objects and maps not-found to null', async () => {
    send.mockResolvedValueOnce({
      Body: { transformToByteArray: async () => new Uint8Array([1, 2]) },
      ContentType: 'image/png',
    })
    const got = await s3.get('a.png')
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectCommand)
    expect(got).toEqual({ body: Buffer.from([1, 2]), contentType: 'image/png' })

    send.mockResolvedValueOnce({})
    expect(await s3.get('a.png')).toBeNull()
    send.mockResolvedValueOnce({ Body: { transformToByteArray: async () => new Uint8Array() } })
    expect((await s3.get('a.png'))?.contentType).toBeUndefined()
    send.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'NoSuchKey' }))
    expect(await s3.get('a.png')).toBeNull()
    send.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'AccessDenied' }))
    await expect(s3.get('a.png')).rejects.toThrow('x')
  })

  it('deletes', async () => {
    send.mockResolvedValue({})
    await s3.delete('a.png')
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(DeleteObjectCommand)
  })

  it('checks existence with HeadObject', async () => {
    send.mockResolvedValueOnce({})
    expect(await s3.exists('a.png')).toBe(true)
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadObjectCommand)
    send.mockRejectedValueOnce({ name: 'NotFound', $metadata: { httpStatusCode: 404 } })
    expect(await s3.exists('a.png')).toBe(false)
    send.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } })
    expect(await s3.exists('a.png')).toBe(false)
    send.mockRejectedValueOnce(Object.assign(new Error('denied'), { name: 'Forbidden' }))
    await expect(s3.exists('a.png')).rejects.toThrow('denied')
  })

  it('builds CDN urls and rejects unsafe keys', async () => {
    expect(s3.publicUrl('v/x/1.webp')).toBe('https://cdn.example.com/v/x/1.webp')
    expect(() => s3.publicUrl('../x')).toThrow(/Unsafe/)
    await expect(s3.put('../x', Buffer.from('x'), { contentType: 'x' })).rejects.toThrow(/Unsafe/)
  })

  it('presigns PUT urls', async () => {
    const real = new S3StorageProvider({
      ...base,
      bucket: 'my-bucket',
      client: new S3Client({
        region: 'eu-south-1',
        credentials: { accessKeyId: 'AKIATEST', secretAccessKey: 'secret' },
        requestChecksumCalculation: 'WHEN_REQUIRED',
      }),
    })
    const out = await real.presignPut('uploads/cover/x.png', {
      contentType: 'image/png',
      maxBytes: 1000,
      expiresInSec: 60,
    })
    expect(out.url).toContain('my-bucket.s3.eu-south-1.amazonaws.com/uploads/cover/x.png')
    expect(out.url).not.toContain('checksum')
    expect(out.url).toContain('X-Amz-Signature=')
    expect(out.headers['Content-Type']).toBe('image/png')
    await expect(
      real.presignPut('a.png', { contentType: 'image/png', maxBytes: 0, expiresInSec: 60 }),
    ).rejects.toThrow(/maxBytes/)
    await expect(
      real.presignPut('a.png', { contentType: 'image/png', maxBytes: 1, expiresInSec: 0 }),
    ).rejects.toThrow(/expiresInSec/)
  })
})
