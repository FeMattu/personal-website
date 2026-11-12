# Architecture after (new project)

Generated with `/graphify` (AST extraction on `src`, `prisma`, `scripts`, `tests`, same method as `architecture-before.md`):
216 code files, **1155 nodes, 3849 edges, 44 communities**, 99% extracted / 1% inferred, **no import cycles**.

|               | Old project  | New project                                         |
| ------------- | ------------ | --------------------------------------------------- |
| Code files    | 169          | 216                                                 |
| Nodes / edges | 797 / 2304   | 1155 / 3849                                         |
| Communities   | 27           | 44                                                  |
| Import cycles | none         | none                                                |
| Tests         | 312 + 24 e2e | 241 unit/component/integration + 51 Playwright runs |

## God nodes

`Button()` (60, UI primitive), `requireAdmin()` (37: the single page guard is used by every admin page), `locales` / `defaultLocale`
(config shared by i18n, seeds, admin forms), `missingLocales()` (33: translation completeness), `PageHeader()`, `SelectField()`,
`TextField()`, `FormFooter()` (shared admin form kit), `localeMap()` (translation form mapping).

Compared with the old graph, the hubs moved from ad-hoc helpers (`errorMessage()`, `cdnUrls()`) to deliberate shared building blocks:
one guard (`requireAdmin`/`assertAdmin`), one i18n config, one admin form kit. There is no signing/CDN hub because images are served from
public, content-hashed keys.

## Layers (enforced by convention, see `CLAUDE.md`)

```
app/ (pages, route handlers)  ->  actions/ (assertAdmin -> zod -> repository -> revalidateContent -> ActionResult)
        |                                   |
        v                                   v
lib/content (cached read models)     lib/db/repositories (ONLY Prisma users)
        |                                   |
        +---------->  lib/i18n, lib/admin (schemas, mappers, ordering), lib/storage, lib/photos, lib/auth  <---+
```

Storage: `StorageProvider` interface -> `LocalStorageProvider` (default) / `S3StorageProvider` (env-gated), selected in `lib/storage/index.ts`.
Photos: `ingestPhoto()` = validate -> EXIF -> sharp variants (AVIF/WebP) -> blur/dominant colour -> hashed keys -> storage; the DB stores keys only.

## Surprising connections (test coverage links)

Component tests drive `SortableList`, `ConfirmDelete`, `SiteHeader`, `ThemeToggle`, `LanguageSwitcher`, `ContactForm`; the media route and the
admin schemas are covered through their real entry points. The auth-guard integration test calls every exported admin action without a
session and with a non-admin session and asserts nothing was written or revalidated.

Raw graphify outputs live outside the repo (scratch folder) on purpose.
