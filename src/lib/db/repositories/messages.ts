import 'server-only'
import type { MessageStatus } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

export const messagesRepo = {
  create: (data: {
    name: string
    email: string
    subject?: string | null
    body: string
    locale?: string | null
    ipHash?: string | null
  }) => prisma.contactMessage.create({ data }),

  countSince: (ipHash: string, since: Date) =>
    prisma.contactMessage.count({ where: { ipHash, createdAt: { gte: since } } }),

  list: (status?: MessageStatus) =>
    prisma.contactMessage.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),

  setStatus: (id: string, status: MessageStatus) =>
    prisma.contactMessage.update({ where: { id }, data: { status } }),

  remove: (id: string) => prisma.contactMessage.delete({ where: { id } }),

  countNew: () => prisma.contactMessage.count({ where: { status: 'NEW' } }),
}
