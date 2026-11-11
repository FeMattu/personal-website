'use client'

import { useRouter } from 'next/navigation'
import { createCertification, updateCertification } from '@/actions/admin/certifications'
import { defaultLocale, locales } from '@/i18n/config'
import { translationRows } from '@/lib/admin/mappers'
import { certificationSchema, type CertificationInput } from '@/lib/admin/schema-cv'
import { missingLocales } from '@/lib/i18n/localize'
import { FormFooter } from './form-footer'
import { STATUS_OPTIONS, SelectField, TextField, suggestSlug, useAdminForm } from './form-kit'
import { TranslationTabs } from './translation-tabs'

type Props = { id: string | null; initial: CertificationInput }

export function CertificationForm({ id, initial }: Props) {
  const router = useRouter()
  const { form, onSubmit, submitting, locale, setLocale } = useAdminForm({
    schema: certificationSchema,
    defaultValues: initial,
    submit: (values) => (id ? updateCertification(id, values) : createCertification(values)),
    successMessage: 'Certification saved',
    onSuccess: (result) => {
      if (!id && result.id) router.replace(`/admin/certifications/${result.id}`)
      else router.refresh()
    },
  })
  const missing = missingLocales(translationRows(form.watch('translations')), locales, 'name')

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="slug" label="Slug" hint="Used in the public URL." />
        <TextField form={form} name="issuer" label="Issuer" />
        <TextField form={form} name="issuedAt" label="Issued on" type="date" />
        <TextField form={form} name="url" label="Credential URL" type="url" />
        <SelectField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
      </div>

      <TranslationTabs value={locale} onValueChange={setLocale} missing={missing}>
        {(code) => (
          <>
            <TextField
              form={form}
              name={`translations.${code}.name`}
              label="Name"
              onBlurValue={(value) => !id && code === defaultLocale && suggestSlug(form, value)}
            />
            <TextField
              form={form}
              name={`translations.${code}.description`}
              label="Description"
              multiline
            />
          </>
        )}
      </TranslationTabs>

      <FormFooter submitting={submitting} cancelHref="/admin/certifications" />
    </form>
  )
}
