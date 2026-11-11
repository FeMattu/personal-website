import { describe, expect, it } from 'vitest'
import { parseEnv } from '@/env'

describe('parseEnv', () => {
  it('validates a group in isolation', () => {
    expect(parseEnv('db', { DATABASE_URL: 'postgresql://x' }).DATABASE_URL).toBe('postgresql://x')
    expect(() => parseEnv('db', {})).toThrow(/DATABASE_URL/)
  })

  it('requires auth secrets only for the auth group', () => {
    expect(() => parseEnv('auth', { AUTH_SECRET: 'short' })).toThrow(/AUTH_SECRET|ADMIN_EMAIL/)
    const ok = parseEnv('auth', {
      AUTH_SECRET: 'x'.repeat(32),
      ADMIN_EMAIL: 'me@example.com',
      AUTH_GITHUB_ID: '',
    })
    expect(ok.AUTH_GITHUB_ID).toBeUndefined()
  })

  it('applies storage defaults and treats empty strings as unset', () => {
    const s = parseEnv('storage', { STORAGE_DRIVER: '', AWS_REGION: '' })
    expect(s.STORAGE_DRIVER).toBe('local')
    expect(s.LOCAL_STORAGE_DIR).toBe('./storage-data')
    expect(s.AWS_REGION).toBeUndefined()
  })

  it('rejects an unknown storage driver', () => {
    expect(() => parseEnv('storage', { STORAGE_DRIVER: 'ftp' })).toThrow()
  })

  it('defaults the site url', () => {
    expect(parseEnv('site', {}).NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
  })
})
