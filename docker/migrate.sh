#!/bin/sh
# Applies real migrations, then (optionally) the idempotent seed. Safe to run repeatedly.
set -eu
pnpm exec prisma migrate deploy
if [ "${SEED:-true}" = "true" ]; then
  pnpm exec prisma db seed
fi
