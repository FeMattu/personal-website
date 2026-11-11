'use server'

import { headers } from 'next/headers'
import { isLocale } from '@/i18n/config'
import { submitContact } from '@/lib/contact/service'

export type ContactActionState =
  | { status: 'success' }
  | { status: 'error'; reason: 'rate_limited' | 'error' }
  | { status: 'invalid'; fieldErrors: Record<string, string> }

/** Public action (no session needed): zod + honeypot + DB rate limit live in the service. */
export async function sendContactMessage(
  input: { name: string; email: string; subject?: string; message: string; website?: string },
  locale: string,
): Promise<ContactActionState> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  const outcome = await submitContact(input, { ip, locale: isLocale(locale) ? locale : 'it' })
  if (outcome.ok) return { status: 'success' }
  if (outcome.reason === 'invalid') return { status: 'invalid', fieldErrors: outcome.fieldErrors }
  return { status: 'error', reason: outcome.reason }
}
