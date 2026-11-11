import 'server-only'
import type { Prisma, TagKind } from '@prisma/client'
import { AdminError } from '@/lib/admin/errors'
import { copySlug, parseTags } from '@/lib/admin/mappers'
import { isPermutation, reorderPositions } from '@/lib/admin/ordering'

export type Tx = Prisma.TransactionClient

/** Upserts every tag of a comma list and returns their ids (kind is only set on creation). */
export async function upsertTagIds(tx: Tx, csv: string, kind: TagKind): Promise<string[]> {
  const ids: string[] = []
  for (const { slug, name } of parseTags(csv)) {
    const tag = await tx.tag.upsert({
      where: { slug },
      create: { slug, name, kind },
      update: {},
      select: { id: true },
    })
    ids.push(tag.id)
  }
  return ids
}

/** Validates `ids` is a permutation of `existing` and writes `position = index`. */
export async function applyOrder(
  existing: readonly string[],
  ids: readonly string[],
  update: (id: string, position: number) => Promise<unknown>,
): Promise<void> {
  if (!isPermutation(ids, existing)) {
    throw new AdminError('The list changed in the meantime. Reload the page and try again.')
  }
  for (const { id, position } of reorderPositions(ids)) await update(id, position)
}

/** First free `<slug>-copy[-n]`; `findTaken` returns the slugs starting with the given prefix. */
export async function freeCopySlug(
  slug: string,
  findTaken: (prefix: string) => Promise<string[]>,
): Promise<string> {
  return copySlug(slug, new Set(await findTaken(`${slug}-copy`)))
}

export const nextPosition = (max: number | null | undefined): number => (max ?? -1) + 1

export function notFound(): never {
  throw new AdminError('Record not found')
}
