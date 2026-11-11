import 'server-only'
import type { ContentStatus, MessageStatus } from '@prisma/client'
import { blankToNull, planTranslations } from '@/lib/admin/mappers'
import type { SiteInput, SocialInput, SpokenLanguageInput } from '@/lib/admin/schema-content'
import { prisma } from '@/lib/db/prisma'
import { applyOrder, freeCopySlug, nextPosition, notFound, type Tx } from './admin-shared'

const byPosition = { position: 'asc' } as const

// ------------------------------------------------------------------ site settings

export const siteRepo = {
  get: () =>
    prisma.siteSettings.findUnique({ where: { id: 'site' }, include: { translations: true } }),

  save: (input: SiteInput) =>
    prisma.$transaction(async (tx) => {
      const scalars = {
        ownerName: input.ownerName,
        email: blankToNull(input.email),
        phone: blankToNull(input.phone),
        cvPath: blankToNull(input.cvPath),
      }
      await tx.siteSettings.upsert({
        where: { id: 'site' },
        create: { id: 'site', ...scalars },
        update: scalars,
      })
      const plan = planTranslations(input.translations, ['role'])
      for (const { locale, row } of plan.upsert) {
        const data = {
          role: row.role,
          tagline: blankToNull(row.tagline),
          bio: blankToNull(row.bio),
          interests: blankToNull(row.interests),
          location: blankToNull(row.location),
          seoTitle: blankToNull(row.seoTitle),
          seoDescription: blankToNull(row.seoDescription),
        }
        await tx.siteSettingsTranslation.upsert({
          where: { settingsId_locale: { settingsId: 'site', locale } },
          create: { settingsId: 'site', locale, ...data },
          update: data,
        })
      }
      if (plan.remove.length > 0) {
        await tx.siteSettingsTranslation.deleteMany({
          where: { settingsId: 'site', locale: { in: plan.remove } },
        })
      }
    }),

  /** Stores only the storage key (or clears it). Requires the settings row to exist. */
  setAvatar: (avatarKey: string | null) =>
    prisma.siteSettings.update({ where: { id: 'site' }, data: { avatarKey } }),
}

// ------------------------------------------------------------------ social links

const socialScalars = (input: SocialInput) => ({
  kind: input.kind,
  label: blankToNull(input.label),
  url: input.url,
  status: input.status,
})

export const socialRepo = {
  list: () => prisma.socialLink.findMany({ orderBy: byPosition }),

  create: (input: SocialInput) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.socialLink.aggregate({ _max: { position: true } })
      const row = await tx.socialLink.create({
        data: { ...socialScalars(input), position: nextPosition(max._max.position) },
      })
      return { id: row.id }
    }),

  update: async (id: string, input: SocialInput) => {
    await prisma.socialLink.update({ where: { id }, data: socialScalars(input) })
    return { id }
  },

  remove: (id: string) => prisma.socialLink.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.socialLink.update({ where: { id }, data: { status } }),

  duplicate: (id: string) =>
    prisma.$transaction(async (tx) => {
      const src = await tx.socialLink.findUnique({ where: { id } })
      if (!src) return notFound()
      const max = await tx.socialLink.aggregate({ _max: { position: true } })
      const copy = await tx.socialLink.create({
        data: {
          kind: src.kind,
          label: src.label,
          url: src.url,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
        },
      })
      return { id: copy.id }
    }),

  reorder: (ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (await tx.socialLink.findMany({ select: { id: true } })).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.socialLink.update({ where: { id: rowId }, data: { position } }),
      )
    }),
}

// ------------------------------------------------------------------ spoken languages

async function writeLanguageTranslations(tx: Tx, id: string, input: SpokenLanguageInput) {
  const plan = planTranslations(input.translations, ['detail'], { requireDefault: false })
  for (const { locale, row } of plan.upsert) {
    const detail = blankToNull(row.detail)
    await tx.spokenLanguageTranslation.upsert({
      where: { spokenLanguageId_locale: { spokenLanguageId: id, locale } },
      create: { spokenLanguageId: id, locale, detail },
      update: { detail },
    })
  }
  if (plan.remove.length > 0) {
    await tx.spokenLanguageTranslation.deleteMany({
      where: { spokenLanguageId: id, locale: { in: plan.remove } },
    })
  }
}

const languageScalars = (input: SpokenLanguageInput) => ({
  code: input.code,
  name: input.name,
  proficiency: input.proficiency,
  status: input.status,
})

export const spokenLanguageRepo = {
  list: () =>
    prisma.spokenLanguage.findMany({ orderBy: byPosition, include: { translations: true } }),

  create: (input: SpokenLanguageInput) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.spokenLanguage.aggregate({ _max: { position: true } })
      const row = await tx.spokenLanguage.create({
        data: { ...languageScalars(input), position: nextPosition(max._max.position) },
      })
      await writeLanguageTranslations(tx, row.id, input)
      return { id: row.id }
    }),

  update: (id: string, input: SpokenLanguageInput) =>
    prisma.$transaction(async (tx) => {
      await tx.spokenLanguage.update({ where: { id }, data: languageScalars(input) })
      await writeLanguageTranslations(tx, id, input)
      return { id }
    }),

  remove: (id: string) => prisma.spokenLanguage.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.spokenLanguage.update({ where: { id }, data: { status } }),

  duplicate: (id: string) =>
    prisma.$transaction(async (tx) => {
      const src = await tx.spokenLanguage.findUnique({
        where: { id },
        include: { translations: true },
      })
      if (!src) return notFound()
      const code = await freeCopySlug(src.code, async (prefix) =>
        (await tx.spokenLanguage.findMany({ where: { code: { startsWith: prefix } } })).map(
          (r) => r.code,
        ),
      )
      const max = await tx.spokenLanguage.aggregate({ _max: { position: true } })
      const copy = await tx.spokenLanguage.create({
        data: {
          code,
          name: src.name,
          proficiency: src.proficiency,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
          translations: {
            create: src.translations.map(({ spokenLanguageId: _s, ...t }) => t),
          },
        },
      })
      return { id: copy.id }
    }),

  reorder: (ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (await tx.spokenLanguage.findMany({ select: { id: true } })).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.spokenLanguage.update({ where: { id: rowId }, data: { position } }),
      )
    }),
}

// ------------------------------------------------------------------ contact messages

export const adminMessagesRepo = {
  list: (status?: MessageStatus) =>
    prisma.contactMessage.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
  counts: async () => {
    const groups = await prisma.contactMessage.groupBy({ by: ['status'], _count: { _all: true } })
    return Object.fromEntries(groups.map((g) => [g.status, g._count._all]))
  },
  setStatus: (id: string, status: MessageStatus) =>
    prisma.contactMessage.update({ where: { id }, data: { status } }),
  remove: (id: string) => prisma.contactMessage.delete({ where: { id } }),
}
