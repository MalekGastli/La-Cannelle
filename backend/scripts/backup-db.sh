#!/usr/bin/env bash
# Logical backup of the PostgreSQL database (pg_dump, custom format, timestamped).
#
# Usage:   DATABASE_URL_UNPOOLED=postgres://... ./scripts/backup-db.sh [output-dir]
# Uses DATABASE_URL_UNPOOLED, falling back to DATABASE_URL. pg_dump must use the UNPOOLED
# (direct) Neon host: PgBouncer in transaction mode does not support pg_dump's session features.
# Strip pooler-only params (?pgbouncer=true&connection_limit=1) automatically.
#
# Never overwrites an existing file. Read-only against the database. Restore: docs/DATABASE.md.
set -euo pipefail

URL="${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-}}"
if [ -z "$URL" ]; then
  echo "error: set DATABASE_URL_UNPOOLED (preferred) or DATABASE_URL" >&2
  exit 1
fi
command -v pg_dump >/dev/null || { echo "error: pg_dump not found (install postgresql-client matching the server major version)" >&2; exit 1; }

# pg_dump rejects Prisma-specific query params: rebuild the query string without them.
BASE="${URL%%\?*}"
if [ "$BASE" != "$URL" ]; then
  KEPT=""
  IFS='&' read -r -a PARTS <<< "${URL#*\?}"
  for part in "${PARTS[@]}"; do
    case "$part" in
      pgbouncer=*|connection_limit=*|pool_timeout=*|schema=*|"") ;;
      *) KEPT="${KEPT:+$KEPT&}$part" ;;
    esac
  done
  URL="$BASE${KEPT:+?$KEPT}"
fi

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/lacannelle-$STAMP.dump"

if [ -e "$FILE" ]; then
  echo "error: $FILE already exists, refusing to overwrite" >&2
  exit 1
fi

umask 077
echo "Backing up to $FILE ..."
if ! pg_dump --format=custom --no-owner --no-privileges --compress=6 --file="$FILE" "$URL"; then
  rm -f "$FILE"
  echo "error: pg_dump failed, partial file removed" >&2
  exit 1
fi

# Sanity check: the archive must be readable
pg_restore --list "$FILE" >/dev/null
echo "OK: $(du -h "$FILE" | cut -f1) written, archive verified ($FILE)"
