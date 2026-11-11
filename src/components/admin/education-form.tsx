'use client'

import { useRouter } from 'next/navigation'
import { createEducation, updateEducation } from '@/actions/admin/education'
import { locales } from '@/i18n/config'
import { translationRows } from '@/lib/admin/mappers'
import { educationSchema, type EducationInput } from '@/lib/admin/schema-cv'
import { missingLocales } from '@/lib/i18n/localize'
import { FormFooter } from './form-footer'
import { STATUS_OPTIONS, SelectField, TextField, suggestSlug, useAdminForm } from './form-kit'
import { TranslationTabs } from './translation-tabs'

type Props = { id: string | null; initial: EducationInput }

export function EducationForm({ id, initial }: Props) {
  const router = useRouter()
  const { form, onSubmit, submitting, locale, setLocale } = useAdminForm({
    schema: educationSchema,
    defaultValues: initial,
    submit: (values) => (id ? updateEducation(id, values) : createEducation(values)),
    successMessage: 'Education saved',
    onSuccess: (result) => {
      if (!id && result.id) router.replace(`/admin/education/${result.id}`)
      else router.refresh()
    },
  })
  const missing = missingLocales(translationRows(form.watch('translations')), locales, 'title')

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="institution"
          label="Institution"
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
      </div>

      <TranslationTabs value={locale} onValueChange={setLocale} missing={missing}>
        {(code) => (
          <>
            <TextField form={form} name={`translations.${code}.title`} label="Title / degree" />
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

      <FormFooter submitting={submitting} cancelHref="/admin/education" />
    </form>
  )
}
