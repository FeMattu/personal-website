import { describe, expect, it } from 'vitest'
import { localize, missingLocales } from '@/lib/i18n/localize'

const rows = [
  { locale: 'it', title: 'Titolo', summary: 'Sommario', highlights: ['a'] },
  { locale: 'en', title: 'Title', summary: '', highlights: [] as string[] },
]

describe('localize', () => {
  it('returns the requested locale', () => {
    expect(localize(rows, 'en', 'it')?.title).toBe('Title')
  })

  it('falls back field by field to the default locale for empty values', () => {
    const en = localize(rows, 'en', 'it')
    expect(en?.summary).toBe('Sommario')
    expect(en?.highlights).toEqual(['a'])
  })

  it('uses the default locale when the requested row is missing', () => {
    expect(localize(rows, 'fr', 'it')?.title).toBe('Titolo')
  })

  it('returns null when nothing exists and never leaks the locale key', () => {
    expect(localize([], 'en', 'it')).toBeNull()
    expect(localize(rows, 'it', 'it')).not.toHaveProperty('locale')
  })
})

describe('missingLocales', () => {
  it('flags locales whose field is empty or absent', () => {
    expect(missingLocales(rows, ['it', 'en', 'fr'], 'summary')).toEqual(['en', 'fr'])
    expect(missingLocales(rows, ['it', 'en'], 'title')).toEqual([])
  })
})
