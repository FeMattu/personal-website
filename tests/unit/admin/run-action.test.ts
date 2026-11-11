import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const auth = vi.hoisted(() => vi.fn())
const revalidateContent = vi.hoisted(() => vi.fn())
vi.mock('@/auth', () => ({ auth }))
vi.mock('@/lib/revalidate', () => ({ revalidateContent }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

import { AdminError } from '@/lib/admin/errors'
import { runVoid, runWrite, toFailure } from '@/lib/admin/run-action'

const schema = z.object({ name: z.string().min(1, 'Required') })
const admin = { user: { isAdmin: true } }

beforeEach(() => {
  vi.clearAllMocks()
  auth.mockResolvedValue(admin)
})

describe('runWrite', () => {
  it('rejects without a session, before validating or writing', async () => {
    auth.mockResolvedValue(null)
    const handler = vi.fn()
    const result = await runWrite(schema, { name: 'x' }, handler)
    expect(result).toEqual({ ok: false, error: 'Unauthorized', fieldErrors: undefined })
    expect(handler).not.toHaveBeenCalled()
    expect(revalidateContent).not.toHaveBeenCalled()
  })

  it('rejects a non-admin session', async () => {
    auth.mockResolvedValue({ user: { isAdmin: false } })
    const result = await runWrite(schema, { name: 'x' }, vi.fn())
    expect(result.ok).toBe(false)
  })

  it('returns field errors for invalid input and does not write', async () => {
    const handler = vi.fn()
    const result = await runWrite(schema, { name: '' }, handler)
    expect(result).toMatchObject({ ok: false, fieldErrors: { name: 'Required' } })
    expect(handler).not.toHaveBeenCalled()
  })

  it('runs the handler, revalidates and returns the data', async () => {
    const result = await runWrite(schema, { name: 'x' }, async (data) => ({ id: data.name }))
    expect(result).toEqual({ ok: true, data: { id: 'x' } })
    expect(revalidateContent).toHaveBeenCalledTimes(1)
  })

  it('never throws: unexpected errors become a generic failure and are logged', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const result = await runWrite(schema, { name: 'x' }, async () => {
      throw new Error('secret connection string')
    })
    expect(result.ok).toBe(false)
    expect(JSON.stringify(result)).not.toContain('secret')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('runVoid', () => {
  it('returns ok without data', async () => {
    const result = await runVoid(schema, { name: 'x' }, async () => 42)
    expect(result).toEqual({ ok: true, data: undefined })
  })
})

describe('toFailure (slug uniqueness mapping)', () => {
  it('maps a unique violation to a field error on the offending column', () => {
    const error = Object.assign(new Error('boom'), { code: 'P2002', meta: { target: ['slug'] } })
    expect(toFailure(error)).toMatchObject({ ok: false, fieldErrors: { slug: 'Already in use' } })
  })

  it('accepts a string target and falls back to slug', () => {
    const withString = Object.assign(new Error(), { code: 'P2002', meta: { target: 'code' } })
    expect(toFailure(withString).fieldErrors).toEqual({ code: 'Already in use' })
    const noMeta = Object.assign(new Error(), { code: 'P2002' })
    expect(toFailure(noMeta).fieldErrors).toEqual({ slug: 'Already in use' })
  })

  it('maps a missing record and AdminError', () => {
    expect(toFailure(Object.assign(new Error(), { code: 'P2025' })).error).toBe('Record not found')
    expect(toFailure(new AdminError('Nope', { file: 'bad' }))).toEqual({
      ok: false,
      error: 'Nope',
      fieldErrors: { file: 'bad' },
    })
  })
})
