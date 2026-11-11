'use client'

import { useRouter } from 'next/navigation'
import { removeAvatar, saveSite, uploadAvatar } from '@/actions/admin/site'
import { locales } from '@/i18n/config'
import { translationRows } from '@/lib/admin/mappers'
import { siteSchema, type SiteInput } from '@/lib/admin/schema-content'
import { missingLocales } from '@/lib/i18n/localize'
import { FormFooter } from './form-footer'
import { TextField, useAdminForm } from './form-kit'
import { ImageUploadField } from './image-upload-field'
import { TranslationTabs } from './translation-tabs'

type Props = { initial: SiteInput; avatarKey: string | null }

export function SiteForm({ initial, avatarKey }: Props) {
  const router = useRouter()
  const { form, onSubmit, submitting, locale, setLocale } = useAdminForm({
    schema: siteSchema,
    defaultValues: initial,
    submit: (values) => saveSite(values),
    successMessage: 'Site settings saved',
    onSuccess: () => router.refresh(),
  })
  const missing = missingLocales(translationRows(form.watch('translations')), locales, 'role')

  return (
    <div className="grid max-w-3xl gap-8">
      <ImageUploadField
        label="Avatar"
        currentKey={avatarKey}
        onUpload={uploadAvatar}
        onRemove={removeAvatar}
      />
      <form onSubmit={onSubmit} className="grid gap-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField form={form} name="ownerName" label="Name" />
          <TextField form={form} name="email" label="Public email" type="email" />
          <TextField form={form} name="phone" label="Phone" />
          <TextField
            form={form}
            name="cvPath"
            label="CV path or key"
            hint="Public path or storage key of the CV PDF."
          />
        </div>
        <TranslationTabs value={locale} onValueChange={setLocale} missing={missing}>
          {(code) => (
            <>
              <TextField form={form} name={`translations.${code}.role`} label="Role" />
              <TextField form={form} name={`translations.${code}.tagline`} label="Tagline" />
              <TextField
                form={form}
                name={`translations.${code}.bio`}
                label="Bio"
                multiline
                rows={6}
                hint="Separate paragraphs with a blank line."
              />
              <TextField
                form={form}
                name={`translations.${code}.interests`}
                label="Interests"
                multiline
                rows={3}
              />
              <TextField form={form} name={`translations.${code}.location`} label="Location" />
              <TextField form={form} name={`translations.${code}.seoTitle`} label="SEO title" />
              <TextField
                form={form}
                name={`translations.${code}.seoDescription`}
                label="SEO description"
                multiline
                rows={3}
              />
            </>
          )}
        </TranslationTabs>
        <FormFooter submitting={submitting} />
      </form>
    </div>
  )
}
