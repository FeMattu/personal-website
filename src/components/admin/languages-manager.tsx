'use client'

import {
  createLanguage,
  deleteLanguage,
  duplicateLanguage,
  reorderLanguage,
  setLanguageStatus,
  updateLanguage,
} from '@/actions/admin/languages'
import { localeNames, locales } from '@/i18n/config'
import {
  PROFICIENCIES,
  spokenLanguageSchema,
  type SpokenLanguageInput,
} from '@/lib/admin/schema-content'
import { EditorManager, type DialogFormProps, type EditorRow } from './editor-manager'
import { FormFooter } from './form-footer'
import { STATUS_OPTIONS, SelectField, TextField, useAdminForm } from './form-kit'

const LEVEL_OPTIONS = PROFICIENCIES.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}))

function LanguageForm({ id, initial, onDone }: DialogFormProps<SpokenLanguageInput>) {
  const { form, onSubmit, submitting } = useAdminForm({
    schema: spokenLanguageSchema,
    defaultValues: initial,
    submit: (values) => (id ? updateLanguage(id, values) : createLanguage(values)),
    successMessage: 'Language saved',
    onSuccess: onDone,
  })
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="code" label="Code" hint='ISO 639-1, e.g. "it".' />
        <TextField form={form} name="name" label="Name" hint="In its own language." />
        <SelectField form={form} name="proficiency" label="Proficiency" options={LEVEL_OPTIONS} />
        <SelectField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
      </div>
      {locales.map((code) => (
        <TextField
          key={code}
          form={form}
          name={`translations.${code}.detail`}
          label={`Detail (${localeNames[code]})`}
          hint="Optional, e.g. certificate or score."
        />
      ))}
      <FormFooter submitting={submitting} />
    </form>
  )
}

export function LanguagesManager({
  items,
  blank,
}: {
  items: EditorRow<SpokenLanguageInput>[]
  blank: SpokenLanguageInput
}) {
  return (
    <EditorManager
      noun="language"
      items={items}
      blank={blank}
      actions={{
        reorder: reorderLanguage,
        remove: deleteLanguage,
        duplicate: duplicateLanguage,
        setStatus: setLanguageStatus,
      }}
      renderForm={(props) => <LanguageForm key={props.id ?? 'new'} {...props} />}
    />
  )
}
