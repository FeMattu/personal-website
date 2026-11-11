/**
 * Adding a language = one entry in `locales` + `localeNames`, a messages file
 * `src/i18n/messages/<code>.json`, and a `Locale` row (the seed/admin creates it).
 */
export const locales = ['it', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'it'

export const localeNames: Record<Locale, string> = { it: 'Italiano', en: 'English' }

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}
