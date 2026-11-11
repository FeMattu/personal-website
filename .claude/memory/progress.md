# Progress log (update after every phase)

## Phase 0: analysis + scaffold: DONE (2026-11-12)
- Branch `feat/site-rewrite`. graphify AST run on old project -> `docs/architecture-before.md`. Old DB exported outside the repo (no admin edits to lose).
- Tooling configs, Docker (compose + compose.dev), `.env` built from old values (git-ignored), Prisma schema + `init` migration applied to the dev DB.
- Photo/storage infra delegated to a background agent (files: `src/lib/storage/*`, `src/lib/photos/*`, `src/app/api/media`, `docs/PHOTOS-AWS-SETUP.md`).

## Next
- Phase 1: seed + repositories + localize. Phase 2: i18n/theme/shell. Phase 3: public pages. Phase 4: auth/admin. Phase 6: tests/quality. Phase 7: wrap-up.

## Reference notes (summary)
- agb-portale-rdoc: prisma.config.ts, multi-stage Dockerfile, compose healthcheck, ESLint flat config, components.json (`radix-nova`).
- domus: compose + compose.dev, Dockerfile stages, pnpm `allowBuilds`, TS ~6.0 / ESLint 9, i18n key-parity test, knip. Full notes: `docs/reference-notes.md`.

## Known gotchas
- Windows/Git Bash: `pkill` unavailable; use PowerShell `Get-NetTCPConnection`. GateGuard hook: first write per directory needs a facts statement.
- Dev DB container name: `personal-website-dev-db-1` (port 54340). Do not touch `fedmattucci-site-pg` (old site) or `docker-db-1`.
