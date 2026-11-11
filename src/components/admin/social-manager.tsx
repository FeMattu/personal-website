'use client'

import {
  createSocial,
  deleteSocial,
  duplicateSocial,
  reorderSocial,
  setSocialStatus,
  updateSocial,
} from '@/actions/admin/social'
import { SOCIAL_KINDS, socialSchema, type SocialInput } from '@/lib/admin/schema-content'
import { EditorManager, type DialogFormProps, type EditorRow } from './editor-manager'
import { FormFooter } from './form-footer'
import { STATUS_OPTIONS, SelectField, TextField, useAdminForm } from './form-kit'

const KIND_OPTIONS = SOCIAL_KINDS.map((value) => ({
  value,
  label: value.charAt(0) + value.slice(1).toLowerCase(),
}))

function SocialForm({ id, initial, onDone }: DialogFormProps<SocialInput>) {
  const { form, onSubmit, submitting } = useAdminForm({
    schema: socialSchema,
    defaultValues: initial,
    submit: (values) => (id ? updateSocial(id, values) : createSocial(values)),
    successMessage: 'Link saved',
    onSuccess: onDone,
  })
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <SelectField form={form} name="kind" label="Type" options={KIND_OPTIONS} />
      <TextField form={form} name="label" label="Label" hint="Optional; defaults to the type." />
      <TextField
        form={form}
        name="url"
        label="URL"
        hint="https://..., mailto:you@example.com or tel:+39..."
      />
      <SelectField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
      <FormFooter submitting={submitting} />
    </form>
  )
}

export function SocialManager({
  items,
  blank,
}: {
  items: EditorRow<SocialInput>[]
  blank: SocialInput
}) {
  return (
    <EditorManager
      noun="link"
      items={items}
      blank={blank}
      actions={{
        reorder: reorderSocial,
        remove: deleteSocial,
        duplicate: duplicateSocial,
        setStatus: setSocialStatus,
      }}
      renderForm={(props) => <SocialForm key={props.id ?? 'new'} {...props} />}
    />
  )
}
