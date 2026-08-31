# A11oy Model Router lexicon UI proof — 2026-08-31

Status: PASS
Proof level: 4
Workcell: PLATFORM-PR-688-MODEL-ROUTER-PROOF

## Claim under test

At exact source revision 9e66b0eebb52d4e183e2b9248fec1aa74caf8611, the live built route /a11oy/model-router renders
Governed Agent Change Management and does not render the superseded public label
Governed Inference Recipes.

## Evidence identity

| Field | Value |
|---|---|
| Source revision | 9e66b0eebb52d4e183e2b9248fec1aa74caf8611 |
| Source tree | 51fa6d934538233b1ad83ec336ff59498b6b1a50 |
| Source branch at capture | chore/a11oy-gacm-signed-688 |
| Pull request | #691 |
| Workflow run | https://github.com/szl-holdings/platform/actions/runs/33357789150 |
| Workflow definition | ops/model-router-proof-691-20260831 at 926390e0efc0a7bfd1cb7b14ea8919e03e8dfeb4 |
| Runner | GitHub-hosted ubuntu-24.04 |
| Browser | Chromium 148.0.7778.96 |
| Route | /a11oy/model-router |
| Viewport | 1440x900 CSS px; device scale factor 1 |
| Capture time | 2026-08-31T04:39:40.844Z |
| Screenshot SHA-256 | 3646d432fb1ca1a5176c2b4e6d52fbd2e2ef063247fc09e4eb0264ef510abfd0 |
| Metadata SHA-256 | 08c659642f0461dc75b57f419d82a2df8b1fe24abcf3de3b00dd00add0b13ca5 |

## Procedure and verification

1. The workflow checked out the immutable source revision and verified its Git tree.
2. It re-read main, the successor branch, and PR #691 before executing the build.
3. It installed the frozen lockfile with lifecycle and pnpmfile execution disabled.
4. It passed A11oy typecheck and Series A tests, then built the exact source.
5. It served the built Vite output on loopback and loaded the exact application route.
6. Playwright waited for the loading state to resolve and the changed heading to be visible.
7. It asserted that the superseded heading was absent, horizontal overflow was zero, no
   page or console errors occurred, and no undeclared foreign network request escaped.
8. The screenshot bytes were hashed before upload and re-hashed before publication.

## Evidence

- Screenshot: docs/assets/screenshots/current/a11oy-model-router-2026-08-31.jpg
- Machine-readable metadata:
  docs/assets/screenshots/current/a11oy-model-router-capture-metadata-2026-08-31.json.txt
- Screenshot catalog: audit/screenshot-catalog.md

The screenshot is a viewport capture centered on the modified governed-recipe section. The
same-origin model-router API was deterministically stubbed with ok:false responses because the
claim under test is public lexicon rendering, not live provider state.

## Acceptance result

PASS. The changed phrase is visible in the exact-source browser render and the prior phrase is
absent from rendered page text. Automated browser, source-identity, tree-identity, build, test,
network-boundary, and binary-hash checks all passed.

## Nonclaims

This packet does not prove deployment, production runtime, provider connectivity, customer use,
or external-service parity. It proves only the named source, local built route, runner, viewport,
and captured bytes.
