import { z } from 'zod'

/** Error messages are i18n keys under `contact.validation.*`, translated where they are shown. */
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(100, 'fieldLong'),
  email: z.string().trim().max(200, 'fieldLong').pipe(z.email('emailInvalid')),
  subject: z.string().trim().max(150, 'fieldLong').optional(),
  message: z.string().trim().min(10, 'messageShort').max(5000, 'messageLong'),
  /** Honeypot: real users never see or fill it. */
  website: z.string().max(200).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>
