# Packet 6 vertical-cell workcell

Evidence class: MODELED source candidate; remote draft PR NOT RUN.

This workcell converts the Packet 6 vertical-factory design into executable,
fail-closed source. It does not claim a production deployment, customer use,
provider publication, or independent runtime witness.

## Scope

- `apps/vertical-cells/**`: strict manifests, registries, compiler, fixtures,
  generated-contract verification, and compiler tests.
- `packages/vertical-runtime/**`: local persistence ledger (durability
  unverified), policy-shadow evaluator, deterministic decision receipts,
  release gate, loopback HTTP service, offline verifier, and runtime tests.

No GitHub settings, workflows, root configuration, lockfiles, secrets,
Hugging Face assets, DNS, deployments, or existing application routes are in
scope.

## Plan

1. Normalize the seven Packet 6 cells and formula aliases into strict,
   machine-addressable registries.
2. Compile every cell deterministically into ontology, policy, UI, route,
   evaluation, receipt, release-plan, and investor-demo contracts.
3. Fail closed on unknown formula bindings, ambiguous authority, invalid public
   effectors, or evidence-free release promotion.
4. Provide a SQLite-backed, locally append-guarded hash-chain ledger and a
   loopback-only, bearer-authenticated recommendation service. Evaluation emits
   a decision and deterministic local receipt in one transaction; human
   dispositions append a second receipt
   without enabling execution. The service never executes an external action.
5. Exercise positive, denial, tamper, restart, recovery, release-gate, and
   deterministic-build paths with standard-library tests.

## Success criteria

- Seven manifests validate and compile twice to the same tree digest.
- Every formula binding resolves; every formula has `grants_authority=false`.
- Killinchu has no physical-effector capability and prohibited requests deny.
- Ledger events survive restart, and internally inconsistent records or missing
  append guards are detected while they remain observable. Completeness against
  a database writer who rewrites history and restores guards is not claimed.
- ENFORCE evaluation atomically records the decision and initial receipt, bound
  to the exact canonical request and admitted source digest. Receipt retrieval
  rejects absent or mismatched decision parents and divergent human inheritance.
  Receipt and raw-event retrieval require the local bearer token;
  human disposition is append-only, idempotent, and conflict-safe.
- Every operational release state, including `PRODUCTION_READY`, is blocked by
  the local gate. Admission requires a separate verifier with receipt bytes,
  authorized signer keys, and independent witness provenance.
- The HTTP service binds to loopback by default and exposes separate liveness,
  local readiness, and production-readiness states.

## Baseline evidence

- Protected base refreshed on 2026-10-03: `f2f8df6f89056e9104587674ccec0855dd5b177a`.
- Branch: `packet6/vertical-cells-fail-closed-20260829`.
- Node: `v24.19.0`; current repository package manager: `pnpm@10.26.1`.
- Earlier pre-edit `pnpm typecheck` did not reach TypeScript. The first attempt lacked
  Node on the child-process PATH; the corrected attempt stopped on pnpm's
  ignored-build-script policy. No build scripts were approved, and the
  pnpm-generated root workspace edit was removed before source work began.
- On 2026-10-03 the offline cached Corepack launcher enumerated the workspace
  but Turbo could not resolve a pnpm binary. That attempt did not reach
  TypeScript either; it is not a passing typecheck.
- Adding the existing Corepack shim directory to the process PATH allowed a
  fresh root typecheck to run: 30 tasks succeeded, but the run failed because
  `packages/evidence-doctrine` requested uncached `pnpm@11.9.0` while
  `COREPACK_ENABLE_NETWORK=0`. Whole-workspace typecheck remains BLOCKED; no
  dependency installation, package-manager pin edit, or build-script approval
  was performed to change that result.
- No UI surface or existing route is modified, so screenshot and `qa:routes`
  requirements are not applicable to this scoped source package.

## Evidence boundary

Passing local tests establishes local source behavior only. A protected draft
PR, hosted exact-head checks, review, merge, provider release, and externally
witnessed runtime remain separate states.

The original Packet 6 declaration is not a receipt for this successor: none of
its seven source-manifest or 78 compiled-file hash declarations match this
reconstructed implementation. The captured profile identity is preserved, but
byte equivalence to the original packet is not claimed. The original Killinchu
12-route public surface is not implemented or independently witnessed here.

Publication remains BLOCKED until the estate sole writer releases this exact
repo/branch/path lane. No broader remote mutation, protected merge, deployment,
or provider publication is authorized by this workcell.

## Local qualification, 2026-10-03

Evidence class: MEASURED, local source and SAMPLE execution only.

- Runtime pytest: 76 passed, 62 subtests passed after the final service changes.
- Factory pytest: 21 passed, including canonical-byte checks for the checked-in
  contract records. Standard-library unittest passed the original 20 factory tests;
  the added canonical-byte test also passed independently after formatting.
- Ruff check and format check: clean, 31 Python files.
- Full captured-form auditor: PASS with zero issues, zero network calls and
  zero provider mutations. Supplied profile bytes were unchanged at readback.
- Standalone compiler CLI: seven source files and 78 compiled files. Source
  tree SHA-256 is `c157bb7296fb8d35e390505bc5cbb8c7ed390a56dc4f5f872b1ac2124610a79e`;
  compiled tree SHA-256 is `54ee0842c912acde94a39b0f17af594691d8476737c8f10fb2f6d1418a128a95`.
- SAMPLE CLI evaluation and ledger verification: REQUIRE_APPROVAL,
  `execution_permitted=false`, two chain-consistent decision/receipt events.
- Independent local fault probes repeated request substitution, orphan receipt
  GET, duplicate evidence, a real first SQL insert followed by second-insert
  failure, retry/replay, and `#`/`%23` ledger filenames. All rejected or rolled
  back as expected without unintended byte/event/directory changes. The final
  fault returns HTTP 503 `PERSISTENCE_UNAVAILABLE`; healthy retry/replay returns
  HTTP 200 with the same two-event pair. This code review is not an independent
  external runtime witness.

The tests used installed Python 3.12.10. Runtime tests were invoked with the
following isolated source paths and disabled external pytest plugin autoload:

```powershell
$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD = "1"
& 'C:/Users/steph/AppData/Local/Programs/Python/Python312/python.exe' -I -B -c "import sys; sys.path[:0]=['packages/vertical-runtime','packages/vertical-runtime/tests','apps/vertical-cells']; import pytest; raise SystemExit(pytest.main(['-p','no:cacheprovider','-q','packages/vertical-runtime/tests']))"
```

Captured CLI commands ran from the repository root with
`PYTHONPATH=apps/vertical-cells;packages/vertical-runtime;packages/vertical-runtime/tests`:

```powershell
& 'C:/Users/steph/AppData/Local/Programs/Python/Python312/python.exe' -B apps/vertical-cells/tools/szl_estate_vertical_auditor_v6.py --profile ../packet6/szl_estate_vertical_factory_profile_v6.json --compiler apps/vertical-cells/tools/szl_vertical_cell_compiler_v6.py --out ../packet6-qualification-20261003/audit
& 'C:/Users/steph/AppData/Local/Programs/Python/Python312/python.exe' -B apps/vertical-cells/tools/szl_vertical_cell_compiler_v6.py --profile ../packet6/szl_estate_vertical_factory_profile_v6.json --vertical-dir ../packet6-qualification-20261003/source --out ../packet6-qualification-20261003/compiled --clean
& 'C:/Users/steph/AppData/Local/Programs/Python/Python312/python.exe' -B -m szl_vertical_runtime evaluate lyte-services packages/vertical-runtime/examples/lyte-request.json --ledger ../packet6-qualification-20261003/sample-ledger.sqlite3
& 'C:/Users/steph/AppData/Local/Programs/Python/Python312/python.exe' -B -m szl_vertical_runtime verify-ledger --ledger ../packet6-qualification-20261003/sample-ledger.sqlite3
```

After the earlier protected-main refresh, final GitHub branch/PR API readback
returned HTTP 403 `API rate limit exceeded` at 07:19 UTC. Current protected head
and queue state are therefore UNKNOWN, not re-certified by the earlier read.
Publication stays BLOCKED pending a fresh compare-and-swap/state check and the
sole-writer lane release. Root typecheck also remains BLOCKED as described
above. No hosted CI, remote PR, merge, deployment, or provider write was run.
