# Rewrite plan

Branch: `feat/site-rewrite` (never `main`). The old project (`...\7-PERSONALE\FedericoMattucci`) is a read-only
source of content, config and context. All code here is written fresh. See `DECISIONS.md` for every choice that was
ambiguous.

## Phases (each ends with: lint, `tsc --noEmit`, `vitest run`, `next build`, then a commit)

| # | Phase | Output |
| - | ----- | ------ |
| 0 | Analysis + scaffold | graphify, `architecture-before.md`, inventory, issues, reference notes, `CLAUDE.md` + `.claude/` memory, tooling configs, Docker, `.env` |
| 1 | Data layer | Prisma schema, first migration, idempotent seed from the CV + old data, repositories, `localize()` fallback |
| 2 | App shell | i18n (`/[locale]`, it/en), theme, shadcn components, sticky top navbar, footer, design tokens |
| 3 | Public pages | home (hero + all sections), projects, skills, detail pages + SEO, contact, photos placeholder, 404/error/loading, sitemap/robots/hreflang |
| 4 | Auth + admin | Auth.js v5 (jwt + Prisma adapter, `ADMIN_EMAIL`), `/login`, `/admin` sidebar, generic CRUD, duplicate, draft/published, dnd reorder, uploads, messages |
| 5 | Photo infrastructure | `StorageProvider` (local + S3), upload validation, EXIF, sharp variants, blur, hashed keys, image loader, `docs/PHOTOS-AWS-SETUP.md` |
| 6 | Quality | unit, component, integration, Playwright; coverage >= 80% on `src/lib`+`src/actions`; knip; Lighthouse; security review |
| 7 | Wrap-up | `architecture-after.md`, `PR.md`, README, memory update, delete temp clones |

## Routes

Public (`/[locale]`, locales `it` default, `en`): `/`, `/experience/[slug]`, `/education/[slug]`,
`/projects`, `/projects/[slug]`, `/certifications/[slug]`, `/skills`, `/photos` (placeholder),
`/photos/[album]` (shell), `/contact`. Old routes kept: home anchors `#experience #education #skills #projects #photos #contact`,
`/projects/[slug]`, `/experience/[slug]`, `/education/[slug]`, `/photos`; old `/contacts` redirects to `/contact`.
Technical: `/sitemap.xml`, `/robots.txt`, `/api/health`, `/api/media/[...key]` (local storage only), `/api/auth/*`.
Admin (no locale): `/login`, `/admin`, `/admin/<resource>`, `/admin/<resource>/[id]`.

## Architecture

Layers: `app/` (pages, route handlers) and `actions/` -> `lib/content` (read models) + `lib/db/repositories` (the only
Prisma users) -> pure domain code (`lib/i18n`, `lib/ordering`, `lib/validation`). Server Components by default; client
components only for interaction (navbar, theme, language switcher, forms, dnd, lightbox).

Public pages are static/ISR (`revalidate`) and are invalidated on every admin write via `revalidatePath/Tag`;
the public layout never calls `auth()`.

## Definition of done

Lighthouse >= 95 on `/it` locally, WCAG AA in both themes, no secrets in git, all gates green, `PR.md` written,
`main` untouched.
