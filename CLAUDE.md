# Personal website: project memory

Bilingual (IT default, EN) portfolio + CV for Federico Mattucci with a built-in admin. This is a **clean rewrite** on branch
`feat/site-rewrite` (never touch `main`, never force-push; the owner decides the merge). The old project
(`D:\OneDrive - University of Pisa\2-LAVORO\7-PERSONALE\FedericoMattucci`) is a **read-only** content/config source.

**Read at the start of every session/phase:** `.claude/memory/progress.md` (log + TODO), `docs/DECISIONS.md`,
`docs/REWRITE_PLAN.md`. **Update `progress.md` after every phase** (and this file if a rule changes).

## Stack (exact versions are in `package.json` / `pnpm-lock.yaml`)

Next.js 16 (App Router, `src/`, `proxy.ts`) · React 19 · TypeScript `~6.0` strict + `noUncheckedIndexedAccess` · Tailwind CSS 4 ·
shadcn/ui (`radix-nova`, **only** via `pnpm dlx shadcn@latest add`, `src/components/ui` never hand-edited) · `cn()` (clsx +
tailwind-merge) + cva · zod 4 · Prisma **6.19** + PostgreSQL 17 · Auth.js v5 (`next-auth@5.0.0-beta`, jwt + Prisma adapter) ·
next-intl 4 (`/[locale]`) · next-themes · `@dnd-kit` · sharp + exifr · AWS SDK v3 (S3) · vitest 5 + Testing Library + jsdom ·
Playwright · ESLint 9 + Prettier · knip. Package manager: **pnpm only** (single lockfile, no `.npmrc`). Node >= 22.

## Commands

`pnpm dev | build | start | lint | typecheck | test | test:integration | test:coverage | test:e2e | db:migrate | db:seed | docker:up`.
Gate before every commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
Local DB: `docker compose -f compose.dev.yaml up -d db` (Postgres on `127.0.0.1:54340`, DBs `site` and `site_test`).
Full stack in Docker: `docker compose up -d --build` (prod-like) or `docker compose -f compose.dev.yaml up` (hot reload).

## Structure

```
src/app/(site)/[locale]/   public pages (ISR, revalidate 300 + revalidatePath on admin writes)
src/app/(admin)/           /login and /admin/** (the ONLY place with a sidebar)
src/app/api/               health, media (local storage), auth
src/actions/               server actions (session check -> zod -> repository -> revalidate -> ActionResult)
src/lib/                   db/repositories (ONLY Prisma users), content (read models), i18n, storage, photos, auth, contact, validation, ordering
src/components/            ui (shadcn) layout home detail projects skills photos admin
src/i18n/                  config.ts routing.ts request.ts navigation.ts messages/{it,en}.json
src/env.ts                 zod env, per group: env('db'|'auth'|'storage'|'mail'|'site')
prisma/                    schema.prisma, migrations/ (real migrations only), seed.ts (idempotent)
tests/                     unit/ integration/ e2e/ stubs/
docs/                      REWRITE_PLAN, DECISIONS, PHOTOS-AWS-SETUP, architecture-before/after, CONTENT_MAPPING, ...
```

## Rules

- **English** for code, identifiers, files, comments, commits, docs. UI strings only through `src/i18n/messages/{it,en}.json`
  (keys identical, enforced by a test) or DB translations. New language = new messages file + one line in `src/i18n/config.ts` + a `Locale` row.
- DB content is translatable per locale with fallback to the default locale per field (`lib/i18n/localize.ts`). Photos/covers store **storage keys only**.
- **Public** nav = sticky top bar only (no sidebar/`<aside>`); shadcn Sidebar only under `/admin`. Public layout is static: no `auth()`/`cookies()`.
- Every admin page calls `requireAdmin()`; every write action calls `assertAdmin()` first, then validates with zod, writes via a repository,
  then `revalidatePath`. Return `ActionResult`; never throw to the UI. Unauthenticated writes must be rejected (tested).
- Migrations: `prisma migrate dev --name x` (never `db push`). Seed uses `upsert` with **empty `update`** so admin edits are never overwritten.
- No `any`. No secrets in git (`.env*` ignored except `.env.example`). Never print secrets in logs/docs/commits.
- Design: minimal, whitespace, hairline borders, primary = blue via shadcn CSS variables (`--primary`), no heavy gradients, animations respect
  `prefers-reduced-motion`, WCAG AA light + dark, visible focus, no hard-coded colours.
- Commits: small Conventional Commits in English. Phase gates must pass first.
- A "Fact-Forcing Gate" hook asks for facts before first writes in a new directory: state them, then retry (do not disable the hook).

## Pointers

Photos/AWS: `docs/PHOTOS-AWS-SETUP.md`. Content mapping from the CV: `docs/CONTENT_MAPPING.md`. Old project analysis: `docs/old-project-inventory.md`, `docs/issues-found.md`.
