# A11oy governed lexicon dual-surface UI proof — 2026-08-31

Status: PASS
Proof level: 4
Workcell: PLATFORM-PR-696-CONVERGENCE-PROOF

## Pre-execution plan

1. Freeze the source branch and Git tree before running candidate code.
2. Reverify protected `main`, PR #696, its branch, and its exact head with API reads.
3. Install the frozen dependency graph with lifecycle and pnpmfile execution disabled.
4. run typecheck, the Series A suite, and the production build; stop on any nonzero exit.
5. Serve the built application on loopback and capture both modified public surfaces.
6. Reject the proof on stale source identity, the superseded label, browser errors,
   horizontal overflow, undeclared network, missing artifacts, or digest mismatch.
7. Publish only evidence bytes and this packet with a compare-and-swap commit.

## Patch summary

- Product commit `9e66b0eebb52d4e183e2b9248fec1aa74caf8611` changes only
  `artifacts/a11oy/src/pages/ModelRouter.tsx` and
  `artifacts/a11oy/src/data/agiConvergenceData.ts` (6 additions, 6 deletions).
- The product patch renames the public phrase `Governed Inference Recipes` to
  `Governed Agent Change Management`; it does not change routing or provider behavior.
- Evidence commit `e1730f581c8109986f14410ff65304715afee634` from predecessor
  PR #691 added the first Model Router capture, its metadata, the catalog entry, and the initial packet.
- This evidence-only append adds the missing Convergence capture and metadata, appends
  the catalog, and replaces the packet with the complete plan → patch → test → verify trail.

## Claim under test

The exact-source built routes `/a11oy/model-router` and `/a11oy/convergence` both render
`Governed Agent Change Management` and neither renders the superseded public label
`Governed Inference Recipes`.

## Evidence identity

| Route | Source revision / tree | Workflow run | Chromium | Screenshot SHA-256 | Metadata SHA-256 |
|---|---|---|---|---|---|
| `/a11oy/model-router` | `9e66b0eebb52d4e183e2b9248fec1aa74caf8611` / `51fa6d934538233b1ad83ec336ff59498b6b1a50` | https://github.com/szl-holdings/platform/actions/runs/33357789150 | 148.0.7778.96 | `3646d432fb1ca1a5176c2b4e6d52fbd2e2ef063247fc09e4eb0264ef510abfd0` | `08c659642f0461dc75b57f419d82a2df8b1fe24abcf3de3b00dd00add0b13ca5` |
| `/a11oy/convergence` | `e1730f581c8109986f14410ff65304715afee634` / `9d2145f7f22ec3a42828e6601885f7bc4c79b373` | https://github.com/szl-holdings/platform/actions/runs/33359471359 | 148.0.7778.96 | `8ee00fa6d520d7120dd7845f6e0a66c3bea53f218ec41261d8c438947734f0c6` | `819d48c2c66c3abfeb2a83849a3c946002325becfa691ef34f439cf57ef16946` |

Both captures use a 1440×900 CSS-pixel viewport at device scale factor 1 on a
GitHub-hosted Ubuntu 24.04 runner. The Convergence capture branch was `chore/a11oy-gacm-dual-proof-20260831`; its
temporary workflow definition was `ops/convergence-proof-696-20260831` at `99a81af1458d65b150ed3f5aa473e01737b6ea88`.

## Test commands and results

| Command | Exit code | Result |
|---|---:|---|
| `pnpm install --frozen-lockfile --ignore-scripts --ignore-pnpmfile` | 0 | Frozen dependency graph installed without lifecycle execution |
| `pnpm --filter @workspace/a11oy typecheck` | 0 | TypeScript qualification passed |
| `pnpm --filter @workspace/a11oy test:series-a` | 0 | Focused Series A suite passed |
| `pnpm --filter @workspace/a11oy build` | 0 | Production Vite build passed |
| Playwright exact-route assertions: `/a11oy/model-router` | 0 | Prior exact-source capture PASS |
| Playwright exact-route assertions: `/a11oy/convergence` | 0 | Current exact-source capture PASS |

## Procedure and verification

1. The workflow checked out the immutable source revision and verified its Git tree.
2. It re-read main, the successor branch, and PR #696 before executing the build.
3. It installed the frozen lockfile with lifecycle and pnpmfile execution disabled.
4. It passed A11oy typecheck and Series A tests, then built the exact source.
5. It served the built Vite output on loopback and loaded the exact application routes.
6. Playwright scrolled each changed label into view before capturing its route.
7. It asserted that the superseded heading was absent, horizontal overflow was zero, no
   page or console errors occurred, and no undeclared foreign network request escaped.
8. The screenshot bytes were hashed before upload and re-hashed before publication.

## Evidence

- Model Router screenshot: docs/assets/screenshots/current/a11oy-model-router-2026-08-31.jpg
- Model Router metadata:
  docs/assets/screenshots/current/a11oy-model-router-capture-metadata-2026-08-31.json.txt
- Convergence screenshot: docs/assets/screenshots/current/a11oy-convergence-2026-08-31.jpg
- Convergence metadata: docs/assets/screenshots/current/a11oy-convergence-capture-metadata-2026-08-31.json.txt
- Screenshot catalog: audit/screenshot-catalog.md

Each screenshot is a viewport capture centered on the modified label. Same-origin
`/api/a11oy/*` requests received deterministic `ok:false` JSON because the claim under test is
public lexicon rendering, not live provider state.

## Acceptance result

PASS. The changed phrase is visible on both exact-source browser surfaces and the prior phrase
is absent from both rendered pages. Automated browser, source-identity, tree-identity, build, test,
network-boundary, and binary-hash checks all passed.

## Nonclaims

This packet does not prove deployment, production runtime, provider connectivity, customer use,
or external-service parity. It proves only the named source, local built route, runner, viewport,
and captured bytes.
