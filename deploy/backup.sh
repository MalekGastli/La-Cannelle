#!/bin/sh
# Backup of database + uploaded photos. Usage (from the deploy folder):  sh backup.sh
# Keeps the last 14 days in /var/backups/lacannelle (change with BACKUP_DIR). Restore: see deploy/README.md
set -eu
cd "$(dirname "$0")"
DIR=${BACKUP_DIR:-/var/backups/lacannelle}
STAMP=$(date +%Y-%m-%d_%H%M%S)
mkdir -p "$DIR"
docker compose exec -T db pg_dump -U lacannelle -Fc lacannelle > "$DIR/db_$STAMP.dump"
docker compose exec -T backend tar czf - -C /data uploads > "$DIR/uploads_$STAMP.tgz"
find "$DIR" -type f \( -name 'db_*.dump' -o -name 'uploads_*.tgz' \) -mtime +14 -delete
echo "Backup written to $DIR ($STAMP)"
