import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, truncateContent } from './helpers'

const headersMock = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({ headers: headersMock }))

import { sendContactMessage } from '@/actions/contact'
import { RATE_LIMIT } from '@/lib/contact/service'

const valid = { name: 'Ada', email: 'ada@example.com', message: 'A sufficiently long message' }

beforeEach(async () => {
  await truncateContent()
  headersMock.mockResolvedValue(new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))
})
afterAll(() => db.$disconnect())

describe('sendContactMessage (public action, real DB)', () => {
  it('stores a valid message without the raw ip and with the locale', async () => {
    expect(await sendContactMessage(valid, 'en')).toEqual({ status: 'success' })
    const rows = await db.contactMessage.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ name: 'Ada', locale: 'en', status: 'NEW' })
    expect(JSON.stringify(rows[0])).not.toContain('9.9.9.9')
    expect(rows[0]?.ipHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('falls back to the default locale for unknown locales', async () => {
    await sendContactMessage(valid, 'xx')
    expect((await db.contactMessage.findFirst())?.locale).toBe('it')
  })

  it('returns field errors for invalid input and stores nothing', async () => {
    const result = await sendContactMessage({ ...valid, email: 'bad' }, 'en')
    expect(result).toMatchObject({ status: 'invalid', fieldErrors: { email: 'emailInvalid' } })
    expect(await db.contactMessage.count()).toBe(0)
  })

  it('silently ignores honeypot submissions', async () => {
    expect(await sendContactMessage({ ...valid, website: 'http://spam.example' }, 'en')).toEqual({
      status: 'success',
    })
    expect(await db.contactMessage.count()).toBe(0)
  })

  it('rate limits the same sender after the maximum', async () => {
    for (let i = 0; i < RATE_LIMIT.max; i++) {
      expect(await sendContactMessage(valid, 'en')).toEqual({ status: 'success' })
    }
    expect(await sendContactMessage(valid, 'en')).toEqual({
      status: 'error',
      reason: 'rate_limited',
    })
    expect(await db.contactMessage.count()).toBe(RATE_LIMIT.max)

    // a different sender is unaffected
    headersMock.mockResolvedValue(new Headers({ 'x-forwarded-for': '8.8.8.8' }))
    expect(await sendContactMessage(valid, 'en')).toEqual({ status: 'success' })
  })
})
