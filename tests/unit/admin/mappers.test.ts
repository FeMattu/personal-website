import { describe, expect, it } from 'vitest'
import { defaultLocale, locales } from '@/i18n/config'
import {
  blankToNull,
  copySlug,
  fromDbDate,
  joinLines,
  joinTags,
  localeMap,
  parseTags,
  planTranslations,
  splitLines,
  toDbDate,
  toDbDateOrNull,
  translationRows,
} from '@/lib/admin/mappers'

const other = locales.find((code) => code !== defaultLocale) ?? 'en'

describe('planTranslations (translation upsert mapping)', () => {
  type Row = { role: string; summary: string }
  const filled: Row = { role: 'Developer', summary: '' }
  const blank: Row = { role: '', summary: 'only a summary' }

  it('upserts filled rows for every enabled locale', () => {
    const plan = planTranslations({ [defaultLocale]: filled, [other]: filled }, ['role'])
    expect(plan.upsert.map((u) => u.locale).sort()).toEqual([...locales].sort())
    expect(plan.remove).toEqual([])
  })

  it('removes a blank non-default row', () => {
    const plan = planTranslations({ [defaultLocale]: filled, [other]: blank }, ['role'])
    expect(plan.remove).toEqual([other])
    expect(plan.upsert.map((u) => u.locale)).toEqual([defaultLocale])
  })

  it('never removes the default locale when it is required', () => {
    const plan = planTranslations({ [defaultLocale]: blank }, ['role'])
    expect(plan.remove).toEqual([])
    expect(plan.upsert).toEqual([])
  })

  it('removes a blank default row when it is optional', () => {
    const plan = planTranslations({ [defaultLocale]: blank }, ['role'], { requireDefault: false })
    expect(plan.remove).toEqual([defaultLocale])
  })

  it('treats a row as filled when ANY listed key has content', () => {
    const plan = planTranslations({ [other]: blank }, ['role', 'summary'])
    expect(plan.upsert).toHaveLength(1)
  })

  it('ignores locales that were not submitted or are unknown', () => {
    const plan = planTranslations({ xx: filled }, ['role'])
    expect(plan).toEqual({ upsert: [], remove: [] })
  })
})

describe('copySlug', () => {
  it('appends -copy', () => {
    expect(copySlug('hello', new Set())).toBe('hello-copy')
  })

  it('finds the first free numbered copy', () => {
    expect(copySlug('hello', new Set(['hello-copy']))).toBe('hello-copy-2')
    expect(copySlug('hello', new Set(['hello-copy', 'hello-copy-2']))).toBe('hello-copy-3')
  })
})

describe('text mappers', () => {
  it('blankToNull', () => {
    expect(blankToNull('  ')).toBeNull()
    expect(blankToNull(undefined)).toBeNull()
    expect(blankToNull(' x ')).toBe('x')
  })

  it('splitLines / joinLines', () => {
    expect(splitLines('a\r\n\n  b  \nc')).toEqual(['a', 'b', 'c'])
    expect(joinLines(['a', 'b'])).toBe('a\nb')
  })

  it('parseTags dedupes by slug and drops empties', () => {
    expect(parseTags('Next.js, next-js, , React ,!!!')).toEqual([
      { slug: 'next-js', name: 'Next.js' },
      { slug: 'react', name: 'React' },
    ])
    expect(joinTags([{ name: 'A' }, { name: 'B' }])).toBe('A, B')
  })

  it('date helpers use UTC midnight', () => {
    const date = toDbDate('2024-03-09')
    expect(date.toISOString()).toBe('2024-03-09T00:00:00.000Z')
    expect(fromDbDate(date)).toBe('2024-03-09')
    expect(fromDbDate(null)).toBe('')
    expect(toDbDateOrNull('')).toBeNull()
    expect(toDbDateOrNull('2024-03-09')).toEqual(date)
  })

  it('localeMap and translationRows', () => {
    const map = localeMap((code) => ({ title: code }))
    expect(Object.keys(map)).toEqual([...locales])
    expect(translationRows(map)).toEqual(locales.map((code) => ({ title: code, locale: code })))
  })
})
