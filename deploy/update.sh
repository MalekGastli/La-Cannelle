#!/bin/sh
# Apply a new version of the code: run from the deploy folder after replacing/pulling the code.
set -eu
cd "$(dirname "$0")"
docker compose up -d --build
docker image prune -f >/dev/null
docker compose ps
