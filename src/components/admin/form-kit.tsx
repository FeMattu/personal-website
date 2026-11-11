'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState, type ReactNode } from 'react'
import {
  Controller,
  get,
  useForm,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { defaultLocale, locales } from '@/i18n/config'
import type { ActionResult } from '@/lib/action-result'
import { slugify } from '@/lib/slug'
import { cn } from '@/lib/utils'

export function errorMessage<T extends FieldValues>(
  errors: FieldErrors<T>,
  name: string,
): string | undefined {
  const found: unknown = get(errors, name)
  if (typeof found === 'object' && found !== null && 'message' in found) {
    return typeof found.message === 'string' ? found.message : undefined
  }
  return undefined
}

/** Locale code of the first translation field that has a validation error. */
export function firstInvalidLocale<T extends FieldValues>(errors: FieldErrors<T>): string | null {
  const translations: unknown = get(errors, 'translations')
  if (typeof translations !== 'object' || translations === null) return null
  return locales.find((code) => code in translations) ?? null
}

type FormOptions<T extends FieldValues> = {
  schema: z.ZodType<T, T>
  defaultValues: T
  submit: (values: T) => Promise<ActionResult<{ id: string } | { key: string } | undefined>>
  successMessage: string
  onSuccess?: (result: { id?: string }) => void
}

/** react-hook-form + zod + server action wiring shared by every admin editor. */
export function useAdminForm<T extends FieldValues>(options: FormOptions<T>) {
  const { schema, defaultValues, submit, successMessage, onSuccess } = options
  const form = useForm<T, unknown, T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  })
  const [locale, setLocale] = useState<string>(defaultLocale)

  const onSubmit = form.handleSubmit(
    async (values) => {
      const result = await submit(values)
      if (result.ok) {
        toast.success(successMessage)
        const data = result.data
        onSuccess?.({ id: data && 'id' in data ? data.id : undefined })
        return
      }
      toast.error(result.error)
      for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(name as Path<T>, { message })
      }
      const invalid = firstInvalidLocale(form.formState.errors)
      if (invalid) setLocale(invalid)
    },
    (errors) => {
      const invalid = firstInvalidLocale(errors)
      if (invalid) setLocale(invalid)
      toast.error('Please fix the highlighted fields')
    },
  )

  return { form, onSubmit, submitting: form.formState.isSubmitting, locale, setLocale }
}

type FieldShellProps = {
  label: string
  htmlFor: string
  error?: string | undefined
  hint?: string | undefined
  className?: string | undefined
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, className, children }: FieldShellProps) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type BaseProps<T extends FieldValues> = {
  form: UseFormReturn<T, unknown, T>
  name: Path<T>
  label: string
  hint?: string
  className?: string
}

export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  className,
  type = 'text',
  multiline = false,
  rows = 4,
  placeholder,
  onBlurValue,
}: BaseProps<T> & {
  type?: string
  multiline?: boolean
  rows?: number
  placeholder?: string
  onBlurValue?: (value: string) => void
}) {
  const id = useId()
  const error = errorMessage(form.formState.errors, name)
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const { onBlur, ...register } = form.register(name)
  const common = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    placeholder,
    ...register,
  }
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} className={className}>
      {multiline ? (
        <Textarea
          rows={rows}
          {...common}
          onBlur={(event) => {
            void onBlur(event)
            onBlurValue?.(event.target.value)
          }}
        />
      ) : (
        <Input
          type={type}
          {...common}
          onBlur={(event) => {
            void onBlur(event)
            onBlurValue?.(event.target.value)
          }}
        />
      )}
    </Field>
  )
}

const NONE = '__none__'

export function SelectField<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  className,
  options,
  emptyLabel,
}: BaseProps<T> & {
  options: readonly { value: string; label: string }[]
  /** When set, adds a first option that stores the empty string. */
  emptyLabel?: string
}) {
  const id = useId()
  const error = errorMessage(form.formState.errors, name)
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} className={className}>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select
            value={typeof field.value === 'string' && field.value !== '' ? field.value : NONE}
            onValueChange={(value) => field.onChange(value === NONE ? '' : value)}
          >
            <SelectTrigger id={id} aria-invalid={error ? true : undefined} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {emptyLabel ? <SelectItem value={NONE}>{emptyLabel}</SelectItem> : null}
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  )
}

export function SwitchField<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  className,
}: BaseProps<T>) {
  const id = useId()
  return (
    <div className={cn('flex items-center justify-between gap-4 rounded-lg border p-3', className)}>
      <div className="grid gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Switch id={id} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        )}
      />
    </div>
  )
}

export const STATUS_OPTIONS = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
] as const

/** Fills an empty `slug` field from a human title (never overwrites a slug that is already set). */
export function suggestSlug<T extends FieldValues>(
  form: UseFormReturn<T, unknown, T>,
  source: string,
): void {
  const name = 'slug' as Path<T>
  if (form.getValues(name)) return
  form.setValue(name, slugify(source) as PathValue<T, Path<T>>)
}
