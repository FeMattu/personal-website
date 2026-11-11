import { describe, expect, it } from 'vitest'
import { ADMIN_NAV } from '@/lib/admin/nav'

describe('ADMIN_NAV', () => {
  it('lists every admin section once with a label and an icon', () => {
    expect(ADMIN_NAV.map((item) => item.href)).toEqual([
      '/admin/site',
      '/admin/experience',
      '/admin/education',
      '/admin/certifications',
      '/admin/skills',
      '/admin/projects',
      '/admin/social',
      '/admin/languages',
      '/admin/photos',
      '/admin/messages',
    ])
    for (const item of ADMIN_NAV) {
      expect(item.label).not.toBe('')
      expect(item.icon).toBeDefined()
    }
  })
})
