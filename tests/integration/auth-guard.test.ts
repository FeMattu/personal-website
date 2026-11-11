import { db, signIn, translations, truncateContent } from './helpers'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => vi.fn())
const cache = vi.hoisted(() => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))
const put = vi.hoisted(() => vi.fn())
vi.mock('@/auth', () => ({ auth }))
vi.mock('next/cache', () => cache)
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/content', () => ({ CONTENT_TAG: 'content' }))
vi.mock('@/lib/storage', () => ({ getStorage: () => ({ put, delete: vi.fn() }) }))

import * as certifications from '@/actions/admin/certifications'
import * as education from '@/actions/admin/education'
import * as experience from '@/actions/admin/experience'
import * as languages from '@/actions/admin/languages'
import * as messages from '@/actions/admin/messages'
import * as photos from '@/actions/admin/photos'
import * as projects from '@/actions/admin/projects'
import * as site from '@/actions/admin/site'
import * as skills from '@/actions/admin/skills'
import * as social from '@/actions/admin/social'
import { defaultLocale } from '@/i18n/config'

const modules = {
  certifications,
  education,
  experience,
  languages,
  messages,
  photos,
  projects,
  site,
  skills,
  social,
}

type Action = (...args: unknown[]) => Promise<unknown>

const exported = Object.entries(modules).flatMap(([moduleName, mod]) =>
  Object.entries(mod).map(([name, fn]) => ({ moduleName, name, fn })),
)

/** A fingerprint of everything an admin write could change. */
async function snapshot(): Promise<string> {
  const [counts, rows] = await Promise.all([
    Promise.all([
      db.experience.count(),
      db.education.count(),
      db.certification.count(),
      db.spokenLanguage.count(),
      db.skillCategory.count(),
      db.skill.count(),
      db.project.count(),
      db.projectImage.count(),
      db.photoAlbum.count(),
      db.photo.count(),
      db.socialLink.count(),
      db.siteSettings.count(),
      db.contactMessage.count(),
      db.tag.count(),
    ]),
    Promise.all([
      db.experience.findMany({ orderBy: { id: 'asc' } }),
      db.project.findMany({ orderBy: { id: 'asc' } }),
      db.contactMessage.findMany({ orderBy: { id: 'asc' } }),
      db.siteSettings.findMany(),
      db.skill.findMany({ orderBy: { id: 'asc' } }),
    ]),
  ])
  return JSON.stringify({ counts, rows })
}

let seeded: {
  experienceId: string
  projectId: string
  messageId: string
  skillId: string
  categoryId: string
}

beforeAll(async () => {
  await truncateContent()
  const exp = await db.experience.create({
    data: {
      slug: 'seed',
      organization: 'Seed',
      startDate: new Date('2020-01-01'),
      status: 'PUBLISHED',
    },
  })
  const project = await db.project.create({ data: { slug: 'seed-project', status: 'PUBLISHED' } })
  const message = await db.contactMessage.create({
    data: { name: 'A', email: 'a@b.it', body: 'hi' },
  })
  const category = await db.skillCategory.create({ data: { slug: 'seed-cat' } })
  const skill = await db.skill.create({
    data: { slug: 'seed-skill', name: 'S', categoryId: category.id },
  })
  await db.siteSettings.create({ data: { id: 'site', ownerName: 'Seed' } })
  seeded = {
    experienceId: exp.id,
    projectId: project.id,
    messageId: message.id,
    skillId: skill.id,
    categoryId: category.id,
  }
})
afterAll(async () => {
  await truncateContent()
  await db.$disconnect()
})

describe('every exported admin action rejects unauthenticated callers', () => {
  it('covers every actions module', () => {
    expect(Object.keys(modules)).toHaveLength(10)
    expect(exported.length).toBeGreaterThan(60)
    expect(exported.every(({ fn }) => typeof fn === 'function')).toBe(true)
  })

  for (const anonymous of ['no session', 'non-admin session'] as const) {
    it(`returns Unauthorized and writes nothing (${anonymous})`, async () => {
      if (anonymous === 'no session') signIn(auth, 'anonymous')
      else auth.mockResolvedValue({ user: { isAdmin: false, email: 'someone@example.com' } })
      vi.clearAllMocks()

      const before = await snapshot()
      const validForm = new FormData()
      validForm.set(
        'file',
        new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'x.png', { type: 'image/png' }),
      )
      const payloads: unknown[][] = [
        [],
        [seeded.experienceId, seeded.experienceId],
        [[seeded.experienceId]],
        [seeded.projectId, validForm],
        [validForm],
        [seeded.messageId, 'ARCHIVED'],
        [seeded.categoryId, [seeded.skillId]],
        [{ slug: 'x', translations: translations({ role: 'x' }) }],
      ]

      for (const { moduleName, name, fn } of exported) {
        for (const args of payloads) {
          const result = await (fn as Action)(...args)
          expect(result, `${moduleName}.${name}(${args.length} args)`).toMatchObject({
            ok: false,
            error: 'Unauthorized',
          })
        }
      }

      expect(await snapshot()).toBe(before)
      expect(put).not.toHaveBeenCalled()
      expect(cache.revalidateTag).not.toHaveBeenCalled()
      expect(cache.revalidatePath).not.toHaveBeenCalled()
    })
  }

  it('sanity check: the same calls DO write when signed in as admin', async () => {
    signIn(auth, 'admin')
    const before = await snapshot()
    const result = await experience.setExperienceStatus(seeded.experienceId, 'DRAFT')
    expect(result.ok).toBe(true)
    expect(await snapshot()).not.toBe(before)
    expect(cache.revalidateTag).toHaveBeenCalled()
    expect(defaultLocale).toBeTruthy()
  })
})
