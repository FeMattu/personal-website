'use client'

import { useRouter } from 'next/navigation'
import { Controller } from 'react-hook-form'
import { createProject, updateProject } from '@/actions/admin/projects'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { defaultLocale, locales } from '@/i18n/config'
import { translationRows } from '@/lib/admin/mappers'
import { projectSchema, type ProjectInput } from '@/lib/admin/schema-content'
import { missingLocales } from '@/lib/i18n/localize'
import { FormFooter } from './form-footer'
import {
  STATUS_OPTIONS,
  SelectField,
  SwitchField,
  TextField,
  suggestSlug,
  useAdminForm,
} from './form-kit'
import { TranslationTabs } from './translation-tabs'

export type SkillOption = { id: string; name: string; category: string }
type Props = { id: string | null; initial: ProjectInput; skills: SkillOption[] }

export function ProjectForm({ id, initial, skills }: Props) {
  const router = useRouter()
  const { form, onSubmit, submitting, locale, setLocale } = useAdminForm({
    schema: projectSchema,
    defaultValues: initial,
    submit: (values) => (id ? updateProject(id, values) : createProject(values)),
    successMessage: 'Project saved',
    onSuccess: (result) => {
      if (!id && result.id) router.replace(`/admin/projects/${result.id}`)
      else router.refresh()
    },
  })
  const missing = missingLocales(translationRows(form.watch('translations')), locales, 'title')
  const categories = [...new Set(skills.map((s) => s.category))]

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="slug" label="Slug" hint="Used in the public URL." />
        <SelectField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
        <TextField form={form} name="liveUrl" label="Live URL" type="url" />
        <TextField form={form} name="repoUrl" label="Repository URL" type="url" />
        <TextField form={form} name="startDate" label="Start date" type="date" />
        <SwitchField form={form} name="featured" label="Featured" hint="Show on the home page." />
        <TextField
          form={form}
          name="tags"
          label="Tags"
          hint="Comma separated, e.g. Next.js, Prisma."
          className="sm:col-span-2"
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Linked skills</legend>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Create skills first to link them here.</p>
        ) : (
          <Controller
            control={form.control}
            name="skillIds"
            render={({ field }) => (
              <div className="grid gap-3">
                {categories.map((category) => (
                  <div key={category} className="grid gap-1.5">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {skills
                        .filter((s) => s.category === category)
                        .map((skill) => {
                          const checked = field.value.includes(skill.id)
                          const inputId = `skill-${skill.id}`
                          return (
                            <div key={skill.id} className="flex items-center gap-2">
                              <Checkbox
                                id={inputId}
                                checked={checked}
                                onCheckedChange={(next) =>
                                  field.onChange(
                                    next === true
                                      ? [...field.value, skill.id]
                                      : field.value.filter((value) => value !== skill.id),
                                  )
                                }
                              />
                              <Label htmlFor={inputId} className="font-normal">
                                {skill.name}
                              </Label>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          />
        )}
      </fieldset>

      <TranslationTabs value={locale} onValueChange={setLocale} missing={missing}>
        {(code) => (
          <>
            <TextField
              form={form}
              name={`translations.${code}.title`}
              label="Title"
              onBlurValue={(value) => !id && code === defaultLocale && suggestSlug(form, value)}
            />
            <TextField form={form} name={`translations.${code}.summary`} label="Summary" />
            <TextField
              form={form}
              name={`translations.${code}.description`}
              label="Description"
              multiline
              rows={8}
              hint="Separate paragraphs with a blank line."
            />
            <TextField
              form={form}
              name={`translations.${code}.goals`}
              label="Goals"
              multiline
              rows={4}
            />
          </>
        )}
      </TranslationTabs>

      <FormFooter submitting={submitting} cancelHref="/admin/projects" />
    </form>
  )
}
