import 'server-only'
import { createHash } from 'node:crypto'
import { messagesRepo } from '@/lib/db/repositories/messages'
import { contactSchema } from '@/lib/validation/contact'
import { sendContactEmail } from './mailer'

export const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 }

export type ContactOutcome =
  | { ok: true }
  | { ok: false; reason: 'invalid'; fieldErrors: Record<string, string> }
  | { ok: false; reason: 'rate_limited' | 'error' }

/** sha256(ip + secret): rate limiting without storing raw addresses. */
export function hashIp(ip: string, secret = process.env.AUTH_SECRET ?? ''): string {
  return createHash('sha256').update(`${ip}|${secret}`).digest('hex')
}

/**
 * Validates, applies the honeypot and the DB-backed rate limit, stores the message, then e-mails it.
 * E-mail failures never fail the submission: the message is already stored.
 */
export async function submitContact(
  raw: unknown,
  ctx: { ip: string; locale: string; now?: Date },
): Promise<ContactOutcome> {
  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? 'form')
      fieldErrors[field] ??= issue.message
    }
    return { ok: false, reason: 'invalid', fieldErrors }
  }

  // Honeypot filled => a bot: report success, store nothing.
  if (parsed.data.website && parsed.data.website.trim() !== '') return { ok: true }

  const ipHash = hashIp(ctx.ip)
  const since = new Date((ctx.now ?? new Date()).getTime() - RATE_LIMIT.windowMs)
  if ((await messagesRepo.countSince(ipHash, since)) >= RATE_LIMIT.max) {
    return { ok: false, reason: 'rate_limited' }
  }

  try {
    const { name, email, subject, message } = parsed.data
    const stored = {
      name,
      email,
      subject: subject || null,
      body: message,
      locale: ctx.locale,
      ipHash,
    }
    await messagesRepo.create(stored)
    try {
      await sendContactEmail(stored)
    } catch (error) {
      console.error('Contact e-mail failed (message was stored):', (error as Error).message)
    }
    return { ok: true }
  } catch (error) {
    console.error('Contact submission failed:', (error as Error).message)
    return { ok: false, reason: 'error' }
  }
}
