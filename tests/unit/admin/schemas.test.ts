import { describe, expect, it } from 'vitest'
import { defaultLocale, locales } from '@/i18n/config'
import { localeMap } from '@/lib/admin/mappers'
import { fieldErrorsFrom, idSchema, optionalUrl, slugSchema } from '@/lib/admin/schema-common'
import {
  certificationSchema,
  educationSchema,
  experienceSchema,
  type ExperienceInput,
} from '@/lib/admin/schema-cv'
import {
  albumSchema,
  categorySchema,
  messageStatusSchema,
  photoSchema,
  projectSchema,
  siteSchema,
  skillSchema,
  socialSchema,
  spokenLanguageSchema,
} from '@/lib/admin/schema-content'

const other = locales.find((code) => code !== defaultLocale) ?? 'en'

const experience = (): ExperienceInput => ({
  slug: 'acme',
  organization: 'Acme',
  location: '',
  url: '',
  startDate: '2022-01-01',
  endDate: '',
  featured: true,
  status: 'PUBLISHED',
  tags: 'React',
  translations: localeMap((code) => ({
    role: code === defaultLocale ? 'Developer' : '',
    summary: '',
    description: '',
    highlights: '',
  })),
})

describe('common schemas', () => {
  it('slugSchema accepts kebab-case and rejects the rest', () => {
    expect(slugSchema.safeParse('my-slug-2').success).toBe(true)
    for (const bad of ['', 'My-Slug', 'a--b', '-a', 'a_b', 'a b', 'x'.repeat(81)]) {
      expect(slugSchema.safeParse(bad).success).toBe(false)
    }
  })

  it('optionalUrl accepts empty or http(s) only', () => {
    expect(optionalUrl.safeParse('').success).toBe(true)
    expect(optionalUrl.safeParse('https://example.com/x').success).toBe(true)
    expect(optionalUrl.safeParse('javascript:alert(1)').success).toBe(false)
    expect(optionalUrl.safeParse('not a url').success).toBe(false)
  })

  it('idSchema requires a non-empty id', () => {
    expect(idSchema.safeParse('').success).toBe(false)
    expect(idSchema.safeParse('abc').success).toBe(true)
  })

  it('fieldErrorsFrom flattens paths and keeps the first message', () => {
    const result = slugSchema.safeParse('Bad Slug')
    expect(result.success).toBe(false)
    if (!result.success) expect(Object.keys(fieldErrorsFrom(result.error))).toEqual([''])
  })
})

describe('experienceSchema', () => {
  it('accepts a minimal valid payload', () => {
    expect(experienceSchema.safeParse(experience()).success).toBe(true)
  })

  it('requires the role in the default language with a field error path', () => {
    const input = experience()
    input.translations[defaultLocale] = { role: ' ', summary: '', description: '', highlights: '' }
    const result = experienceSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(fieldErrorsFrom(result.error)[`translations.${defaultLocale}.role`]).toMatch(
        /Required/,
      )
    }
  })

  it('rejects an end date before the start date', () => {
    const result = experienceSchema.safeParse({ ...experience(), endDate: '2021-12-31' })
    expect(result.success).toBe(false)
    if (!result.success) expect(fieldErrorsFrom(result.error)).toHaveProperty('endDate')
  })

  it('rejects impossible calendar dates', () => {
    expect(experienceSchema.safeParse({ ...experience(), startDate: '2022-02-31' }).success).toBe(
      false,
    )
    expect(experienceSchema.safeParse({ ...experience(), startDate: '' }).success).toBe(false)
  })

  it('rejects a secondary language that has content but no role', () => {
    const input = experience()
    input.translations[other] = {
      role: '',
      summary: 'only a summary',
      description: '',
      highlights: '',
    }
    const result = experienceSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(fieldErrorsFrom(result.error)).toHaveProperty(`translations.${other}.role`)
    }
  })

  it('rejects unknown locales and invalid slugs', () => {
    const input = experience()
    input.translations.xx = { role: 'x', summary: '', description: '', highlights: '' }
    expect(experienceSchema.safeParse(input).success).toBe(false)
    expect(experienceSchema.safeParse({ ...experience(), slug: 'Bad Slug' }).success).toBe(false)
  })

  it('trims strings', () => {
    const parsed = experienceSchema.parse({ ...experience(), organization: '  Acme  ' })
    expect(parsed.organization).toBe('Acme')
  })
})

describe('other resource schemas', () => {
  const t = <T extends object>(fields: T, req: keyof T & string) =>
    localeMap((code) => ({ ...fields, [req]: code === defaultLocale ? 'Value' : '' }))

  it('educationSchema / certificationSchema require their default-locale field', () => {
    const education = {
      slug: 'uni',
      institution: 'University',
      location: '',
      url: '',
      startDate: '2015-09-01',
      endDate: '2018-07-01',
      status: 'DRAFT',
      translations: t({ title: '', summary: '', description: '', highlights: '' }, 'title'),
    }
    expect(educationSchema.safeParse(education).success).toBe(true)
    expect(educationSchema.safeParse({ ...education, endDate: '2014-01-01' }).success).toBe(false)

    const certification = {
      slug: 'aws',
      issuer: '',
      issuedAt: '',
      url: '',
      status: 'DRAFT',
      translations: t({ name: '', description: '' }, 'name'),
    }
    expect(certificationSchema.safeParse(certification).success).toBe(true)
    expect(
      certificationSchema.safeParse({
        ...certification,
        translations: localeMap(() => ({ name: '', description: '' })),
      }).success,
    ).toBe(false)
  })

  it('categorySchema and skillSchema (level may be empty = not rated)', () => {
    expect(
      categorySchema.safeParse({
        slug: 'web',
        status: 'PUBLISHED',
        translations: t({ name: '' }, 'name'),
      }).success,
    ).toBe(true)
    const skill = {
      slug: 'ts',
      name: 'TypeScript',
      level: '',
      categoryId: 'cat1',
      status: 'PUBLISHED',
      translations: localeMap(() => ({ description: '' })),
    }
    expect(skillSchema.safeParse(skill).success).toBe(true)
    expect(skillSchema.safeParse({ ...skill, level: 'EXPERT' }).success).toBe(true)
    expect(skillSchema.safeParse({ ...skill, level: 'GURU' }).success).toBe(false)
    expect(skillSchema.safeParse({ ...skill, categoryId: '' }).success).toBe(false)
  })

  it('projectSchema', () => {
    const project = {
      slug: 'site',
      liveUrl: 'https://example.com',
      repoUrl: '',
      startDate: '',
      featured: false,
      status: 'DRAFT',
      tags: '',
      skillIds: ['a', 'b'],
      translations: t({ title: '', summary: '', description: '', goals: '' }, 'title'),
    }
    expect(projectSchema.safeParse(project).success).toBe(true)
    expect(projectSchema.safeParse({ ...project, liveUrl: 'ftp://x' }).success).toBe(false)
    expect(projectSchema.safeParse({ ...project, skillIds: [''] }).success).toBe(false)
  })

  it('siteSchema validates the public email', () => {
    const site = {
      ownerName: 'Federico',
      email: '',
      phone: '',
      cvPath: '',
      translations: t(
        {
          role: '',
          tagline: '',
          bio: '',
          interests: '',
          location: '',
          seoTitle: '',
          seoDescription: '',
        },
        'role',
      ),
    }
    expect(siteSchema.safeParse(site).success).toBe(true)
    expect(siteSchema.safeParse({ ...site, email: 'nope' }).success).toBe(false)
    expect(siteSchema.safeParse({ ...site, ownerName: ' ' }).success).toBe(false)
  })

  it('socialSchema allows http(s), mailto and tel only', () => {
    const base = { kind: 'GITHUB', label: '', url: 'https://github.com/x', status: 'PUBLISHED' }
    expect(socialSchema.safeParse(base).success).toBe(true)
    expect(socialSchema.safeParse({ ...base, kind: 'EMAIL', url: 'mailto:a@b.it' }).success).toBe(
      true,
    )
    expect(socialSchema.safeParse({ ...base, url: 'javascript:alert(1)' }).success).toBe(false)
    expect(socialSchema.safeParse({ ...base, kind: 'NOPE' }).success).toBe(false)
  })

  it('spokenLanguageSchema normalises and validates the code', () => {
    const base = {
      code: 'EN',
      name: 'English',
      proficiency: 'FLUENT',
      status: 'PUBLISHED',
      translations: localeMap(() => ({ detail: '' })),
    }
    const parsed = spokenLanguageSchema.safeParse(base)
    expect(parsed.success && parsed.data.code).toBe('en')
    expect(spokenLanguageSchema.safeParse({ ...base, code: 'english' }).success).toBe(false)
  })

  it('albumSchema requires a default-locale title; photoSchema has no required text', () => {
    expect(
      albumSchema.safeParse({
        slug: 'trip',
        status: 'PUBLISHED',
        translations: localeMap(() => ({ title: '', description: '' })),
      }).success,
    ).toBe(false)
    expect(
      photoSchema.safeParse({
        albumId: '',
        featured: false,
        status: 'DRAFT',
        tags: 'sunset',
        translations: localeMap(() => ({ title: '', description: '', alt: '' })),
      }).success,
    ).toBe(true)
  })

  it('messageStatusSchema', () => {
    expect(messageStatusSchema.safeParse({ id: 'm1', status: 'ARCHIVED' }).success).toBe(true)
    expect(messageStatusSchema.safeParse({ id: 'm1', status: 'SPAM' }).success).toBe(false)
  })
})
