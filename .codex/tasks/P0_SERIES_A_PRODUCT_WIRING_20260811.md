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
