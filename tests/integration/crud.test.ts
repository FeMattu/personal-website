import { db, signIn, translations, truncateContent } from './helpers'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => vi.fn())
const cache = vi.hoisted(() => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('@/auth', () => ({ auth }))
vi.mock('next/cache', () => cache)
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/content', () => ({ CONTENT_TAG: 'content' }))

import {
  createExperience,
  deleteExperience,
  duplicateExperience,
  reorderExperience,
  setExperienceStatus,
  updateExperience,
} from '@/actions/admin/experience'
import { defaultLocale, locales } from '@/i18n/config'
import type { ExperienceInput } from '@/lib/admin/schema-cv'

const other = locales.find((code) => code !== defaultLocale) ?? 'en'

const experience = (over: Partial<ExperienceInput> = {}): ExperienceInput => ({
  slug: 'acme',
  organization: 'Acme',
  location: '',
  url: '',
  startDate: '2022-01-01',
  endDate: '',
  featured: true,
  status: 'PUBLISHED',
  tags: 'React, Next.js',
  translations: translations({
    role: 'Developer',
    summary: '',
    description: '',
    highlights: 'one\ntwo',
  }),
  ...over,
})

const find = (id: string) =>
  db.experience.findUniqueOrThrow({
    where: { id },
    include: { translations: true, tags: { include: { tag: true } } },
  })

async function created(over: Partial<ExperienceInput> = {}): Promise<string> {
  const result = await createExperience(experience(over))
  if (!result.ok || !result.data) throw new Error(`create failed: ${JSON.stringify(result)}`)
  return result.data.id
}

beforeEach(async () => {
  vi.clearAllMocks()
  signIn(auth, 'admin')
  await truncateContent()
})
afterAll(() => db.$disconnect())

describe('experience CRUD', () => {
  it('creates a row with translations, split highlights and TECH tags, then revalidates', async () => {
    const id = await created()
    const row = await find(id)

    expect(row).toMatchObject({
      slug: 'acme',
      organization: 'Acme',
      position: 0,
      status: 'PUBLISHED',
    })
    expect(row.startDate.toISOString().slice(0, 10)).toBe('2022-01-01')
    expect(row.endDate).toBeNull()
    expect(row.translations.map((t) => t.locale)).toEqual([defaultLocale])
    expect(row.translations[0]?.highlights).toEqual(['one', 'two'])
    expect(row.tags.map((t) => t.tag.name).sort()).toEqual(['Next.js', 'React'])
    expect(row.tags.every((t) => t.tag.kind === 'TECH')).toBe(true)

    expect(cache.revalidateTag).toHaveBeenCalledWith('content', 'max')
    expect(cache.revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('upserts non-empty translations, deletes blank non-default rows, rewrites tags', async () => {
    const id = await created()

    const withOther = experience({
      tags: 'React',
      translations: {
        ...experience().translations,
        [other]: { role: 'Developer (other)', summary: 's', description: '', highlights: '' },
      },
    })
    expect((await updateExperience(id, withOther)).ok).toBe(true)
    let row = await find(id)
    expect(row.translations.map((t) => t.locale).sort()).toEqual([...locales].sort())
    expect(row.tags.map((t) => t.tag.name)).toEqual(['React'])

    const blankedOther = experience({
      translations: {
        ...experience().translations,
        [other]: { role: '', summary: '', description: '', highlights: '' },
      },
    })
    expect((await updateExperience(id, blankedOther)).ok).toBe(true)
    row = await find(id)
    expect(row.translations.map((t) => t.locale)).toEqual([defaultLocale])
  })

  it('maps a duplicated slug to a field error and writes nothing', async () => {
    await created()
    const result = await createExperience(experience())
    expect(result).toMatchObject({ ok: false, fieldErrors: { slug: 'Already in use' } })
    expect(await db.experience.count()).toBe(1)
  })

  it('rejects invalid input without touching the database or the cache', async () => {
    vi.clearAllMocks()
    const result = await createExperience(experience({ slug: 'Bad Slug' }))
    expect(result).toMatchObject({ ok: false, fieldErrors: { slug: expect.any(String) } })
    expect(await db.experience.count()).toBe(0)
    expect(cache.revalidateTag).not.toHaveBeenCalled()
  })

  it('requires the default-locale role', async () => {
    const result = await createExperience(
      experience({
        translations: translations({ role: '', summary: '', description: '', highlights: '' }),
      }),
    )
    expect(result.ok).toBe(false)
    expect(await db.experience.count()).toBe(0)
  })

  it('duplicates as a DRAFT with <slug>-copy, copying translations and tags', async () => {
    const id = await created()
    const first = await duplicateExperience(id)
    const second = await duplicateExperience(id)
    if (!first.ok || !first.data || !second.ok || !second.data) throw new Error('duplicate failed')

    const copy = await find(first.data.id)
    expect(copy).toMatchObject({ slug: 'acme-copy', status: 'DRAFT', position: 1 })
    expect(copy.translations).toHaveLength(1)
    expect(copy.tags).toHaveLength(2)
    expect((await find(second.data.id)).slug).toBe('acme-copy-2')
    expect((await find(id)).status).toBe('PUBLISHED')
  })

  it('toggles status and deletes (children cascade)', async () => {
    const id = await created()
    expect((await setExperienceStatus(id, 'DRAFT')).ok).toBe(true)
    expect((await find(id)).status).toBe('DRAFT')

    expect((await deleteExperience(id)).ok).toBe(true)
    expect(await db.experience.count()).toBe(0)
    expect(await db.experienceTranslation.count()).toBe(0)
    expect(await db.experienceTag.count()).toBe(0)
  })

  it('reports a missing row instead of throwing', async () => {
    expect(await deleteExperience('does-not-exist')).toMatchObject({
      ok: false,
      error: 'Record not found',
    })
    expect(await duplicateExperience('does-not-exist')).toMatchObject({ ok: false })
  })
})

describe('reorder', () => {
  const positions = async () =>
    Object.fromEntries((await db.experience.findMany()).map((r) => [r.slug, r.position]))

  it('rewrites position = index for the whole list in one go', async () => {
    const a = await created({ slug: 'a' })
    const b = await created({ slug: 'b' })
    const c = await created({ slug: 'c' })
    expect(await positions()).toEqual({ a: 0, b: 1, c: 2 })

    expect((await reorderExperience([c, a, b])).ok).toBe(true)
    expect(await positions()).toEqual({ c: 0, a: 1, b: 2 })
  })

  it('rejects anything that is not a permutation and leaves positions untouched', async () => {
    const a = await created({ slug: 'a' })
    const b = await created({ slug: 'b' })
    const c = await created({ slug: 'c' })
    for (const ids of [
      [a, b],
      [a, a, b],
      [a, b, c, 'ghost'],
      [a, b, 'ghost'],
    ]) {
      const result = await reorderExperience(ids)
      expect(result.ok).toBe(false)
    }
    expect(await positions()).toEqual({ a: 0, b: 1, c: 2 })
  })
})
