# P0 Series A product upgrade — final current-source qualification, 2026-09-25

Workcell: `P0-SERIES-A-PRODUCT-WIRING-20260811`.
**Implementation, current-source build and local product proof COMPLETE.**
Publication is recorded separately below; no deployment or hosted promotion is inferred.

## Exact source

- Repository and existing branch: `szl-holdings/platform`, `codex/p0-platform-work-20260811`.
- Remote branch before this task's publication: `4c26025098553390f23fd1273638d8e0c33b2114`.
- Current protected source incorporated: `9e58f052a7fba212bc74dcc4fd92adc412ffa865`.
- Normal signed integration: `560ecf37893910f5e22caf1dbde49b92b2bd3e0f`.
- Final captured source: `c62cac56e4ea84ccff641e0cc119bfe67278e577`.
- Final captured tree: `6d85c83195d3dd529df9e03a6360bc232cec60b7`.
- Existing [PR #601](https://github.com/szl-holdings/platform/pull/601) remains CLOSED/draft; not reopened.
- Final evidence/publication commits are successors with documentation/images only;
  the screenshot source is never relabeled.

The [September 24 packet](P0_SERIES_A_PRODUCT_UPGRADE_20260924.md) documents the
complete implementation, earlier attempts and scoped boundaries. Its 75 images
remain evidence for that day's exact source, not the September 25 integration.
This run incorporates protected ZIP bounds hardening and Decision Genome string-key
compatibility. Protected workflows, contracts, lockfile/workspace configuration,
SeriesAView/data, Atelier/GraphQL, Vite config and canonical Series A capture
wrapper remain byte-identical to the current protected base.

## Fresh qualification

All commands below ran after the current-main integration. The final source adds
only the capture readiness assertion and its source-contract assertion; application,
runtime and contract bytes did not change after their passing tests.

- Pinned pnpm 10.26.1 `install --frozen-lockfile --ignore-scripts`, `CI=true`:
  exit 0; frozen resolution unchanged; +2/-1 linked packages; no lifecycle scripts.
- `node --test artifacts/a11oy/test/series-a-contract.test.mjs artifacts/a11oy/test/product-wiring-contract.test.mjs scripts/qa/series-a-proof-helpers.test.mjs`:
  exit 0, **23/23**, rerun after the final verifier change.
- `node --test scripts/qa/screenshot-layout-helpers.test.mjs`: exit 0, **9/9**.
- From `packages/a11oy-runtime`, `node node_modules/vitest/vitest.mjs run --maxWorkers=1`:
  exit 0, **37/37 tests, 3 files**.
- From `packages/contracts`, the same single-worker Vitest command:
  exit 0, **190/190 tests, 7 files**.
- `node node_modules/typescript/bin/tsc -p <package>/tsconfig.json --noEmit`:
  exit 0 for **artifacts/a11oy, lib/a11oy-fabric, packages/a11oy-runtime and packages/contracts**.
- `node --experimental-vm-modules scripts/docs/check-docs-claims.js`: exit 0, **26/26**.
- `node node_modules/tsx/dist/cli.mjs scripts/brand-check.ts`: exit 0.
- Final scoped Biome formatting/lint and Oxlint hook checks: exit 0.
  Earlier full A11oy lint remains warning-only (563 warnings/74 infos); no rule disabled.
- Final exact-source owned production build: exit 0; Vite 8.0.16, **3,344 modules**.
- Exact-source interactions: **155 states PASS** over 320, 390, 768, 1366 and 1728px.
- Exact-source capture wrapper: **exit 0, VERIFIED, 75 captures, zero failures**.
- `git diff --check`: exit 0; scoped added-line credential patterns: zero;
  changed environment files: zero.
- `node --experimental-vm-modules scripts/qa/verify-claims.js --strict`: exit 1,
  unchanged absent Vessels/AIS provider authority (`MARINETRAFFIC_API_KEY`);
  90 working, 12 partial, 3 dormant, 1 mock, 0 broken. Not waived.
- Aggregate workspace typecheck is **not qualified**; its prior toolchain/implicit
  install boundary is preserved in the September 24 packet.

Initial parallel test startup encountered host resource exhaustion: contracts Node
OOM, runtime exit 1 without diagnostics, and Chromium closure during layout tests.
Serial single-worker Vitest and serial Chromium reruns passed without source changes.
No resource failure is silently treated as a test pass.

The first September 25 matrix on `560ecf...` rejected Workcells at 390px because
the boot marker became true before its lazy page rendered. It is NOT promoted.
The final verifier now waits, bounded to ten seconds, for one main landmark and
the exact planned H1 before inspecting geometry, links or screenshots. All existing
failure checks remain. The final complete rerun passed; the failed packet remains
under ignored output for diagnostics.

## Durable final proof

Capture interval: **2026-09-25T12:37:36.111Z through 2026-09-25T12:40:33.97Z**.
Node v24.19.0; Playwright 1.60.0; Chromium 148.0.7778.96.
Authority: **LOCAL_NON_AUTHORITATIVE**.

All files are retained under `docs/assets/screenshots/current/`.
Original output names map to these byte-identical sidecars:

- `metadata.json` → `a11oy-product-matrix-2026-09-25-metadata.json.txt`,
  SHA-256 `8ec68be5a681b07856f2e2c1c4e62b717ff70edb11e8829c803ee8ba799fbca8`.
- `source-bound-metadata.json` → `a11oy-product-matrix-2026-09-25-source-bound-metadata.json.txt`,
  SHA-256 `39fa48e245f3e234f189c2b8d5c547e088a555f1f97a21e4d8358589cf8d3534`.
- `interactions.json` → `a11oy-product-matrix-2026-09-25-interactions.json.txt`,
  SHA-256 `5ab1584cb791bc751bad5440a1f424a8afb9016f7d4d7f0bb7a19f1b0318fcdd`.

The suffix protects evidence bytes from formatter hooks. PNG filenames are unchanged.
The final wrapper owns build/server/cleanup and binds all 75 PNGs, the 155-state
receipt, source inputs and served assets. Independent readback recomputed every PNG,
both receipt bindings, all nine tracked inputs from immutable Git blobs and the asset
manifest. Served files: **348 / 16659010 bytes**;
pre/post manifest SHA-256 **2fbedb670deb85927761784c89f2dea4669750ce6094def131070f9e00712bbc**, equal.

Seventy of the 75 PNGs are byte-identical to their corresponding September 24 images.
The five Fabric images differ; final 320px and 1366px Fabric images were separately
viewed with no visible overlap/clipping, and all five passed geometry/text checks.
Very tall screenshots are downsampled by the image viewer, so visual review is not
a claim that every tiny glyph was independently read. Final mobile Demo and the
corrected status header were also viewed. [Catalog](screenshot-catalog.md) links all
routes and widths; complete per-image times, checks and hashes are in metadata.

## Reproduction

From a clean checkout of the captured source on the declared existing branch,
with pinned dependencies and repository Chromium, use a fresh output directory:

```powershell
$env:SOURCE_REVISION = 'c62cac56e4ea84ccff641e0cc119bfe67278e577'
$env:SOURCE_TREE_SHA = '6d85c83195d3dd529df9e03a6360bc232cec60b7'
$env:SOURCE_REF = 'codex/p0-platform-work-20260811'
$env:SOURCE_REPOSITORY = 'szl-holdings/platform'
$env:CAPTURE_ENVIRONMENT = 'local-exact-head'
$env:CAPTURED_BY = 'Codex desktop agent for Stephen Lutar'
$env:GIT_EXECUTABLE = (Get-Command git -CommandType Application | Select-Object -First 1).Source
$env:RUN_IDENTITY = 'PowerShell: node scripts/qa/capture-series-a-product-matrix-proof.mjs for source ' + $env:SOURCE_REVISION
$env:SCREENSHOT_OUTPUT_DIR = 'output/a11oy-product-matrix-c62cac56e4ea-reproduction'
node scripts/qa/capture-series-a-product-matrix-proof.mjs
```

## Publication receipt and limits

Normal branch publication succeeded on September 29 at
`4d44542e967eb341b05418f8a0bc550b882bf1dc`; remote SHA/tree and GitHub signature
were verified. See [publication and alignment receipt](P0_SERIES_A_SOURCE_ALIGNMENT_20260929.md)
for integrated protected source, fresh scoped tests and the blocked current-browser
qualification. This packet's September 25 screenshots retain their original source.

The operational registry stays frozen and empty; seeded Workcells remain DEMO.
Source/build/browser success does not establish authenticated external operation,
provider parity, deployment, customer use, certification or independent approval.
The strict-claims provider gap, aggregate qualification and hosted promotion remain
explicitly open. No PR creation/reopening/merge, deployment, protection bypass,
secret introduction or provider publication was performed.
