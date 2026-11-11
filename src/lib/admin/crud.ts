import { z } from 'zod'
import type { ActionResult } from '@/lib/action-result'
import { runVoid, runWrite } from './run-action'
import {
  idSchema,
  reorderSchema,
  statusSchema,
  withId,
  type ContentStatusValue,
} from './schema-common'

/** What an admin repository must offer for the shared write actions. */
export interface CrudRepo<I> {
  create(input: I): Promise<{ id: string }>
  update(id: string, input: I): Promise<{ id: string }>
  remove(id: string): Promise<unknown>
  duplicate(id: string): Promise<{ id: string }>
  setStatus(id: string, status: ContentStatusValue): Promise<unknown>
}

const statusChangeSchema = z.object({ id: idSchema, status: statusSchema })

type IdResult = Promise<ActionResult<{ id: string }>>

/** Every write goes through `runWrite`: assertAdmin -> zod -> repository -> revalidate. */
export function crud<I>(repo: CrudRepo<I>, schema: z.ZodType<I>) {
  return {
    create: (input: unknown): IdResult => runWrite(schema, input, (data) => repo.create(data)),
    update: (id: unknown, input: unknown): IdResult =>
      runWrite(withId(schema), { id, data: input }, (v) => repo.update(v.id, v.data)),
    remove: (id: unknown): Promise<ActionResult> =>
      runVoid(idSchema, id, (value) => repo.remove(value)),
    duplicate: (id: unknown): IdResult => runWrite(idSchema, id, (value) => repo.duplicate(value)),
    setStatus: (id: unknown, status: unknown): Promise<ActionResult> =>
      runVoid(statusChangeSchema, { id, status }, (v) => repo.setStatus(v.id, v.status)),
  }
}

/** Persists a new order (`ids` must be a permutation of the existing ids; checked in the repo). */
export function reorderWith(
  reorder: (ids: readonly string[]) => Promise<unknown>,
  ids: unknown,
): Promise<ActionResult> {
  return runVoid(reorderSchema, ids, (value) => reorder(value))
}
