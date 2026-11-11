import { describe, expect, it } from 'vitest'
import { parseEnv } from '@/env'
import { createStorage, getStorage, resetStorage } from '@/lib/storage'
import { LocalStorageProvider } from '@/lib/storage/local'
import { S3StorageProvider } from '@/lib/storage/s3'

const cfg = (extra: Record<string, string> = {}) => parseEnv('storage', extra)

describe('createStorage', () => {
  it('defaults to local', () => {
    expect(createStorage(cfg())).toBeInstanceOf(LocalStorageProvider)
  })

  it('builds s3 with full config', () => {
    const s = createStorage(
      cfg({
        STORAGE_DRIVER: 's3',
        S3_BUCKET: 'b',
        AWS_REGION: 'eu-west-1',
        STORAGE_PUBLIC_BASE_URL: 'https://cdn.example.com',
        S3_FORCE_PATH_STYLE: 'true',
        S3_ENDPOINT: 'http://localhost:9000',
        AWS_ACCESS_KEY_ID: 'a',
        AWS_SECRET_ACCESS_KEY: 'b',
      }),
    )
    expect(s).toBeInstanceOf(S3StorageProvider)
    expect(s.publicUrl('k.jpg')).toBe('https://cdn.example.com/k.jpg')
  })

  it('lists missing s3 variables', () => {
    expect(() => createStorage(cfg({ STORAGE_DRIVER: 's3' }))).toThrow(
      /S3_BUCKET, AWS_REGION, STORAGE_PUBLIC_BASE_URL/,
    )
  })

  it('rejects half a credential pair', () => {
    expect(() =>
      createStorage(
        cfg({
          STORAGE_DRIVER: 's3',
          S3_BUCKET: 'b',
          AWS_REGION: 'r',
          STORAGE_PUBLIC_BASE_URL: 'https://cdn.example.com',
          AWS_ACCESS_KEY_ID: 'a',
        }),
      ),
    ).toThrow(/both AWS_ACCESS_KEY_ID/)
  })
})

describe('getStorage', () => {
  it('returns a cached singleton', () => {
    resetStorage()
    expect(getStorage()).toBe(getStorage())
    resetStorage()
  })
})
