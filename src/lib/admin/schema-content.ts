import { z } from 'zod'
import {
  idSchema,
  optionalDate,
  optionalUrl,
  requiredText,
  slugSchema,
  statusSchema,
  text,
  translationsSchema,
} from './schema-common'

export const SKILL_LEVELS = ['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const
export const PROFICIENCIES = ['BASIC', 'INTERMEDIATE', 'FLUENT', 'NATIVE'] as const
export const SOCIAL_KINDS = [
  'GITHUB',
  'LINKEDIN',
  'INSTAGRAM',
  'EMAIL',
  'PHONE',
  'WEBSITE',
  'OTHER',
] as const
export const MESSAGE_STATUSES = ['NEW', 'READ', 'ARCHIVED'] as const

export const categorySchema = z.object({
  slug: slugSchema,
  status: statusSchema,
  translations: translationsSchema(z.object({ name: text(120) }), 'name'),
})
export type CategoryInput = z.infer<typeof categorySchema>

export const skillSchema = z.object({
  slug: slugSchema,
  name: requiredText(120),
  /** Empty string = not rated. */
  level: z.union([z.literal(''), z.enum(SKILL_LEVELS)]),
  categoryId: idSchema,
  status: statusSchema,
  translations: translationsSchema(z.object({ description: text(1000) }), null),
})
export type SkillInput = z.infer<typeof skillSchema>

export const projectSchema = z.object({
  slug: slugSchema,
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  startDate: optionalDate,
  featured: z.boolean(),
  status: statusSchema,
  tags: text(500),
  skillIds: z.array(idSchema).max(200),
  translations: translationsSchema(
    z.object({
      title: text(200),
      summary: text(600),
      description: text(10000),
      goals: text(4000),
    }),
    'title',
  ),
})
export type ProjectInput = z.infer<typeof projectSchema>

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Must be a valid email')

export const siteSchema = z.object({
  ownerName: requiredText(120),
  email: optionalEmail,
  phone: text(60),
  cvPath: text(500),
  translations: translationsSchema(
    z.object({
      role: text(200),
      tagline: text(300),
      bio: text(6000),
      interests: text(2000),
      location: text(200),
      seoTitle: text(120),
      seoDescription: text(300),
    }),
    'role',
  ),
})
export type SiteInput = z.infer<typeof siteSchema>

const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']
const isLinkUrl = (value: string): boolean => {
  try {
    return ALLOWED_LINK_PROTOCOLS.includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export const socialSchema = z.object({
  kind: z.enum(SOCIAL_KINDS),
  label: text(80),
  url: requiredText(500).refine(isLinkUrl, 'Use an http(s), mailto: or tel: URL'),
  status: statusSchema,
})
export type SocialInput = z.infer<typeof socialSchema>

export const spokenLanguageSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2,3}(?:-[a-z]{2,4})?$/, 'Use a language code such as "en" or "pt-br"'),
  name: requiredText(80),
  proficiency: z.enum(PROFICIENCIES),
  status: statusSchema,
  translations: translationsSchema(z.object({ detail: text(200) }), null),
})
export type SpokenLanguageInput = z.infer<typeof spokenLanguageSchema>

export const messageStatusSchema = z.object({ id: idSchema, status: z.enum(MESSAGE_STATUSES) })

export const albumSchema = z.object({
  slug: slugSchema,
  status: statusSchema,
  translations: translationsSchema(
    z.object({ title: text(200), description: text(2000) }),
    'title',
  ),
})
export type AlbumInput = z.infer<typeof albumSchema>

export const photoSchema = z.object({
  /** Empty string = no album. */
  albumId: z.union([z.literal(''), idSchema]),
  featured: z.boolean(),
  status: statusSchema,
  tags: text(500),
  translations: translationsSchema(
    z.object({ title: text(200), description: text(2000), alt: text(300) }),
    null,
  ),
})
export type PhotoInput = z.infer<typeof photoSchema>
