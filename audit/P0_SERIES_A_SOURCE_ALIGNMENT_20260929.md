# P0 Series A source publication and alignment receipt — 2026-09-29

Workcell: `P0-SERIES-A-PRODUCT-WIRING-20260811`.

**SOURCE BRANCH PUSHED AND VERIFIED. Full operational release is NOT established.**
This receipt separates the Platform build from the independently published A11oy
Python product, Hugging Face artifacts, and static proof domain.

## Source publication

- Canonical repository: `https://github.com/szl-holdings/platform`.
- Existing branch: `codex/p0-platform-work-20260811`; no replacement PR created.
- Remote branch before push: `4c26025098553390f23fd1273638d8e0c33b2114`.
- Protected base integrated: `098d3d7705a4e410490502088b2693747745f613`.
- Signed integration: `eba51d16c3006fb0258d87d285c8d20d517d527b`.
- Published implementation: `4d44542e967eb341b05418f8a0bc550b882bf1dc`.
- Published implementation tree: `223a912e6db7149a48f4f1671db877b61d1688ef`.
- `git push origin HEAD:codex/p0-platform-work-20260811`: exit 0, normal fast-forward.
- `git ls-remote origin refs/heads/codex/p0-platform-work-20260811`: exact match.
- Local SSH verification: valid; GitHub commit API: `verified=true`, `reason=valid`,
  matching commit and tree.
- Existing PR #601 remains CLOSED/draft, with historical head `4c260250...`.
  Pushing its branch does not reopen it, perform protected admission, or deploy.
- After the API quota reset, `gh run list --branch codex/p0-platform-work-20260811
  --commit 4d44542e967eb341b05418f8a0bc550b882bf1dc` returned an empty list.
  No hosted CI pass is claimed for the published head.
- Protected main advanced to `d1634eb97afecbf3f68770003f3ecbaf4189835b` during this
  run. That later head was observed, not silently called the tested base.
- This receipt's successor changes documentation only; it does not relabel
  screenshots or change the implementation identity above.

The source integration preserves the current protected security/dependency,
Python Ovis, readiness-publication, and evidence changes. The sole workspace-file
adjustment normalizes CRLF to the existing LF attribute policy: both unstaged and
staged `git diff --ignore-space-at-eol --exit-code` passed. No dependency value or
capture gate changed. Before normalization, the raw workspace blob matched HEAD
but Git correctly reported its conflict with the declared normalization policy.

## Local qualification and honest limits

- Pinned pnpm 10.26.1, `CI=true`, `install --frozen-lockfile --ignore-scripts`:
  exit 0, 203 workspace projects, +29/-25 packages; no lockfile resolution change.
- `node --test artifacts/a11oy/test/series-a-contract.test.mjs artifacts/a11oy/test/product-wiring-contract.test.mjs scripts/qa/series-a-proof-helpers.test.mjs`:
  23/23 passed, including a rerun at final implementation source.
- `node node_modules/vitest/vitest.mjs run --maxWorkers=1` from
  `packages/a11oy-runtime`: 37/37 passed in 3 files; from `packages/contracts`:
  190/190 passed in 7 files.
- Direct `node node_modules/typescript/bin/tsc -p <package>/tsconfig.json --noEmit`:
  all four passed: artifacts/a11oy, lib/a11oy-fabric, packages/a11oy-runtime,
  packages/contracts. These checks ran on integration source; final normalization
  changed no TypeScript/application bytes.
- `node --experimental-vm-modules scripts/docs/check-docs-claims.js`: 26/26 passed.
- Brand check and pre-push changed-file brand-string check: passed; 18 files scanned.
  Optional OG check explicitly skipped: Python/Pillow unavailable to the hook.
- Source-bound wrapper's owned production build at `4d44542e...`: Vite 8.0.16,
  3,344 modules, successful build in 1m 5s.
- Current browser matrix: **NOT QUALIFIED**. Durable attempt started
  `2026-09-29T21:51:41.8801489Z`, finished `2026-09-29T21:56:29.9556120Z`, exit 1.
  The build completed, then Playwright could not find Chromium headless-shell 1223.
  No screenshots, interaction pass, or source-bound final sidecar was produced.
- The 9 browser-layout fixtures also could not launch that missing browser.
  Restoring pinned Chromium 148.0.7778.96 failed with `ENOSPC` (exit 1).
  The first install command also used an absent direct playwright CLI path;
  the repository's `@playwright/test/cli.js` was then used correctly.
- The C drive reached zero free bytes. Cleanup of this task's disposable diagnostic
  build was blocked by execution policy; **nothing was deleted**. No other user's
  files, caches, or processes were removed. Space later increased independently,
  allowing this receipt to be saved, but browser installation remains incomplete.
- Added credential-pattern matches: zero. Environment-file changes: zero.
- Workspace-wide qualification, strict provider claims and hosted promotion remain
  unestablished; no aggregate pass is inferred from these scoped checks.

The previously successful **75 screenshots and 155 interaction states** remain
durably committed in `7eda5d6799832c1b37771dc29dbfe2ef995c707f`, with captured source
`c62cac56e4ea84ccff641e0cc119bfe67278e577`. Their three receipt hashes were rechecked
before commit. See [September 25 proof](P0_SERIES_A_PRODUCT_UPGRADE_20260925.md)
and [screenshot catalog](screenshot-catalog.md). They are historical exact-source
evidence, NOT a fresh browser pass for September 29 or hosted promotion authority.

## Actual Python source checks

At integration `eba51d16...`, all of these scoped source paths were unchanged
after testing. No Python packages were installed for these checks.

- Python 3.12.10: `python -B -m unittest discover -s platform/agents/readiness/_lib -p test_khipu_publish.py -v`:
  **10/10 passed**, exit 0; HF is replaced by an in-memory fake, so this proves
  publication rejection/ordering/locking contracts, not actual publication.
- Python 3.11.9, from services/substrate-py-workers:
  `python -B -m pytest tests/test_ovis_omni.py -v -rA -p no:cacheprovider`:
  **4/4 passed**, exit 0. Package requirement is >=3.11. Tests use FakeRuntime:
  revision/receipt binding, dimension admission, production refusal and CAS tamper
  rejection are tested; real model inference is not. The first Python 3.12 attempt
  failed collection because structlog was absent. Existing 3.11 dependencies worked.
- Python 3.12.10, PYTHONPATH=packages/live-wires;packages/wire-d:
  `python -B -m pytest packages/live-wires/tests packages/wire-d/tests -q -p no:cacheprovider --import-mode=importlib`:
  **3/3 passed**, exit 0; import/integration-point smoke checks only. Placeholder
  signatures and derived values are not promoted to production receipts.
- PYTHONDONTWRITEBYTECODE=1; OTEL_SDK_DISABLED=true for readiness/worker checks;
  PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 for pytest. Selected tests are synchronous.
  Ovis warnings: Starlette BlockingPortal deprecation and unknown asyncio_mode.
- `AGENTS.md` references lib/a11oy-fabric-py, but that directory is absent from
  HEAD and protected source. This documentation drift is a known gap; no nonexistent
  substrate CLI execution is claimed.

## Bounded provider and domain observations

Read-only observation completed **2026-09-29T21:31:42Z**. No provider publication,
model/kernel execution, dataset upload, DNS mutation, merge or deployment occurred.

1. **Live Python product source is `szl-holdings/a11oy`, not Platform.** Observed
   GitHub-verified main `599d3a4783fe2816a7c5cf15a819453d5cb6c264` matches the
   revision reported by [build information](https://a-11-oy.com/api/build-info)
   and [honesty endpoint](https://a-11-oy.com/api/a11oy/v1/honest).
   [HF Space metadata](https://huggingface.co/api/spaces/SZLHOLDINGS/a11oy)
   reports repository/runtime `8d20317b43d337e3278e893878504fda572ef20f`, RUNNING.
   This is reported identity, not complete byte-parity or signed-execution proof.
2. **Live execution evidence remains incomplete.** Build info: receipt_minted=false.
   [Health](https://a-11-oy.com/healthz): signer ABSENT, signing_available=false,
   DSSE UNAVAILABLE. [Readiness](https://a-11-oy.com/readyz): ready, SQLite,
   khipu_durable=true, chain_ok=true, depth 0. No signed persistent action/restart
   witness was established. The short doctrine commit is not a deployment SHA.
3. **Publication authority:** A11oy `.github/workflows/hf-sync.yml` is the declared
   canonical automatic writer, using reusable-hf-deploy at
   `e3ec47ad2e99a535839afe0f30fefbd8973d52da`. Current-main workflow contents were
   read; immutable workflow-byte revalidation and exact-head terminal receipts
   are still required before dispatch. GitHub API rate-limit 403 at 21:25:52Z
   blocked workflow-run inspection; requests stopped until a later quota reset.
   No competing publisher was dispatched from this Platform task.
4. **Khipu model:** [immutable source binding](https://huggingface.co/SZLHOLDINGS/SZL-Khipu-1.5B/resolve/724d251459cc987f33985c5799f5f3a9e02f4cd2/szl-source-binding.json)
   links szl-forge@eb8850adf2193b767a4ae24561955d2a2fde1159 but covers only its card,
   banner and binding. It explicitly says publication_eligible=false, abstention
   2/6, and no weights/runtime/evaluation authority. ReceiptAgent metadata exists,
   but its exact-revision README returned 401; no qualification is inferred.
5. **Kernel:** [first-class metadata](https://huggingface.co/api/kernels/SZLHOLDINGS/szl-kernels)
   reports kernel revision ba1ac6abdf82a281012f051d135004b7f1f5eceb and
   trustedPublisher=false. Its stable v1 binding declares szl-kernels source
   34d95e772c370510d67fe81282635828e2c4abb6 and szl-forge publisher
   fc1858e1e3a386361486683d6de3df5a94a5a239. The legacy model mirror is distinct.
   No kernel code or current-main/v1 parity was tested.
6. **Datasets sampled:** a11oy-verifiable-corpus at
   34c097640744b2840bc23080861e310e74eb8b41 and szl-lake at
   bdf238294cd938fec97a4de5472e53764f5b262e. Record signatures, full parity,
   training rights and complete organization pagination were not verified.
7. **Static evidence site:** observed verified a11oy-net main
   d53459ce0cd2fc23d3c4c5fb1dcacaf627f22765. Its [health.json](https://a11oy.net/health.json)
   text matches that immutable source. [Build-info route](https://a11oy.net/api/build-info)
   explicitly returns static HTML, PARTIAL, identity NOT_CLAIMED and revision
   NOT_PUBLISHED_BY_THIS_ROUTE. /healthz=404 follows the declared static contract;
   it is not a missing Python health implementation to fake into passing.

## Release disposition

The normal branch push is complete. Exact-current protected admission, a fresh
browser matrix, canonical provider publication receipts, signed live persistence,
and model/kernel/dataset qualification are separate unresolved gates. Existing
PR #601 was closed and the original task retained a no-new-PR/no-merge constraint
at this observation. Later explicit user authorization and the actions below
supersede that action boundary, not evidence requirements or historical receipts.
All seeded Workcells remain DEMO; the operational registry remains empty/frozen.
No production, training, customer, certification, independent-approval or full
estate alignment claim is made. The autopilot skill was used for current-source
integration, scoped qualification and branch publication without bypassing gates.

## September 29 continuation: protected source and organization actions

Times below are UTC; September 30 UTC observations occurred on September 29 in
America/New_York. The user subsequently explicitly authorized organization-wide
PR handling and normal merges. No protection bypass or force-push was performed.

### Platform plan and diagnostic disposition

Documentation successor `99dab747418630e4605c8f7ed02a8c11613284df`, tree
`b2e01934c70939fb12d95e61c72466a5dd598509`, was normally pushed and verified.
Protected main later reached `402c9876c032a9bb532f0a3d1f997aa3254c7653` through
Atelier and dependency repairs. This continuation integrates that exact base
normally, preserving protected runtime/dependency bytes, combining both package
test lists and historical gap entries, and retaining declared LF normalization.
Acceptance is scoped source/type/runtime checks, then the unchanged owned-build,
155-state, 75-image rail on a clean committed source. No Atelier live-provider
witness or production readiness is inferred from protected integration.

Qualification after integrating `402c9876...`: frozen pnpm 10.26.1 install passed
(203 projects, lockfile unchanged); combined source/helper/Atelier contract suite
passed **28/28**; runtime **37/37** and shared contracts **190/190** passed with one
worker; all four direct package typechecks passed; documentation claims **26/26**
passed. Staged protected runtime/services/workers/Atelier/shared-proxy/workflow and
environment-example paths exactly match that protected source. Workspace values
match protected source ignoring only line endings. Whitespace checks passed.
An attempted `scripts/brand-check.mjs` invocation failed because that path does
not exist; the declared command is `tsx scripts/brand-check.ts`, not a missing
brand implementation. The corrected `node --import tsx scripts/brand-check.ts`
passed, followed by **9/9** browser layout regressions. Current complete browser
proof remains pending until its own receipt.

The only new harness behavior reports a failed navigation's original cause,
viewport, route, last passing state and bounded browser error names. It adds no
browser call on the failure path and changes no ten-second readiness deadline,
network policy, content/layout assertion or acceptance threshold.

Pinned Chromium headless-shell 148.0.7778.96 subsequently installed and **9 layout
fixtures passed**. The earlier missing-browser limitation is historical. Other
attempts remain failed:

- r4 at `99dab747...`: build passed; logs reached 155 interaction states, then
  writing `interactions.json` failed with ENOSPC. Wrapper exit 1, from
  `01:47:07.4223463Z` to `01:52:37.5144823Z`. No complete proof exists.
- r5 at the same source/tree: build passed in 29.79 seconds; completed viewport
  groups reached 97 states through 768px. `/a11oy/proof` navigation after replay
  at 1366px exceeded readiness's ten-second deadline. Wrapper exit 1, from
  `01:57:56.2733137Z` to `02:01:31.8768359Z`; no screenshots/final receipt.
- Synthetic loopback clock/navigation diagnostic at `03:39:20.215Z`: **9/9 passed**,
  no browser errors, 1517–1542 ms readiness. Three trials each used installed clock,
  explicit resume and fresh context. Receipt SHA-256:
  `65ebdf5710bc4ecc9e74e11293156adfbb2eb6243c8665c64f5ecc1bcc243026`.
  This does not execute A11oy or reproduce a stuck-clock defect. No speculative
  clock workaround, longer deadline or swallowed failure was introduced.

Disk space recovered independently; no files were deleted here. The earlier pinned
pnpm cache path disappeared externally. Existing replacement
`_npx/a2581990a6675e57/node_modules/pnpm/bin/pnpm.cjs` and Corepack both reported
the required 10.26.1; no different package-manager version was substituted.

### Organization inventory and two verified Lambda merges

Authenticated inventory covered **130/130 unique repositories**, complete repository
and nested PR pagination, including 95 primary-Python repositories. It recorded
34 open PRs across 11 repositories before the merges below: 24 drafts, with CI
rollups 16 successful / 15 failing / 3 pending. These are timestamped inventory
counts, not whole-estate code/runtime qualification. Raw observations occurred
`01:45:43Z`–`01:46:55Z`; generating derived files later does not refresh them.

Private repository metadata and raw inventory remain **local and ignored**, not
copied into this public repository. Local manifest SHA-256:
`6078ed959c986e90d0eb77a49d7c7570cd977f860a91bf2f05520040edfdcd29`.
Drafts, explicit HOLDs, failing checks and active-owner lanes were not blindly merged.

Both Lambda changes used normal squash merges with exact-head compare-and-swap,
valid source signatures, seven fresh successful checks, and complete empty
comment/review-thread pagination. No independent human approval is invented.
Existing protections were read, not weakened; checks were voluntarily required
here even though that repository did not configure required branch checks.

1. [Lambda #58](https://github.com/szl-holdings/szl-lambda-gate/pull/58): callable regex
   replacement preserves release-note backslashes, with 15 regression combinations.
   Tested head `64d89e3286a5c44e6b78f7ea772db2bc5c4171d4`; verified merge
   `05a988fbff2214d44b450a6134961eb32ca14f1b` at `01:53:55Z`.
   Merge tree `5733bc88397609861316d8ba487f4397d3374b81` equals the tested tree.
2. [Lambda #57](https://github.com/szl-holdings/szl-lambda-gate/pull/57): exactly four
   reviewed source paths may replace mirror bytes; other collisions fail closed
   and Hub-only assets remain preserved. Normal branch update incorporated #58;
   seven fresh checks passed at `d7d328a6d0c800d29ad1e4edeaf443e96d50b237`.
   Verified merge `7cb79cba7ecb5dbb9da59b2d6b516a98d2a114d6` at `01:59:16Z`,
   tree `79e3df78361ce3853d640e67d01ebadbc0f452ba`, exactly matches the tested tree.

Post-merge `7cb79cba...` workflows passed CI, CodeQL, Trivy, Doctrine Overclaim
Guard, SBOM, Scorecard and the push-only mirror plan.
[CI](https://github.com/szl-holdings/szl-lambda-gate/actions/runs/36657697034)
is code evidence; the push plan does not publish to HF.

Another publisher subsequently created [v0.2.0](https://github.com/szl-holdings/szl-lambda-gate/releases/tag/v0.2.0)
at `02:37:14Z`, targeting merged source `7cb79cba...`. Its immutable
[HF model-mirror card](https://huggingface.co/SZLHOLDINGS/szl-lambda-gate/blob/a225574718f889a64ff60a686d35df9ed5ef4289/README.md)
now binds that release/source. A prior
[publisher run](https://github.com/szl-holdings/szl-lambda-gate/actions/runs/36660690036)
failed at Resolve Hub credential (OIDC), not at source tests. This does not explain
the later Hub update. This task has no terminal payload receipt or verified HF
tag readback. Main later became verified `b74dd478e83cce1f7cb4a234fa407a5ab1578db4`.
No duplicate release/dispatch was created here. The configured model mirror is
distinct from first-class Kernel Hub publication/execution.

### Later Python product and domain observations

The active A11oy release owner advanced canonical Python source to verified
`3831b4475ed16d78efc337496a87847a6320b06c`, tree
`81c4cddebb658fe0d3aa1aa87a47c8306fefb8fa`. At approximately `01:52Z`, HF Space
repo/runtime `765d4d6d8bdeb270d0c06cb5e05d5c36d5bcecda` was RUNNING; domain and
HF-host build-info matched that source with Python 3.14.7.
[Canonical sync](https://github.com/szl-holdings/a11oy/actions/runs/36639665771)
and [post-deploy parity](https://github.com/szl-holdings/a11oy/actions/runs/36655775031)
passed. Deployment evidence listed 1438 deployed files, 1436 resolved inputs,
zero unresolved COPY sources. Two receipt archives matched GitHub artifact digests.

A `01:30:43Z` restart receipt passed source/public-key/database/pre-chain
persistence, boot change and no writer overlap. This later evidence supersedes
the earlier absence of a restart witness, not the historical observation.
Yet fresh Series A status at `01:48:57Z` was **BLOCKED** by
`github_inventory_unavailable`, despite SIGNED status and 44,403 receipts.
Generic `/healthz` reported signer ABSENT while `/api/a11oy/healthz` reported
DSSE-LIVE; the disagreement is not resolved by selecting the favorable endpoint.
A GDW transition remained UNSIGNED_ATOMIC / OUTBOX_PENDING, not signed execution.

Static a11oy.net source later became `bad45c90da70fe49035f63fbd847d38133355942`;
its health contract still denies runtime authority. No competing A11oy publisher,
domain write, model-weight promotion, dataset upload or kernel execution occurred
here. These observations require refresh before any later promotion decision.
