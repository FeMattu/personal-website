import { z } from 'zod'
import { defaultLocale, locales } from '@/i18n/config'
import { SLUG_PATTERN } from '@/lib/slug'

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED'] as const
export type ContentStatusValue = (typeof CONTENT_STATUSES)[number]

export const idSchema = z.string().trim().min(1, 'Missing id').max(64)
export const statusSchema = z.enum(CONTENT_STATUSES)
export const reorderSchema = z.array(idSchema).max(1000)

export const text = (max: number) => z.string().trim().max(max, `At most ${max} characters`)
export const requiredText = (max: number) =>
  z.string().trim().min(1, 'Required').max(max, `At most ${max} characters`)

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(80, 'At most 80 characters')
  .regex(SLUG_PATTERN, 'Lowercase letters, digits and single hyphens only')

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Empty string or an absolute http(s) URL. */
export const optionalUrl = z
  .string()
  .trim()
  .max(500, 'At most 500 characters')
  .refine((value) => value === '' || isHttpUrl(value), 'Must be a valid http(s) URL')

const isRealDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export const requiredDate = z.string().refine(isRealDate, 'Use a valid date (YYYY-MM-DD)')
export const optionalDate = z
  .string()
  .refine((value) => value === '' || isRealDate(value), 'Use a valid date (YYYY-MM-DD)')

/**
 * `{ [locale]: fields }`. Only known locales are accepted and, when `required` is given,
 * that field must be filled for the default locale.
 */
export function translationsSchema<F extends z.ZodObject>(fields: F, required: string | null) {
  return z.record(z.string(), fields).superRefine((value, ctx) => {
    for (const locale of Object.keys(value)) {
      if (!(locales as readonly string[]).includes(locale)) {
        ctx.addIssue({ code: 'custom', message: `Unknown locale "${locale}"`, path: [locale] })
      }
    }
    if (required === null) return
    const isBlank = (row: object | undefined, key: string): boolean => {
      const field: unknown = row ? Reflect.get(row, key) : undefined
      return typeof field !== 'string' || field.trim() === ''
    }
    if (isBlank(value[defaultLocale], required)) {
      ctx.addIssue({
        code: 'custom',
        message: `Required for the default language (${defaultLocale.toUpperCase()})`,
        path: [defaultLocale, required],
      })
    }
    // A non-default language with some content must also have the required field.
    for (const [locale, row] of Object.entries(value)) {
      if (locale === defaultLocale || !isBlank(row, required)) continue
      const hasContent = Object.keys(row).some((key) => key !== required && !isBlank(row, key))
      if (hasContent) {
        ctx.addIssue({
          code: 'custom',
          message: 'Required when this language has other content',
          path: [locale, required],
        })
      }
    }
  })
}

/** Wraps a payload schema with the id of the row being edited. */
export const withId = <I>(data: z.ZodType<I>): z.ZodType<{ id: string; data: I }> =>
  z.object({ id: idSchema, data })

/** Flattens a zod error into `{ 'a.b.c': 'message' }` (first message wins). */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!(key in errors)) errors[key] = issue.message
  }
  return errors
}
