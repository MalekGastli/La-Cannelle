#!/bin/sh
# Vercel build for the API: generate client, migrate, bootstrap admin and first-run content.
set -e
prisma generate
export DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
prisma migrate deploy
tsx prisma/ensure-admin.ts
tsx prisma/ensure-defaults.ts
