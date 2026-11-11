import { promises as fs } from 'node:fs'
import path from 'node:path'
import { isSafeKey } from './keys'
import type { PutOptions, StorageProvider, StoredObject } from './types'

const EXT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  pdf: 'application/pdf',
}

export function contentTypeFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TYPES[ext] ?? 'application/octet-stream'
}

export interface LocalStorageOptions {
  dir: string
  publicBaseUrl?: string | undefined
}

export class LocalStorageProvider implements StorageProvider {
  private readonly root: string
  private readonly publicBaseUrl: string

  constructor(options: LocalStorageOptions) {
    this.root = path.resolve(options.dir)
    this.publicBaseUrl = (options.publicBaseUrl ?? '').replace(/\/+$/, '')
  }

  private resolve(key: string): string {
    if (!isSafeKey(key)) throw new Error(`Unsafe storage key: ${key}`)
    const full = path.resolve(this.root, key)
    if (!full.startsWith(this.root + path.sep)) throw new Error(`Unsafe storage key: ${key}`)
    return full
  }

  async put(key: string, body: Buffer, _opts: PutOptions): Promise<void> {
    const file = this.resolve(key)
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, body)
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      const body = await fs.readFile(this.resolve(key))
      return { body, contentType: contentTypeFromKey(key) }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true })
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await fs.stat(this.resolve(key))).isFile()
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
      throw error
    }
  }

  publicUrl(key: string): string {
    if (!isSafeKey(key)) throw new Error(`Unsafe storage key: ${key}`)
    return `${this.publicBaseUrl}/api/media/${key}`
  }
}
