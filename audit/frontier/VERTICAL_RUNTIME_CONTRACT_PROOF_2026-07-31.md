# Vertical runtime-contract proof packet

- `workcell_id`: `VERTICAL-RUNTIME-CONTRACTS-2026-07-31`
- `agent`: `Codex`
- `objective`: replace the live Vessels and Insurance HTML/404 conformance
  gaps with exact-SHA, fail-closed `/version` and `/evidence` runtime contracts
  without manufacturing portable DSSE evidence.
- `plan_summary`:
  1. refresh exact repository, PR, and deployment state;
  2. add canonical runtime contracts to Killinchu and David Leads;
  3. keep portable conformance receipts empty until genuine cross-repository
     DSSE material exists;
  4. validate each repository's complete configured safety gate;
  5. merge through normal protected pull requests;
  6. verify exact-main deployments and rerun the Platform frontier probe.
- `patch_summary`:
  - Killinchu registers JSON `/version` and `/evidence` ahead of the SPA
    fallback, captures only an exact 40-hex `SZL_GIT_SHA`, supports GET/HEAD
    parity, and reports `PARTIAL` with `receipts: []`;
  - David Leads validates its allowlisted deployment SHA inputs, adds the same
    fail-closed root contracts, distinguishes public application-receipt count
    from portable conformance receipts, and applies no-store caching to runtime
    truth routes;
  - neither target claims Khipu-chain, denial-receipt, OTel GenAI,
    offline-verifier, or product-registration success.
- `test_results`:
  - Killinchu focused route suite:
    `python -m pytest tests/test_public_route_repair.py -q`, exit `0`,
    `24/24` passed plus `62` subtests;
  - Killinchu route, static-brand, and assembled-app guard suite:
    `python -m pytest tests/test_public_route_repair.py tests/test_static_brand_assets.py tests/test_research_sources_guard.py -q`,
    exit `0`, `41/41` passed plus `62` subtests;
  - David compile:
    `python -m compileall -q app ops`, exit `0`;
  - David configured CI command:
    `python -m unittest discover -s tests -t . -p "test_*.py" -v`,
    exit `0`, `126/126` passed;
  - Killinchu PR #301 checks: all reported checks terminal green before merge;
    signed head `169df3b39209fe751405c6295a0ec4da7b3551d8`;
  - Killinchu protected squash merge:
    `3af652dbc326e653e4c02c0a879d25188e8bdf6a`, GitHub signature
    `verified=true`, exact-main workflows `17/17` successful;
  - Killinchu governed deployment run:
    <https://github.com/szl-holdings/killinchu/actions/runs/30594130250>,
    exit state `success`; source binding, runtime-byte attestation, smoke
    routes, GitHub OIDC attestation, release-receipt publication, and restarted
    runtime verification passed;
  - live Killinchu readback: `/version.gitSha`
    `3af652dbc326e653e4c02c0a879d25188e8bdf6a`,
    `/evidence.evidenceState=PARTIAL`, `/evidence.receipts=[]`, and
    `/api/build-info.receipt_minted=true`; GitHub attestation `38075818`;
  - exact live Vessels conformance run: expected non-conformant exit `1`,
    `2/7` gates passed (`runtime-endpoints`, `readme-status`);
  - David PR #74 operational-safety check: exit `0`, `126/126` passed; signed
    head `01649ee00d921f3f9e589e538cb68e03b62cae91`;
  - David protected squash merge:
    `e34044cbb2b565ea77421c4ec6dbef19a5d133dc`, GitHub signature
    `verified=true`; exact-main CI successful;
  - final read-only frontier preflight at `2026-07-31T00:46:21.287Z`: exit
    `0`, Vessels `CANDIDATE`, Insurance `NON_CONFORMANT`, Sentra `ABSENT`,
    overall verticals `0/3 VERIFIED`;
  - Platform default `pnpm typecheck` launcher attempt: exit `1` before
    compilation because bundled pnpm `11.9.0` refused to replace the pinned
    pnpm-10 modules directory without a TTY
    (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`); no product check result was
    inferred from this launcher failure;
  - Platform pinned-pnpm launcher attempt: exit `1` before compilation because
    the child process could not resolve `node` until the bundled Node directory
    was added to `PATH`; no product check result was inferred from this launcher
    failure;
  - Platform pinned `pnpm 10.26.1` typecheck with bundled Node on `PATH`: exit
    `0`, `182/182` Turbo tasks successful;
  - Platform `pnpm claims:validate`: exit `0`, canonical truth and allowlist
    coverage passed, `89/89` truth tests passed;
  - Platform `pnpm docs:claims-check`: exit `0`, `26/26` documentation claims
    verified;
  - Platform `pnpm audit:source-of-truth`: exit `0`, `66/66` source-of-truth
    checks passed;
  - an initial parallel wrapper around the preceding truth/security checks
    timed out at `60` seconds after emitting a clean scanner result, so that
    wrapper was not accepted as terminal evidence and every check was rerun
    separately;
  - Platform `node scripts/qa/scan-secrets.js .`: exit `0`, `CLEAN — no
    secrets found`.
- `screenshot_refs`: `N/A`; this change is runtime JSON, CI, and deployment
  evidence rather than a visual surface.
- `verification_notes`: an empty `receipts` array is deliberate negative
  evidence. It makes the endpoint machine-readable while preserving failure of
  Khipu-chain, denial, OTel, and offline-verification gates.
- `public_claim_check`: Vessels is described only as a runtime candidate and
  `2/7`; Insurance is described only as source-merged and deployment-blocked;
  no `3/3`, npm publication, DOI, hardware-attestation, or hosted-observability
  claim is made.
- `security_check`: no credential, token, private key, environment value,
  branch rule, required reviewer, or protected deployment approval was added,
  removed, exposed, or bypassed.
- `known_gaps_update`: revision 22 records one live runtime-gate advance and
  preserves every absent cryptographic, telemetry, registration, and
  account-controlled gate.
- `proof_level`: `4` (`Full Proof`), with screenshot evidence not applicable
  and the David deployment explicitly incomplete.
- `recorded_at`: `2026-07-30T20:46:21-04:00`
- `recorded_by`: `Codex`
