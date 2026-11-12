import { describe, expect, it } from 'vitest'
import { formatMonthYear, formatPeriod, formatYear, yearsSince } from '@/lib/dates'
import { mediaUrl } from '@/lib/media'
import { activeKeyForPath, NAV_ITEMS, SPY_SECTIONS } from '@/lib/navigation'
import { buildMetadata, localizedPath } from '@/lib/seo'
import { SLUG_PATTERN, slugify } from '@/lib/slug'
import { fail, ok } from '@/lib/action-result'

describe('dates', () => {
  it('formats civil dates without timezone drift', () => {
    expect(formatMonthYear('2026-02-01', 'en')).toBe('Feb 2026')
    expect(formatYear('2024-12-31', 'en')).toBe('2024')
  })
  it('renders an open period with the present label', () => {
    expect(formatPeriod('2025-09-01', null, 'en', 'Present')).toBe('Sep 2025 – Present')
    expect(formatPeriod('2025-09-01', '2026-02-01', 'en', 'Present')).toContain('Feb 2026')
  })
})

describe('yearsSince', () => {
  it('counts whole years and respects the anniversary', () => {
    expect(yearsSince('2020-06-15', new Date('2026-06-14T00:00:00Z'))).toBe(5)
    expect(yearsSince('2020-06-15', new Date('2026-06-15T00:00:00Z'))).toBe(6)
    expect(yearsSince('2030-01-01', new Date('2026-01-01T00:00:00Z'))).toBe(0)
  })
})

describe('slug', () => {
  it('slugifies accents, symbols and ampersands', () => {
    expect(slugify('Università di Pisa & Co.')).toBe('universita-di-pisa-and-co')
    expect(SLUG_PATTERN.test(slugify('C/C++'))).toBe(true)
  })
})

describe('navigation', () => {
  it('has anchors for home sections and a page for photos', () => {
    expect(SPY_SECTIONS).toEqual(['experience', 'education', 'skills', 'projects', 'contact'])
    expect(NAV_ITEMS.find((i) => i.key === 'photos')).toMatchObject({
      kind: 'page',
      href: '/photos',
    })
  })
  it('maps paths to the active entry', () => {
    expect(activeKeyForPath('/projects/x')).toBe('projects')
    expect(activeKeyForPath('/certifications/ielts')).toBe('education')
    expect(activeKeyForPath('/')).toBeNull()
  })
})

describe('seo', () => {
  it('builds hreflang alternates incl. x-default', () => {
    const m = buildMetadata({ locale: 'en', path: '/projects', title: 'P' })
    const languages = m.alternates?.languages as Record<string, string>
    expect(Object.keys(languages)).toEqual(expect.arrayContaining(['it', 'en', 'x-default']))
    expect(languages['x-default']).toContain('/it/projects')
    expect(localizedPath('it', '/')).toBe('/it')
  })
})

describe('media + action result', () => {
  it('builds media urls from keys', () => {
    expect(mediaUrl('uploads/avatar/a b.jpg')).toBe('/api/media/uploads/avatar/a%20b.jpg')
  })
  it('wraps results', () => {
    expect(ok(1)).toEqual({ ok: true, data: 1 })
    expect(fail('x', { a: 'b' })).toEqual({ ok: false, error: 'x', fieldErrors: { a: 'b' } })
  })
})
