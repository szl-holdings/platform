#!/bin/bash
# Post-merge setup script.
# IMPORTANT: Do NOT add workflow start commands here (e.g. pnpm dev, dev:api,
# dev:command, dev:flagship, dev:web). All application workflows are managed
# exclusively by the artifact system and are reconciled automatically after this
# script exits. Starting them here would create duplicate processes competing for
# the same ports.
set -e

# Workspace package-set snapshot (Task #5076).
# When a merge adds a new entry under packages/, lib/, apps/, artifacts/, or
# workers/, the lockfile may already reflect it (so `pnpm install
# --frozen-lockfile` reports "Lockfile is up to date" and exits without
# actually populating node_modules/<scope>/<new-pkg>). The result is the
# api-server build and several Vite artifacts fail to resolve the new
# package on the next workflow restart (see Task #4991 / #5074).
#
# To make that class of failure self-healing, we snapshot the sorted list
# of name@version pairs from `pnpm m ls --json --depth -1` and compare
# against the previous snapshot persisted under .local/state/. When the
# set differs we drop --frozen-lockfile so pnpm always materialises the
# new symlinks. Unchanged merges keep the fast frozen-lockfile path.
WORKSPACE_SNAPSHOT_DIR=".local/state"
WORKSPACE_SNAPSHOT_FILE="$WORKSPACE_SNAPSHOT_DIR/workspace-packages.txt"
mkdir -p "$WORKSPACE_SNAPSHOT_DIR"

# Capture the workspace snapshot. `set +e` so a non-zero exit from pnpm
# or node doesn't kill the script under `set -e`; we explicitly handle
# the failure below (fail-closed: a missing/unparseable snapshot forces a
# full install rather than silently keeping the fast path, which would
# reintroduce the exact #4991/#5074 failure mode).
set +e
# Parse only stdout from `pnpm m ls`; benign stderr (deprecation notices,
# peer-dep warnings) is logged separately but must not poison the JSON
# parse and force unnecessary full installs.
current_snapshot="$(pnpm m ls --json --depth -1 2>/tmp/post-merge-pnpm-ls.err \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const pkgs=JSON.parse(d);if(!Array.isArray(pkgs))throw new Error("not array");console.log(pkgs.filter(p=>p&&p.name).map(p=>`${p.name}@${p.version||"0.0.0"}`).sort().join("\n"))}catch(e){console.error("snapshot parse failed: "+e.message);process.exit(1)}})')"
snapshot_exit=$?
if [ "$snapshot_exit" -ne 0 ] && [ -s /tmp/post-merge-pnpm-ls.err ]; then
  echo "post-merge: pnpm m ls stderr:"
  cat /tmp/post-merge-pnpm-ls.err
fi
rm -f /tmp/post-merge-pnpm-ls.err
set -e

snapshot_changed=0
if [ "$snapshot_exit" -ne 0 ] || [ -z "$current_snapshot" ]; then
  echo "post-merge: workspace snapshot unavailable (exit=$snapshot_exit) — forcing full pnpm install (fail-closed)"
  snapshot_changed=1
elif [ ! -f "$WORKSPACE_SNAPSHOT_FILE" ]; then
  echo "post-merge: no prior workspace-package snapshot — forcing full pnpm install"
  snapshot_changed=1
elif ! printf '%s\n' "$current_snapshot" | diff -q - "$WORKSPACE_SNAPSHOT_FILE" >/dev/null 2>&1; then
  echo "post-merge: workspace package set changed since last merge — forcing full pnpm install"
  printf '%s\n' "$current_snapshot" | diff - "$WORKSPACE_SNAPSHOT_FILE" || true
  snapshot_changed=1
fi

# Detect removed/renamed workspace packages (Task #5089).
# Task #5076 surfaces *added* workspace packages so they reliably get
# installed. The mirror failure mode — a merge that *removes* or *renames*
# a workspace package — is silent: dependents in the remaining packages
# fail to resolve the missing module on the next workflow restart. Here
# we name the removed packages explicitly, list any plausible renames
# (newly-added names in the same merge), and fail the post-merge step if
# any remaining workspace package still declares a dependency on a
# removed name so the broken state is visible at merge time rather than
# at the next workflow restart.
if [ -n "$current_snapshot" ] && [ -f "$WORKSPACE_SNAPSHOT_FILE" ]; then
  previous_names="$(sed 's/@[^@]*$//' "$WORKSPACE_SNAPSHOT_FILE" | sort -u)"
  current_names="$(printf '%s\n' "$current_snapshot" | sed 's/@[^@]*$//' | sort -u)"
  removed_names="$(comm -23 <(printf '%s\n' "$previous_names") <(printf '%s\n' "$current_names"))"
  added_names="$(comm -13 <(printf '%s\n' "$previous_names") <(printf '%s\n' "$current_names"))"
  if [ -n "$removed_names" ]; then
    echo "post-merge: workspace packages removed since last merge:"
    printf '  - %s\n' $removed_names
    if [ -n "$added_names" ]; then
      echo "post-merge: workspace packages added since last merge (possible renames):"
      printf '  + %s\n' $added_names
    fi

    # Build the list of *remaining* workspace package.json paths from
    # `pnpm m ls` so we only flag dependents that live inside a real
    # workspace member. This avoids false positives from archived /
    # vendored / excluded package.json files elsewhere in the tree.
    set +e
    workspace_manifests="$(pnpm m ls --json --depth -1 2>/dev/null \
      | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const pkgs=JSON.parse(d);if(!Array.isArray(pkgs))throw 0;const path=require("path");console.log(pkgs.filter(p=>p&&p.path).map(p=>path.relative(process.cwd(),path.join(p.path,"package.json"))).join("\n"))}catch(e){process.exit(1)}})')"
    workspace_manifests_exit=$?
    set -e
    if [ "$workspace_manifests_exit" -ne 0 ] || [ -z "$workspace_manifests" ]; then
      # Fail-closed: removed_names is non-empty here, so silently
      # skipping the dependent scan would let a real dangling dep
      # slip through. Exit non-zero so the broken state is visible.
      echo "post-merge: ERROR — workspace packages were removed but workspace manifests could not be enumerated (exit=$workspace_manifests_exit); refusing to skip the dangling-dependent check."
      echo "post-merge: failing post-merge so the situation is visible at merge time (Task #5089)."
      exit 1
    fi

    broken_report=""
    if [ -n "$workspace_manifests" ]; then
      for removed in $removed_names; do
        # Escape regex metacharacters in the package name before passing
        # to grep -E so unusual but valid names (e.g. containing a `.`)
        # can't false-match. Match "<name>": as a dependency *key* so
        # we don't trip on the package's own "name" field, where the
        # value side has no trailing colon.
        escaped="$(printf '%s' "$removed" | sed 's/[][\\.^$*+?(){}|]/\\&/g')"
        matches=""
        while IFS= read -r manifest; do
          [ -z "$manifest" ] && continue
          [ ! -f "$manifest" ] && continue
          if grep -qE "\"${escaped}\"[[:space:]]*:" "$manifest" 2>/dev/null; then
            matches+="${manifest}"$'\n'
          fi
        done <<< "$workspace_manifests"
        if [ -n "$matches" ]; then
          broken_report+="\n  ${removed} is still referenced by:\n"
          while IFS= read -r f; do
            [ -n "$f" ] && broken_report+="    - ${f}\n"
          done <<< "$matches"
        fi
      done
    fi
    if [ -n "$broken_report" ]; then
      echo "post-merge: ERROR — removed workspace packages still have dependents in the monorepo:"
      printf '%b' "$broken_report"
      echo "post-merge: failing so the dangling dependency is visible at merge time (Task #5089)."
      exit 1
    fi
  fi
fi

if [ "$snapshot_changed" -eq 1 ]; then
  # Workspace package set changed (or snapshot untrustworthy) — must NOT
  # use --frozen-lockfile, since the lockfile may already encode the new
  # package and frozen-lockfile will then no-op without creating the
  # node_modules symlink. Failure tolerance matches the unchanged branch
  # so a transient pnpm hiccup doesn't kill the whole post-merge run.
  pnpm install 2>&1 || pnpm install 2>&1 || true
else
  pnpm install --frozen-lockfile 2>&1 || pnpm install 2>&1 || true
fi

if [ -n "$current_snapshot" ]; then
  printf '%s\n' "$current_snapshot" > "$WORKSPACE_SNAPSHOT_FILE"
fi
# Run schema sync non-interactively.
#
# Schema-hash short-circuit (Task #5025) + journaled migrate (Task #5056):
# the wrapper hashes lib/db/src/schema/** and compares against a marker
# row in `_szl_schema_marker` on the dev DB. The common case (no schema
# change) completes in seconds without invoking drizzle-kit at all.
#
# On a hash delta the wrapper runs the lib/db `migrate` pipeline
# (backfill → drizzle-kit migrate → manual). `drizzle-kit migrate`
# replays journaled SQL files from lib/db/drizzle/ that are newer than
# the latest entry in `drizzle.__drizzle_migrations`, which is dramatically
# faster than the old `drizzle-kit push` introspection diff and is fully
# non-interactive by design (no prompts, no newline-injection wrapper
# needed). See lib/db/scripts/non-interactive-migrate.mjs for behavior +
# safety knobs (DB_MIGRATE_TIMEOUT_MS, DB_MIGRATE_FORCE).
#
# stdin is /dev/null defensively; with `migrate` there should be no
# prompts to receive it anyway.
#
# Real drizzle failures propagate. With the schema-hash short-circuit
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
  pnpm --filter @szl-holdings/db migrate-non-interactive < /dev/null 2>&1
migrate_status=$?
set -e
if [ "$migrate_status" -eq 124 ]; then
  echo "drizzle-kit migrate timed out applying a schema delta — failing the post-merge step so the drift is visible (raise DB_MIGRATE_TIMEOUT_MS or investigate the delta)"
  exit "$migrate_status"
elif [ "$migrate_status" -ne 0 ]; then
  echo "drizzle-kit migrate failed with exit $migrate_status — failing the post-merge step so the schema drift is visible"
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
