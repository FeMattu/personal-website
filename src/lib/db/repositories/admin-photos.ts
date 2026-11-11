import 'server-only'
import type { ContentStatus } from '@prisma/client'
import { AdminError } from '@/lib/admin/errors'
import { blankToNull, planTranslations } from '@/lib/admin/mappers'
import type { AlbumInput, PhotoInput } from '@/lib/admin/schema-content'
import { prisma } from '@/lib/db/prisma'
import type { IngestedPhoto } from '@/lib/photos/ingest'
import {
  applyOrder,
  freeCopySlug,
  nextPosition,
  notFound,
  upsertTagIds,
  type Tx,
} from './admin-shared'

const byPosition = { position: 'asc' } as const

// ------------------------------------------------------------------ albums

async function writeAlbumTranslations(tx: Tx, id: string, input: AlbumInput) {
  const plan = planTranslations(input.translations, ['title'])
  for (const { locale, row } of plan.upsert) {
    const data = { title: row.title, description: blankToNull(row.description) }
    await tx.photoAlbumTranslation.upsert({
      where: { albumId_locale: { albumId: id, locale } },
      create: { albumId: id, locale, ...data },
      update: data,
    })
  }
  if (plan.remove.length > 0) {
    await tx.photoAlbumTranslation.deleteMany({
      where: { albumId: id, locale: { in: plan.remove } },
    })
  }
}

export const albumRepo = {
  list: () =>
    prisma.photoAlbum.findMany({
      orderBy: byPosition,
      include: { translations: true, _count: { select: { photos: true } } },
    }),

  create: (input: AlbumInput) =>
    prisma.$transaction(async (tx) => {
      const max = await tx.photoAlbum.aggregate({ _max: { position: true } })
      const row = await tx.photoAlbum.create({
        data: { slug: input.slug, status: input.status, position: nextPosition(max._max.position) },
      })
      await writeAlbumTranslations(tx, row.id, input)
      return { id: row.id }
    }),

  update: (id: string, input: AlbumInput) =>
    prisma.$transaction(async (tx) => {
      await tx.photoAlbum.update({
        where: { id },
        data: { slug: input.slug, status: input.status },
      })
      await writeAlbumTranslations(tx, id, input)
      return { id }
    }),

  /** Photos of the album are kept (albumId becomes null). */
  remove: (id: string) => prisma.photoAlbum.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.photoAlbum.update({ where: { id }, data: { status } }),

  duplicate: (id: string) =>
    prisma.$transaction(async (tx) => {
      const src = await tx.photoAlbum.findUnique({ where: { id }, include: { translations: true } })
      if (!src) return notFound()
      const slug = await freeCopySlug(src.slug, async (prefix) =>
        (await tx.photoAlbum.findMany({ where: { slug: { startsWith: prefix } } })).map(
          (r) => r.slug,
        ),
      )
      const max = await tx.photoAlbum.aggregate({ _max: { position: true } })
      const copy = await tx.photoAlbum.create({
        data: {
          slug,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
          translations: { create: src.translations.map(({ albumId: _a, ...t }) => t) },
        },
      })
      return { id: copy.id }
    }),

  reorder: (ids: readonly string[]) =>
    prisma.$transaction(async (tx) => {
      const existing = (await tx.photoAlbum.findMany({ select: { id: true } })).map((r) => r.id)
      await applyOrder(existing, ids, (rowId, position) =>
        tx.photoAlbum.update({ where: { id: rowId }, data: { position } }),
      )
    }),
}

// ------------------------------------------------------------------ photos

const photoInclude = {
  translations: true,
  tags: { include: { tag: true } },
  variants: { orderBy: { width: 'asc' } },
  album: { select: { id: true, slug: true } },
} as const

async function writePhotoRelations(tx: Tx, id: string, input: PhotoInput) {
  const plan = planTranslations(input.translations, ['title', 'description', 'alt'], {
    requireDefault: false,
  })
  for (const { locale, row } of plan.upsert) {
    const data = {
      title: blankToNull(row.title),
      description: blankToNull(row.description),
      alt: blankToNull(row.alt),
    }
    await tx.photoTranslation.upsert({
      where: { photoId_locale: { photoId: id, locale } },
      create: { photoId: id, locale, ...data },
      update: data,
    })
  }
  if (plan.remove.length > 0) {
    await tx.photoTranslation.deleteMany({ where: { photoId: id, locale: { in: plan.remove } } })
  }
  const tagIds = await upsertTagIds(tx, input.tags, 'PHOTO')
  await tx.photoTag.deleteMany({ where: { photoId: id } })
  if (tagIds.length > 0) {
    await tx.photoTag.createMany({ data: tagIds.map((tagId) => ({ photoId: id, tagId })) })
  }
}

export const photoRepo = {
  list: () =>
    prisma.photo.findMany({
      orderBy: [{ createdAt: 'desc' }],
      include: photoInclude,
    }),

  get: (id: string) => prisma.photo.findUnique({ where: { id }, include: photoInclude }),

  /** Persists an already-ingested photo (files are stored by `ingestPhoto`). DRAFT by default. */
  createFromIngest: (ingested: IngestedPhoto, albumId: string | null) =>
    prisma.$transaction(async (tx) => {
      const duplicate = await tx.photo.findUnique({
        where: { contentHash: ingested.contentHash },
        select: { id: true },
      })
      if (duplicate) throw new AdminError('This photo was already uploaded')
      const { variants, ...rest } = ingested
      const max = await tx.photo.aggregate({ where: { albumId }, _max: { position: true } })
      const row = await tx.photo.create({
        data: {
          ...rest,
          albumId,
          status: 'DRAFT',
          position: nextPosition(max._max.position),
          variants: { create: variants },
        },
      })
      return { id: row.id }
    }),

  update: (id: string, input: PhotoInput) =>
    prisma.$transaction(async (tx) => {
      await tx.photo.update({
        where: { id },
        data: {
          albumId: input.albumId === '' ? null : input.albumId,
          featured: input.featured,
          status: input.status,
        },
      })
      await writePhotoRelations(tx, id, input)
      return { id }
    }),

  /** Deletes the row (variants/translations cascade). Storage objects are never deleted. */
  remove: (id: string) => prisma.photo.delete({ where: { id } }),

  setStatus: (id: string, status: ContentStatus) =>
    prisma.photo.update({ where: { id }, data: { status } }),

  setFeatured: (id: string, featured: boolean) =>
    prisma.photo.update({ where: { id }, data: { featured } }),
}
