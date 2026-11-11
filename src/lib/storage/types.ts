export interface PutOptions {
  contentType: string
  cacheControl?: string
}

export interface PresignPutOptions {
  contentType: string
  maxBytes: number
  expiresInSec: number
}

export interface StoredObject {
  body: Buffer
  contentType?: string
}

/** Storage abstraction. The database only ever stores keys; URLs come from `publicUrl`. */
export interface StorageProvider {
  put(key: string, body: Buffer, opts: PutOptions): Promise<void>
  get(key: string): Promise<StoredObject | null>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  publicUrl(key: string): string
  presignPut?(
    key: string,
    opts: PresignPutOptions,
  ): Promise<{ url: string; headers: Record<string, string> }>
}
