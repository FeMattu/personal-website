import type {
  Certification,
  CertificationTranslation,
  Education,
  EducationTranslation,
  Experience,
  ExperienceTranslation,
  PhotoAlbum,
  PhotoAlbumTranslation,
  Project,
  ProjectTranslation,
  SkillCategory,
  SkillCategoryTranslation,
  Skill,
  SkillTranslation,
  SocialLink,
  SpokenLanguage,
  SpokenLanguageTranslation,
  Photo,
  PhotoTranslation,
  SiteSettings,
  SiteSettingsTranslation,
  Tag,
} from '@prisma/client'
import { fromDbDate, joinLines, joinTags, localeMap } from './mappers'
import type { CertificationInput, EducationInput, ExperienceInput } from './schema-cv'
import type {
  AlbumInput,
  CategoryInput,
  PhotoInput,
  ProjectInput,
  SiteInput,
  SkillInput,
  SocialInput,
  SpokenLanguageInput,
} from './schema-content'

const find = <T extends { locale: string }>(rows: readonly T[], locale: string) =>
  rows.find((r) => r.locale === locale)
const s = (value: string | null | undefined): string => value ?? ''
type WithTags = { tags: { tag: Pick<Tag, 'name'> }[] }

export const blankExperience = (): ExperienceInput => ({
  slug: '',
  organization: '',
  location: '',
  url: '',
  startDate: '',
  endDate: '',
  featured: true,
  status: 'DRAFT',
  tags: '',
  translations: localeMap(() => ({ role: '', summary: '', description: '', highlights: '' })),
})

export const experienceToForm = (
  row: Experience & { translations: ExperienceTranslation[] } & WithTags,
): ExperienceInput => ({
  slug: row.slug,
  organization: row.organization,
  location: s(row.location),
  url: s(row.url),
  startDate: fromDbDate(row.startDate),
  endDate: fromDbDate(row.endDate),
  featured: row.featured,
  status: row.status,
  tags: joinTags(row.tags.map((t) => t.tag)),
  translations: localeMap((locale) => {
    const t = find(row.translations, locale)
    return {
      role: s(t?.role),
      summary: s(t?.summary),
      description: s(t?.description),
      highlights: joinLines(t?.highlights ?? []),
    }
  }),
})

export const blankEducation = (): EducationInput => ({
  slug: '',
  institution: '',
  location: '',
  url: '',
  startDate: '',
  endDate: '',
  status: 'DRAFT',
  translations: localeMap(() => ({ title: '', summary: '', description: '', highlights: '' })),
})

export const educationToForm = (
  row: Education & { translations: EducationTranslation[] },
): EducationInput => ({
  slug: row.slug,
  institution: row.institution,
  location: s(row.location),
  url: s(row.url),
  startDate: fromDbDate(row.startDate),
  endDate: fromDbDate(row.endDate),
  status: row.status,
  translations: localeMap((locale) => {
    const t = find(row.translations, locale)
    return {
      title: s(t?.title),
      summary: s(t?.summary),
      description: s(t?.description),
      highlights: joinLines(t?.highlights ?? []),
    }
  }),
})

export const blankCertification = (): CertificationInput => ({
  slug: '',
  issuer: '',
  issuedAt: '',
  url: '',
  status: 'DRAFT',
  translations: localeMap(() => ({ name: '', description: '' })),
})

export const certificationToForm = (
  row: Certification & { translations: CertificationTranslation[] },
): CertificationInput => ({
  slug: row.slug,
  issuer: s(row.issuer),
  issuedAt: fromDbDate(row.issuedAt),
  url: s(row.url),
  status: row.status,
  translations: localeMap((locale) => {
    const t = find(row.translations, locale)
    return { name: s(t?.name), description: s(t?.description) }
  }),
})

export const blankCategory = (): CategoryInput => ({
  slug: '',
  status: 'PUBLISHED',
  translations: localeMap(() => ({ name: '' })),
})

export const categoryToForm = (
  row: SkillCategory & { translations: SkillCategoryTranslation[] },
): CategoryInput => ({
  slug: row.slug,
  status: row.status,
  translations: localeMap((locale) => ({ name: s(find(row.translations, locale)?.name) })),
})

export const blankSkill = (categoryId: string): SkillInput => ({
  slug: '',
  name: '',
  level: '',
  categoryId,
  status: 'PUBLISHED',
  translations: localeMap(() => ({ description: '' })),
})

export const skillToForm = (row: Skill & { translations: SkillTranslation[] }): SkillInput => ({
  slug: row.slug,
  name: row.name,
  level: row.level ?? '',
  categoryId: row.categoryId,
  status: row.status,
  translations: localeMap((locale) => ({
    description: s(find(row.translations, locale)?.description),
  })),
})

export const blankProject = (): ProjectInput => ({
  slug: '',
  liveUrl: '',
  repoUrl: '',
  startDate: '',
  featured: false,
  status: 'DRAFT',
  tags: '',
  skillIds: [],
  translations: localeMap(() => ({ title: '', summary: '', description: '', goals: '' })),
})

export const projectToForm = (
  row: Project & {
    translations: ProjectTranslation[]
    skills: { skillId: string }[]
  } & WithTags,
): ProjectInput => ({
  slug: row.slug,
  liveUrl: s(row.liveUrl),
  repoUrl: s(row.repoUrl),
  startDate: fromDbDate(row.startDate),
  featured: row.featured,
  status: row.status,
  tags: joinTags(row.tags.map((t) => t.tag)),
  skillIds: row.skills.map((x) => x.skillId),
  translations: localeMap((locale) => {
    const t = find(row.translations, locale)
    return {
      title: s(t?.title),
      summary: s(t?.summary),
      description: s(t?.description),
      goals: s(t?.goals),
    }
  }),
})

export const siteToForm = (
  row: (SiteSettings & { translations: SiteSettingsTranslation[] }) | null,
): SiteInput => ({
  ownerName: s(row?.ownerName),
  email: s(row?.email),
  phone: s(row?.phone),
  cvPath: s(row?.cvPath),
  translations: localeMap((locale) => {
    const t = row ? find(row.translations, locale) : undefined
    return {
      role: s(t?.role),
      tagline: s(t?.tagline),
      bio: s(t?.bio),
      interests: s(t?.interests),
      location: s(t?.location),
      seoTitle: s(t?.seoTitle),
      seoDescription: s(t?.seoDescription),
    }
  }),
})

export const blankSocial = (): SocialInput => ({
  kind: 'GITHUB',
  label: '',
  url: '',
  status: 'PUBLISHED',
})

export const socialToForm = (row: SocialLink): SocialInput => ({
  kind: row.kind,
  label: s(row.label),
  url: row.url,
  status: row.status,
})

export const blankLanguage = (): SpokenLanguageInput => ({
  code: '',
  name: '',
  proficiency: 'FLUENT',
  status: 'PUBLISHED',
  translations: localeMap(() => ({ detail: '' })),
})

export const languageToForm = (
  row: SpokenLanguage & { translations: SpokenLanguageTranslation[] },
): SpokenLanguageInput => ({
  code: row.code,
  name: row.name,
  proficiency: row.proficiency,
  status: row.status,
  translations: localeMap((locale) => ({ detail: s(find(row.translations, locale)?.detail) })),
})

export const blankAlbum = (): AlbumInput => ({
  slug: '',
  status: 'PUBLISHED',
  translations: localeMap(() => ({ title: '', description: '' })),
})

export const albumToForm = (
  row: PhotoAlbum & { translations: PhotoAlbumTranslation[] },
): AlbumInput => ({
  slug: row.slug,
  status: row.status,
  translations: localeMap((locale) => {
    const t = find(row.translations, locale)
    return { title: s(t?.title), description: s(t?.description) }
  }),
})

export const photoToForm = (
  row: Photo & { translations: PhotoTranslation[] } & WithTags,
): PhotoInput => ({
  albumId: row.albumId ?? '',
  featured: row.featured,
  status: row.status,
  tags: joinTags(row.tags.map((t) => t.tag)),
  translations: localeMap((locale) => {
    const t = find(row.translations, locale)
    return { title: s(t?.title), description: s(t?.description), alt: s(t?.alt) }
  }),
})
