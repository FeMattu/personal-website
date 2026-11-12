# Progress log (update after every phase)

## Status: all phases DONE on `feat/site-rewrite` (2026-11-12). Not merged: the owner decides. See `docs/PR.md`.

## Phase 0: analysis + scaffold: DONE
- graphify AST run on the old project -> `docs/architecture-before.md`; old DB exported outside the repo (it only held seed data).
- Tooling (ESLint 9, Prettier, vitest 5, Playwright, knip), Docker (compose + compose.dev), `.env` built from old values (git-ignored).

## Phase 1: data layer: DONE
- Normalised Prisma schema + `init` migration; idempotent seed (`prisma/seed.ts` + `seed-data.ts`, upserts with empty `update`).
- Repositories (`lib/db/repositories`, the only Prisma users), tag-cached read models (`lib/content`), `localize()` with field-level fallback.

## Phase 2-3: shell + public pages: DONE
- next-intl `/[locale]` (it default, en), theme, sticky top navbar (scroll-spy, mobile Sheet), footer, home sections, skills (Tabs + dots), projects (tag filter),
  generic detail route `[type]/[slug]`, contact (zod + honeypot + DB rate limit + Resend), photos placeholder, 404/error, sitemap, robots, hreflang, `/api/health`.
- Pages are `force-dynamic` over `unstable_cache` data (tag `content`): the build needs no DB. Admin writes call `revalidateContent()` (`expire: 0`).

## Phase 4: auth + admin: DONE
- Auth.js v5 (jwt + Prisma adapter, scrypt password provider, GitHub if configured), `/login`, admin shell + sidebar, dashboard.
- CRUD for all resources (agent-built, lead-reviewed): `src/lib/admin`, `src/actions/admin`, `src/components/admin`, `/admin/*`.
- Local admin login: `ADMIN_EMAIL` from `.env`, password `admin-dev-local` (dev only; hash in `.env`).

## Phase 5: photo infrastructure: DONE
- `src/lib/storage/*` (local + S3), `src/lib/photos/*`, `/api/media`, `docs/PHOTOS-AWS-SETUP.md` (617 lines). S3 only tested against mocks.

## Phase 6-7: quality + wrap-up: DONE
- 241 unit/component/integration tests, coverage 84% on `src/lib` + `src/actions` (run `pnpm test:coverage`), Playwright 51 runs (desktop + mobile), knip clean.
- Lighthouse (mobile, prod build): Accessibility 100, Best Practices 100, SEO 92 (canonical only differs on localhost).
- Docker: image builds without a DB; `docker compose up -d --build` verified (migrate + seed + app healthy).
- Docs: `architecture-after.md`, `PR.md`, `CONTENT_MAPPING.md`, README.

## Redesign (after the rewrite): DONE
- UI = dark/electric-blue "Creative Developer" Dribbble reference; structure/UX = "Developer Profile Template" reference (see D-27). Tokens in `globals.css`, new `stats-bar.tsx`, rewritten hero/about/contact/footer, pill navbar. Home order: hero, stats, about+skills, experience|education, projects, photos, contact.

## TODO / follow-ups
- Owner: AWS setup, GitHub OAuth (optional), Resend key, production secrets, fill content (avatar, project drafts).
- CSP header (nonce) in `proxy.ts`; login rate limit; photo reorder UI; photo grid + lightbox once S3 works; re-import the 15 old photos.

## Known gotchas
- Windows/Git Bash: `pkill` unavailable; use PowerShell `Get-NetTCPConnection`. GateGuard hook: first write per directory/type needs a facts statement (do not disable); it also blocks `rm -rf`.
- Dev DB container: `personal-website-dev-db-1` (port 54340). Do not touch `fedmattucci-site-pg` (old site) or `docker-db-1`.
- jsdom must stay at 27 (Node 22.14). Password hash uses `:` separators (Next expands `$` in .env).
- Playwright: wait for the server action POST excluding `/__nextjs*` dev-tools requests; inactive tab panels stay mounted (scope locators to the active `tabpanel`).
- Server components cannot pass functions to client components (use string props).
- Write tool keeps an existing file's encoding (README was UTF-16): delete and recreate if needed.
