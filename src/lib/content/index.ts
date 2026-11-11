import 'server-only'
import { unstable_cache } from 'next/cache'
import { defaultLocale } from '@/i18n/config'
import { publicRepo } from '@/lib/db/repositories/public'
import { localize } from '@/lib/i18n/localize'
import type {
  CertificationView,
  EducationView,
  ExperienceView,
  ProjectView,
  SiteView,
  SkillCategoryView,
  SocialView,
  SpokenLanguageView,
  TagView,
} from './types'

/**
 * Public read models: plain, serialisable objects (dates as `YYYY-MM-DD` strings) so they can live in
 * the Next data cache. Every admin write calls `revalidateContent()` (tag `content`); entries also
 * expire after 5 minutes as a safety net. Pages are rendered on request (no DB needed at build time).
 */
export const CONTENT_TAG = 'content'
const REVALIDATE_SECONDS = 300

const cached = <A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>) =>
  unstable_cache(fn, ['content', name], { tags: [CONTENT_TAG], revalidate: REVALIDATE_SECONDS })

const day = (d: Date | null | undefined): string | null => (d ? d.toISOString().slice(0, 10) : null)
const tagView = (t: { tag: { slug: string; name: string } }): TagView => ({
  slug: t.tag.slug,
  name: t.tag.name,
})
const paragraphs = (text: string | null | undefined): string[] =>
  (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

export const getSite = cached('site', async (locale: string): Promise<SiteView | null> => {
  const row = await publicRepo.site()
  if (!row) return null
  const t = localize(row.translations, locale, defaultLocale)
  return {
    ownerName: row.ownerName,
    email: row.email,
    phone: row.phone,
    avatarKey: row.avatarKey,
    cvPath: row.cvPath,
    role: t?.role ?? '',
    tagline: t?.tagline ?? null,
    bio: paragraphs(t?.bio),
    interests: t?.interests ?? null,
    location: t?.location ?? null,
    seoTitle: t?.seoTitle ?? null,
    seoDescription: t?.seoDescription ?? null,
  }
})

export const getSocialLinks = cached('social', async (): Promise<SocialView[]> =>
  (await publicRepo.socialLinks()).map((s) => ({
    id: s.id,
    kind: s.kind,
    label: s.label ?? s.kind,
    url: s.url,
  })),
)

export const getSpokenLanguages = cached(
  'spoken',
  async (locale: string): Promise<SpokenLanguageView[]> =>
    (await publicRepo.spokenLanguages()).map((s) => ({
      code: s.code,
      name: s.name,
      proficiency: s.proficiency,
      detail: localize(s.translations, locale, defaultLocale)?.detail ?? null,
    })),
)

type ExperienceRow = Awaited<ReturnType<typeof publicRepo.experiences>>[number]
const toExperience = (e: ExperienceRow, locale: string): ExperienceView => {
  const t = localize(e.translations, locale, defaultLocale)
  return {
    id: e.id,
    slug: e.slug,
    organization: e.organization,
    location: e.location,
    url: e.url,
    startDate: day(e.startDate) as string,
    endDate: day(e.endDate),
    featured: e.featured,
    role: t?.role ?? e.organization,
    summary: t?.summary ?? null,
    description: paragraphs(t?.description),
    highlights: t?.highlights ?? [],
    tags: e.tags.map(tagView),
  }
}

export const getExperiences = cached(
  'experiences',
  async (locale: string): Promise<ExperienceView[]> =>
    (await publicRepo.experiences()).map((e) => toExperience(e, locale)),
)
export const getExperience = cached(
  'experience',
  async (slug: string, locale: string): Promise<ExperienceView | null> => {
    const row = await publicRepo.experienceBySlug(slug)
    return row ? toExperience(row, locale) : null
  },
)

type EducationRow = Awaited<ReturnType<typeof publicRepo.educations>>[number]
const toEducation = (e: EducationRow, locale: string): EducationView => {
  const t = localize(e.translations, locale, defaultLocale)
  return {
    id: e.id,
    slug: e.slug,
    institution: e.institution,
    location: e.location,
    url: e.url,
    startDate: day(e.startDate) as string,
    endDate: day(e.endDate),
    title: t?.title ?? e.institution,
    summary: t?.summary ?? null,
    description: paragraphs(t?.description),
    highlights: t?.highlights ?? [],
  }
}

export const getEducations = cached(
  'educations',
  async (locale: string): Promise<EducationView[]> =>
    (await publicRepo.educations()).map((e) => toEducation(e, locale)),
)
export const getEducation = cached(
  'education',
  async (slug: string, locale: string): Promise<EducationView | null> => {
    const row = await publicRepo.educationBySlug(slug)
    return row ? toEducation(row, locale) : null
  },
)

type CertificationRow = Awaited<ReturnType<typeof publicRepo.certifications>>[number]
const toCertification = (c: CertificationRow, locale: string): CertificationView => {
  const t = localize(c.translations, locale, defaultLocale)
  return {
    id: c.id,
    slug: c.slug,
    issuer: c.issuer,
    issuedAt: day(c.issuedAt),
    url: c.url,
    name: t?.name ?? c.slug,
    description: paragraphs(t?.description),
  }
}

export const getCertifications = cached(
  'certifications',
  async (locale: string): Promise<CertificationView[]> =>
    (await publicRepo.certifications()).map((c) => toCertification(c, locale)),
)
export const getCertification = cached(
  'certification',
  async (slug: string, locale: string): Promise<CertificationView | null> => {
    const row = await publicRepo.certificationBySlug(slug)
    return row ? toCertification(row, locale) : null
  },
)

export const getSkillCategories = cached(
  'skills',
  async (locale: string): Promise<SkillCategoryView[]> =>
    (await publicRepo.skillCategories()).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: localize(c.translations, locale, defaultLocale)?.name ?? c.slug,
      skills: c.skills.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        level: s.level,
        description: localize(s.translations, locale, defaultLocale)?.description ?? null,
        projects: s.projects.map((p) => ({
          slug: p.project.slug,
          title: localize(p.project.translations, locale, defaultLocale)?.title ?? p.project.slug,
        })),
      })),
    })),
)

type ProjectRow = Awaited<ReturnType<typeof publicRepo.projects>>[number]
const toProject = (p: ProjectRow, locale: string): ProjectView => {
  const t = localize(p.translations, locale, defaultLocale)
  return {
    id: p.id,
    slug: p.slug,
    title: t?.title ?? p.slug,
    summary: t?.summary ?? null,
    description: paragraphs(t?.description),
    goals: paragraphs(t?.goals),
    coverKey: p.coverKey,
    liveUrl: p.liveUrl,
    repoUrl: p.repoUrl,
    startDate: day(p.startDate),
    featured: p.featured,
    tags: p.tags.map(tagView),
    images: p.images.map((i) => ({ id: i.id, key: i.storageKey })),
    skills: p.skills.map((s) => ({ slug: s.skill.slug, name: s.skill.name })),
  }
}

export const getProjects = cached('projects', async (locale: string): Promise<ProjectView[]> =>
  (await publicRepo.projects()).map((p) => toProject(p, locale)),
)
export const getProject = cached(
  'project',
  async (slug: string, locale: string): Promise<ProjectView | null> => {
    const row = await publicRepo.projectBySlug(slug)
    return row ? toProject(row, locale) : null
  },
)

export const getPhotoAlbums = cached('albums', async (locale: string) =>
  (await publicRepo.albums()).map((a) => {
    const t = localize(a.translations, locale, defaultLocale)
    return {
      id: a.id,
      slug: a.slug,
      title: t?.title ?? a.slug,
      description: t?.description ?? null,
      photoCount: a._count.photos,
    }
  }),
)
