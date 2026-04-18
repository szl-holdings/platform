#!/bin/bash
# Post-merge setup script.
# IMPORTANT: Do NOT add workflow start commands here (e.g. pnpm dev, dev:api,
# dev:command, dev:flagship, dev:web). All application workflows are managed
# exclusively by the artifact system and are reconciled automatically after this
# script exits. Starting them here would create duplicate processes competing for
# the same ports.
set -e
pnpm install --frozen-lockfile 2>&1 || pnpm install 2>&1 || true
# Run schema sync non-interactively.
# --force (via push-force script) bypasses drizzle-kit confirmation prompts.
# stdin is /dev/null so any remaining prompt receives EOF and fails immediately
# rather than blocking forever.
# Non-fatal: a migration warning must never block workflow reconciliation.
timeout 150 pnpm --filter @szl-holdings/db push-force < /dev/null 2>&1 || echo "drizzle-kit push timed out or failed (non-fatal)"
