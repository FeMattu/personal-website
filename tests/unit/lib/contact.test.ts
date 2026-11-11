import { beforeEach, describe, expect, it, vi } from 'vitest'

const repo = vi.hoisted(() => ({ create: vi.fn(), countSince: vi.fn() }))
vi.mock('@/lib/db/repositories/messages', () => ({ messagesRepo: repo }))

import { buildEmail, sendContactEmail, singleLine } from '@/lib/contact/mailer'
import { hashIp, RATE_LIMIT, submitContact } from '@/lib/contact/service'
import { contactSchema } from '@/lib/validation/contact'

const valid = { name: 'Ada', email: 'ada@example.com', message: 'Hello, this is a message.' }
const ctx = { ip: '1.2.3.4', locale: 'en' }

beforeEach(() => {
  repo.create.mockReset().mockResolvedValue({})
  repo.countSince.mockReset().mockResolvedValue(0)
  delete process.env.RESEND_API_KEY
  delete process.env.CONTACT_TO_EMAIL
})

describe('contactSchema', () => {
  it('accepts a valid message', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })
  it('returns i18n keys as messages', () => {
    const r = contactSchema.safeParse({ name: '', email: 'x', message: 'short' })
    expect(r.success).toBe(false)
    const keys = r.error?.issues.map((i) => i.message)
    expect(keys).toEqual(expect.arrayContaining(['nameRequired', 'emailInvalid', 'messageShort']))
  })
})

describe('submitContact', () => {
  it('stores a valid message with a hashed ip and no raw address', async () => {
    const out = await submitContact(valid, ctx)
    expect(out).toEqual({ ok: true })
    const stored = repo.create.mock.calls[0]?.[0]
    expect(stored.ipHash).toBe(hashIp('1.2.3.4'))
    expect(JSON.stringify(stored)).not.toContain('1.2.3.4')
  })

  it('silently drops honeypot submissions', async () => {
    const out = await submitContact({ ...valid, website: 'http://spam' }, ctx)
    expect(out).toEqual({ ok: true })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('rate limits per ip hash', async () => {
    repo.countSince.mockResolvedValue(RATE_LIMIT.max)
    const out = await submitContact(valid, ctx)
    expect(out).toEqual({ ok: false, reason: 'rate_limited' })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('reports field errors for invalid input', async () => {
    const out = await submitContact({ ...valid, email: 'nope' }, ctx)
    expect(out).toMatchObject({
      ok: false,
      reason: 'invalid',
      fieldErrors: { email: 'emailInvalid' },
    })
  })

  it('reports a generic error when storing fails', async () => {
    repo.create.mockRejectedValue(new Error('db down'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await submitContact(valid, ctx)).toEqual({ ok: false, reason: 'error' })
    spy.mockRestore()
  })
})

describe('mailer', () => {
  it('strips CR/LF to prevent header injection', () => {
    expect(singleLine('a\r\nBcc: x')).toBe('a Bcc: x')
    const mail = buildEmail(
      { name: 'A\nB', email: 'a@b.c', subject: 'Hi\r\nBcc: x', body: 'body' },
      'to@x.y',
      'from@x.y',
    )
    expect(mail.subject).not.toMatch(/[\r\n]/)
    expect(mail.reply_to).toBe('a@b.c')
  })

  it('skips silently when not configured', async () => {
    expect(await sendContactEmail({ name: 'a', email: 'a@b.c', body: 'x' })).toBe('skipped')
  })
})
