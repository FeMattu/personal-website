import 'server-only'
import type { ContentStatus } from '@prisma/client'
import {
  blankToNull,
  planTranslations,
  splitLines,
  toDbDate,
  toDbDateOrNull,
} from '@/lib/admin/mappers'
import type { CertificationInput, EducationInput, ExperienceInput } from '@/lib/admin/schema-cv'
import { prisma } from '@/lib/db/prisma'
import {
  applyOrder,
  freeCopySlug,
  nextPosition,
  notFound,
  upsertTagIds,
  type Tx,
} from './admin-shared'

const byPosition = { position: 'asc' } as const

// ------------------------------------------------------------------ experience

const experienceInclude = { translations: true, tags: { include: { tag: true } } } as const

async function writeExperienceRelations(tx: Tx, id: string, input: ExperienceInput) {
  const plan = planTranslations(input.translations, ['role'])
  for (const { locale, row } of plan.upsert) {
    const data = {
      role: row.role,
      summary: blankToNull(row.summary),
      description: blankToNull(row.description),
      highlights: splitLines(row.highlights),
    }
    await tx.experienceTranslation.upsert({
      where: { experienceId_locale: { experienceId: id, locale } },
      create: { experienceId: id, locale, ...data },
      update: data,
    })
  }
  if (plan.remove.length > 0) {
    await tx.experienceTranslation.deleteMany({
      where: { experienceId: id, locale: { in: plan.remove } },
    })
  }
  const tagIds = await upsertTagIds(tx, input.tags, 'TECH')
  await tx.experienceTag.deleteMany({ where: { experienceId: id } })
  if (tagIds.length > 0) {
    await tx.experienceTag.createMany({
      data: tagIds.map((tagId) => ({ experienceId: id, tagId })),
    })
  }
}

const experienceScalars = (input: ExperienceInput) => ({
  slug: input.slug,
  organization: input.organization,
  location: blankToNull(input.location),
  url: blankToNull(input.url),
  startDate: toDbDate(input.startDate),
  endDate: toDbDateOrNull(input.endDate),
  featured: input.featured,
  status: input.status,
})

export const experienceRepo = {
  list: () => prisma.experience.findMany({ orderBy: byPosition, include: experienceInclude }),
  get: (id: string) => prisma.experience.findUnique({ where: { id }, include: experienceInclude }),

  create: (input: ExperienceInput) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.experience.aggregate({ _max: { position: true } })
      const row = await tx.experience.create({
        data: { ...experienceScalars(input), position: nextPosition(max._max.position) },
      })
      await writeExperienceRelations(tx, row.id, input)
      return { id: row.id }
    }),

  update: (id: string, input: ExperienceInput) =>
    prisma.$transaction(async (tx) => {
      await tx.experience.update({ where: { id }, data: experienceScalars(input) })
      await writeExperienceRelations(tx, id, input)
      return { id }
    }),

  remove: (id: string) => prisma.experience.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.experience.update({ where: { id }, data: { status } }),

  duplicate: (id: string) =>
    prisma.$transaction(async (tx) => {
      const src = await tx.experience.findUnique({ where: { id }, include: experienceInclude })
      if (!src) return notFound()
      const slug = await freeCopySlug(src.slug, async (prefix) =>
        (await tx.experience.findMany({ where: { slug: { startsWith: prefix } } })).map(
          (r) => r.slug,
        ),
      )
      const max = await tx.experience.aggregate({ _max: { position: true } })
      const copy = await tx.experience.create({
        data: {
          slug,
          organization: src.organization,
          location: src.location,
          url: src.url,
          startDate: src.startDate,
          endDate: src.endDate,
          featured: src.featured,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
          translations: {
            create: src.translations.map(({ experienceId: _e, ...t }) => t),
          },
          tags: { create: src.tags.map((t) => ({ tagId: t.tagId })) },
        },
      })
      return { id: copy.id }
    }),

  reorder: (ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (await tx.experience.findMany({ select: { id: true } })).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.experience.update({ where: { id: rowId }, data: { position } }),
      )
    }),
}

// ------------------------------------------------------------------ education

const educationInclude = { translations: true } as const

async function writeEducationRelations(tx: Tx, id: string, input: EducationInput) {
  const plan = planTranslations(input.translations, ['title'])
  for (const { locale, row } of plan.upsert) {
    const data = {
      title: row.title,
      summary: blankToNull(row.summary),
      description: blankToNull(row.description),
      highlights: splitLines(row.highlights),
    }
    await tx.educationTranslation.upsert({
      where: { educationId_locale: { educationId: id, locale } },
      create: { educationId: id, locale, ...data },
      update: data,
    })
  }
  if (plan.remove.length > 0) {
    await tx.educationTranslation.deleteMany({
      where: { educationId: id, locale: { in: plan.remove } },
    })
  }
}

const educationScalars = (input: EducationInput) => ({
  slug: input.slug,
  institution: input.institution,
  location: blankToNull(input.location),
  url: blankToNull(input.url),
  startDate: toDbDate(input.startDate),
  endDate: toDbDateOrNull(input.endDate),
  status: input.status,
})

export const educationRepo = {
  list: () => prisma.education.findMany({ orderBy: byPosition, include: educationInclude }),
  get: (id: string) => prisma.education.findUnique({ where: { id }, include: educationInclude }),

  create: (input: EducationInput) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.education.aggregate({ _max: { position: true } })
      const row = await tx.education.create({
        data: { ...educationScalars(input), position: nextPosition(max._max.position) },
      })
      await writeEducationRelations(tx, row.id, input)
      return { id: row.id }
    }),

  update: (id: string, input: EducationInput) =>
    prisma.$transaction(async (tx) => {
      await tx.education.update({ where: { id }, data: educationScalars(input) })
      await writeEducationRelations(tx, id, input)
      return { id }
    }),

  remove: (id: string) => prisma.education.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.education.update({ where: { id }, data: { status } }),

  duplicate: (id: string) =>
    prisma.$transaction(async (tx) => {
      const src = await tx.education.findUnique({ where: { id }, include: educationInclude })
      if (!src) return notFound()
      const slug = await freeCopySlug(src.slug, async (prefix) =>
        (await tx.education.findMany({ where: { slug: { startsWith: prefix } } })).map(
          (r) => r.slug,
        ),
      )
      const max = await tx.education.aggregate({ _max: { position: true } })
      const copy = await tx.education.create({
        data: {
          slug,
          institution: src.institution,
          location: src.location,
          url: src.url,
          startDate: src.startDate,
          endDate: src.endDate,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
          translations: { create: src.translations.map(({ educationId: _e, ...t }) => t) },
        },
      })
      return { id: copy.id }
    }),

  reorder: (ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (await tx.education.findMany({ select: { id: true } })).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.education.update({ where: { id: rowId }, data: { position } }),
      )
    }),
}

// ------------------------------------------------------------------ certifications

const certificationInclude = { translations: true } as const

async function writeCertificationRelations(tx: Tx, id: string, input: CertificationInput) {
  const plan = planTranslations(input.translations, ['name'])
  for (const { locale, row } of plan.upsert) {
    const data = { name: row.name, description: blankToNull(row.description) }
    await tx.certificationTranslation.upsert({
      where: { certificationId_locale: { certificationId: id, locale } },
      create: { certificationId: id, locale, ...data },
      update: data,
    })
  }
  if (plan.remove.length > 0) {
    await tx.certificationTranslation.deleteMany({
      where: { certificationId: id, locale: { in: plan.remove } },
    })
  }
}

const certificationScalars = (input: CertificationInput) => ({
  slug: input.slug,
  issuer: blankToNull(input.issuer),
  issuedAt: toDbDateOrNull(input.issuedAt),
  url: blankToNull(input.url),
  status: input.status,
})

export const certificationRepo = {
  list: () => prisma.certification.findMany({ orderBy: byPosition, include: certificationInclude }),
  get: (id: string) =>
    prisma.certification.findUnique({ where: { id }, include: certificationInclude }),

  create: (input: CertificationInput) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.certification.aggregate({ _max: { position: true } })
      const row = await tx.certification.create({
        data: { ...certificationScalars(input), position: nextPosition(max._max.position) },
      })
      await writeCertificationRelations(tx, row.id, input)
      return { id: row.id }
    }),

  update: (id: string, input: CertificationInput) =>
    prisma.$transaction(async (tx) => {
      await tx.certification.update({ where: { id }, data: certificationScalars(input) })
      await writeCertificationRelations(tx, id, input)
      return { id }
    }),

  remove: (id: string) => prisma.certification.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.certification.update({ where: { id }, data: { status } }),

  duplicate: (id: string) =>
    prisma.$transaction(async (tx) => {
      const src = await tx.certification.findUnique({
        where: { id },
        include: certificationInclude,
      })
      if (!src) return notFound()
      const slug = await freeCopySlug(src.slug, async (prefix) =>
        (await tx.certification.findMany({ where: { slug: { startsWith: prefix } } })).map(
          (r) => r.slug,
        ),
      )
      const max = await tx.certification.aggregate({ _max: { position: true } })
      const copy = await tx.certification.create({
        data: {
          slug,
          issuer: src.issuer,
          issuedAt: src.issuedAt,
          url: src.url,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
          translations: { create: src.translations.map(({ certificationId: _c, ...t }) => t) },
        },
      })
      return { id: copy.id }
    }),

  reorder: (ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (await tx.certification.findMany({ select: { id: true } })).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.certification.update({ where: { id: rowId }, data: { position } }),
      )
    }),
}
