import type { MetadataRoute } from 'next'
import { defaultLocale, locales } from '@/i18n/config'
import { getCertifications, getEducations, getExperiences, getProjects } from '@/lib/content'
import { localizedPath, siteOrigin } from '@/lib/seo'

export const dynamic = 'force-dynamic'

const STATIC_PATHS = ['/', '/projects', '/skills', '/photos', '/contact']

function entry(path: string, lastModified: Date): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteOrigin}${localizedPath(defaultLocale, path)}`,
    lastModified,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${siteOrigin}${localizedPath(l, path)}`]),
      ),
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [experiences, educations, projects, certifications] = await Promise.all([
    getExperiences(defaultLocale),
    getEducations(defaultLocale),
    getProjects(defaultLocale),
    getCertifications(defaultLocale),
  ])
  const paths = [
    ...STATIC_PATHS,
    ...experiences.map((e) => `/experience/${e.slug}`),
    ...educations.map((e) => `/education/${e.slug}`),
    ...projects.map((p) => `/projects/${p.slug}`),
    ...certifications.map((c) => `/certifications/${c.slug}`),
  ]
  return paths.map((p) => entry(p, now))
}
