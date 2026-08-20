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

## 2026-08-11 published successor result

### Exact source and boundary

- Proof-correction worktree: `C:\Users\steph\Documents\Codex\2026-08-13\u\work\platform-608-fix`
- Repository: `szl-holdings/platform`
- Branch: `codex/p0-platform-work-20260813-r2`
- Current protected base revision: `8745cf05e98b30547e005ade7f5741885480e6e1`
- Published implementation revision: `4ed2dfa486a7776c4a329be6fb20a2af9de3ad19`
- Pull request: #608, open and ready for exact-head review
- State: signed published source candidate. Branch pushes and PR updates are recorded; no merge,
  deployment, Hugging Face change, domain change, or other provider mutation is claimed.

### Root causes

1. The registered investor route used a legacy view with hard-coded commercial and operating
   claims that were not bound to current evidence.
2. Six buyer problems existed only as dispersed product routes; there was no coherent investor
   entry point exposing a shared decision grammar and proof boundary.
3. The frontend declares GraphQL HTTP and WebSocket clients, but no server resolver or registered
   route for those contracts was found at this source revision. The new view therefore fails
   closed as `UNAVAILABLE` rather than inventing backend wiring.
4. The A11oy production bundle resolved `@szl-holdings/flexcache/react` to an unbuilt `dist`
   export. The Vite configuration now aliases both FlexCache entry points to their tracked local
   TypeScript sources, matching the monorepo source-alias pattern.
5. The globally mounted Omnia provider posted an adoption beacon to an absent endpoint and emitted
   an HTTP 404 in the browser. A11oy now declares the provider network `UNAVAILABLE`; the provider
   skips the absent beacon and notification endpoints instead of fabricating a backend.

### Patch

- Added `/a11oy/start` and mapped `/a11oy/investor-demo` to the same truth-safe `SeriesAView`.
- Added typed contracts for cyber security, finance, data governance, enterprise operations, real
  estate, and legal.
- Added a keyboard-operable tab interface with `Observe -> Gate -> Act -> Prove`, buyer value,
  existing source-route CTAs, and explicit `AVAILABLE`, `DEMO`, `BLOCKED`, and `UNAVAILABLE`
  evidence states.
- Added 6/3/1-column responsive layouts, full-width narrow-screen actions, 44-46 px interaction
  targets, overflow controls, and reduced-motion handling.
- Replaced the shell's unsupported `Fabric operational` claim with `Active prototype` and routed
  its Series A CTA to the canonical view.
- Added focused source-contract regression tests and the `test:series-a` package script.
- Added both Series A entry points to the repository route smoke inventory.
- Added a typed fail-closed Omnia network state and aligned the A11oy TypeScript provider path with
  the same tracked source used by Vite.

### Payload dispositions

- Starting SHA `d5cf05ce18b2f776e5ea5124bb9eebc5b0a842d9`:
  `SUPERSEDED_BY_NEWER_SOURCE` because current PR #584 head was obtained read-only.
- Closed PR #584 head `bc40b1c6aec8a44a8a6928c25a21de9aa91e76b7`:
  `SUPERSEDED_BY_NEWER_SOURCE` and retained only as historical provenance.
- PR #608 implementation revision `4ed2dfa486a7776c4a329be6fb20a2af9de3ad19`:
  `APPLIED_PUBLISHED_AND_HOSTED_CI_VERIFIED` before the additive proof correction.
- Six-view investor IA, evidence-state contract, route compatibility, and local source alias:
  `APPLIED_AND_VERIFIED` by focused tests, TypeScript compilation, and production build.
- GraphQL server execution, external connectors, hosted receipts, deployment parity, and
  independently observed production behavior: `BLOCKED_EXTERNAL_AUTHORITY` and displayed as
  unavailable where relevant.
- Legacy investor hard-coded claims: `SUPERSEDED_BY_NEWER_SOURCE` at the registered route; the
  legacy file remains in the tree but is no longer the route target.

### Qualification evidence

- Baseline root `pnpm typecheck`: `BLOCKED` before compilation because the fresh worktree had no
  linked dependencies and the package manager's registry requests failed with local/network
  `EACCES`/fetch errors.
- Final root `pnpm typecheck` and direct Turbo retry: `BLOCKED` before source diagnostics because
  pnpm attempted to purge/relink the junction-backed dependency tree without a TTY. The retry
  entered the 201-package typecheck graph, but package scripts hit the same dependency-status
  guard. The local dependency tree was preserved rather than allowing a destructive relink.
- Dependency recovery: reused a fully linked checkout with the identical lockfile SHA-256
  `B77E2E22177D2DA040AD16B9CAAB8E0CB14B53B3F959BAD4DA5B77726D2F7C82` through local junctions;
  no package or lockfile mutation was made.
- A11oy TypeScript: `PASS` with `tsc -p artifacts/a11oy/tsconfig.json --noEmit`.
- Standalone Omnia package TypeScript: `BLOCKED` by its existing package configuration (DOM globals
  are absent from the package compiler libs and the linked checkout cannot resolve `lucide-react`).
  The changed provider source is imported through the A11oy TypeScript path and passed there.
- Focused contracts: `PASS`, 7/7 with
  `node --test artifacts/a11oy/test/series-a-contract.test.mjs`.
- Focused Biome lint for all changed A11oy production modules: `PASS` with no warnings.
- React best-practices review: `PASS` with no critical waterfall, bundle, hook, rendering, or
  accessibility defect found in the changed components.
- Production bundle: `PASS`, 3,342 modules transformed with
  `vite build --configLoader runner`.
- Repository route smoke: overall `BLOCKED` because the five other web artifacts were not running;
  the live A11oy slice passed 18/18, including `/a11oy/start` and `/a11oy/investor-demo`.
- Preview readback: `PASS`, HTTP 200 at `http://127.0.0.1:4128/a11oy/start` with the configured
  CSP, X-Frame-Options, Permissions-Policy, and HSTS headers.
- Responsive browser matrix: `PASS` at 320, 390, 768, 1366, and 1728 CSS pixels. Every width had
  six tabs and matching panels, working Home/End/Arrow navigation, `scrollWidth == innerWidth`, no
  clipped nav link, no interaction target below 44 px, no application console/page error, no error
  overlay, and no `/api` request. The compatibility investor route also returned HTTP 200.
- Visual review: `PASS`; 320, 390, and 1366 captures were directly inspected. The review repaired
  the 320 px nav clipping and removed the residual unsupported live-operation footer text.
- Screenshot files: `docs/assets/screenshots/current/a11oy-series-a-start-{320,390,768,1366,1728}-2026-08-11.png`.
- `git diff --check`: `PASS`.

### Screenshot evidence and non-claims

The in-app browser controller first failed with
`failed to write kernel assets: The system cannot find the path specified. (os error 3)`. A local
Playwright/Chromium fallback subsequently completed the five-width matrix and produced the
cataloged images. Because the sandbox denied the optional Google Fonts request, the capture
fulfilled that stylesheet with an empty response and used the declared system-font fallback. This
is local responsive UI evidence, not external-font, hosted, deployed, or production evidence.

This published candidate proves committed branch source, local qualification, and hosted CI on the
named implementation revision. It does not prove a protected merge, deployment, domain state,
GraphQL service, connector execution, customer use, revenue, compliance, production readiness, or
live receipt parity. `docs/APP_STATUS.md` was not changed because unmerged source does not change
the canonical deployed application status.

Proof packet:
`audit/P0_SERIES_A_PRODUCT_WIRING_LOCAL_SUCCESSOR_PROOF_2026-08-11.md`.
