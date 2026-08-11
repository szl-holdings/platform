# P0 Series-A product wiring - Proof Packet

| Field | Value |
|---|---|
| `workcell_id` | `P0-SERIES-A-PRODUCT-WIRING-20260811` |
| `agent` | Codex |
| `objective` | Add one coherent investor/developer entry journey and an operationally honest, typed demonstration Workcell path without promoting local source or seeded data to production evidence. |
| `plan_summary` | Reconcile the exact PR head and protected source; audit the unavailable historical payload; implement only reproducible current-source repairs; run focused package and browser qualification; capture fresh local browser proof; preserve hosted and promotion gates. |
| `patch_summary` | Added `/a11oy/start`; made the A11oy shell responsive; separated Workcell workflow status from typed evidence availability; marked repository seed records `DEMO` with a required reason and fixed timestamp; relabeled seed-backed demo, Workcell, governance, PCE, proof, and trust surfaces; added focused fabric tests; refreshed route manifests and the artifact README; captured 18 fresh built-preview images. |
| `proof_level` | Level 4 - public-facing local source and browser evidence. This is not Level 5 release proof and does not establish a deployment. |
| `recorded_at` | `2026-08-11T05:55:36.9707697-04:00` |
| `recorded_by` | Codex |

## Evidence boundary

This packet covers the local working tree derived from the exact starting PR
head below. It does not claim that the working tree was committed, pushed,
merged, deployed, or independently reviewed.

| State | Exact value |
|---|---|
| Starting PR head | `bc40b1c6aec8a44a8a6928c25a21de9aa91e76b7` |
| Starting PR-head tree | `9da60b857941ea9f6b9e58c784a6f9abfa44fbee` |
| Current protected `main` observed during reconciliation | `0fa6067cd20b56e0ad7dd49d4939212f491e4ee8` |
| Protected-main tree | `4ee91db51cff2b7a2c0f369d49ab0597a9dedc67` |
| Existing PR | `szl-holdings/platform#584` |
| Existing branch | `codex/p0-platform-work-20260811` |

The task did not retrieve, display, copy, or mutate credentials. It did not
write to protected `main`, create another pull request, merge, deploy, publish
to Hugging Face, weaken a gate, rewrite history, or force-push.

## Recovery and payload disposition

- The previously reported local commit `8243029` is absent from the inspected
  August 11 Git object databases. Its original commit bytes and tree could not
  be recovered, so no recovery claim is made and it was not replayed.
- The reported commit envelope
  `7d9e0e51e1746dd768762ab83aced74f0c26455d` is also absent. Its previously
  reported 15-file target tree
  `cfa56cb60e88f967e8722875b69a8d9d7d555394` was reproduced byte-for-byte from
  the old base `d5cf05ce18b2f776e5ea5124bb9eebc5b0a842d9` using the recovered LF-normalized
  candidate only as an audited reference.
- That older payload was not applied wholesale. Current source, current task
  requirements, and the audit findings superseded stale or defective portions.
- The operational source-state implementation already present on the PR head
  was retained and extended through the separate fabric/UI evidence boundary.

## Implementation summary

### Product journey and routing

- `artifacts/a11oy/src/pages/ProductJourney.tsx` provides a source-local
  investor path and developer path with visible evidence states.
- `artifacts/a11oy/src/App.tsx` registers `/a11oy/start`.
- `artifacts/a11oy/src/components/layout.tsx` and
  `artifacts/a11oy/src/index.css` provide responsive shell/navigation behavior
  and accessible target sizing for the changed path.
- `scripts/qa/smoke-routes.js` and `ops/audit/routes.json` include the new route.
- `artifacts/a11oy/README.md` now describes the active-prototype and seeded-demo
  boundary and current routes.

### Typed Workcell evidence

- `lib/a11oy-fabric/src/types.ts` defines the six-state
  `OperationalEvidenceState` vocabulary: `REAL`, `DEMO`, `UNAVAILABLE`,
  `DEGRADED`, `BLOCKED`, and `ROADMAP`.
- `lib/a11oy-fabric/src/schema.ts` keeps workflow status separate from required
  `evidenceState` and `evidenceReason` fields.
- `lib/a11oy-fabric/src/seed/workcells.ts` marks all repository fixtures
  `DEMO`, provides one explicit evidence reason, and uses a fixed fixture
  timestamp.
- `lib/a11oy-fabric/tests/seed-workcell-evidence.test.ts` checks the evidence
  label/reason and deterministic timestamps.
- The existing `packages/a11oy-runtime` source continues to fail closed with an
  empty `UNAVAILABLE` operational registry when no authenticated source exists.

### Truthful seed-backed surfaces

The changed A11oy demo, Workcell list/detail/replay, PCE, governance, proof, and
trust pages distinguish demonstration fixtures and modeled controls from
authenticated operational evidence. Workflow labels such as `running` and
`completed` no longer imply a real execution source. The replay fixture no
longer relies on runtime randomness for its displayed summary.

## Test results observed so far

These outcomes were observed before this packet was finalized. A successful
focused command is not a substitute for the final exact-tree, hosted, or
promotion gates listed as pending.

| Command or check | Outcome |
|---|---|
| `pnpm install --ignore-scripts` | PASS - dependency linking completed. |
| `pnpm --filter @workspace/a11oy-runtime test` | PASS - 3 files, 37 tests. |
| `pnpm --filter @workspace/a11oy-runtime typecheck` | PASS. |
| `pnpm --filter @workspace/a11oy-fabric test` | PASS - 1 file, 2 tests. |
| `pnpm --filter @workspace/a11oy-fabric typecheck` | PASS. |
| `pnpm --filter @workspace/a11oy typecheck` | PASS. |
| `pnpm --filter @workspace/a11oy lint:ci` | PASS, exit 0; warning-only output, no lint error. |
| `pnpm --filter @workspace/a11oy build` | PASS - 3,343 modules transformed and a `ProductJourney` chunk emitted. |
| `curl` against the dev server at `http://127.0.0.1:4110/a11oy/start` | PASS - HTTP 200. This is response reachability, not browser-render evidence. |
| In-app browser against the Vite dev server on port 4110 | BLOCKED FOR RENDERING - the HMR WebSocket could not establish in the in-app browser. No screenshot from that failed browser path is used. |
| Built preview at `http://127.0.0.1:4111` | PASS for the observed local run - all 18 requested target/viewport combinations returned and rendered; no page errors or horizontal overflow were observed. Journey destinations rendered. |
| Initial axe pass | FINDINGS OBSERVED - source fixes were applied. No final axe pass is claimed yet. |
| Final axe rerun after fixes | **PENDING**. |
| Final focused package rerun on the completed exact tree | **PENDING**. |
| Final doctrine/claim/brand/route checks | **PENDING**. |
| Final secret scan and `git diff --check` | **PENDING**. |
| Commit signature, DCO/raw-commit verification, push, remote readback, and hosted checks | **PENDING**. |

## Screenshot references

Eighteen fresh JPG files were captured from the running local production-build
preview on port 4111. The in-app capture excludes browser chrome, so every route
is recorded explicitly in `audit/screenshot-catalog.md` as permitted by the
repository screenshot doctrine.

| Surface | Viewports captured | Route |
|---|---|---|
| Investor/developer start | 320, 390, 768, 1366, 1728 CSS px | `/a11oy/start` |
| Seeded Workcell registry | 320, 390, 768, 1366, 1728 CSS px | `/a11oy/workcells` |
| Seeded Workcell detail | 1366 CSS px | `/a11oy/workcells/wc-001` |
| Seeded Workcell replay detail | 1366 CSS px | `/a11oy/workcells/wc-001/replay` |
| Seeded replay index | 1366 CSS px | `/a11oy/replay` |
| Interactive seeded demo | 1366 CSS px | `/a11oy/demo` |
| PCE demonstration registry | 1366 CSS px | `/a11oy/pce` |
| Governance demonstration | 1366 CSS px | `/a11oy/governance` |
| Demonstration Proof Ledger | 1366 CSS px | `/a11oy/proof` |
| Prototype Trust Center | 1366 CSS px | `/a11oy/trust` |

The captures prove that these local built-preview routes rendered at the stated
viewport. They do not establish deployed-byte parity, authenticated data,
cryptographic validity of displayed demonstration receipts, or production
operation.

## Verification notes

- The investor and developer journeys are visible from one start surface.
- The changed journey destinations rendered during the observed built-preview
  browser run.
- The five required responsive widths rendered for both `/a11oy/start` and
  `/a11oy/workcells` without observed horizontal document overflow.
- The browser evidence shows the `DEMO`/prototype boundary on the changed
  seed-backed surfaces.
- Final axe, package, doctrine, Git hygiene, push, and hosted-CI results remain
  pending and must be appended rather than inferred.

## Public claim check

The local UI and this packet describe an active prototype, repository-seeded
demonstration data, modeled controls, and local browser evidence. They do not
claim customers, revenue, certification, production operation, authenticated
execution, deployment, public-source parity, or hosted success.

## Security check

No secret was requested, displayed, or intentionally added during the work.
The final exact-diff secret scan and environment-file check are still
`PENDING`; this packet does not predeclare them green.

## Known-gaps update

`docs/operations/known-gaps.md` now records:

- the branch-local `/a11oy/start` and seed-evidence repair without promoting
  application readiness;
- the difference between local built-preview evidence and hosted/deployed
  evidence; and
- the existing hosted Truth-drift live-probe transport failure, which remains
  fail-closed pending a new exact-head hosted run.

`docs/APP_STATUS.md` is intentionally unchanged because this task has not
promoted any application readiness state.

## Remaining gates and non-claims

1. Complete the pending final axe, focused package, doctrine, route, claim,
   secret, and Git-diff checks on the final exact tree.
2. Review and intentionally stage only the task files; dependency-install side
   effects are not automatically part of the implementation.
3. Create a policy-compliant signed/DCO commit if the local signing identity is
   available, without rewriting existing history.
4. Push normally to the existing branch and verify the exact remote commit and
   tree. Do not force-push or create another PR.
5. Require terminal hosted checks and protected-branch authority for any later
   promotion. This packet makes no merge or deployment request.

