// IMPORT THIS FIRST in every integration test: it points Prisma at the test database before
// `@/lib/db/prisma` is evaluated and refuses anything that is not clearly a test database.
import { config } from 'dotenv'
import type { vi } from 'vitest'

config({ path: '.env', quiet: true })

const testUrl = process.env.DATABASE_URL_TEST
if (!testUrl) throw new Error('DATABASE_URL_TEST is required for integration tests')
const dbName = decodeURIComponent(new URL(testUrl).pathname.replace(/^\//, ''))
if (!dbName.toLowerCase().includes('test')) {
  throw new Error(`Refusing to touch database "${dbName}": its name must contain "test"`)
}
process.env.DATABASE_URL = testUrl

import { PrismaClient } from '@prisma/client'
import { defaultLocale, locales } from '../../src/i18n/config'

export const db = new PrismaClient({ datasourceUrl: testUrl })

/** Content tables emptied between tests (`Locale` rows are kept). CASCADE clears the children. */
const CONTENT_TABLES = [
  'Experience',
  'Education',
  'Certification',
  'SpokenLanguage',
  'SkillCategory',
  'Skill',
  'Project',
  'PhotoAlbum',
  'Photo',
  'Tag',
  'SocialLink',
  'ContactMessage',
  'SiteSettings',
]

export async function truncateContent(): Promise<void> {
  const list = CONTENT_TABLES.map((table) => `"${table}"`).join(', ')
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`)
}

/** Makes `auth()` (mocked `@/auth`) return an admin session, or `null` for anonymous. */
export function signIn(auth: ReturnType<typeof vi.fn>, as: 'admin' | 'anonymous'): void {
  auth.mockResolvedValue(
    as === 'admin' ? { user: { isAdmin: true, email: 'admin@example.com' } } : null,
  )
}

/** Translations map with the default locale filled (all other locales empty). */
export function translations<T extends Record<string, string>>(filled: T): Record<string, T> {
  const empty = Object.fromEntries(Object.keys(filled).map((key) => [key, ''])) as T
  return Object.fromEntries(
    locales.map((code) => [code, code === defaultLocale ? { ...filled } : { ...empty }]),
  )
}
