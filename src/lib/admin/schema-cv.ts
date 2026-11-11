import { z } from 'zod'
import {
  optionalDate,
  optionalUrl,
  requiredDate,
  requiredText,
  slugSchema,
  statusSchema,
  text,
  translationsSchema,
} from './schema-common'

const endsAfterStart = (value: { startDate: string; endDate: string }) =>
  value.endDate === '' || value.endDate >= value.startDate

const endDateIssue = { message: 'End date must not precede the start date', path: ['endDate'] }

export const experienceSchema = z
  .object({
    slug: slugSchema,
    organization: requiredText(200),
    location: text(200),
    url: optionalUrl,
    startDate: requiredDate,
    endDate: optionalDate,
    featured: z.boolean(),
    status: statusSchema,
    tags: text(500),
    translations: translationsSchema(
      z.object({
        role: text(200),
        summary: text(600),
        description: text(8000),
        highlights: text(4000),
      }),
      'role',
    ),
  })
  .refine(endsAfterStart, endDateIssue)
export type ExperienceInput = z.infer<typeof experienceSchema>

export const educationSchema = z
  .object({
    slug: slugSchema,
    institution: requiredText(200),
    location: text(200),
    url: optionalUrl,
    startDate: requiredDate,
    endDate: optionalDate,
    status: statusSchema,
    translations: translationsSchema(
      z.object({
        title: text(200),
        summary: text(600),
        description: text(8000),
        highlights: text(4000),
      }),
      'title',
    ),
  })
  .refine(endsAfterStart, endDateIssue)
export type EducationInput = z.infer<typeof educationSchema>

export const certificationSchema = z.object({
  slug: slugSchema,
  issuer: text(200),
  issuedAt: optionalDate,
  url: optionalUrl,
  status: statusSchema,
  translations: translationsSchema(z.object({ name: text(200), description: text(4000) }), 'name'),
})
export type CertificationInput = z.infer<typeof certificationSchema>
