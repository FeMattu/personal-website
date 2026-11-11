import { describe, expect, it } from 'vitest'
import { isAdminEmail } from '@/lib/auth/allowlist'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('isAdminEmail', () => {
  it('matches case-insensitively and trims', () => {
    expect(isAdminEmail('  Me@Example.com ', 'me@example.com')).toBe(true)
  })
  it('rejects other or missing e-mails', () => {
    expect(isAdminEmail('other@example.com', 'me@example.com')).toBe(false)
    expect(isAdminEmail(null, 'me@example.com')).toBe(false)
    expect(isAdminEmail('', 'me@example.com')).toBe(false)
  })
})

describe('password hashing', () => {
  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('correct horse')
    expect(hash).not.toContain('$')
    expect(await verifyPassword('correct horse', hash)).toBe(true)
    expect(await verifyPassword('wrong horse', hash)).toBe(false)
  })
  it('uses a random salt', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'))
  })
  it('rejects malformed or missing hashes', async () => {
    expect(await verifyPassword('x', undefined)).toBe(false)
    expect(await verifyPassword('x', 'plaintext')).toBe(false)
    expect(await verifyPassword('x', 'bcrypt:1:2:3:4:5')).toBe(false)
  })
})
