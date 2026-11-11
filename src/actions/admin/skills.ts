'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/action-result'
import { crud, reorderWith } from '@/lib/admin/crud'
import { runVoid } from '@/lib/admin/run-action'
import { idSchema, reorderSchema, type ContentStatusValue } from '@/lib/admin/schema-common'
import {
  categorySchema,
  skillSchema,
  type CategoryInput,
  type SkillInput,
} from '@/lib/admin/schema-content'
import { categoryRepo, skillRepo } from '@/lib/db/repositories/admin-skills'

const category = crud(categoryRepo, categorySchema)
const skill = crud(skillRepo, skillSchema)
const skillOrderSchema = z.object({ categoryId: idSchema, ids: reorderSchema })

export async function createCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  return category.create(input)
}
export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  return category.update(id, input)
}
export async function deleteCategory(id: string): Promise<ActionResult> {
  return category.remove(id)
}
export async function duplicateCategory(id: string): Promise<ActionResult<{ id: string }>> {
  return category.duplicate(id)
}
export async function setCategoryStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return category.setStatus(id, status)
}
export async function reorderCategories(ids: string[]): Promise<ActionResult> {
  return reorderWith(categoryRepo.reorder, ids)
}

export async function createSkill(input: SkillInput): Promise<ActionResult<{ id: string }>> {
  return skill.create(input)
}
export async function updateSkill(
  id: string,
  input: SkillInput,
): Promise<ActionResult<{ id: string }>> {
  return skill.update(id, input)
}
export async function deleteSkill(id: string): Promise<ActionResult> {
  return skill.remove(id)
}
export async function duplicateSkill(id: string): Promise<ActionResult<{ id: string }>> {
  return skill.duplicate(id)
}
export async function setSkillStatus(
  id: string,
  status: ContentStatusValue,
): Promise<ActionResult> {
  return skill.setStatus(id, status)
}
export async function reorderSkills(categoryId: string, ids: string[]): Promise<ActionResult> {
  return runVoid(skillOrderSchema, { categoryId, ids }, (v) =>
    skillRepo.reorder(v.categoryId, v.ids),
  )
}
