import type { z } from 'zod'
import { fail, ok, type ActionResult } from '@/lib/action-result'
import { AuthError, assertAdmin } from '@/lib/auth/session'
import { revalidateContent } from '@/lib/revalidate'
import { AdminError } from './errors'
import { fieldErrorsFrom } from './schema-common'

function prismaCode(error: unknown): { code: string; target: string[] } | null {
  if (typeof error !== 'object' || error === null) return null
  const code: unknown = Reflect.get(error, 'code')
  if (typeof code !== 'string' || !/^P\d{4}$/.test(code)) return null
  const meta: unknown = Reflect.get(error, 'meta')
  const rawTarget: unknown =
    typeof meta === 'object' && meta !== null ? Reflect.get(meta, 'target') : undefined
  const target = Array.isArray(rawTarget)
    ? rawTarget.filter((t): t is string => typeof t === 'string')
    : typeof rawTarget === 'string'
      ? [rawTarget]
      : []
  return { code, target }
}

/** Maps any thrown value to a safe `ActionResult` failure (internals are only logged). */
export function toFailure(error: unknown): ReturnType<typeof fail> {
  if (error instanceof AuthError) return fail('Unauthorized')
  if (error instanceof AdminError) return fail(error.message, error.fieldErrors)
  const prisma = prismaCode(error)
  if (prisma?.code === 'P2002') {
    const field = prisma.target.find((t) => t !== 'id') ?? 'slug'
    return fail('A record with this value already exists', { [field]: 'Already in use' })
  }
  if (prisma?.code === 'P2025') return fail('Record not found')
  console.error('[admin action]', error)
  return fail('Something went wrong. Please try again.')
}

/**
 * Standard write pipeline: assertAdmin -> zod -> handler (repository) -> revalidate -> ActionResult.
 * Never throws to the caller.
 */
export async function runWrite<S extends z.ZodType, T = undefined>(
  schema: S,
  input: unknown,
  handler: (data: z.infer<S>) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    await assertAdmin()
    const parsed = schema.safeParse(input)
    if (!parsed.success)
      return fail('Please fix the highlighted fields', fieldErrorsFrom(parsed.error))
    const data = await handler(parsed.data)
    revalidateContent()
    return ok(data)
  } catch (error) {
    return toFailure(error)
  }
}

/** Same as `runWrite` for handlers whose result is not needed by the UI. */
export function runVoid<S extends z.ZodType>(
  schema: S,
  input: unknown,
  handler: (data: z.infer<S>) => Promise<unknown>,
): Promise<ActionResult> {
  return runWrite(schema, input, async (data) => {
    await handler(data)
    return undefined
  })
}
