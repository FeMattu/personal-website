'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import {
  createCategory,
  createSkill,
  deleteCategory,
  deleteSkill,
  duplicateCategory,
  duplicateSkill,
  reorderCategories,
  reorderSkills,
  setCategoryStatus,
  setSkillStatus,
  updateCategory,
  updateSkill,
} from '@/actions/admin/skills'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { defaultLocale, localeNames, locales } from '@/i18n/config'
import { blankSkill } from '@/lib/admin/form-values'
import { translationRows } from '@/lib/admin/mappers'
import {
  SKILL_LEVELS,
  categorySchema,
  skillSchema,
  type CategoryInput,
  type SkillInput,
} from '@/lib/admin/schema-content'
import { missingLocales } from '@/lib/i18n/localize'
import { FormFooter } from './form-footer'
import { STATUS_OPTIONS, SelectField, TextField, suggestSlug, useAdminForm } from './form-kit'
import {
  ResourceList,
  RowActions,
  RowHeading,
  type ResourceActions,
  type ResourceRow,
} from './resource-list'
import { SortableList } from './sortable-list'
import { TranslationTabs } from './translation-tabs'

export type SkillEditorRow = ResourceRow & { form: SkillInput }
export type CategoryEditorRow = ResourceRow & {
  form: CategoryInput
  skills: SkillEditorRow[]
}

type Props = { categories: CategoryEditorRow[]; blankCategory: CategoryInput }

type Dialogue =
  { kind: 'category'; id: string | null } | { kind: 'skill'; id: string | null; categoryId: string }

const LEVEL_OPTIONS = SKILL_LEVELS.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}))

const categoryActions: ResourceActions = {
  reorder: reorderCategories,
  remove: deleteCategory,
  duplicate: duplicateCategory,
  setStatus: setCategoryStatus,
}

const skillActions = (categoryId: string): ResourceActions => ({
  reorder: (ids) => reorderSkills(categoryId, ids),
  remove: deleteSkill,
  duplicate: duplicateSkill,
  setStatus: setSkillStatus,
})

function CategoryForm({
  id,
  initial,
  onDone,
}: {
  id: string | null
  initial: CategoryInput
  onDone: () => void
}) {
  const { form, onSubmit, submitting, locale, setLocale } = useAdminForm({
    schema: categorySchema,
    defaultValues: initial,
    submit: (values) => (id ? updateCategory(id, values) : createCategory(values)),
    successMessage: 'Category saved',
    onSuccess: onDone,
  })
  const missing = missingLocales(translationRows(form.watch('translations')), locales, 'name')
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="slug" label="Slug" />
        <SelectField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
      </div>
      <TranslationTabs value={locale} onValueChange={setLocale} missing={missing}>
        {(code) => (
          <TextField
            form={form}
            name={`translations.${code}.name`}
            label="Name"
            onBlurValue={(value) => !id && code === defaultLocale && suggestSlug(form, value)}
          />
        )}
      </TranslationTabs>
      <FormFooter submitting={submitting} />
    </form>
  )
}

function SkillForm({
  id,
  initial,
  categories,
  onDone,
}: {
  id: string | null
  initial: SkillInput
  categories: { id: string; title: string }[]
  onDone: () => void
}) {
  const { form, onSubmit, submitting } = useAdminForm({
    schema: skillSchema,
    defaultValues: initial,
    submit: (values) => (id ? updateSkill(id, values) : createSkill(values)),
    successMessage: 'Skill saved',
    onSuccess: onDone,
  })
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="name"
          label="Name"
          onBlurValue={(value) => !id && suggestSlug(form, value)}
        />
        <TextField form={form} name="slug" label="Slug" />
        <SelectField
          form={form}
          name="categoryId"
          label="Category"
          options={categories.map((c) => ({ value: c.id, label: c.title }))}
        />
        <SelectField
          form={form}
          name="level"
          label="Level"
          emptyLabel="Not rated"
          options={LEVEL_OPTIONS}
        />
        <SelectField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
      </div>
      {locales.map((code) => (
        <TextField
          key={code}
          form={form}
          name={`translations.${code}.description`}
          label={`Description (${localeNames[code]})`}
          multiline
          rows={2}
        />
      ))}
      <FormFooter submitting={submitting} />
    </form>
  )
}

/** Categories and their skills on one page: both levels are sortable and edited in dialogs. */
export function SkillsManager({ categories, blankCategory }: Props) {
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)
  const close = () => setDialogue(null)

  const editingCategory =
    dialogue?.kind === 'category' && dialogue.id
      ? categories.find((c) => c.id === dialogue.id)
      : undefined
  const editingSkill =
    dialogue?.kind === 'skill' && dialogue.id
      ? categories.flatMap((c) => c.skills).find((s) => s.id === dialogue.id)
      : undefined

  return (
    <div className="grid gap-6">
      <div>
        <Button onClick={() => setDialogue({ kind: 'category', id: null })}>
          <Plus /> Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No categories yet.
        </p>
      ) : (
        <SortableList
          items={categories}
          getLabel={(category) => category.title}
          onReorder={reorderCategories}
          renderItem={(category) => (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <RowHeading item={category} />
                <RowActions
                  item={category}
                  noun="category"
                  actions={categoryActions}
                  onEdit={(id) => setDialogue({ kind: 'category', id })}
                  deleteWarning="The category and ALL of its skills are deleted."
                />
              </div>
              <ResourceList
                items={category.skills}
                noun="skills"
                actions={skillActions(category.id)}
                onEdit={(id) => setDialogue({ kind: 'skill', id, categoryId: category.id })}
              />
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogue({ kind: 'skill', id: null, categoryId: category.id })}
                >
                  <Plus /> Add skill to {category.title}
                </Button>
              </div>
            </div>
          )}
        />
      )}

      <Dialog open={dialogue !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {dialogue?.kind === 'skill'
                ? dialogue.id
                  ? 'Edit skill'
                  : 'New skill'
                : dialogue?.id
                  ? 'Edit category'
                  : 'New category'}
            </DialogTitle>
            <DialogDescription>
              Saved changes go live as soon as the status is Published.
            </DialogDescription>
          </DialogHeader>
          {dialogue?.kind === 'category' ? (
            <CategoryForm
              key={dialogue.id ?? 'new'}
              id={dialogue.id}
              initial={editingCategory?.form ?? blankCategory}
              onDone={close}
            />
          ) : null}
          {dialogue?.kind === 'skill' ? (
            <SkillForm
              key={dialogue.id ?? `new-${dialogue.categoryId}`}
              id={dialogue.id}
              initial={editingSkill?.form ?? blankSkill(dialogue.categoryId)}
              categories={categories}
              onDone={close}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
