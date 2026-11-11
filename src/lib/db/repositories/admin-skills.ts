import 'server-only'
import type { ContentStatus } from '@prisma/client'
import { blankToNull, planTranslations } from '@/lib/admin/mappers'
import type { CategoryInput, SkillInput } from '@/lib/admin/schema-content'
import { prisma } from '@/lib/db/prisma'
import { applyOrder, freeCopySlug, nextPosition, notFound, type Tx } from './admin-shared'

const byPosition = { position: 'asc' } as const

async function writeCategoryTranslations(tx: Tx, id: string, input: CategoryInput) {
  const plan = planTranslations(input.translations, ['name'])
  for (const { locale, row } of plan.upsert) {
    await tx.skillCategoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: id, locale } },
      create: { categoryId: id, locale, name: row.name },
      update: { name: row.name },
    })
  }
  if (plan.remove.length > 0) {
    await tx.skillCategoryTranslation.deleteMany({
      where: { categoryId: id, locale: { in: plan.remove } },
    })
  }
}

export const categoryRepo = {
  /** Categories with their skills (both ordered) and all translations. */
  listWithSkills: () =>
    prisma.skillCategory.findMany({
      orderBy: byPosition,
      include: {
        translations: true,
        skills: { orderBy: byPosition, include: { translations: true } },
      },
    }),

  create: (input: CategoryInput) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.skillCategory.aggregate({ _max: { position: true } })
      const row = await tx.skillCategory.create({
        data: { slug: input.slug, status: input.status, position: nextPosition(max._max.position) },
      })
      await writeCategoryTranslations(tx, row.id, input)
      return { id: row.id }
    }),

  update: (id: string, input: CategoryInput) =>
    prisma.$transaction(async (tx) => {
      await tx.skillCategory.update({
        where: { id },
        data: { slug: input.slug, status: input.status },
      })
      await writeCategoryTranslations(tx, id, input)
      return { id }
    }),

  /** Deleting a category cascades to its skills (schema). */
  remove: (id: string) => prisma.skillCategory.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.skillCategory.update({ where: { id }, data: { status } }),

  /** Copies the category (translations only, no skills) as a DRAFT. */
  duplicate: (id: string) =>
    prisma.$transaction(async (tx) => {
      const src = await tx.skillCategory.findUnique({
        where: { id },
        include: { translations: true },
      })
      if (!src) return notFound()
      const slug = await freeCopySlug(src.slug, async (prefix) =>
        (await tx.skillCategory.findMany({ where: { slug: { startsWith: prefix } } })).map(
          (r) => r.slug,
        ),
      )
      const max = await tx.skillCategory.aggregate({ _max: { position: true } })
      const copy = await tx.skillCategory.create({
        data: {
          slug,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
          translations: { create: src.translations.map(({ categoryId: _c, ...t }) => t) },
        },
      })
      return { id: copy.id }
    }),

  reorder: (ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (await tx.skillCategory.findMany({ select: { id: true } })).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.skillCategory.update({ where: { id: rowId }, data: { position } }),
      )
    }),
}

async function writeSkillTranslations(tx: Tx, id: string, input: SkillInput) {
  const plan = planTranslations(input.translations, ['description'], { requireDefault: false })
  for (const { locale, row } of plan.upsert) {
    const description = blankToNull(row.description)
    await tx.skillTranslation.upsert({
      where: { skillId_locale: { skillId: id, locale } },
      create: { skillId: id, locale, description },
      update: { description },
    })
  }
  if (plan.remove.length > 0) {
    await tx.skillTranslation.deleteMany({ where: { skillId: id, locale: { in: plan.remove } } })
  }
}

const skillScalars = (input: SkillInput) => ({
  slug: input.slug,
  name: input.name,
  level: input.level === '' ? null : input.level,
  categoryId: input.categoryId,
  status: input.status,
})

export const skillRepo = {
  /** Flat list for project pickers. */
  listAll: () =>
    prisma.skill.findMany({
      orderBy: [{ category: { position: 'asc' } }, byPosition],
      select: { id: true, name: true, category: { select: { slug: true } } },
    }),

  create: (input: SkillInput) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.skill.aggregate({
        where: { categoryId: input.categoryId },
        _max: { position: true },
      })
      const row = await tx.skill.create({
        data: { ...skillScalars(input), position: nextPosition(max._max.position) },
      })
      await writeSkillTranslations(tx, row.id, input)
      return { id: row.id }
    }),

  update: (id: string, input: SkillInput) =>
    prisma.$transaction(async (tx) => {
      await tx.skill.update({ where: { id }, data: skillScalars(input) })
      await writeSkillTranslations(tx, id, input)
      return { id }
    }),

  remove: (id: string) => prisma.skill.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.skill.update({ where: { id }, data: { status } }),

  duplicate: (id: string) =>
    prisma.$transaction(async (tx) => {
      const src = await tx.skill.findUnique({ where: { id }, include: { translations: true } })
      if (!src) return notFound()
      const slug = await freeCopySlug(src.slug, async (prefix) =>
        (await tx.skill.findMany({ where: { slug: { startsWith: prefix } } })).map((r) => r.slug),
      )
      const max = await tx.skill.aggregate({
        where: { categoryId: src.categoryId },
        _max: { position: true },
      })
      const copy = await tx.skill.create({
        data: {
          slug,
          name: src.name,
          level: src.level,
          categoryId: src.categoryId,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
          translations: { create: src.translations.map(({ skillId: _s, ...t }) => t) },
        },
      })
      return { id: copy.id }
    }),

  /** Reorders the skills of ONE category. */
  reorder: (categoryId: string, ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (
        await tx.skill.findMany({ where: { categoryId }, select: { id: true } })
      ).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.skill.update({ where: { id: rowId }, data: { position } }),
      )
    }),
}
