# P0 — Series-A product wiring and proof closure

## Authority and source

- Repository: `szl-holdings/platform`
- Starting protected-main revision: `e7c87eddcc1761de3887db4bc39e6e6a945b13cc`
- `AGENTS.md`, `docs/A11OY_NON_NEGOTIABLES.md`, `docs/APP_STATUS.md`, `docs/operations/known-gaps.md`, and current protected source are authoritative.
- Current source supersedes stale payloads and old screenshots.
- Work only on this task PR branch. Do not write directly to protected `main`.

## Mission

Finish the currently implementable platform work needed for one coherent investor/developer product experience and one operationally honest execution path. Inspect, patch, test, capture real proof where the environment supports it, and leave complete source changes on this branch. Do not return another roadmap.

## Required work

### 1. Reconcile current state

Run the Pathfinder/context pass required by `AGENTS.md`. Inspect all active artifacts, routes, Workcell definitions, proof/status documents, open gaps, and repository-native task payloads. Classify every discovered payload as:

- `APPLIED_AND_VERIFIED`
- `SUPERSEDED_BY_NEWER_SOURCE`
- `ALREADY_SATISFIED`
- `BLOCKED_EXTERNAL_AUTHORITY`

Do not replay old patches against the current monorepo.

### 2. Wire the product end to end

Close reproducible source-level gaps across the current platform, prioritizing:

- one understandable investor path from company narrative to flagship value, live demo, proof, and diligence;
- one understandable developer path from architecture to APIs, Workcells, governance, receipts, local run, and verification;
- coherent navigation and naming across the current A11oy/KORA/FORGE/APEX product family defined by `AGENTS.md`;
- operational Workcell truth: real, demo, unavailable, degraded, blocked, and roadmap states must be explicit and typed;
- routes, API clients, environment fallbacks, and state transitions used by investor/demo-critical surfaces;
- no dead CTA, placeholder path, clipped panel, inaccessible target, stale hard-coded count, or wide-table-only mobile experience;
- proof packets, status documents, and known-gap closure for every changed surface;
- mobile, tablet, laptop, and wide-desktop layouts for changed public UI;
- exact distinction between an active prototype/investor demo and verified production operation.

When a current contract is already satisfied, avoid cosmetic churn and add focused regression evidence instead.

### 3. Qualification

Follow the repository loop exactly:

`Context → Plan → Patch → Test → Screenshot → Verify → Proof → Commit`

At minimum run the applicable current commands:

- baseline and final `pnpm typecheck`;
- focused package tests and relevant full tests;
- `pnpm qa:routes` for route changes;
- build checks for changed apps/packages;
- responsive/browser verification at 320, 390, 768, 1366, and 1728 CSS pixels;
- live screenshots for changed UI only when a real running surface is available;
- claim/doctrine, secret, accessibility, and route checks;
- `git diff --check`.

Do not weaken a check or fabricate screenshots/evidence to make the task pass.

### 4. Evidence

Update this file before finishing with exact files changed, root causes, commands/outcomes, screenshots or explicit screenshot blockers, payload dispositions, remaining external blockers, and non-claims. Create the required Proof Packet using the repository’s existing `audit/` conventions. Update `docs/operations/known-gaps.md` and `docs/APP_STATUS.md` when status changes.

## Hard boundaries

- No direct protected-main write, force push, history rewrite, self-approval, or administrator bypass.
- No secret retrieval, display, copying, or mutation.
- No destructive database operation.
- No fake customer, revenue, compliance, integration, deployment, or production claim.
- No copied vendor UI, copy, or trade dress.
- No Hugging Face publication or deployment claim from this task.
- Preserve exact-head hosted checks, independent review, and protected merge as promotion authority.

## Definition of done

The branch contains complete tested source repairs or a proof-backed `ALREADY_SATISFIED` result; investor and developer journeys are coherent across all changed screen sizes; operational states and claims are honest; task/payload dispositions are recorded; and no reproducible source defect in scope is left as an unowned roadmap item.

---

## Execution and evidence record - 2026-08-11

### Exact reconciled starting state

| State | Exact value |
|---|---|
| Existing pull request | `szl-holdings/platform#584` |
| Existing branch | `codex/p0-platform-work-20260811` |
| Starting PR head | `bc40b1c6aec8a44a8a6928c25a21de9aa91e76b7` |
| Starting PR-head tree | `9da60b857941ea9f6b9e58c784a6f9abfa44fbee` |
| Protected `main` observed during reconciliation | `0fa6067cd20b56e0ad7dd49d4939212f491e4ee8` |
| Protected-main tree | `4ee91db51cff2b7a2c0f369d49ab0597a9dedc67` |

The implementation and qualification work began from the exact PR head above;
the older starting revision in the authority section is historical task context,
not the source used for this run.

### Historical recovery and payload dispositions

| Discovered payload or source state | Disposition | Evidence and action |
|---|---|---|
| Previously reported local commit `8243029` | `SUPERSEDED_BY_NEWER_SOURCE` | The object was absent from the inspected August 11 Git object databases. Its original commit bytes and tests could not be reproduced, so it was not recovered or replayed and no commit-recovery claim is made. |
| Reported commit envelope `7d9e0e51e1746dd768762ab83aced74f0c26455d` | `SUPERSEDED_BY_NEWER_SOURCE` | The commit object was absent. The previously reported 15-file tree `cfa56cb60e88f967e8722875b69a8d9d7d555394` was reproduced byte-for-byte from old base `d5cf05ce18b2f776e5ea5124bb9eebc5b0a842d9` and used only as an audited reference. It was not replayed wholesale onto current source. |
| Operational source-state contract already on PR head | `ALREADY_SATISFIED` | `packages/a11oy-runtime` already used the exhaustive six-state vocabulary and an empty, frozen, fail-closed registry. It was retained and covered by the current 37-test runtime suite. |
| Current investor/developer route, responsive shell, and seed-backed UI truth defects | `APPLIED_AND_VERIFIED` | Current-source repairs were applied and verified by the focused commands and local built-preview browser evidence below. This disposition is limited to those observed checks; final axe, exact-tree, doctrine, Git, and hosted gates remain pending. |
| Current Workcell schema/fixture evidence separation | `APPLIED_AND_VERIFIED` | Workflow status is separate from required typed `evidenceState` and `evidenceReason`; deterministic repository fixtures are `DEMO` and focused fabric tests passed. |
| Hosted Truth-drift live-probe result | `BLOCKED_EXTERNAL_AUTHORITY` | Hosted run `31463647916`, job `93691994304`, timed out all 21 approved external probes from the same runner. A new terminal hosted run against the exact pushed head is required; the gate was not bypassed or weakened. |
| Commit, push, protected checks, review, merge, and deployment | `BLOCKED_EXTERNAL_AUTHORITY` | Local source/browser work cannot establish remote persistence, hosted success, protected merge authority, or deployment. The final Git and push steps below remain explicitly pending. |

### Root causes addressed

- The current A11oy router did not expose one source-backed entry surface that
  joined the investor narrative/diligence path with the developer
  architecture/Workcell/governance path.
- The existing shell navigation could overflow narrow viewports and some
  interactive targets did not consistently meet the changed-surface target
  size requirement.
- Seeded Workcell workflow labels such as `running` and `completed` were being
  rendered close to operational availability labels, and their evidence source
  was not required by the fabric schema.
- Seed-backed demo, replay, PCE, governance, proof, and trust surfaces used copy
  that could overstate deterministic fixtures as live evidence; replay summary
  content also used runtime randomness.
- A previous local payload was not recoverable as a Git object. Reconstructing
  its earlier tree provided a comparison point, not authority to overwrite
  current source.

### Current implementation summary

- Added `artifacts/a11oy/src/pages/ProductJourney.tsx` and registered
  `/a11oy/start` in `artifacts/a11oy/src/App.tsx`.
- Updated `artifacts/a11oy/src/components/layout.tsx` and
  `artifacts/a11oy/src/index.css` for responsive navigation, overflow-safe
  changed surfaces, and accessible target sizing.
- Kept the exhaustive operational vocabulary `REAL`, `DEMO`, `UNAVAILABLE`,
  `DEGRADED`, `BLOCKED`, and `ROADMAP`, while separating it from Workcell
  workflow status in `lib/a11oy-fabric/src/types.ts` and
  `lib/a11oy-fabric/src/schema.ts`.
- Required an evidence reason, marked repository fixtures `DEMO`, and replaced
  fixture-time variability with a fixed timestamp in
  `lib/a11oy-fabric/src/seed/workcells.ts`; added
  `lib/a11oy-fabric/tests/seed-workcell-evidence.test.ts`.
- Applied the same seeded-demonstration boundary to the A11oy demo, Workcell
  list/detail/replay, PCE, governance, Proof Ledger, and Trust Center pages;
  removed runtime randomness from displayed replay demonstration output.
- Updated `scripts/qa/smoke-routes.js`, `ops/audit/routes.json`, and
  `artifacts/a11oy/README.md` for the new route and prototype/evidence boundary.
- Created the Level 4 local-source/browser Proof Packet at
  `audit/P0_SERIES_A_PRODUCT_WIRING_PROOF_2026-08-11.md` and appended all fresh
  captures to `audit/screenshot-catalog.md`.
- Updated `docs/operations/known-gaps.md`. `docs/APP_STATUS.md` is intentionally
  unchanged because no application readiness status was promoted.

### Observed command and browser outcomes

| Command or check | Observed outcome |
|---|---|
| `pnpm install --ignore-scripts` | PASS - dependency linking completed. |
| `pnpm --filter @workspace/a11oy-runtime test` | PASS - 3 files, 37 tests. |
| `pnpm --filter @workspace/a11oy-runtime typecheck` | PASS. |
| `pnpm --filter @workspace/a11oy-fabric test` | PASS - 1 file, 2 tests. |
| `pnpm --filter @workspace/a11oy-fabric typecheck` | PASS. |
| `pnpm --filter @workspace/a11oy typecheck` | PASS. |
| `pnpm --filter @workspace/a11oy lint:ci` | PASS, exit 0; warning-only output and no lint error. |
| `pnpm --filter @workspace/a11oy build` | PASS - 3,343 modules transformed and a `ProductJourney` chunk emitted. |
| `curl` to `http://127.0.0.1:4110/a11oy/start` | PASS - HTTP 200. Reachability only; not JavaScript-render proof. |
| In-app browser against Vite dev port 4110 | BLOCKED FOR RENDERING - its HMR WebSocket did not establish. No screenshot from this path was used. |
| In-app browser against built preview `http://127.0.0.1:4111` | PASS for the observed local run - all 18 target/viewport combinations rendered, with no page error or horizontal document overflow observed. Investor and developer journey destinations rendered. |
| Initial axe run | FINDINGS OBSERVED - repairs were applied. A final rerun is not yet claimed. |
| Final axe rerun after all source fixes | **PENDING - final operator must replace this line only with the observed command and result.** |
| Final focused package rerun on the completed exact tree | **PENDING - final operator must record exact commands and outcomes.** |
| Final doctrine, claim, brand, and route checks | **PENDING - final operator must record exact commands and outcomes.** |
| Final secret/environment scan and `git diff --check` | **PENDING - final operator must record exact commands and outcomes.** |
| Commit signature, DCO/raw-commit verification, normal push, remote SHA/tree readback, and hosted checks | **PENDING - no remote persistence or hosted success is claimed.** |

### Fresh local-browser evidence

All captures were made by Codex against the running local production-build
preview on port 4111 for Workcell
`P0-SERIES-A-PRODUCT-WIRING-20260811`, proof level 4. The in-app capture excludes
browser chrome, so the exact route is recorded in the screenshot catalog.

| Surface | Widths | Route |
|---|---|---|
| Investor/developer start | 320, 390, 768, 1366, 1728 CSS px | `/a11oy/start` |
| Seeded Workcell registry | 320, 390, 768, 1366, 1728 CSS px | `/a11oy/workcells` |
| Workcell detail | 1366 CSS px | `/a11oy/workcells/wc-001` |
| Workcell replay detail | 1366 CSS px | `/a11oy/workcells/wc-001/replay` |
| Replay registry | 1366 CSS px | `/a11oy/replay` |
| Demo | 1366 CSS px | `/a11oy/demo` |
| PCE registry | 1366 CSS px | `/a11oy/pce` |
| Governance | 1366 CSS px | `/a11oy/governance` |
| Proof Ledger | 1366 CSS px | `/a11oy/proof` |
| Trust Center | 1366 CSS px | `/a11oy/trust` |

These images establish only that the stated local built-preview bytes rendered
at the stated viewport sizes. They do not establish deployment, deployed-byte
parity, an authenticated evidence source, live execution, receipt validity,
certification, or production operation.

### Remaining blocker, completion state, and non-claims

- Final axe, focused exact-tree package, doctrine/claim/brand/route, secret,
  environment-file, and Git-diff checks remain `PENDING`; this task must not be
  marked complete until the final operator replaces those placeholders with
  observed results.
- An intentional policy-compliant commit, signature/DCO verification, normal
  push to the existing branch, exact remote SHA/tree readback, terminal hosted
  checks, and protected authority remain `PENDING`.
- The external Truth-drift probe transport failure remains fail-closed and must
  be resolved by a new exact-head hosted run, not by weakening or skipping the
  gate.
- No new pull request was created. No force-push, direct protected-main write,
  history rewrite, self-approval, merge, deployment, publication, secret
  retrieval, customer/revenue claim, certification claim, or production claim
  is made.
