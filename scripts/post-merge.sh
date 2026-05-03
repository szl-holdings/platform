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
# Uses the non-interactive wrapper (push-non-interactive) so the workflow
# never hangs on drizzle-kit's "Is `foo` a new table or rename?" prompts.
# See lib/db/scripts/non-interactive-migrate.mjs for behavior + safety knobs
# (DB_MIGRATE_TIMEOUT_MS, DB_MIGRATE_FAIL_ON_PROMPT).
# stdin is /dev/null so any remaining prompt receives EOF and fails immediately
# rather than blocking forever.
# The duplicate-index-name error caused by skill_library.ts has been resolved
# (that file is excluded from the schema barrel — see lib/db/src/schema/index.ts
# and lib/db/drizzle/0144_skill_library_schema_audit.sql for details).
# drizzle-kit push is non-fatal: the 800+ table schema takes longer than the
# introspection timeout on some runs. Failures are logged but do not block
# the merge or workflow reconciliation.
# Inner wrapper timeout (12 min) sits ~3 min under the outer post-merge
# timeout (15 min) so the wrapper finishes cleanly and prints diagnostics
# before the platform sends SIGTERM. FAIL_ON_PROMPT stays off because the
# wrapper auto-answers drizzle's "create new table?" prompts with the safe
# default (Enter -> "create"); failing closed here would block every merge
# whenever the schema introduces a new table that visually resembles one
# of the orphan legacy tables in the live DB.
DB_MIGRATE_TIMEOUT_MS=720000 \
DB_MIGRATE_FAIL_ON_PROMPT=false \
  pnpm --filter @szl-holdings/db push-non-interactive < /dev/null 2>&1 \
  || echo "drizzle-kit push timed out or failed (non-fatal, 800+ table schema)"

# Ensure the corporate site's capability manifest is a symlink to the audit
# source-of-truth, never a stale hand-copied file. The Product Readiness Matrix,
# Trust pages, and Investors Overview all read from this path; if the audit
# harness regenerates platform-capability-manifest.json the symlink guarantees
# the corporate site reflects it on the next build with zero manual steps.
# This step is best-effort and never blocks the merge: the szl-holdings artifact
# may not be scaffolded yet, and the audit manifest may not exist on every run.
MANIFEST_LINK="artifacts/szl-holdings/src/data/capability-manifest.json"
MANIFEST_TARGET="../../../audit/platform-capability-manifest.json"
MANIFEST_TARGET_ABS="audit/platform-capability-manifest.json"
MANIFEST_DIR="$(dirname "$MANIFEST_LINK")"
if [ ! -d "$MANIFEST_DIR" ]; then
  echo "Skipping capability-manifest symlink: $MANIFEST_DIR does not exist (artifact not scaffolded)"
elif [ ! -f "$MANIFEST_TARGET_ABS" ]; then
  echo "Skipping capability-manifest symlink: $MANIFEST_TARGET_ABS does not exist (no audit manifest)"
elif [ ! -L "$MANIFEST_LINK" ] || [ "$(readlink "$MANIFEST_LINK")" != "$MANIFEST_TARGET" ]; then
  rm -f "$MANIFEST_LINK"
  if ln -s "$MANIFEST_TARGET" "$MANIFEST_LINK" 2>/dev/null; then
    echo "Restored capability manifest symlink: $MANIFEST_LINK -> $MANIFEST_TARGET"
  else
    echo "Failed to create capability-manifest symlink (non-fatal)"
  fi
fi

# Regenerate downloadable solution-brief PDFs from the platform capability
# manifest so the corporate site never serves stale or broken assets. Runs
# after the symlink fix above so the generator always reads the freshest
# manifest. Non-fatal: a failure here must not block workflow reconciliation.
timeout 60 pnpm --filter @workspace/api-server run generate:solution-briefs 2>&1 \
  || echo "solution-brief regeneration failed (non-fatal)"
