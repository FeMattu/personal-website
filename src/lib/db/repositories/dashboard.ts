import 'server-only'
import { prisma } from '@/lib/db/prisma'

/** Counts shown on the admin dashboard (one round trip). */
export async function getDashboardCounts() {
  const [experiences, education, skills, projects, projectsDraft, photos, messagesNew] =
    await Promise.all([
      prisma.experience.count(),
      prisma.education.count(),
      prisma.skill.count(),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'DRAFT' } }),
      prisma.photo.count(),
      prisma.contactMessage.count({ where: { status: 'NEW' } }),
    ])
  return { experiences, education, skills, projects, projectsDraft, photos, messagesNew }
}
