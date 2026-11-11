# Reference notes

## `agb-portale-rdoc` (cloned via SSH to a temp folder outside the repo, deleted at the end)

Reused as conventions only (domain model, data and secrets were not copied):

- `prisma.config.ts` with `dotenv/config`, `migrations.seed = tsx ...`; `db:*` scripts (`db:migrate`, `db:deploy`, `db:seed`).
- Docker: multi-stage image (deps -> builder -> runner standalone), `compose` with `db` healthcheck, app waits for
  `service_healthy`; entrypoint applies migrations + idempotent seed; separate dev override.
- ESLint 9 flat config: `eslint-config-next` core-web-vitals + typescript, `no-explicit-any: error`, `consistent-type-imports`,
  prettier last, `components/ui` ignored (shadcn-generated).
- shadcn `components.json` (style `radix-nova`, `cssVariables`), Vitest with v8 coverage scoped to domain/validation.
- Not adopted: Spanish/Italian domain naming, puppeteer, bcrypt credentials flow, emailjs.

## `domus` (read-only technical reference)

- Clean rewrite layout: `src/app`, `src/lib/{db,services,validation}`, `tests/{unit,integration,e2e}`, `docs/`.
- `compose.yaml` (prod: `db` + one-shot `migrate` + `app`) and `compose.dev.yaml` (hot reload, mounted source, DB published on localhost).
- Dockerfile stages `base/deps/dev/tools/build/runner` with standalone output and a `/api/health` HEALTHCHECK.
- pnpm only, `pnpm-workspace.yaml` `allowBuilds`, no `.npmrc`; TypeScript pinned `~6.0` (typescript-eslint does not support 7), ESLint 9
  (ESLint 10 blocked by `eslint-plugin-react`).
- i18n: `it.json`/`en.json` with a key-parity unit test; theme via `next-themes`; `CLAUDE.md` holds stack table + rules.
- knip config (shadcn components as entries). Vitest `projects` (unit/integration).
- Not adopted: no-locale-routing i18n (this site needs `/[locale]`), Prisma 7 (kept 6.19, see `DECISIONS.md` D-02).
