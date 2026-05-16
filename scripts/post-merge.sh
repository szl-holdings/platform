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
# (DB_MIGRATE_TIMEOUT_MS, DB_MIGRATE_FAIL_ON_PROMPT, DB_MIGRATE_FORCE).
# stdin is /dev/null so any remaining prompt receives EOF and fails immediately
# rather than blocking forever.
#
# Schema-hash short-circuit (Task #5025): the wrapper now hashes
# lib/db/src/schema/** and compares against a marker row in
# `_szl_schema_marker` on the dev DB. The common case (no schema change)
# completes in seconds without invoking drizzle-kit at all. Only an
# actual schema delta triggers the ~4 min `drizzle-kit push` introspection.
#
# Real drizzle failures now propagate. With the schema-hash short-circuit
# in place, the common (no-delta) case never invokes drizzle-kit at all,
# so a timeout or non-zero exit always signals a genuine problem with an
# actual schema delta. We therefore fail the post-merge on ANY non-zero
# status (including 124 timeouts) so schema drift is never silent.
#
# `set -e` is active, so we briefly disable errexit to capture the real
# exit code (`if ! cmd; then $?` does NOT preserve it — `!` is the last
# command evaluated). `set +e` / `set -e` is the only pattern that works.
set +e
DB_MIGRATE_TIMEOUT_MS=600000 \
DB_MIGRATE_FAIL_ON_PROMPT=false \
  pnpm --filter @szl-holdings/db push-non-interactive < /dev/null 2>&1
migrate_status=$?
set -e
if [ "$migrate_status" -eq 124 ]; then
  echo "drizzle-kit push timed out applying a schema delta — failing the post-merge step so the drift is visible (raise DB_MIGRATE_TIMEOUT_MS or investigate the delta)"
  exit "$migrate_status"
elif [ "$migrate_status" -ne 0 ]; then
  echo "drizzle-kit push failed with exit $migrate_status — failing the post-merge step so the schema drift is visible"
  exit "$migrate_status"
fi

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
