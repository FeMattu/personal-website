'use client'

import { useRouter } from 'next/navigation'
import { locales } from '@/i18n/config'
import { translationRows } from '@/lib/admin/mappers'
import { experienceSchema, type ExperienceInput } from '@/lib/admin/schema-cv'
import { missingLocales } from '@/lib/i18n/localize'
import { createExperience, updateExperience } from '@/actions/admin/experience'
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

type Props = { id: string | null; initial: ExperienceInput }

export function ExperienceForm({ id, initial }: Props) {
  const router = useRouter()
  const { form, onSubmit, submitting, locale, setLocale } = useAdminForm({
    schema: experienceSchema,
    defaultValues: initial,
    submit: (values) => (id ? updateExperience(id, values) : createExperience(values)),
    successMessage: 'Experience saved',
    onSuccess: (result) => {
      if (!id && result.id) router.replace(`/admin/experience/${result.id}`)
      else router.refresh()
    },
  })
  const missing = missingLocales(translationRows(form.watch('translations')), locales, 'role')

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="organization"
          label="Organization"
          onBlurValue={(value) => !id && suggestSlug(form, value)}
        />
        <TextField form={form} name="slug" label="Slug" hint="Used in the public URL." />
        <TextField form={form} name="location" label="Location" />
        <TextField form={form} name="url" label="Website" type="url" />
        <TextField form={form} name="startDate" label="Start date" type="date" />
        <TextField
          form={form}
          name="endDate"
          label="End date"
          type="date"
          hint="Leave empty if ongoing."
        />
        <SelectField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
        <SwitchField
          form={form}
          name="featured"
          label="Featured"
          hint="Highlight on the home page."
        />
        <TextField
          form={form}
          name="tags"
          label="Technologies"
          hint="Comma separated, e.g. TypeScript, React, PostgreSQL."
          className="sm:col-span-2"
        />
      </div>

      <TranslationTabs value={locale} onValueChange={setLocale} missing={missing}>
        {(code) => (
          <>
            <TextField form={form} name={`translations.${code}.role`} label="Role" />
            <TextField form={form} name={`translations.${code}.summary`} label="Summary" />
            <TextField
              form={form}
              name={`translations.${code}.description`}
              label="Description"
              multiline
              rows={6}
              hint="Separate paragraphs with a blank line."
            />
            <TextField
              form={form}
              name={`translations.${code}.highlights`}
              label="Highlights"
              multiline
              hint="One highlight per line."
            />
          </>
        )}
      </TranslationTabs>

      <FormFooter submitting={submitting} cancelHref="/admin/experience" />
    </form>
  )
}
