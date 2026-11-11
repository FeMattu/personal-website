import 'server-only'
import { env, type Env } from '@/env'
import { LocalStorageProvider } from './local'
import { S3StorageProvider } from './s3'
import type { StorageProvider } from './types'

export type { StorageProvider } from './types'

export type StorageConfig = Env<'storage'>

/** Builds a provider from validated config. Throws clear errors for incomplete S3 settings. */
export function createStorage(config: StorageConfig): StorageProvider {
  if (config.STORAGE_DRIVER === 's3') {
    const missing = (
      [
        ['S3_BUCKET', config.S3_BUCKET],
        ['AWS_REGION', config.AWS_REGION],
        ['STORAGE_PUBLIC_BASE_URL', config.STORAGE_PUBLIC_BASE_URL],
      ] as const
    )
      .filter(([, value]) => !value)
      .map(([name]) => name)
    if (missing.length > 0) {
      throw new Error(`STORAGE_DRIVER=s3 requires: ${missing.join(', ')}`)
    }
    if (Boolean(config.AWS_ACCESS_KEY_ID) !== Boolean(config.AWS_SECRET_ACCESS_KEY)) {
      throw new Error('Set both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or neither')
    }
    return new S3StorageProvider({
      bucket: config.S3_BUCKET as string,
      region: config.AWS_REGION as string,
      endpoint: config.S3_ENDPOINT,
      forcePathStyle: config.S3_FORCE_PATH_STYLE === 'true',
      publicBaseUrl: config.STORAGE_PUBLIC_BASE_URL as string,
    })
  }
  return new LocalStorageProvider({
    dir: config.LOCAL_STORAGE_DIR,
    publicBaseUrl: config.STORAGE_PUBLIC_BASE_URL,
  })
}

let instance: StorageProvider | undefined

export function getStorage(): StorageProvider {
  instance ??= createStorage(env('storage'))
  return instance
}

/** Test helper. */
export function resetStorage(): void {
  instance = undefined
}
