#!/bin/bash
set -e
pnpm install --frozen-lockfile 2>&1 || pnpm install 2>&1 || true
timeout 60 bash -c 'yes "" | pnpm --filter db push --force 2>&1' || echo "drizzle-kit push timed out or failed (non-fatal)"
