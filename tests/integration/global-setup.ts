import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { defaultLocale, localeNames, locales } from '../../src/i18n/config'

const require = createRequire(import.meta.url)

/** Name of the database in a Postgres connection string. */
function databaseName(url: string): string {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, ''))
}

/**
 * Integration tests write to a REAL Postgres: refuse to run unless it is clearly a test database,
 * migrate it, and make sure the `Locale` rows exist (content tables are truncated per test).
 */
export default async function setup(): Promise<void> {
  config({ path: '.env', quiet: true })

  const url = process.env.DATABASE_URL_TEST
  if (!url) {
    throw new Error('DATABASE_URL_TEST is required to run integration tests (see .env.example)')
  }
  const name = databaseName(url)
  if (!name.toLowerCase().includes('test')) {
    throw new Error(
      `Refusing to run integration tests: database "${name}" does not contain "test" in its name`,
    )
  }

  // Everything below (and every test worker forked after this) talks to the test database only.
  process.env.DATABASE_URL = url

  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  })

  const prisma = new PrismaClient({ datasourceUrl: url })
  try {
    for (const [position, code] of locales.entries()) {
      await prisma.locale.upsert({
        where: { code },
        create: { code, name: localeNames[code], isDefault: code === defaultLocale, position },
        update: {},
      })
    }
  } finally {
    await prisma.$disconnect()
  }
}
