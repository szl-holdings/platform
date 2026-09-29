# P0 Series A product upgrade — 2026-09-24 proof packet

September 25 completion and current-source publication are recorded in
[the successor packet](P0_SERIES_A_PRODUCT_UPGRADE_20260925.md). The source
identity and receipts below remain September 24 evidence, not relabeled proof.

## Disposition and source

Implementation and local product proof are complete. Normal branch publication
awaits the remote readback in the publication receipt below. This is not a
production-readiness, hosted-CI, merge or deployment claim.

| Identity | Exact value |
| --- | --- |
| Workcell | `P0-SERIES-A-PRODUCT-WIRING-20260811` |
| Repository / existing branch | `szl-holdings/platform` / `codex/p0-platform-work-20260811` |
| Remote branch before publication | `4c26025098553390f23fd1273638d8e0c33b2114` |
| Protected source incorporated and rechecked | `ff8e29514a6560e269a875027db240b580b05b25` |
| Signed normal integration merge | `d4c3c471684b09d5c975c00cdb55d054f9e7d7c5` |
| Captured implementation source | `6ca620d578c39a9b97a47259445782bf6b58f159` |
| Captured source tree | `12c6248a9ec6f0efa3d4f3556ba99d8b24cbbb7f` |
| Existing PR | [#601](https://github.com/szl-holdings/platform/pull/601), observed CLOSED and draft; not reopened |
| Authority | `LOCAL_NON_AUTHORITATIVE` |

The unavailable `8243029` object was not reproducible and was not restored.
Disposition: BLOCKED / SUPERSEDED BY REPRODUCIBLE CURRENT SOURCE. The historical
protected PR #668 receipt remains separate and is not overwritten by this run.

## Delivered implementation

- Preserve the protected `/a11oy/start` and `/a11oy/investor-demo` Series A
  contracts, Atelier/GraphQL integration and canonical capture tool. Add the
  Series A alias and qualified investor/developer product journey.
- Separate workflow progress from six-state operational availability with
  required evidence reasons. All 20 seeded Workcells remain deterministic DEMO
  records; the operational registry remains empty, frozen and fail-closed.
- Qualify demo, proof, replay, governance, trust, architecture, resources and
  fabric copy. Fixture digest/signature-shaped fields are not attestations;
  the chain check is not computed; demo completion creates no real execution,
  receipt, hash or signature.
- Repair responsive grids, evidence panels, full fixture text, filters and
  replay controls. Shared header items wrap; operational status pills remain
  intact. Mobile navigation uses a native modal dialog with focus containment,
  Escape, close-button, backdrop, resize and navigation handling.
- Correct replay speed intervals and pause/resume without resetting progress.
- Add exact-source product capture and interaction verification: owned build
  and server, immutable asset manifests, bounded lifecycle/cleanup, scroll
  reveal checks, geometry/text-overflow checks and network isolation.
- React best-practices review kept listeners cleaned up and focus restoration
  bounded. No new dependency, disabled lint rule or invented authority was added.

## Qualification ledger

Node v24.19.0; pinned pnpm 10.26.1; Vite 8.0.16; Playwright 1.60.0;
Chromium 148.0.7778.96. Commands ran from the repository root unless noted.

| Command / check | Actual outcome |
| --- | --- |
| Pinned pnpm `install --frozen-lockfile --ignore-scripts`, `CI=true` | Exit 0; 203 projects / 1,736 packages; frozen resolution up to date; lifecycle scripts deliberately not executed |
| `node --test artifacts/a11oy/test/series-a-contract.test.mjs artifacts/a11oy/test/product-wiring-contract.test.mjs scripts/qa/series-a-proof-helpers.test.mjs` | Exit 0; 23/23, rerun after final header fix |
| `node --test scripts/qa/screenshot-layout-helpers.test.mjs` | Exit 0; 9/9 Chromium regressions |
| `node node_modules/vitest/vitest.mjs run` in `packages/a11oy-runtime` | Exit 0; Vitest 4.1.11; 3 files / 37 tests |
| `node node_modules/typescript/bin/tsc -p artifacts/a11oy/tsconfig.json --noEmit` | Exit 0, rerun after final header fix |
| Same tsc command with `lib/a11oy-fabric/tsconfig.json` | Exit 0 |
| Same tsc command with `packages/a11oy-runtime/tsconfig.json` | Exit 0 |
| Pinned pnpm `--filter @workspace/a11oy lint:ci` | Exit 0; 192 files, 563 warnings and 74 infos; not warning-free |
| Scoped Biome format/lint and Oxlint pre-commit checks | Exit 0; two existing Card accessibility warnings remain in shared UI; no rule disabled |
| Diagnostic Vite production build | Exit 0 |
| Final exact-source owned Vite production build | Completed; 3,344 modules transformed; 348 served files |
| Final exact-source product interactions | PASS; 155 states across five widths |
| Final exact-source screenshot matrix | VERIFIED; 15 routes × 5 widths = 75 images; zero reported failures |
| `A11OY_URL=http://127.0.0.1:4417 node scripts/qa/smoke-routes.js --web-only --json` | A11oy 21/21 PASS; overall exit 1 because 60 routes on five stopped unrelated services could not connect |
| `node node_modules/tsx/dist/cli.mjs scripts/brand-check.ts` | Exit 0 |
| `node node_modules/tsx/dist/cli.mjs scripts/check-banned-brand-strings.ts --changed-from ff8e29514a6560e269a875027db240b580b05b25` | Exit 0; no new violations |
| `node --experimental-vm-modules scripts/docs/check-docs-claims.js` | Exit 0; 26/26 |
| `node --experimental-vm-modules scripts/qa/verify-claims.js --strict` | Exit 1; Vessels/AIS lacks MARINETRAFFIC_API_KEY; 90 working, 12 partial, 3 dormant, 1 mock, 0 broken |
| Aggregate workspace typecheck | NOT QUALIFIED; initial child-pnpm selection failed; retry stopped after unrelated nested package auto-selected its own manager and linked dependencies |
| Whitespace / added-line credential and retired-name patterns / changed environment files | Diff check passed; zero matching added lines; zero changed environment files; scoped scan, not exhaustive secret certification |
| Source SSH signature | Verified locally with the existing allowed-signers file |

Pinned executable:
`C:/Users/steph/AppData/Local/npm-cache/_npx/fc0c0bfc49531a9a/node_modules/pnpm/bin/pnpm.cjs`.
The initial install without CI refused noninteractive module-directory
replacement (exit 1); the later pinned frozen installation passed. The aggregate
retry encountered evidence-doctrine's own pnpm 11.9.0 declaration and implicit
three-dev-dependency linking. It was stopped; its generated isolated lockfile
was retained recoverably in ignored
`output/evidence-doctrine-generated-lock-20260924.yaml`, not committed. Root
manifests and the protected lockfile stayed unchanged. No aggregate pass is claimed.
Fabric, runtime and layout-helper source bytes stayed unchanged after their
passing runs; A11oy typecheck/contracts and all browser checks were rerun after
the final header fix.

## Durable evidence and independent readback

Retained directory: `docs/assets/screenshots/current/`. PNG filenames remain
unchanged. JSON sidecars were copied byte-for-byte with `.json.txt` suffixes to
prevent formatting hooks from changing the evidence. Original-name mapping:

| Original output | Retained sidecar | SHA-256 |
| --- | --- | --- |
| `metadata.json` | `a11oy-product-matrix-2026-09-24-metadata.json.txt` | `ced4ba27026da9ead7cf96a8a05bf678bc0d45529327ee963fb1c55e07ff636f` |
| `source-bound-metadata.json` | `a11oy-product-matrix-2026-09-24-source-bound-metadata.json.txt` | `76150bbcda8f57a79cf20d9362a68354e2746884a83148d774f208bb566478ba` |
| `interactions.json` | `a11oy-product-matrix-2026-09-24-interactions.json.txt` | `5ab1584cb791bc751bad5440a1f424a8afb9016f7d4d7f0bb7a19f1b0318fcdd` |

Served manifest SHA-256:
`2fbedb670deb85927761784c89f2dea4669750ce6094def131070f9e00712bbc`.
Its pre/post-capture values match: 348 files, 16,659,010 bytes. Independent
readback recomputed all 75 PNG digests, both receipt bindings, the manifest,
and all nine input hashes against immutable source Git blobs.

The terminal session handle was lost after capture. Completion is established
by the final source-bound receipt (written only after capture, source readback
and successful cleanup), independently validated files, clean source checkout
and no remaining capture process. A recovered terminal exit code is not claimed.

The 155 states include initial routes/layout, Workcell filters and detail links,
replay speed/pause/resume/completion/reset, proof tabs/replay, demo completion/reset,
and mobile focus, Escape, close-button, backdrop, resize and route navigation.
Operational status pills must remain unbroken. This is not a latency SLO or a
production execution witness. Actual PNG visual review includes the corrected
mobile Demo/Proof/header surfaces and narrow/wide product/fixture layouts.
Per-image route, viewport, capture time and SHA-256 are retained in the metadata
and [screenshot catalog](screenshot-catalog.md).

### Earlier attempts are not the final proof

- Old 70-image source `8f3f8b530fb4c2748bf4b1d9b4367844cab87701`:
  REJECTED/SUPERSEDED because the old detector missed clipped Proof Ledger content.
- Initial diagnostic cold navigation timed out; unchanged checks then passed,
  followed by the expanded 155-state suite.
- Source `ace98ccfe33fca61c8c6305716f5956e8237f869`: first capture stopped on
  Chromium ERR_NETWORK_IO_SUSPENDED; retry hit the implicit five-second assertion
  default despite a declared ten-second action budget. The verifier now explicitly
  shares the ten-second readiness budget. Content, isolation, geometry and overall
  suite deadlines remain enforced.
- Source `022f6f4d2824571f7621678ca3e773f149d0b1ae`: automated 75/155 passed,
  but visual review found a split DEMO header at 320px. It is intermediate only.
  The final source repairs it and adds a regression assertion before rerunning
  the complete build, interaction and capture sequence.

## Exact reproduction

Use a clean checkout of the captured source on the declared branch, the pinned
dependencies and repository Playwright Chromium. Choose an absent/empty output
directory. From the repository root:

```powershell
$env:SOURCE_REVISION = '6ca620d578c39a9b97a47259445782bf6b58f159'
$env:SOURCE_TREE_SHA = '12c6248a9ec6f0efa3d4f3556ba99d8b24cbbb7f'
$env:SOURCE_REF = 'codex/p0-platform-work-20260811'
$env:SOURCE_REPOSITORY = 'szl-holdings/platform'
$env:CAPTURE_ENVIRONMENT = 'local-exact-head'
$env:CAPTURED_BY = 'Codex desktop agent for Stephen Lutar'
$env:GIT_EXECUTABLE = (Get-Command git -CommandType Application | Select-Object -First 1).Source
$env:RUN_IDENTITY = 'PowerShell: node scripts/qa/capture-series-a-product-matrix-proof.mjs for source ' + $env:SOURCE_REVISION
$env:SCREENSHOT_OUTPUT_DIR = 'output/a11oy-product-matrix-6ca620d578c3-reproduction'
node scripts/qa/capture-series-a-product-matrix-proof.mjs
```

The wrapper validates HEAD/tree/ref/origin, clean source and exact tracked input
bytes, owns the build/server, verifies immutable assets, captures every planned
surface, verifies images/interactions, and completes cleanup before its final
receipt. Evidence-only successors must retain this captured source identity
and prove source/build/capture input continuity; do not relabel old images.

## Protected source and operational limits

Protected `.github/`, lockfile/workspace configuration, A11oy Vite config,
SeriesAView/data, Atelier/GraphQL and canonical Series A capture tool compare
byte-for-byte with `ff8e29514a6560e269a875027db240b580b05b25`, which is an ancestor.
The inherited Biome parser change supports Tailwind directives, not disabled rules.

This completes source/local product qualification, not estate-wide production
readiness. Seed workflows are DEMO; absent authenticated operation remains
UNAVAILABLE; external actions without authority remain BLOCKED. The empty
operational registry is not populated with invented sources. Strict claims,
workspace aggregate qualification and exact-head hosted promotion are not closed.
No new PR, PR reopening, force-push, merge, deployment, gate bypass, credential
introduction, provider publication, customer outcome, certification or independent
witness is claimed. The [canonical task](../.codex/tasks/P0_SERIES_A_PRODUCT_WIRING_20260811.md)
and [known gaps](../docs/operations/known-gaps.md) preserve these boundaries.

## Publication receipt

Normal branch push and authoritative remote-ref readback are the remaining
receipt step. The publication commit/tree are separate from the captured source.
A local commit or existing PR does not prove successful publication.
