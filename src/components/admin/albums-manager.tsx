'use client'

import {
  createAlbum,
  deleteAlbum,
  duplicateAlbum,
  reorderAlbums,
  setAlbumStatus,
  updateAlbum,
} from '@/actions/admin/photos'
import { defaultLocale, locales } from '@/i18n/config'
import { translationRows } from '@/lib/admin/mappers'
import { albumSchema, type AlbumInput } from '@/lib/admin/schema-content'
import { missingLocales } from '@/lib/i18n/localize'
import { EditorManager, type DialogFormProps, type EditorRow } from './editor-manager'
import { FormFooter } from './form-footer'
import { STATUS_OPTIONS, SelectField, TextField, suggestSlug, useAdminForm } from './form-kit'
import { TranslationTabs } from './translation-tabs'

function AlbumForm({ id, initial, onDone }: DialogFormProps<AlbumInput>) {
  const { form, onSubmit, submitting, locale, setLocale } = useAdminForm({
    schema: albumSchema,
    defaultValues: initial,
    submit: (values) => (id ? updateAlbum(id, values) : createAlbum(values)),
    successMessage: 'Album saved',
    onSuccess: onDone,
  })
  const missing = missingLocales(translationRows(form.watch('translations')), locales, 'title')
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="slug" label="Slug" />
        <SelectField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
      </div>
      <TranslationTabs value={locale} onValueChange={setLocale} missing={missing}>
        {(code) => (
          <>
            <TextField
              form={form}
              name={`translations.${code}.title`}
              label="Title"
              onBlurValue={(value) => !id && code === defaultLocale && suggestSlug(form, value)}
            />
            <TextField
              form={form}
              name={`translations.${code}.description`}
              label="Description"
              multiline
              rows={3}
            />
          </>
        )}
      </TranslationTabs>
      <FormFooter submitting={submitting} />
    </form>
  )
}

export function AlbumsManager({
  items,
  blank,
}: {
  items: EditorRow<AlbumInput>[]
  blank: AlbumInput
}) {
  return (
    <EditorManager
      noun="album"
      items={items}
      blank={blank}
      deleteWarning="The album is removed. Its photos are kept and become unassigned."
      actions={{
        reorder: reorderAlbums,
        remove: deleteAlbum,
        duplicate: duplicateAlbum,
        setStatus: setAlbumStatus,
      }}
      renderForm={(props) => <AlbumForm key={props.id ?? 'new'} {...props} />}
    />
  )
}
