# P0 Series A Product Wiring - Protected Successor Proof Packet

Generated: 2026-08-11

## Verdict

`SOURCE_COMMITTED / PROTECTED PR #608 / FRESH EXACT-HEAD GATES REQUIRED`

Platform PR #608 carries the committed Series A product wiring on branch
`codex/p0-platform-work-20260813-r2`. The product delta passed the focused local contracts,
TypeScript compilation, production bundling, responsive browser matrix, and the bounded hosted
checks recorded below. Pre-remediation PR head `4ed2dfa486a7776c4a329be6fb20a2af9de3ad19`
completed with no failed or pending check contexts; this documentation repair must receive its own
fresh exact-head checks and review-thread resolution before protected merge. Nothing in this packet
claims a merge, deployment, production runtime, or independent production witness.

## Exact provenance

| Field | Evidence |
|---|---|
| Repository | `szl-holdings/platform` |
| Worktree | `C:\Users\steph\Documents\Codex\2026-08-11\i\work\platform-series-a-clean` |
| Branch | `codex/p0-platform-work-20260813-r2` |
| PR | #608, open and ready for review at packet repair time |
| Incorporated protected-main base | `8745cf05e98b30547e005ade7f5741885480e6e1` |
| Product delta commit | `72c5a3607e859a83ea4291ec5b3665dc0ff382ca` |
| Review-repair parent | `4ed2dfa486a7776c4a329be6fb20a2af9de3ad19` |
| Exact repair revision | The immutable GitHub PR #608 head containing this packet is authoritative |
| Candidate state | Committed and pushed; fresh exact-head CI and review-thread resolution required |
| Remote mutations | Successor branch pushes and PR #608 publication/update; no protected merge or deploy |

The earlier PR #584 local candidate is provenance only. It is superseded by the committed PR #608
successor above and is not the promotion target.

## Product contract

The registered `/a11oy/start` route defaults to an investor lens and exposes exactly six buyer
views:

1. Cyber security
2. Finance
3. Data governance
4. Enterprise operations
5. Real estate
6. Legal

Every view follows `Observe -> Gate -> Act -> Prove`, identifies the buyer and value, links to an
existing registered A11oy source route, and holds the same evidence boundary:

| Surface or operation | State | Meaning |
|---|---|---|
| React view | `AVAILABLE` | Present and locally compiled in this source tree |
| Decision scenario | `DEMO` | Deterministic, non-customer scenario |
| External action | `BLOCKED` | Staged recommendation only; no external mutation |
| GraphQL runtime | `UNAVAILABLE` | Client declarations exist, but no server resolver route was found |

The legacy `/a11oy/investor-demo` route resolves to the same truth-safe view. This prevents the
registered route from continuing to expose the legacy component's hard-coded investor metrics.

## Backend inspection

Searches across the API route trees, libraries, packages, and A11oy artifact found frontend client
declarations for `/api/graphql` and `/api/graphql/ws`, but no registered server resolver or route.
No GraphQL response, subscription, or deployment was fabricated. The view explicitly renders the
runtime as `UNAVAILABLE`; it remains a residual backend gap.

## Changed source

- `artifacts/a11oy/src/App.tsx`
- `artifacts/a11oy/src/components/layout.tsx`
- `artifacts/a11oy/src/data/seriesASolutions.ts`
- `artifacts/a11oy/src/main.tsx`
- `artifacts/a11oy/src/pages/SeriesAView.tsx`
- `artifacts/a11oy/package.json`
- `artifacts/a11oy/tsconfig.json`
- `artifacts/a11oy/vite.config.ts`
- `artifacts/a11oy/test/series-a-contract.test.mjs`
- `packages/omnia-shell/src/OmniaShellProvider.tsx`
- `packages/omnia-shell/src/types.ts`
- `scripts/qa/smoke-routes.js`
- `.codex/tasks/P0_SERIES_A_PRODUCT_WIRING_20260811.md`
- `docs/operations/known-gaps.md`
- `audit/screenshot-catalog.md`
- `docs/assets/screenshots/current/a11oy-series-a-*-2026-08-11.png`
- `audit/P0_SERIES_A_PRODUCT_WIRING_LOCAL_SUCCESSOR_PROOF_2026-08-11.md`

## Verification

| Check | Result |
|---|---|
| Fresh-worktree root `pnpm typecheck` baseline | `BLOCKED`: dependency linking attempted registry access and failed with `EACCES`/fetch errors |
| Final root `pnpm typecheck` | `BLOCKED`: pnpm refused to purge/relink the junction-backed modules tree without a TTY |
| Direct `turbo run typecheck` retry | `BLOCKED`: entered the 201-package graph, then nested pnpm scripts hit the same dependency-status guard before source diagnostics |
| Lockfile identity before dependency reuse | `PASS`: SHA-256 `B77E2E22177D2DA040AD16B9CAAB8E0CB14B53B3F959BAD4DA5B77726D2F7C82` matched the linked checkout |
| `tsc -p artifacts/a11oy/tsconfig.json --noEmit` | `PASS` |
| `tsc -p packages/omnia-shell/tsconfig.json --noEmit` | `BLOCKED`: existing package config omits DOM globals and the linked checkout cannot resolve `lucide-react`; the changed provider passed through the A11oy compile path |
| `node --test artifacts/a11oy/test/series-a-contract.test.mjs` | `PASS`: 7/7 |
| Biome lint, changed A11oy production modules | `PASS`: no warnings |
| React best-practices review | `PASS`: no critical issue in the changed components |
| `vite build --configLoader runner` | `PASS`: 3,342 modules transformed |
| Repository route smoke, A11oy slice | `PASS`: 18/18, including both new/compatible routes |
| Repository route smoke, global result | `BLOCKED`: 60 routes from five intentionally unstarted artifacts were unreachable |
| Preview `HEAD /a11oy/start` | `PASS`: HTTP 200 with configured security headers |
| Browser matrix | `PASS`: 320/390/768/1366/1728; six tabs/panels; keyboard contract; no overflow, clipping, undersized target, app error, overlay, or `/api` request |
| `/a11oy/investor-demo` compatibility | `PASS`: HTTP 200 and canonical Series A heading |
| Direct image review | `PASS`: 320, 390, and 1366 inspected; no capture stitching artifact in final images |
| `git diff --check` | `PASS` |
| Protected PR #608 checks at parent `4ed2dfa486a7776c4a329be6fb20a2af9de3ad19` | `PASS`: 51 successful, 1 neutral, and 2 skipped check contexts; no failed or pending context; DCO and lockfile gates passed |
| Review repair | Three actionable threads identified; this successor corrects provenance, screenshot storage, and public-surface rollback, with fresh exact-head CI and thread resolution still required |

The fresh target did not receive a secret or network package install. Its partial `node_modules`
directory was preserved as `node_modules.partial-install-20260811`; local junctions reuse the
fully linked dependency tree of another checkout with the identical lockfile. Those junctions are
ignored local support state, not product source evidence.

## Responsive and accessibility evidence

The view implements semantic tabs with ArrowLeft, ArrowRight, Home, and End behavior; labelled
tab/tabpanel relationships; visible focus states; reduced-motion handling; 44-46 px interactive
targets; and 6-column, 3-column, and 1-column layouts. A focused Biome accessibility lint passes.

A local Playwright/Chromium fallback captured the same running production bundle at 320, 390, 768,
1366, and 1728 CSS pixels after the in-app controller failed to initialize. At every width the
browser exercised all six tabs, the four keyboard transitions, all four loop phases, compatibility
routing, page overflow, navigation clipping, interaction target dimensions, console/page errors,
error overlays, and API requests. All checks passed. Direct image inspection at 320, 390, and 1366
found a coherent hierarchy and repaired two issues before the final captures: a clipped 320 px nav
label and an unsupported live-operation footer claim.

The sandbox denied the optional Google Fonts stylesheet. The capture fulfilled that stylesheet
with an empty CSS response and therefore verifies the source-declared system-font fallback, not
external font delivery. The five PNGs are cataloged in `audit/screenshot-catalog.md`.

| Width | Pixels | SHA-256 |
|---:|---:|---|
| 320 | 320 x 5325 | `3FEEF96D2ABC2CCADB8AE117A37DEC9FB785EC794BD08EF7442A3111009AB84E` |
| 390 | 390 x 4967 | `4822BAE2B2B3C118CF8527078CA0742C363C92D3D3BF7A17D7F50210FD5F64BD` |
| 768 | 768 x 3077 | `EF5D1298D865F01BB4E8F64A932A323C97D66F4D978D4821A94D77D5E5826511` |
| 1366 | 1366 x 2691 | `E2EBA6DCC1293ACFF47957AC68647DA1D18A66B15F07B49373F2D6D82DE14547` |
| 1728 | 1728 x 2728 | `C4B9C902FCBAFA30B4F0F887098056751EBA9D23622DB15799962518D628CD3B` |

## Residuals and promotion gates

1. Implement or deliberately retire the GraphQL client contract only after a real server resolver,
   authentication boundary, tests, and runtime evidence exist.
2. Run the full root workspace graph in a clean dependency environment; focused A11oy checks do
   not represent all 202 workspace projects.
3. Require a signed and DCO-compliant repair commit, fresh exact-head hosted CI, review-thread
   resolution, and normal protected merge before promotion; require deployed readback and an
   exact-revision receipt before any runtime claim.
4. The legacy `InvestorDemo.tsx` file remains in source but is no longer registered as the route
   target; it should be removed or rewritten in a separately reviewed cleanup only if no other
   consumer is found.
5. The Omnia and GraphQL server endpoints remain absent at this revision. Their clients must stay
   unavailable until real authenticated routes and runtime evidence exist.

## Non-claims

This packet does not claim protected merge, deployment, production operation, live data, live
GraphQL, connector execution, customer use, revenue, compliance, ROI, model superiority, or an
independent runtime witness. It proves committed PR source plus only the bounded local and hosted
checks explicitly recorded above.
