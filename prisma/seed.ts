/**
 * Idempotent seed. Every write is an `upsert` with an EMPTY `update`: rows that already exist
 * (and may have been edited from the admin) are never overwritten. Safe to run on every deploy.
 */
import 'dotenv/config'
import { PrismaClient, type SocialKind } from '@prisma/client'
import {
  certifications,
  draftProjects,
  education,
  experiences,
  locales,
  siteTexts,
  skillCategories,
  socialLinks,
  spokenLanguages,
} from './seed-data'

const prisma = new PrismaClient()
const LOCALES = locales.map((l) => l.code)

const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

type L = { it: string; en: string }
type LList = { it: string[]; en: string[] }
const t = (l: L | null | undefined, code: string): string | null =>
  l ? ((l as Record<string, string>)[code] ?? null) : null
const tl = (l: LList | null | undefined, code: string): string[] =>
  l ? ((l as Record<string, string[]>)[code] ?? []) : []

async function seedLocales() {
  for (const l of locales) {
    await prisma.locale.upsert({
      where: { code: l.code },
      update: {},
      create: { code: l.code, name: l.name, isDefault: l.isDefault, position: l.position },
    })
  }
}

async function seedSite() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  await prisma.siteSettings.upsert({
    where: { id: 'site' },
    update: {},
    create: {
      id: 'site',
      ownerName: 'Federico Mattucci',
      email: adminEmail || 'mattucci.federico@gmail.com',
      phone: '+39 334 185 4239',
      cvPath: '/cv/federico-mattucci-cv.pdf',
    },
  })
  for (const code of LOCALES) {
    await prisma.siteSettingsTranslation.upsert({
      where: { settingsId_locale: { settingsId: 'site', locale: code } },
      update: {},
      create: {
        settingsId: 'site',
        locale: code,
        role: t(siteTexts['hero.role'], code) ?? '',
        bio: t(siteTexts['about.bio'], code),
        interests: t(siteTexts['about.interests'], code),
        location: t(siteTexts['hero.location'], code),
        seoDescription: t(siteTexts['seo.home.description'], code),
      },
    })
  }
}

async function upsertTag(name: string, kind: 'TECH' | 'PHOTO' = 'TECH') {
  const slug = slugify(name)
  return prisma.tag.upsert({ where: { slug }, update: {}, create: { slug, name, kind } })
}

async function seedExperiences() {
  for (const [position, e] of experiences.entries()) {
    const row = await prisma.experience.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        organization: e.organization,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        featured: e.featured,
        position,
      },
    })
    for (const code of LOCALES) {
      await prisma.experienceTranslation.upsert({
        where: { experienceId_locale: { experienceId: row.id, locale: code } },
        update: {},
        create: {
          experienceId: row.id,
          locale: code,
          role: t(e.role, code) ?? '',
          summary: t(e.summary, code),
          highlights: tl(e.highlights, code),
        },
      })
    }
    for (const name of e.tags) {
      const tag = await upsertTag(name)
      await prisma.experienceTag.upsert({
        where: { experienceId_tagId: { experienceId: row.id, tagId: tag.id } },
        update: {},
        create: { experienceId: row.id, tagId: tag.id },
      })
    }
  }
}

async function seedEducation() {
  for (const [position, e] of education.entries()) {
    const row = await prisma.education.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        institution: e.institution,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        position,
      },
    })
    for (const code of LOCALES) {
      await prisma.educationTranslation.upsert({
        where: { educationId_locale: { educationId: row.id, locale: code } },
        update: {},
        create: {
          educationId: row.id,
          locale: code,
          title: t(e.title, code) ?? '',
          summary: t(e.summary, code),
          highlights: tl(e.highlights, code),
        },
      })
    }
  }
}

async function seedCertifications() {
  for (const [position, c] of certifications.entries()) {
    const row = await prisma.certification.upsert({
      where: { slug: c.slug },
      update: {},
      create: { slug: c.slug, issuer: c.issuer, position },
    })
    for (const code of LOCALES) {
      await prisma.certificationTranslation.upsert({
        where: { certificationId_locale: { certificationId: row.id, locale: code } },
        update: {},
        create: { certificationId: row.id, locale: code, name: t(c.name, code) ?? '' },
      })
    }
  }
}

async function seedSkills() {
  for (const [position, cat] of skillCategories.entries()) {
    const row = await prisma.skillCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { slug: cat.slug, position },
    })
    for (const code of LOCALES) {
      await prisma.skillCategoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: row.id, locale: code } },
        update: {},
        create: { categoryId: row.id, locale: code, name: t(cat.name, code) ?? '' },
      })
    }
    for (const [i, name] of cat.skills.entries()) {
      const slug = slugify(name)
      await prisma.skill.upsert({
        where: { slug },
        update: {},
        create: { slug, name, categoryId: row.id, position: i },
      })
    }
  }
}

async function seedSpokenLanguages() {
  for (const [position, s] of spokenLanguages.entries()) {
    const row = await prisma.spokenLanguage.upsert({
      where: { code: s.code },
      update: {},
      create: { code: s.code, name: s.name, proficiency: s.proficiency, position },
    })
    if (!s.detail) continue
    for (const code of LOCALES) {
      await prisma.spokenLanguageTranslation.upsert({
        where: { spokenLanguageId_locale: { spokenLanguageId: row.id, locale: code } },
        update: {},
        create: { spokenLanguageId: row.id, locale: code, detail: t(s.detail, code) },
      })
    }
  }
}

async function seedSocialLinks() {
  // No natural key: only seed when the table is empty so re-runs never duplicate or resurrect deleted links.
  if ((await prisma.socialLink.count()) > 0) return
  await prisma.socialLink.createMany({
    data: socialLinks.map((s, position) => ({
      kind: s.kind as SocialKind,
      label: s.label,
      url: s.url,
      position,
    })),
  })
}

async function seedProjects() {
  for (const [position, p] of draftProjects.entries()) {
    const row = await prisma.project.upsert({
      where: { slug: p.slug },
      update: {},
      create: { slug: p.slug, status: 'DRAFT', position },
    })
    for (const code of LOCALES) {
      await prisma.projectTranslation.upsert({
        where: { projectId_locale: { projectId: row.id, locale: code } },
        update: {},
        create: { projectId: row.id, locale: code, title: t(p.title, code) ?? '' },
      })
    }
  }
}

async function main() {
  await seedLocales()
  await seedSite()
  await seedExperiences()
  await seedEducation()
  await seedCertifications()
  await seedSkills()
  await seedSpokenLanguages()
  await seedSocialLinks()
  await seedProjects()
  console.log('Seed complete (idempotent: existing rows were left untouched).')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
