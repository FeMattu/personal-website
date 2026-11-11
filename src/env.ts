import { z } from 'zod'

/**
 * Environment is validated per group so a feature only requires its own variables
 * (a static build must not demand auth or AWS secrets). Server-only: never import in client code.
 */
const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(emptyToUndefined, schema.optional())

const groups = {
  db: z.object({ DATABASE_URL: z.string().min(1) }),
  site: z.object({
    NEXT_PUBLIC_SITE_URL: z.preprocess(emptyToUndefined, z.url().default('http://localhost:3000')),
  }),
  auth: z.object({
    AUTH_SECRET: z.string().min(16),
    ADMIN_EMAIL: z.email(),
    ADMIN_PASSWORD_HASH: optional(z.string().min(1)),
    AUTH_GITHUB_ID: optional(z.string()),
    AUTH_GITHUB_SECRET: optional(z.string()),
  }),
  storage: z.object({
    STORAGE_DRIVER: z.preprocess(emptyToUndefined, z.enum(['local', 's3']).default('local')),
    LOCAL_STORAGE_DIR: z.preprocess(emptyToUndefined, z.string().default('./storage-data')),
    STORAGE_PUBLIC_BASE_URL: optional(z.url()),
    AWS_REGION: optional(z.string()),
    AWS_ACCESS_KEY_ID: optional(z.string()),
    AWS_SECRET_ACCESS_KEY: optional(z.string()),
    S3_BUCKET: optional(z.string()),
    S3_ENDPOINT: optional(z.url()),
    S3_FORCE_PATH_STYLE: z.preprocess(emptyToUndefined, z.enum(['true', 'false']).default('false')),
  }),
  mail: z.object({
    RESEND_API_KEY: optional(z.string()),
    CONTACT_TO_EMAIL: optional(z.email()),
    CONTACT_FROM_EMAIL: optional(z.string()),
    AUTH_SECRET: optional(z.string()),
  }),
} as const

type Groups = typeof groups
export type EnvGroup = keyof Groups
export type Env<G extends EnvGroup> = z.infer<Groups[G]>

export function parseEnv<G extends EnvGroup>(
  group: G,
  source: Record<string, string | undefined> = process.env,
): Env<G> {
  const result = groups[group].safeParse(source)
  if (!result.success) {
    const names = result.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Invalid or missing environment variables (${group}): ${names}`)
  }
  return result.data as Env<G>
}

const cache = new Map<EnvGroup, unknown>()

/** Cached, per-group accessor: `env('storage').STORAGE_DRIVER`. */
export function env<G extends EnvGroup>(group: G): Env<G> {
  if (!cache.has(group)) cache.set(group, parseEnv(group))
  return cache.get(group) as Env<G>
}

/** Test helper. */
export function resetEnvCache(): void {
  cache.clear()
}

/** Absolute site origin without trailing slash. */
export function siteUrl(): string {
  return env('site').NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
}
