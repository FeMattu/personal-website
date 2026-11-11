# Progress log (update after every phase)

## Phase 0: analysis + scaffold: DONE (2026-11-12)
- Branch `feat/site-rewrite`. graphify AST run on the old project -> `docs/architecture-before.md`. Old DB exported outside the repo (no admin edits to lose).
- Tooling configs, Docker (compose + compose.dev), `.env` built from old values (git-ignored), Prisma schema + `init` migration.

## Phase 1: data layer: DONE
- Idempotent seed (`prisma/seed.ts`, `seed-data.ts`), repositories (`lib/db/repositories`), tag-cached read models (`lib/content`), `localize()` with field-level fallback.

## Phase 2-3: shell + public pages: DONE
- next-intl `/[locale]` (it default, en), theme, sticky top navbar (scroll-spy, mobile Sheet), footer, home sections, skills (Tabs + level dots), projects (tag filter), generic detail route `[type]/[slug]`, contact (zod + honeypot + DB rate limit + Resend), photos placeholder, 404/error, sitemap, robots, hreflang, `/api/health`.
- Pages are `force-dynamic` over `unstable_cache` data (tag `content`): the build needs no DB.

## Phase 4: auth + admin: IN PROGRESS
- Done: Auth.js v5 (jwt + Prisma adapter, GitHub if configured, scrypt password provider), `/login`, admin shell (sidebar), dashboard.
- Delegated to a background agent: admin CRUD (`src/lib/admin`, `src/actions/admin`, `src/components/admin`, `/admin/*` pages), admin/integration tests.
- Local admin login: ADMIN_EMAIL from `.env`, password `admin-dev-local` (dev only; hash in `.env`).

## Phase 5: photo infrastructure: DONE (background agent)
- `src/lib/storage/*` (local + S3 providers), `src/lib/photos/*` (validate, exif, sharp variants, blur, ingest, loader), `/api/media`, `docs/PHOTOS-AWS-SETUP.md`. S3 only tested against mocks.

## Next
- Finish admin (wire, review), Playwright e2e (specs in `tests/e2e`), Docker build check, Lighthouse, knip, security review, `docs/architecture-after.md`, `docs/PR.md`, delete temp clone (`scratchpad/ref/agb`).

## Known gotchas
- Windows/Git Bash: `pkill` unavailable; use PowerShell `Get-NetTCPConnection`. GateGuard hook: first write per directory/type needs a facts statement (do not disable).
- Dev DB container: `personal-website-dev-db-1` (port 54340). Do not touch `fedmattucci-site-pg` (old site) or `docker-db-1`.
- jsdom must stay at 27 (Node 22.14). Password hash uses `:` separators (Next expands `$` in .env).
- Write tool keeps the original encoding of an existing file (README was UTF-16): delete and recreate if needed.
