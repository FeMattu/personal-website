import { env } from '@/env'

export type MailMessage = {
  name: string
  email: string
  subject?: string | null
  body: string
  locale?: string | null
}

/** Removes CR/LF so user input can never inject e-mail headers. */
export function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export function buildEmail(message: MailMessage, to: string, from: string) {
  return {
    from,
    to: [to],
    reply_to: singleLine(message.email),
    subject: `[Site] ${singleLine(message.subject || message.name)}`.slice(0, 200),
    text: `From: ${singleLine(message.name)} <${singleLine(message.email)}>\nLocale: ${message.locale ?? '-'}\n\n${message.body}`,
  }
}

/** Sends the notification through Resend's REST API. Skips silently when not configured. */
export async function sendContactEmail(
  message: MailMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<'sent' | 'skipped'> {
  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = env('mail')
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) return 'skipped'

  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(
      buildEmail(message, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL ?? 'onboarding@resend.dev'),
    ),
  })
  if (!response.ok) throw new Error(`Resend responded ${response.status}`)
  return 'sent'
}
