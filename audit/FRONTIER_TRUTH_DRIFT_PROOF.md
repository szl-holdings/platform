# FRONTIER V2 — Truth Drift Proof Packet

**Workcell:** `FRONTIER-V2-TRUTH-DRIFT`

**Date:** 2026-07-25

**Refreshed base:** `platform@a698a20eda93796f5a245daff413e4760eef8fca`

**Branch:** `agent/frontier-truth-drift-final`

## Context

The canonical generator, remote-evidence verification, allowlist validation,
and hardcoded-metric scanner have advanced on protected `main` since this
workcell began. This refreshed merge preserves those newer controls and adds
only the incremental claim-drift coverage that remained unique to the
superseded draft #467.

## Patch

- Preserved the current canonical generator, truth artifact, evidence labels,
  measurements, validator, allowlist semantics, and full-corpus drift gate from
  protected `main`.
- Added dependency-free incremental scanning for newly changed Markdown, MDX,
  HTML, and TSX claims against canonical metric evidence.
- Added a pull-request/push workflow step that evaluates only the candidate
  delta, plus an explicit manual full-corpus mode that remains honest about
  historical debt.
- Added package scripts for incremental and manual full-corpus scans.
- Linked this proof packet from the audit index and retained the existing
  overclaim ledger without falsely crediting CI for earlier detections.

No deployment, database, UI, repository visibility, branch-protection, or
runtime behavior was changed.

## Verification

- `node tools/truth/check-claims.ts --base origin/main` — required incremental
  scan
- protected `truth-drift` workflow — canonical generator, remote verification,
  label/freshness validation, full scanner, incremental scanner, and artifact
  drift check
- `git diff --check` — required

## Screenshot

**Not applicable.** No UI surface was modified.

## Remaining Gates

- GitHub Actions must reproduce the checks against the complete checkout.
- Branch protection and unresolved-conversation requirements remain mandatory.
- Repository visibility consolidation remains blocked until conformance,
  aliases, release tags, and reversible disposition steps are verified.
