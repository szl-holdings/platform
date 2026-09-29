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
PR #601 is closed and this task retains the explicit no-new-PR/no-merge constraint.
All seeded Workcells remain DEMO; the operational registry remains empty/frozen.
No production, training, customer, certification, independent-approval or full
estate alignment claim is made. The autopilot skill was used for current-source
integration, scoped qualification and branch publication without bypassing gates.
