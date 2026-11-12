# PR: complete rewrite of the personal website (`feat/site-rewrite` -> `main`)

> Do **not** merge automatically: the owner decides. `main` was never touched.

## What changed

A clean rewrite from scratch (the old project was only a source of content/config). Next.js 16 + React 19 + TypeScript strict + Tailwind 4 +
shadcn/ui, Prisma 6 + PostgreSQL, Auth.js v5, next-intl (it/en), next-themes, pnpm, Docker Compose.

- **Public site:** sticky top navbar (scroll-spy, mobile sheet, language + theme), home (hero, about, experience, education, skills, featured
  projects, photos teaser, contact), detail pages (experience, education, projects, certifications) with SEO/Open Graph/hreflang, projects with tag
  filter, skills with Tabs + level dots, contact form (zod, honeypot, DB rate limit, Resend), photos placeholder, 404/error, sitemap, robots, `/api/health`.
- **Admin (`/admin`, sidebar only here):** CRUD for site texts (per language), experience, education, certifications, skills + categories, projects (+ cover/gallery
  upload), social links, spoken languages, photo albums/photos, contact messages; duplicate, draft/published, dnd reorder (keyboard accessible), confirmations, toasts.
- **Auth:** Auth.js v5 (jwt + Prisma adapter) with password login (scrypt hash) and optional GitHub, both restricted to `ADMIN_EMAIL`; `requireAdmin()` in every page,
  `assertAdmin()` first in every write action.
- **Data:** normalised schema (enums, per-locale `*Translation` tables, storage keys only), real migration, idempotent seed from the CV (never overwrites edits).
- **Photos (infrastructure only):** `StorageProvider` (local + S3), validation, EXIF, AVIF/WebP variants, blur, hashed keys, image loader; `docs/PHOTOS-AWS-SETUP.md`.
- **Docs:** `REWRITE_PLAN`, `DECISIONS`, `CONTENT_MAPPING`, `old-project-inventory`, `issues-found`, `reference-notes`, `architecture-before/after`, `CLAUDE.md` + `.claude/memory`.

## How to test (checklist)

Setup: `pnpm install`, `cp .env.example .env` (set `AUTH_SECRET`, `ADMIN_EMAIL`, `pnpm auth:hash "pw"`), `pnpm docker:dev`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`.

Automated gates (all green at the last commit):

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test` (unit + component, jsdom)
- [ ] `pnpm test:integration` (needs the dev Postgres; uses the `site_test` DB and refuses any DB whose name lacks "test")
- [ ] `pnpm test:coverage` (unit + integration; >= 80% on `src/lib` and `src/actions`)
- [ ] `pnpm build` (needs no database)
- [ ] `pnpm test:e2e` (Playwright: auth setup, every route per locale, navbar/no sidebar, mobile menu, language + theme switch, contact validation, SEO, admin login/redirect/edit/reorder)
- [ ] `pnpm knip` (no unused files, exports or dependencies)
- [ ] `docker compose up -d --build` -> `http://localhost:3000` healthy (migrate + seed run automatically)

Manual checks:

- [ ] `/it` and `/en`: all sections render, language switch keeps the page, theme light/dark/system without flash, keyboard focus visible.
- [ ] Mobile width: navbar collapses into a sheet; no horizontal scroll.
- [ ] `/login` with the wrong password fails; with the right one lands on `/admin`; `/admin` without a session redirects to `/login`.
- [ ] Admin: edit a site text in EN, see it on `/en`; reorder experience and reload; duplicate and delete (with confirmation); toggle draft/published (draft disappears from the public site).
- [ ] Contact form: validation errors translated; a message appears in `/admin/messages`; more than 5 per hour from one IP is blocked.
- [ ] Lighthouse (mobile, production build): Accessibility/Best Practices 100, SEO 92 locally (the canonical audit needs `NEXT_PUBLIC_SITE_URL` equal to the served origin).
- [ ] No secrets in git: `git ls-files | grep .env` lists only `.env.example`.

## Manual steps for the owner

1. **AWS photos:** follow `docs/PHOTOS-AWS-SETUP.md`, then set `STORAGE_DRIVER=s3` and the AWS/CDN variables.
2. **Auth provider (optional):** create a GitHub OAuth app (callback `<site>/api/auth/callback/github`), set `AUTH_GITHUB_ID/SECRET`.
3. **Email:** set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (messages are always stored in the DB regardless).
4. **Production secrets:** `AUTH_SECRET`, a strong `POSTGRES_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `NEXT_PUBLIC_SITE_URL`.
5. Content to fill in from `/admin`: avatar, project descriptions/covers/links (Ethibit, EIS Versilia, AGB Design are drafts), skill levels (none were invented), English text review.

## Known issues / follow-ups

- Photo UI is a placeholder; S3 provider is tested with mocks only (no live AWS/MinIO run).
- No Content-Security-Policy header yet (static security headers are set); a nonce-based CSP in `proxy.ts` is a follow-up.
- No login rate limiting beyond scrypt cost; add one if the site is exposed publicly with password login.
- Photo reorder UI is missing (albums can be reordered); gallery images share the `uploads/cover/` key namespace.
- Prisma 6 (not 7) and TypeScript 6.0 / ESLint 9 by design (see `DECISIONS.md`).
