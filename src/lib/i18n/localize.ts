type WithLocale = { locale: string }

const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0)

/**
 * Resolves a per-locale translation row with field-level fallback to the default locale:
 * a missing row, or an empty field, takes the default-locale value. Returns `null` when neither exists.
 */
export function localize<T extends WithLocale>(
  translations: readonly T[],
  locale: string,
  defaultLocale: string,
): Omit<T, 'locale'> | null {
  const wanted = translations.find((t) => t.locale === locale)
  const fallback = translations.find((t) => t.locale === defaultLocale)
  const base = wanted ?? fallback
  if (!base) return null

  const merged: Record<string, unknown> = { ...base }
  delete merged.locale
  if (fallback && wanted && fallback !== wanted) {
    for (const [key, value] of Object.entries(fallback)) {
      if (key !== 'locale' && isEmpty(merged[key])) merged[key] = value
    }
  }
  return merged as Omit<T, 'locale'>
}

/** Locales (from `all`) for which `field` is empty: used by the admin to flag missing translations. */
export function missingLocales<T extends WithLocale>(
  translations: readonly T[],
  all: readonly string[],
  field: keyof T,
): string[] {
  return all.filter((code) => {
    const row = translations.find((t) => t.locale === code)
    return !row || isEmpty(row[field])
  })
}
