# Platform PR 963 native Zod follow-up

Workcell: PLATFORM-963-ZOD4-FOLLOWUP-20261025.
Evidence class: **MEASURED** for the local commands below; source-only candidate.
Baseline source: `97d3f41eb4abf92992b42037c893fe7c0a195c1b`.
Protected main observed: `55a404f12c81b79e673a95e074154dfd5e3c1361`.

## Plan and source changes

Continue the interrupted October 23 candidate without rewriting its history.
Native build/typecheck at the baseline exposed a readonly Zod shape assignment
in `nexus-mcp`; native reproducibility exposed an incomplete memory retention
default. The retained exact-dependency harness also reproduced incomplete
skill performance and tool observability defaults, and the prior author's
untracked governed-call regression reproduced a private shape-call crash.

Complete those existing defaults without changing their values or bounds.
Use a mutable local MCP shape builder and the public object shape accessor.
Tool observability uses a factory to prevent nested sensitive-field arrays
from being shared between independently parsed manifests. The original
untracked governed-call regression is preserved byte-for-byte; its SHA-256 is
`769d6e8a274d14e898be87fdf39d7f4da532d3ea991fa268406d6a45ba3f492f`.

The historical parser proof now identifies its results as parser-only command
receipts. No truth scanner, allowlist, workflow, dependency or admission rule
is changed. No UI or route is changed; screenshot and route smoke do not apply.

## Verification

Existing local toolchain: Node, Vitest 4.1.11, TypeScript 6.0.3; retained
integrity-verified Zod 4.6.6 and MCP SDK 1.32.0 source archives. Aliases use
workspace source and the retained external toolchain; this is not a native
full workspace install. The commands were run from the isolated checkout.

- `pnpm typecheck`: exits nonzero because installed pnpm 11.25.0 rejects the
  required 10.26.1. No install completed. Hosted typecheck is still required.
- `node C:/SZLWork/platform-security/node_modules/vitest/vitest.mjs run --config ../zod-followup.config.mjs`:
  before repair, local command receipt `pass=132, fail=9`. Four failures are
  the demonstrated schema/shape defects. Remaining failures are the existing
  database-dependent handlers and a handler timeout under this local harness;
  they are retained, not represented as green or skipped by a source change.
- `node C:/SZLWork/platform-security/node_modules/vitest/vitest.mjs run --config ../zod-followup.config.mjs --testNamePattern 'defaults|governed structured schema shape'`:
  after repair and review, exit zero; focused receipt `pass=8, filtered=133`.
  Checks include omitted and empty defaults, caller overrides, invalid input,
  schema rejection, non-object schemas and nested-array isolation.
- With `ZOD_FOLLOWUP_ROOTS=1`, `node ../check-contract-types.cjs 4.6.6`:
  exit zero, no diagnostics across the bounded contract roots. The retained
  baseline has the three incomplete-default diagnostics.
- `node ../check-nexus-types.cjs before`: exit one, reproduces TS2542 using
  the earlier builder annotation in the compiler's in-memory read hook.
  `node ../check-nexus-types.cjs after`: exit zero, no diagnostics against
  the exact retained Zod and MCP declaration packages. No source is changed
  by that harness.
- With immutable ancestor `TRUTH_ALLOWLIST_BASE_SHA=55a404f12c81b79e673a95e074154dfd5e3c1361`,
  `node C:/SZLWork/platform-security/node_modules/tsx/dist/cli.mjs tools/truth/claims-drift.ts`:
  exit zero. Sparse canonical truth and allowlist files were materialized
  unchanged, and a one-generation fetch restored the shallow ancestor chain.
  Earlier missing-file and missing-ancestor attempts remain in local receipts.
- `git diff --check`: exit zero.

Independent read-only source review caught the shared nested-array risk; the
factory and regression resolve it. A separate read-only classifier comparison
confirmed the original parser prose was misclassified as estate aggregates,
while the revised prose retains the exact parser results and Windows EPERM
failure. Neither review is a production or independent runtime attestation.

## Remaining gates

Full native current-head typecheck, build, unit, browser and reproducibility
checks are required after publication. Protected merge is reserved to the
coordinating owner. No provider, runtime, database, model or VM action is part
of this candidate. The previously green Security Gate belongs to the baseline
revision; it must run again on this follow-up. The estate remains **BLOCKED**
until its separate release and runtime requirements are satisfied.
