# Architecture before (old project)

Generated with `/graphify` (AST extraction, code only; run from a scratch folder). Corpus: `src`, `prisma`, `scripts`, `tests`
of the old site: 169 code files, **797 nodes, 2304 edges, 27 communities**, 99% extracted / 1% inferred, no import cycles.
Note: 3 `.sql` migrations were not parsed (tree-sitter SQL missing) and 14 files yield no symbols (route handlers, config).

## God nodes (most connected)

| Node | Edges | Reading |
| ---- | ----- | ------- |
| `Button()` | 52 | shadcn UI primitive used everywhere |
| `Badge()` | 24 | tags/levels |
| `requireAdmin()` | 22 | every admin page and action funnels through it (good: single guard) |
| `localize()` | 19 | JSON-map translation fallback |
| `SiteHeader()` | 18 | top nav |
| `errorMessage()` | 18 | action error mapping |
| `ResourceForm()` / `AdminSidebar()` | 16 / 15 | declarative generic admin |
| `cdnUrls()` | 15 | signed CloudFront URL generation |

## Communities (summary)

0. Admin/storage scripts (upload registration, import-photos)
1. Admin server actions (`ActionResult`, delete/duplicate/reorder)
2. Layout shells (root layouts, header, footer, language switcher, toolbar)
3. Detail pages (experience, education, projects) + generateMetadata/static params
4. Photos (page, gallery, repositories, rate limit)
5. Home sections (hero, projects, skills, contact), not-found
6. UI primitives + lightbox + confirm dialog
7. Env validation per group

## Layering observed

`pages/actions -> lib/content + repositories (only Prisma users) -> pure domain`. Solid, kept conceptually in the rewrite.

## Surprising connections

Component tests call components directly (`ResourceForm`, `SortableList`, `ContactForm`, `SiteHeader`, `PhotoGallery`): the
old suite was component-test heavy, integration tests ran against a `site_test` DB.

## Weak points (see `issues-found.md`)

Signed-URL expiry gymnastics, JSON-map translations, generic admin with an unsafe cast, OAuth-only admin with no client
configured locally, S3 access/saving problems, OneDrive-located repo.

Raw outputs live outside the repo (scratchpad). Re-run:
`python run.py "<old path>"` (see `docs/graphify-howto.md` is not kept; the command is `graphify.extract.extract` + `build_from_json`).
