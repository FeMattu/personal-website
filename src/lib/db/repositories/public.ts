import 'server-only'
import { prisma } from '@/lib/db/prisma'

/**
 * Read queries for the public site. Only PUBLISHED rows, ordered by `position`, selective includes.
 * Repositories are the ONLY place that talks to Prisma (besides seed/scripts).
 */
const published = { status: 'PUBLISHED' } as const
const byPosition = { position: 'asc' } as const

const projectInclude = {
  translations: true,
  tags: { include: { tag: true } },
  images: { orderBy: byPosition },
  skills: { include: { skill: true } },
} as const

export const publicRepo = {
  site: () =>
    prisma.siteSettings.findUnique({ where: { id: 'site' }, include: { translations: true } }),

  socialLinks: () => prisma.socialLink.findMany({ where: published, orderBy: byPosition }),

  spokenLanguages: () =>
    prisma.spokenLanguage.findMany({
      where: published,
      orderBy: byPosition,
      include: { translations: true },
    }),

  experiences: () =>
    prisma.experience.findMany({
      where: published,
      orderBy: byPosition,
      include: { translations: true, tags: { include: { tag: true } } },
    }),
  experienceBySlug: (slug: string) =>
    prisma.experience.findFirst({
      where: { slug, ...published },
      include: { translations: true, tags: { include: { tag: true } } },
    }),

  educations: () =>
    prisma.education.findMany({
      where: published,
      orderBy: byPosition,
      include: { translations: true },
    }),
  educationBySlug: (slug: string) =>
    prisma.education.findFirst({ where: { slug, ...published }, include: { translations: true } }),

  certifications: () =>
    prisma.certification.findMany({
      where: published,
      orderBy: byPosition,
      include: { translations: true },
    }),
  certificationBySlug: (slug: string) =>
    prisma.certification.findFirst({
      where: { slug, ...published },
      include: { translations: true },
    }),

  skillCategories: () =>
    prisma.skillCategory.findMany({
      where: published,
      orderBy: byPosition,
      include: {
        translations: true,
        skills: {
          where: published,
          orderBy: byPosition,
          include: {
            translations: true,
            projects: {
              where: { project: published },
              include: { project: { include: { translations: true } } },
            },
          },
        },
      },
    }),

  projects: () =>
    prisma.project.findMany({
      where: published,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: projectInclude,
    }),
  projectBySlug: (slug: string) =>
    prisma.project.findFirst({ where: { slug, ...published }, include: projectInclude }),

  albums: () =>
    prisma.photoAlbum.findMany({
      where: published,
      orderBy: byPosition,
      include: { translations: true, _count: { select: { photos: { where: published } } } },
    }),
}
