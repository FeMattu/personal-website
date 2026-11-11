import { defaultLocale, locales } from '@/i18n/config'
import { slugify } from '@/lib/slug'

export const blankToNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}

/** One entry per non-blank line (textarea <-> string[] columns). */
export const splitLines = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')

export const joinLines = (lines: readonly string[]): string => lines.join('\n')

/** Free-text comma list -> unique tags (by slug), preserving first-seen order. */
export function parseTags(value: string): { slug: string; name: string }[] {
  const seen = new Set<string>()
  const tags: { slug: string; name: string }[] = []
  for (const part of value.split(',')) {
    const name = part.trim()
    const slug = slugify(name)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    tags.push({ slug, name })
  }
  return tags
}

export const joinTags = (tags: readonly { name: string }[]): string =>
  tags.map((t) => t.name).join(', ')

/** `YYYY-MM-DD` -> UTC midnight Date (matches `@db.Date`). */
export const toDbDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`)
export const toDbDateOrNull = (value: string): Date | null =>
  value.trim() === '' ? null : toDbDate(value)
export const fromDbDate = (value: Date | null | undefined): string =>
  value ? value.toISOString().slice(0, 10) : ''

const isFilled = (row: object, keys: readonly string[]): boolean =>
  keys.some((key) => {
    const value: unknown = Reflect.get(row, key)
    return typeof value === 'string' && value.trim() !== ''
  })

export type TranslationPlan<T> = {
  upsert: { locale: string; row: T }[]
  remove: string[]
}

/**
 * Decides which translation rows to write. A row is "filled" when any of `keys` is non-blank.
 * Filled rows are upserted; blank rows are removed, except the default locale when
 * `requireDefault` is true (the schema already forces it to be filled).
 */
export function planTranslations<T extends object>(
  input: Readonly<Record<string, T>>,
  keys: readonly (keyof T & string)[],
  options: { requireDefault?: boolean } = {},
): TranslationPlan<T> {
  const requireDefault = options.requireDefault ?? true
  const plan: TranslationPlan<T> = { upsert: [], remove: [] }
  for (const locale of locales) {
    const row = input[locale]
    if (!row) continue
    if (isFilled(row, keys)) plan.upsert.push({ locale, row })
    else if (!(requireDefault && locale === defaultLocale)) plan.remove.push(locale)
  }
  return plan
}

/** Builds a `{ [locale]: value }` map covering every enabled locale. */
export function localeMap<T>(make: (locale: string) => T): Record<string, T> {
  return Object.fromEntries(locales.map((locale) => [locale, make(locale)]))
}

/** `slug-copy`, then `slug-copy-2`, ... first one not in `taken`. */
export function copySlug(slug: string, taken: ReadonlySet<string>): string {
  const base = `${slug}-copy`
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

/** `{ [locale]: row }` -> `[{ locale, ...row }]`, the shape `missingLocales()` expects. */
export function translationRows<T extends object>(
  map: Readonly<Record<string, T | undefined>>,
): (T & { locale: string })[] {
  return Object.entries(map).flatMap(([locale, row]) => (row ? [{ ...row, locale }] : []))
}
