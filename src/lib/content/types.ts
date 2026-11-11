import type { LanguageProficiency, SkillLevel, SocialKind } from '@prisma/client'

export type TagView = { slug: string; name: string }

export type SiteView = {
  ownerName: string
  email: string | null
  phone: string | null
  avatarKey: string | null
  cvPath: string | null
  role: string
  tagline: string | null
  bio: string[]
  interests: string | null
  location: string | null
  seoTitle: string | null
  seoDescription: string | null
}

export type SocialView = { id: string; kind: SocialKind; label: string; url: string }

export type SpokenLanguageView = {
  code: string
  name: string
  proficiency: LanguageProficiency
  detail: string | null
}

export type ExperienceView = {
  id: string
  slug: string
  organization: string
  location: string | null
  url: string | null
  startDate: string
  endDate: string | null
  featured: boolean
  role: string
  summary: string | null
  description: string[]
  highlights: string[]
  tags: TagView[]
}

export type EducationView = {
  id: string
  slug: string
  institution: string
  location: string | null
  url: string | null
  startDate: string
  endDate: string | null
  title: string
  summary: string | null
  description: string[]
  highlights: string[]
}

export type CertificationView = {
  id: string
  slug: string
  issuer: string | null
  issuedAt: string | null
  url: string | null
  name: string
  description: string[]
}

export type SkillView = {
  id: string
  slug: string
  name: string
  level: SkillLevel | null
  description: string | null
  projects: { slug: string; title: string }[]
}

export type SkillCategoryView = { id: string; slug: string; name: string; skills: SkillView[] }

export type ProjectView = {
  id: string
  slug: string
  title: string
  summary: string | null
  description: string[]
  goals: string[]
  coverKey: string | null
  liveUrl: string | null
  repoUrl: string | null
  startDate: string | null
  featured: boolean
  tags: TagView[]
  images: { id: string; key: string }[]
  skills: { slug: string; name: string }[]
}
