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

# Ensure the corporate site's capability manifest is a symlink to the audit
# source-of-truth, never a stale hand-copied file. The Product Readiness Matrix,
# Trust pages, and Investors Overview all read from this path; if the audit
# harness regenerates platform-capability-manifest.json the symlink guarantees
# the corporate site reflects it on the next build with zero manual steps.
MANIFEST_LINK="artifacts/szl-holdings/src/data/capability-manifest.json"
MANIFEST_TARGET="../../../audit/platform-capability-manifest.json"
if [ ! -L "$MANIFEST_LINK" ] || [ "$(readlink "$MANIFEST_LINK")" != "$MANIFEST_TARGET" ]; then
  rm -f "$MANIFEST_LINK"
  ln -s "$MANIFEST_TARGET" "$MANIFEST_LINK"
  echo "Restored capability manifest symlink: $MANIFEST_LINK -> $MANIFEST_TARGET"
fi
