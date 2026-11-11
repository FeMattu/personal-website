import { describe, expect, it } from 'vitest'
import { defaultLocale, locales } from '@/i18n/config'
import {
  blankAlbum,
  blankCategory,
  blankCertification,
  blankEducation,
  blankExperience,
  blankLanguage,
  blankProject,
  blankSkill,
  blankSocial,
  categoryToForm,
  certificationToForm,
  educationToForm,
  experienceToForm,
  languageToForm,
  photoToForm,
  projectToForm,
  siteToForm,
  skillToForm,
  socialToForm,
  albumToForm,
} from '@/lib/admin/form-values'
import { experienceSchema } from '@/lib/admin/schema-cv'

const date = new Date('2022-05-01T00:00:00.000Z')
const rowBase = { id: 'r1', createdAt: date, updatedAt: date, position: 0 }

describe('form value mappers', () => {
  it('blank values cover every enabled locale', () => {
    for (const blank of [
      blankExperience(),
      blankEducation(),
      blankCertification(),
      blankCategory(),
      blankProject(),
      blankLanguage(),
      blankAlbum(),
      blankSkill('c1'),
    ]) {
      expect(Object.keys(blank.translations)).toEqual([...locales])
    }
    expect(blankSocial().kind).toBe('GITHUB')
    expect(blankSkill('c1').categoryId).toBe('c1')
  })

  it('experienceToForm round-trips through the schema', () => {
    const form = experienceToForm({
      ...rowBase,
      slug: 'acme',
      organization: 'Acme',
      location: null,
      url: null,
      startDate: date,
      endDate: null,
      featured: true,
      status: 'PUBLISHED',
      translations: [
        {
          experienceId: 'r1',
          locale: defaultLocale,
          role: 'Dev',
          summary: null,
          description: 'text',
          highlights: ['a', 'b'],
        },
      ],
      tags: [{ experienceId: 'r1', tagId: 't', tag: { name: 'React' } as never }],
    } as never)
    expect(form.startDate).toBe('2022-05-01')
    expect(form.endDate).toBe('')
    expect(form.tags).toBe('React')
    expect(form.translations[defaultLocale]?.highlights).toBe('a\nb')
    expect(experienceSchema.safeParse(form).success).toBe(true)
  })

  it('maps the remaining resources', () => {
    const t = (extra: object) => [{ locale: defaultLocale, ...extra }]
    expect(
      educationToForm({
        ...rowBase,
        slug: 'u',
        institution: 'U',
        location: null,
        url: null,
        startDate: date,
        endDate: date,
        status: 'DRAFT',
        translations: t({ title: 'BSc', summary: null, description: null, highlights: [] }),
      } as never).translations[defaultLocale]?.title,
    ).toBe('BSc')
    expect(
      certificationToForm({
        ...rowBase,
        slug: 'c',
        issuer: null,
        issuedAt: date,
        url: null,
        status: 'DRAFT',
        translations: t({ name: 'AWS', description: null }),
      } as never).issuedAt,
    ).toBe('2022-05-01')
    expect(
      categoryToForm({
        ...rowBase,
        slug: 'web',
        status: 'PUBLISHED',
        translations: t({ name: 'Web' }),
      } as never).translations[defaultLocale]?.name,
    ).toBe('Web')
    expect(
      skillToForm({
        ...rowBase,
        slug: 'ts',
        name: 'TS',
        level: null,
        categoryId: 'c',
        status: 'PUBLISHED',
        translations: [],
      } as never).level,
    ).toBe('')
    expect(
      projectToForm({
        ...rowBase,
        slug: 'p',
        coverKey: null,
        liveUrl: null,
        repoUrl: null,
        startDate: null,
        featured: false,
        status: 'DRAFT',
        translations: t({ title: 'P', summary: null, description: null, goals: null }),
        skills: [{ skillId: 's1' }],
        tags: [],
      } as never).skillIds,
    ).toEqual(['s1'])
    expect(siteToForm(null).ownerName).toBe('')
    expect(
      socialToForm({
        ...rowBase,
        kind: 'GITHUB',
        label: null,
        url: 'https://x.y',
        status: 'PUBLISHED',
      }).label,
    ).toBe('')
    expect(
      languageToForm({
        ...rowBase,
        code: 'en',
        name: 'English',
        proficiency: 'FLUENT',
        status: 'PUBLISHED',
        translations: t({ detail: 'IELTS' }),
      } as never).translations[defaultLocale]?.detail,
    ).toBe('IELTS')
    expect(
      albumToForm({
        ...rowBase,
        slug: 'a',
        coverPhotoId: null,
        status: 'PUBLISHED',
        translations: t({ title: 'T', description: null }),
      } as never).translations[defaultLocale]?.title,
    ).toBe('T')
    expect(
      photoToForm({
        ...rowBase,
        albumId: null,
        featured: true,
        status: 'DRAFT',
        translations: [],
        tags: [],
      } as never).albumId,
    ).toBe('')
  })
})
