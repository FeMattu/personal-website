import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, truncateContent } from './helpers'

// The Next data cache is a passthrough in tests: we exercise the real queries and mappers.
vi.mock('next/cache', () => ({
  unstable_cache: <A extends unknown[], R>(fn: (...args: A) => Promise<R>) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

import {
  getCertification,
  getCertifications,
  getEducation,
  getEducations,
  getExperience,
  getExperiences,
  getPhotoAlbums,
  getProject,
  getProjects,
  getSite,
  getSkillCategories,
  getSocialLinks,
  getSpokenLanguages,
} from '@/lib/content'
import { getDashboardCounts } from '@/lib/db/repositories/dashboard'
import { messagesRepo } from '@/lib/db/repositories/messages'

const d = (s: string) => new Date(`${s}T00:00:00Z`)

async function seedMinimal() {
  const tag = await db.tag.create({ data: { slug: 'react', name: 'React' } })
  await db.siteSettings.create({
    data: {
      id: 'site',
      ownerName: 'Test Owner',
      cvPath: '/cv.pdf',
      translations: {
        create: [
          { locale: 'it', role: 'Sviluppatore', bio: 'Uno.\n\nDue.', location: 'Lucca' },
          { locale: 'en', role: 'Developer', bio: '' },
        ],
      },
    },
  })
  await db.experience.create({
    data: {
      slug: 'job',
      organization: 'Acme',
      startDate: d('2024-06-01'),
      translations: {
        create: [
          { locale: 'it', role: 'Sviluppatore', summary: 'Sommario', highlights: ['a', 'b'] },
          { locale: 'en', role: 'Developer', summary: '', highlights: [] },
        ],
      },
      tags: { create: [{ tagId: tag.id }] },
    },
  })
  await db.experience.create({
    data: {
      slug: 'draft-job',
      organization: 'Hidden',
      startDate: d('2024-01-01'),
      status: 'DRAFT',
      translations: { create: [{ locale: 'it', role: 'Bozza' }] },
    },
  })
  await db.education.create({
    data: {
      slug: 'uni',
      institution: 'Uni',
      startDate: d('2020-09-01'),
      translations: { create: [{ locale: 'it', title: 'Laurea' }] },
    },
  })
  await db.certification.create({
    data: {
      slug: 'cert',
      issuedAt: d('2023-05-01'),
      translations: {
        create: [
          { locale: 'it', name: 'Cert IT' },
          { locale: 'en', name: 'Cert' },
        ],
      },
    },
  })
  await db.spokenLanguage.create({
    data: {
      code: 'en',
      name: 'English',
      proficiency: 'FLUENT',
      translations: { create: [{ locale: 'it', detail: 'IELTS' }] },
    },
  })
  const project = await db.project.create({
    data: {
      slug: 'site',
      status: 'PUBLISHED',
      featured: true,
      coverKey: 'uploads/cover/x.jpg',
      translations: { create: [{ locale: 'it', title: 'Sito', summary: 'S', goals: 'G1\n\nG2' }] },
      tags: { create: [{ tagId: tag.id }] },
      images: { create: [{ storageKey: 'uploads/cover/y.jpg', position: 0 }] },
    },
  })
  await db.project.create({
    data: {
      slug: 'wip',
      status: 'DRAFT',
      translations: { create: [{ locale: 'it', title: 'WIP' }] },
    },
  })
  const category = await db.skillCategory.create({
    data: { slug: 'langs', translations: { create: [{ locale: 'it', name: 'Linguaggi' }] } },
  })
  const skill = await db.skill.create({
    data: { slug: 'ts', name: 'TypeScript', level: 'ADVANCED', categoryId: category.id },
  })
  await db.projectSkill.create({ data: { projectId: project.id, skillId: skill.id } })
  await db.socialLink.create({ data: { kind: 'GITHUB', url: 'https://github.com/x', label: 'GH' } })
  await db.photoAlbum.create({
    data: { slug: 'alb', translations: { create: [{ locale: 'it', title: 'Album' }] } },
  })
}

beforeEach(async () => {
  await truncateContent()
  await seedMinimal()
})
afterAll(() => db.$disconnect())

describe('public content read models', () => {
  it('maps the site with per-field locale fallback and paragraph splitting', async () => {
    const it = await getSite('it')
    expect(it).toMatchObject({ ownerName: 'Test Owner', role: 'Sviluppatore', location: 'Lucca' })
    expect(it?.bio).toEqual(['Uno.', 'Due.'])
    const en = await getSite('en')
    expect(en?.role).toBe('Developer')
    expect(en?.bio).toEqual(['Uno.', 'Due.']) // empty EN bio falls back to the default locale
  })

  it('returns only PUBLISHED experiences with fallback, tags and serialisable dates', async () => {
    const list = await getExperiences('en')
    expect(list.map((e) => e.slug)).toEqual(['job'])
    expect(list[0]).toMatchObject({
      role: 'Developer',
      summary: 'Sommario',
      highlights: ['a', 'b'],
      startDate: '2024-06-01',
      endDate: null,
    })
    expect(list[0]?.tags).toEqual([{ slug: 'react', name: 'React' }])
    expect(await getExperience('draft-job', 'it')).toBeNull()
    expect((await getExperience('job', 'it'))?.role).toBe('Sviluppatore')
  })

  it('serves education, certifications, languages and social links', async () => {
    expect((await getEducations('it'))[0]?.title).toBe('Laurea')
    expect((await getEducation('uni', 'en'))?.title).toBe('Laurea')
    expect(await getEducation('nope', 'en')).toBeNull()
    expect((await getCertifications('en'))[0]).toMatchObject({
      name: 'Cert',
      issuedAt: '2023-05-01',
    })
    expect((await getCertification('cert', 'it'))?.name).toBe('Cert IT')
    expect((await getSpokenLanguages('en'))[0]).toMatchObject({ code: 'en', detail: 'IELTS' })
    expect((await getSocialLinks())[0]).toMatchObject({ kind: 'GITHUB', label: 'GH' })
  })

  it('groups skills by category and links related published projects', async () => {
    const [cat] = await getSkillCategories('it')
    expect(cat?.name).toBe('Linguaggi')
    expect(cat?.skills[0]).toMatchObject({ name: 'TypeScript', level: 'ADVANCED' })
    expect(cat?.skills[0]?.projects).toEqual([{ slug: 'site', title: 'Sito' }])
  })

  it('lists published projects only, with images, goals and tags', async () => {
    const projects = await getProjects('it')
    expect(projects.map((p) => p.slug)).toEqual(['site'])
    const p = await getProject('site', 'it')
    expect(p).toMatchObject({ coverKey: 'uploads/cover/x.jpg', featured: true })
    expect(p?.goals).toEqual(['G1', 'G2'])
    expect(p?.images).toHaveLength(1)
    expect(p?.skills).toEqual([{ slug: 'ts', name: 'TypeScript' }])
    expect(await getProject('wip', 'it')).toBeNull()
  })

  it('lists published photo albums with counts', async () => {
    expect(await getPhotoAlbums('it')).toMatchObject([
      { slug: 'alb', title: 'Album', photoCount: 0 },
    ])
  })
})

describe('dashboard + messages repositories', () => {
  it('counts content and new messages', async () => {
    await messagesRepo.create({ name: 'A', email: 'a@b.c', body: 'hello hello' })
    const counts = await getDashboardCounts()
    expect(counts).toMatchObject({ experiences: 2, projects: 2, projectsDraft: 1, messagesNew: 1 })
  })

  it('creates, lists, updates and removes messages; counts per ip hash', async () => {
    const m = await messagesRepo.create({ name: 'A', email: 'a@b.c', body: 'x', ipHash: 'h1' })
    expect(await messagesRepo.countSince('h1', new Date(Date.now() - 60_000))).toBe(1)
    expect(await messagesRepo.countSince('h2', new Date(Date.now() - 60_000))).toBe(0)
    await messagesRepo.setStatus(m.id, 'READ')
    expect((await messagesRepo.list('READ')).map((x) => x.id)).toEqual([m.id])
    expect(await messagesRepo.countNew()).toBe(0)
    await messagesRepo.remove(m.id)
    expect(await messagesRepo.list()).toEqual([])
  })
})
