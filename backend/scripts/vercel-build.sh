#!/bin/sh
# Vercel build for the API: generate client, migrate, bootstrap admin and first-run content.
set -e
prisma generate
# Prefer the Vercel-managed Neon database when it is connected (see src/env.ts for the runtime side)
if [ -n "$LACANNELLEDB_DATABASE_URL" ]; then
  export DATABASE_URL="$LACANNELLEDB_DATABASE_URL"
  export DATABASE_URL_UNPOOLED="${LACANNELLEDB_DATABASE_URL_UNPOOLED:-$LACANNELLEDB_DATABASE_URL}"
fi
export DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
prisma migrate deploy
tsx prisma/ensure-admin.ts
tsx prisma/ensure-defaults.ts
