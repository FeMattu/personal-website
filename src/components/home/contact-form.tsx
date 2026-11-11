'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { sendContactMessage } from '@/actions/contact'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { contactSchema, type ContactInput } from '@/lib/validation/contact'

export function ContactForm() {
  const t = useTranslations('contact')
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '', website: '' },
  })

  const message = (key?: string) =>
    key ? t(`validation.${key}` as 'validation.fieldLong') : undefined

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await sendContactMessage(values, locale)
      if (result.status === 'success') {
        setSent(true)
        reset()
        toast.success(t('success'))
      } else if (result.status === 'invalid') {
        for (const [field, key] of Object.entries(result.fieldErrors)) {
          setError(field as keyof ContactInput, { message: key })
        }
      } else {
        toast.error(result.reason === 'rate_limited' ? t('rateLimited') : t('error'))
      }
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby="contact-status">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">{t('name')}</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            {...register('name')}
          />
          {errors.name ? (
            <p id="contact-name-error" role="alert" className="text-sm text-destructive">
              {message(errors.name.message)}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">{t('email')}</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <p id="contact-email-error" role="alert" className="text-sm text-destructive">
              {message(errors.email.message)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">
          {t('subject')} <span className="text-muted-foreground">({t('optional')})</span>
        </Label>
        <Input id="contact-subject" {...register('subject')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">{t('message')}</Label>
        <Textarea
          id="contact-message"
          rows={6}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          {...register('message')}
        />
        {errors.message ? (
          <p id="contact-message-error" role="alert" className="text-sm text-destructive">
            {message(errors.message.message)}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? t('sending') : t('send')}
        </Button>
        <p id="contact-status" role="status" className="text-sm text-muted-foreground">
          {sent ? t('success') : ''}
        </p>
      </div>
    </form>
  )
}
