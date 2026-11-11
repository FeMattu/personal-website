import { db, signIn, translations, truncateContent } from './helpers'
import sharp from 'sharp'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => vi.fn())
const cache = vi.hoisted(() => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))
const store = vi.hoisted(() => ({
  objects: new Map<string, { contentType: string; cacheControl?: string }>(),
  deleted: [] as string[],
}))
vi.mock('@/auth', () => ({ auth }))
vi.mock('next/cache', () => cache)
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/content', () => ({ CONTENT_TAG: 'content' }))
vi.mock('@/lib/storage', () => ({
  getStorage: () => ({
    put: async (
      key: string,
      _body: Buffer,
      opts: { contentType: string; cacheControl?: string },
    ) => {
      store.objects.set(key, opts)
    },
    delete: async (key: string) => {
      store.deleted.push(key)
    },
  }),
}))

import { deleteMessage, setMessageStatus } from '@/actions/admin/messages'
import {
  addProjectImage,
  createProject,
  deleteProject,
  duplicateProject,
  removeProjectImage,
  reorderProjectImages,
  uploadProjectCover,
} from '@/actions/admin/projects'
import { createAlbum, deleteAlbum, updatePhoto, uploadPhoto } from '@/actions/admin/photos'
import { saveSite, uploadAvatar } from '@/actions/admin/site'
import {
  createCategory,
  createSkill,
  deleteCategory,
  duplicateSkill,
  reorderSkills,
} from '@/actions/admin/skills'
import { createSocial, reorderSocial } from '@/actions/admin/social'
import { createLanguage } from '@/actions/admin/languages'
import { defaultLocale, locales } from '@/i18n/config'
import { localeMap } from '@/lib/admin/mappers'
import type { ProjectInput } from '@/lib/admin/schema-content'

const other = locales.find((code) => code !== defaultLocale) ?? 'en'

async function pngFile(name = 'a.png', color = '#336699'): Promise<File> {
  const bytes = await sharp({
    create: { width: 40, height: 30, channels: 3, background: color },
  })
    .png()
    .toBuffer()
  return new File([new Uint8Array(bytes)], name, { type: 'image/png' })
}

const formWith = (file: File, extra: Record<string, string> = {}): FormData => {
  const form = new FormData()
  form.set('file', file)
  for (const [key, value] of Object.entries(extra)) form.set(key, value)
  return form
}

function idOf(result: { ok: boolean; data?: { id: string } | undefined }): string {
  if (!result.ok || !result.data) throw new Error(`expected ok result: ${JSON.stringify(result)}`)
  return result.data.id
}

beforeEach(async () => {
  vi.clearAllMocks()
  store.objects.clear()
  store.deleted.length = 0
  signIn(auth, 'admin')
  await truncateContent()
})
afterAll(() => db.$disconnect())

describe('skills', () => {
  const category = (slug = 'web') => ({
    slug,
    status: 'PUBLISHED' as const,
    translations: translations({ name: 'Web' }),
  })
  const skill = (categoryId: string, slug: string) => ({
    slug,
    name: slug.toUpperCase(),
    level: '' as const,
    categoryId,
    status: 'PUBLISHED' as const,
    translations: localeMap(() => ({ description: '' })),
  })

  it('creates categories and skills (unrated level -> null) and orders skills inside a category', async () => {
    const categoryId = idOf(await createCategory(category()))
    const a = idOf(await createSkill(skill(categoryId, 'ts')))
    const b = idOf(await createSkill(skill(categoryId, 'go')))
    const c = idOf(await createSkill({ ...skill(categoryId, 'rust'), level: 'ADVANCED' }))

    const rows = await db.skill.findMany({ orderBy: { position: 'asc' } })
    expect(rows.map((r) => r.slug)).toEqual(['ts', 'go', 'rust'])
    expect(rows[0]?.level).toBeNull()
    expect(rows[2]?.level).toBe('ADVANCED')

    expect((await reorderSkills(categoryId, [c, a, b])).ok).toBe(true)
    expect((await db.skill.findMany({ orderBy: { position: 'asc' } })).map((r) => r.slug)).toEqual([
      'rust',
      'ts',
      'go',
    ])
    // A skill list that does not match the category is rejected.
    expect((await reorderSkills(categoryId, [a, b])).ok).toBe(false)
  })

  it('stores optional skill descriptions per locale and removes blank ones', async () => {
    const categoryId = idOf(await createCategory(category()))
    const id = idOf(
      await createSkill({
        ...skill(categoryId, 'ts'),
        translations: {
          [defaultLocale]: { description: 'Typed JS' },
          [other]: { description: '' },
        },
      }),
    )
    expect(await db.skillTranslation.count({ where: { skillId: id } })).toBe(1)
  })

  it('duplicates a skill as DRAFT in the same category', async () => {
    const categoryId = idOf(await createCategory(category()))
    const id = idOf(await createSkill(skill(categoryId, 'ts')))
    const copyId = idOf(await duplicateSkill(id))
    expect(await db.skill.findUniqueOrThrow({ where: { id: copyId } })).toMatchObject({
      slug: 'ts-copy',
      status: 'DRAFT',
      categoryId,
    })
  })

  it('deleting a category removes its skills', async () => {
    const categoryId = idOf(await createCategory(category()))
    await createSkill(skill(categoryId, 'ts'))
    expect((await deleteCategory(categoryId)).ok).toBe(true)
    expect(await db.skill.count()).toBe(0)
  })
})

describe('projects', () => {
  const project = (skillIds: string[] = [], slug = 'portfolio'): ProjectInput => ({
    slug,
    liveUrl: 'https://example.com',
    repoUrl: '',
    startDate: '',
    featured: false,
    status: 'DRAFT',
    tags: 'Next.js, Prisma',
    skillIds,
    translations: translations({ title: 'Portfolio', summary: '', description: '', goals: '' }),
  })

  it('creates a project with tags and linked skills, ignoring unknown skill ids', async () => {
    const categoryId = idOf(
      await createCategory({
        slug: 'web',
        status: 'PUBLISHED',
        translations: translations({ name: 'Web' }),
      }),
    )
    const skillId = idOf(
      await createSkill({
        slug: 'ts',
        name: 'TS',
        level: '',
        categoryId,
        status: 'PUBLISHED',
        translations: localeMap(() => ({ description: '' })),
      }),
    )
    const id = idOf(await createProject(project([skillId, 'ghost'])))
    const row = await db.project.findUniqueOrThrow({
      where: { id },
      include: { skills: true, tags: true, translations: true },
    })
    expect(row.skills.map((s) => s.skillId)).toEqual([skillId])
    expect(row.tags).toHaveLength(2)
    expect(row.liveUrl).toBe('https://example.com')
    expect(row.repoUrl).toBeNull()
  })

  it('uploads a cover and gallery images, stores ONLY keys, and never deletes storage objects', async () => {
    const id = idOf(await createProject(project()))

    const cover = await uploadProjectCover(id, formWith(await pngFile('c.png')))
    expect(cover.ok).toBe(true)
    const row = await db.project.findUniqueOrThrow({ where: { id } })
    expect(row.coverKey).toMatch(/^uploads\/cover\/[a-f0-9]{64}\.png$/)
    expect(store.objects.get(row.coverKey ?? '')).toMatchObject({
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000, immutable',
    })

    const first = idOf(await addProjectImage(id, formWith(await pngFile('1.png', '#aa0000'))))
    const second = idOf(await addProjectImage(id, formWith(await pngFile('2.png', '#00aa00'))))
    expect((await reorderProjectImages(id, [second, first])).ok).toBe(true)
    expect(
      (
        await db.projectImage.findMany({ where: { projectId: id }, orderBy: { position: 'asc' } })
      ).map((i) => i.id),
    ).toEqual([second, first])
    expect((await reorderProjectImages(id, [first])).ok).toBe(false)

    expect((await removeProjectImage(id, first)).ok).toBe(true)
    expect(await db.projectImage.count({ where: { projectId: id } })).toBe(1)

    // Duplicating copies the image rows; deleting a project keeps the stored objects.
    const copyId = idOf(await duplicateProject(id))
    expect(await db.projectImage.count({ where: { projectId: copyId } })).toBe(1)
    expect((await deleteProject(id)).ok).toBe(true)
    expect(store.deleted).toEqual([])
    expect(store.objects.size).toBe(3)
  })

  it('rejects non-image uploads and writes nothing', async () => {
    const id = idOf(await createProject(project()))
    const fake = new File([new Uint8Array(Buffer.from('not an image'))], 'x.png', {
      type: 'image/png',
    })
    const result = await uploadProjectCover(id, formWith(fake))
    expect(result).toMatchObject({ ok: false, fieldErrors: { file: expect.any(String) } })
    expect(store.objects.size).toBe(0)
    expect((await db.project.findUniqueOrThrow({ where: { id } })).coverKey).toBeNull()
  })

  it('rejects a missing file', async () => {
    const id = idOf(await createProject(project()))
    expect((await uploadProjectCover(id, new FormData())).ok).toBe(false)
  })
})

describe('site settings', () => {
  const site = {
    ownerName: 'Federico',
    email: 'f@example.com',
    phone: '',
    cvPath: '',
    translations: translations({
      role: 'Developer',
      tagline: 'Hi',
      bio: '',
      interests: '',
      location: '',
      seoTitle: '',
      seoDescription: '',
    }),
  }

  it('upserts the singleton row and per-locale texts', async () => {
    expect((await saveSite(site)).ok).toBe(true)
    expect((await saveSite({ ...site, ownerName: 'Fede' })).ok).toBe(true)
    const row = await db.siteSettings.findUniqueOrThrow({
      where: { id: 'site' },
      include: { translations: true },
    })
    expect(row.ownerName).toBe('Fede')
    expect(row.phone).toBeNull()
    expect(row.translations).toHaveLength(1)
    expect(row.translations[0]).toMatchObject({
      locale: defaultLocale,
      role: 'Developer',
      tagline: 'Hi',
    })
  })

  it('stores only the avatar key', async () => {
    await saveSite(site)
    const result = await uploadAvatar(formWith(await pngFile('me.png')))
    expect(result.ok).toBe(true)
    const row = await db.siteSettings.findUniqueOrThrow({ where: { id: 'site' } })
    expect(row.avatarKey).toMatch(/^uploads\/avatar\/[a-f0-9]{64}\.png$/)
  })

  it('fails cleanly when the settings row does not exist yet', async () => {
    expect(await uploadAvatar(formWith(await pngFile()))).toMatchObject({ ok: false })
  })
})

describe('social links, languages and messages', () => {
  it('creates and reorders social links', async () => {
    const a = idOf(
      await createSocial({
        kind: 'GITHUB',
        label: '',
        url: 'https://github.com/x',
        status: 'PUBLISHED',
      }),
    )
    const b = idOf(
      await createSocial({
        kind: 'EMAIL',
        label: 'Mail',
        url: 'mailto:a@b.it',
        status: 'PUBLISHED',
      }),
    )
    expect((await reorderSocial([b, a])).ok).toBe(true)
    expect(
      (await db.socialLink.findMany({ orderBy: { position: 'asc' } })).map((r) => r.id),
    ).toEqual([b, a])
  })

  it('creates a spoken language and maps a duplicate code to a field error', async () => {
    const input = {
      code: 'en',
      name: 'English',
      proficiency: 'FLUENT' as const,
      status: 'PUBLISHED' as const,
      translations: { [defaultLocale]: { detail: 'IELTS 7' }, [other]: { detail: '' } },
    }
    expect((await createLanguage(input)).ok).toBe(true)
    expect(await createLanguage(input)).toMatchObject({
      ok: false,
      fieldErrors: { code: 'Already in use' },
    })
  })

  it('changes message status and deletes messages', async () => {
    const message = await db.contactMessage.create({
      data: { name: 'Ann', email: 'ann@example.com', body: 'Hello' },
    })
    expect((await setMessageStatus(message.id, 'READ')).ok).toBe(true)
    expect((await db.contactMessage.findUniqueOrThrow({ where: { id: message.id } })).status).toBe(
      'READ',
    )
    expect((await setMessageStatus(message.id, 'SPAM' as never)).ok).toBe(false)
    expect((await deleteMessage(message.id)).ok).toBe(true)
    expect(await db.contactMessage.count()).toBe(0)
  })
})

describe('albums and photos', () => {
  it('uploads a photo (ingest + storage), edits it and keeps the album when the photo is deleted', async () => {
    const albumId = idOf(
      await createAlbum({
        slug: 'trip',
        status: 'PUBLISHED',
        translations: translations({ title: 'Trip', description: '' }),
      }),
    )
    const image = await sharp({
      create: { width: 640, height: 480, channels: 3, background: '#445566' },
    })
      .jpeg()
      .toBuffer()
    const file = new File([new Uint8Array(image)], 'p.jpg', { type: 'image/jpeg' })

    const uploaded = await uploadPhoto(formWith(file, { albumId }))
    const photoId = idOf(uploaded)
    const photo = await db.photo.findUniqueOrThrow({
      where: { id: photoId },
      include: { variants: true },
    })
    expect(photo).toMatchObject({ albumId, status: 'DRAFT', width: 640, height: 480 })
    expect(photo.variants.length).toBeGreaterThan(0)
    expect(photo.originalKey).toMatch(/^originals\//)
    expect(store.objects.size).toBeGreaterThan(photo.variants.length)

    // The same bytes cannot be uploaded twice.
    expect(await uploadPhoto(formWith(file))).toMatchObject({
      ok: false,
      error: 'This photo was already uploaded',
    })

    const update = await updatePhoto(photoId, {
      albumId: '',
      featured: true,
      status: 'PUBLISHED',
      tags: 'sunset, sea',
      translations: {
        [defaultLocale]: { title: 'Sunset', description: '', alt: 'A sunset' },
        [other]: { title: '', description: '', alt: '' },
      },
    })
    expect(update.ok).toBe(true)
    const edited = await db.photo.findUniqueOrThrow({
      where: { id: photoId },
      include: { translations: true, tags: { include: { tag: true } } },
    })
    expect(edited).toMatchObject({ albumId: null, featured: true, status: 'PUBLISHED' })
    expect(edited.translations).toHaveLength(1)
    expect(edited.tags.every((t) => t.tag.kind === 'PHOTO')).toBe(true)

    // Deleting an album keeps its photos.
    await db.photo.update({ where: { id: photoId }, data: { albumId } })
    expect((await deleteAlbum(albumId)).ok).toBe(true)
    expect((await db.photo.findUniqueOrThrow({ where: { id: photoId } })).albumId).toBeNull()
  })
})
