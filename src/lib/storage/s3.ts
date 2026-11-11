import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { IMMUTABLE_CACHE_CONTROL, isSafeKey } from './keys'
import type { PresignPutOptions, PutOptions, StorageProvider, StoredObject } from './types'

export interface S3StorageOptions {
  client?: S3Client
  bucket: string
  region: string
  endpoint?: string | undefined
  forcePathStyle?: boolean | undefined
  publicBaseUrl: string
}

function isNotFound(error: unknown): boolean {
  const e = error as { name?: string; $metadata?: { httpStatusCode?: number } } | null
  return e?.name === 'NoSuchKey' || e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly publicBaseUrl: string

  constructor(options: S3StorageOptions) {
    if (!options.bucket) throw new Error('S3 storage requires S3_BUCKET')
    if (!options.region) throw new Error('S3 storage requires AWS_REGION')
    if (!options.publicBaseUrl) {
      throw new Error('S3 storage requires STORAGE_PUBLIC_BASE_URL (CloudFront / CDN base URL)')
    }
    this.bucket = options.bucket
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, '')
    this.client =
      options.client ??
      new S3Client({
        region: options.region,
        ...(options.endpoint ? { endpoint: options.endpoint } : {}),
        forcePathStyle: options.forcePathStyle ?? false,
        // Newer SDKs add a CRC32 of the (empty) body to presigned PUT URLs, which makes browser
        // uploads fail with a checksum mismatch. Only compute checksums when an operation requires it.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      })
  }

  private check(key: string): void {
    if (!isSafeKey(key)) throw new Error(`Unsafe storage key: ${key}`)
  }

  async put(key: string, body: Buffer, opts: PutOptions): Promise<void> {
    this.check(key)
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: opts.contentType,
        ...(opts.cacheControl ? { CacheControl: opts.cacheControl } : {}),
      }),
    )
  }

  async get(key: string): Promise<StoredObject | null> {
    this.check(key)
    try {
      const out = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
      if (!out.Body) return null
      const bytes = await out.Body.transformToByteArray()
      return {
        body: Buffer.from(bytes),
        ...(out.ContentType ? { contentType: out.ContentType } : {}),
      }
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    this.check(key)
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  async exists(key: string): Promise<boolean> {
    this.check(key)
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      return true
    } catch (error) {
      if (isNotFound(error)) return false
      throw error
    }
  }

  publicUrl(key: string): string {
    this.check(key)
    return `${this.publicBaseUrl}/${key}`
  }

  /**
   * Presigned PUT for direct browser uploads. S3 cannot enforce a maximum size on a presigned PUT,
   * so `maxBytes` is only validated here; callers must re-validate the stored object (ingest does).
   */
  async presignPut(
    key: string,
    opts: PresignPutOptions,
  ): Promise<{ url: string; headers: Record<string, string> }> {
    this.check(key)
    if (!(opts.maxBytes > 0)) throw new Error('presignPut requires a positive maxBytes')
    if (!(opts.expiresInSec > 0)) throw new Error('presignPut requires a positive expiresInSec')
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: opts.contentType,
        CacheControl: IMMUTABLE_CACHE_CONTROL,
      }),
      { expiresIn: opts.expiresInSec, signableHeaders: new Set(['content-type', 'cache-control']) },
    )
    return {
      url,
      headers: { 'Content-Type': opts.contentType, 'Cache-Control': IMMUTABLE_CACHE_CONTROL },
    }
  }
}
