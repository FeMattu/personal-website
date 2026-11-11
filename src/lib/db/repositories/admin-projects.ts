import 'server-only'
import type { ContentStatus } from '@prisma/client'
import { blankToNull, planTranslations, toDbDateOrNull } from '@/lib/admin/mappers'
import type { ProjectInput } from '@/lib/admin/schema-content'
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

const projectInclude = {
  translations: true,
  tags: { include: { tag: true } },
  skills: true,
  images: { orderBy: byPosition },
} as const

async function writeRelations(tx: Tx, id: string, input: ProjectInput) {
  const plan = planTranslations(input.translations, ['title'])
  for (const { locale, row } of plan.upsert) {
    const data = {
      title: row.title,
      summary: blankToNull(row.summary),
      description: blankToNull(row.description),
      goals: blankToNull(row.goals),
    }
    await tx.projectTranslation.upsert({
      where: { projectId_locale: { projectId: id, locale } },
      create: { projectId: id, locale, ...data },
      update: data,
    })
  }
  if (plan.remove.length > 0) {
    await tx.projectTranslation.deleteMany({
      where: { projectId: id, locale: { in: plan.remove } },
    })
  }

  const tagIds = await upsertTagIds(tx, input.tags, 'TECH')
  await tx.projectTag.deleteMany({ where: { projectId: id } })
  if (tagIds.length > 0) {
    await tx.projectTag.createMany({ data: tagIds.map((tagId) => ({ projectId: id, tagId })) })
  }

  const skillIds = [...new Set(input.skillIds)]
  const validSkills = await tx.skill.findMany({
    where: { id: { in: skillIds } },
    select: { id: true },
  })
  await tx.projectSkill.deleteMany({ where: { projectId: id } })
  if (validSkills.length > 0) {
    await tx.projectSkill.createMany({
      data: validSkills.map((s) => ({ projectId: id, skillId: s.id })),
    })
  }
}

const scalars = (input: ProjectInput) => ({
  slug: input.slug,
  liveUrl: blankToNull(input.liveUrl),
  repoUrl: blankToNull(input.repoUrl),
  startDate: toDbDateOrNull(input.startDate),
  featured: input.featured,
  status: input.status,
})

export const projectRepo = {
  list: () => prisma.project.findMany({ orderBy: byPosition, include: projectInclude }),
  get: (id: string) => prisma.project.findUnique({ where: { id }, include: projectInclude }),

  create: (input: ProjectInput) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.project.aggregate({ _max: { position: true } })
      const row = await tx.project.create({
        data: { ...scalars(input), position: nextPosition(max._max.position) },
      })
      await writeRelations(tx, row.id, input)
      return { id: row.id }
    }),

  update: (id: string, input: ProjectInput) =>
    prisma.$transaction(async (tx) => {
      await tx.project.update({ where: { id }, data: scalars(input) })
      await writeRelations(tx, id, input)
      return { id }
    }),

  /** Deletes the row (images/tags/skills cascade). Storage objects are never deleted. */
  remove: (id: string) => prisma.project.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.project.update({ where: { id }, data: { status } }),

  duplicate: (id: string) =>
    prisma.$transaction(async (tx) => {
      const src = await tx.project.findUnique({ where: { id }, include: projectInclude })
      if (!src) return notFound()
      const slug = await freeCopySlug(src.slug, async (prefix) =>
        (await tx.project.findMany({ where: { slug: { startsWith: prefix } } })).map((r) => r.slug),
      )
      const max = await tx.project.aggregate({ _max: { position: true } })
      const copy = await tx.project.create({
        data: {
          slug,
          coverKey: src.coverKey,
          liveUrl: src.liveUrl,
          repoUrl: src.repoUrl,
          startDate: src.startDate,
          featured: src.featured,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
          translations: { create: src.translations.map(({ projectId: _p, ...t }) => t) },
          tags: { create: src.tags.map((t) => ({ tagId: t.tagId })) },
          skills: { create: src.skills.map((s) => ({ skillId: s.skillId })) },
          images: {
            create: src.images.map((i) => ({ storageKey: i.storageKey, position: i.position })),
          },
        },
      })
      return { id: copy.id }
    }),

  reorder: (ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (await tx.project.findMany({ select: { id: true } })).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.project.update({ where: { id: rowId }, data: { position } }),
      )
    }),

  setCover: (id: string, coverKey: string | null) =>
    prisma.project.update({ where: { id }, data: { coverKey } }),

  addImage: (projectId: string, storageKey: string) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.projectImage.aggregate({
        where: { projectId },
        _max: { position: true },
      })
      const image = await tx.projectImage.create({
        data: { projectId, storageKey, position: nextPosition(max._max.position) },
      })
      return { id: image.id }
    }),

  removeImage: (projectId: string, imageId: string) =>
    prisma.projectImage.deleteMany({ where: { id: imageId, projectId } }),

  reorderImages: (projectId: string, ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (
        await tx.projectImage.findMany({ where: { projectId }, select: { id: true } })
      ).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.projectImage.update({ where: { id: rowId }, data: { position } }),
      )
    }),
}
