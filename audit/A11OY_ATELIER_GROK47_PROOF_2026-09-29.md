# A11oy Atelier Grok 4.7 and Turn Capsule proof

- workcell_id: `ATELIER-GROK47-2026-09-29`
- agent: Codex / BuildWarden / PixelProof / ProofSmith
- source_revision: `c09107164fcddaededcdff76bd744702f0b93da0`
- inspected protected-main baseline: `f3e0f3ffe7614956d626b40903f50b35080c1614`
- proof_level: **4 — local source, tests, live UI, claim/security boundary**
- recorded_at: `2026-09-29T21:19:41Z`
- recorded_by: Codex

## Objective and plan

Complete the original SZL-owned Atelier workbench with encrypted single-host
Turn Capsule continuity, reload-safe retry identity, and Grok 4.7 setup. Preserve
the four reasoning controls and deterministic capability gate. Integrate the
current protected security baseline, verify the provider/API/UI/CLI boundaries,
capture the running UI at a recorded source revision, and deliver through a
protected PR. Provider inference, provider publication, and deployment require
their own evidence.

The 4.7 migration plan was recorded in the session before editing: update the
provider resolver, environment example, and setup docs; allow only 4.7 and the
explicit 4.6 rollback; validate caller overrides before provider work; exclude
encrypted provider reasoning from displayed answers and text capsules; run
meaningful contract tests and typechecks; then capture and package the result.

## Patch

The branch adds a tenant/session-scoped reserve-stage-commit Turn Capsule flow,
idempotent replay, hash-linked capsule verification, encrypted local persistence,
logical retention/orphan cleanup, and fail-closed pending recovery. It adds the
local proxy API-hop credential bridge, CLI transport, and browser continuity
controls. The browser retains a prompt-free pending retry identity before a
provider call and requires the same request after reload.

The 4.7 delta centralizes `grok-4.7` as the API/CLI default with `grok-4.6` as the
only rollback target. It validates environment and request choices, respects
explicit request precedence during automatic provider selection, preserves
`reasoning.effort` and `store:false`, and accepts only final assistant output
text from a Responses output array. Provider reasoning ciphertext is discarded.
Known explicit provider authentication/access/quota/rate rejections release a
pending reservation; ambiguous failures retain its retry key.

The setup example, environment reference, application status, known gaps, and
canonical source counts reflect this behavior. The source validator measures
245 environment declarations under its existing alphabetic-name expression,
45 route source files, and 315 handler declarations; these are static counts.

## Verification commands and results

Commands used the existing local dependency installation and Node `v24.19.0`.
Local Vitest was `4.1.7`; the refreshed protected lockfile selects `4.1.11`.
This local run is not clean-install or protected-CI proof.

- `node node_modules/vitest/vitest.mjs run --config vitest.config.ts` in `packages/a11oy-atelier`: **exit 0; atelier_cases_executed=40; atelier_cases_expected=40**, across two source files. The final parser guard cleanup was included in the repeated run. This scoped contract suite covers four efforts, 4.7 default, 4.6 rollback, invalid model rejection with zero fetch/exec, automatic-provider precedence, final text extraction, ciphertext exclusion, and capsule behavior. This is not a platform-wide total.
- `node node_modules/vitest/vitest.mjs run --config vitest.config.ts --maxWorkers 1 --no-file-parallelism` in `apps/alloy-runtime-api`: **exit 0, 71/71** tests in 12 files. Covers API receipt/reservation, encrypted store, retention, restart, tenant isolation, and known versus ambiguous provider failures.
- `node node_modules/typescript/bin/tsc -p packages/a11oy-atelier/tsconfig.json --noEmit`: **exit 0** before and after the migration.
- The same TypeScript command for `apps/alloy-runtime-api`, `artifacts/a11oy`, and `packages/a11oy-cli`: **exit 0** sequentially. Package and API checks were repeated after the automatic-provider precedence repair.
- `node node_modules/vite/bin/vite.js build --config vite.config.ts` in `artifacts/a11oy`: **exit 0**, 3,343 modules transformed, production bundle built.
- `node --test test/series-a-contract.test.mjs test/atelier-session-continuity-contract.test.mjs ../../scripts/qa/series-a-proof-helpers.test.mjs` in `artifacts/a11oy`: **exit 0, 20/20**, no skipped tests, independently rerun at the recorded source revision.
- `node --test src/index.test.mjs` in `packages/shared-proxy`: **exit 0, 51/51**, independently rerun at the recorded source revision.
- `node --experimental-strip-types --test src/*.test.mjs` in `packages/a11oy-cli`: **exit 0, 5/5**, independently rerun at the recorded source revision.
- `node scripts/docs/check-docs-claims.js`: **exit 0, 26/26** claims.
- `node scripts/audit/validate-source-of-truth.js`: **exit 0, 66/66** checks after the measured environment count was refreshed. The first run correctly rejected the old 244 count.
- `node node_modules/tsx/dist/cli.mjs scripts/check-env-coverage.ts --strict`: **exit 0**, three configured artifact coverage checks passed.
- Normal pre-commit Biome formatting/lint and Oxlint passed. Two newly reported optional-chain warnings were fixed in the signed successor; its hook was clean.
- `git diff --check` and staged whitespace checks: **exit 0**. The unrelated workspace line-ending delta was preserved and excluded.

Repository-wide typecheck/test success is not claimed. Protected PR checks and
fresh dependency installation remain distinct gates.

## Runtime and screen evidence

The local launch receipt records source
`c09107164fcddaededcdff76bd744702f0b93da0`, model `grok-4.7`, and startup at
`2026-09-29T21:00:34.5572920Z`. The loopback shared route and health route returned
HTTP 200. Health reported `ENCRYPTED_LOCAL_DURABLE`, `ENCRYPTED_AT_REST`, and a
24-hour logical retention window. Both provider labels identified 4.7; direct
xAI was unavailable because no API key was configured.

The live screenshot is
[`a11oy-atelier-2026-09-29.jpg`](../docs/assets/screenshots/current/a11oy-atelier-2026-09-29.jpg).
Its route, command, viewport, timestamp, source revision, and SHA-256 are retained
in the [catalog](screenshot-catalog.md) and
[metadata sidecar](a11oy-atelier-2026-09-29.screenshot.json). The capture command
exited 0. Visual inspection confirmed the stable loaded workbench, 4.7 labels,
encrypted continuity, revised retry privacy copy, composer, reasoning selector,
and policy-denial rail. The initial bundled-browser attempt failed because its
matching browser executable was absent; the successful capture used installed
Microsoft Edge. No image editing or synthetic capture was used.

## Grok client and actual inference boundary

The local Grok Build client was upgraded through its stable updater from
`1.0.41` to `1.0.44 (5b807183dd79)`. Windows Authenticode verification returned
**Valid**. Saved default and secondary model preferences were changed to 4.7.
`grok models` returned an authenticated Grok account and default `grok-4.7`.

One bounded CLI canary requested `grok-4.7`, low effort, one turn, tools/web
search/subagents denied, and a short fixed reply. It exited **1**, with the
provider recording `model_id=grok-4.7` and **HTTP 402: Grok Build usage balance
exhausted** at `2026-09-29T20:48:25Z`. No successful 4.7 answer or committed live
capsule is established. Configuration health and a model listing do not remove
this gate. No provider credits were purchased and no credentials were disclosed.

## Public claims, security, and known gaps

Application status remains **Partial**. The workbench is an original SZL product
with explicit third-party inference attribution. No owned Grok weights,
production use, independent approval, distributed lock, durable external ledger,
or deployment is asserted. Native encrypted-provider-reasoning continuity is
not implemented in the text capsule.

Provider keys remain server-side. The local proxy bridge is explicit and
loopback-only; DPAPI-protected local runtime keys were reused without printing
or committing them. The API listener itself remains broader than loopback and
requires its configured API key. The source change contains no real credential
or `.env` file. Protected scanning remains a release gate.

`docs/operations/known-gaps.md` and `docs/APP_STATUS.md` retain the current 402
gate and continuity/runtime limits. Production identity, distributed state,
external-ledger durability, a successful direct API witness, protected PR CI,
and a source-bound deployed Atelier runtime remain open proof layers.

The canonical Python/Hugging Face product path is separately owned by
`szl-holdings/a11oy` and its governed publisher to `SZLHOLDINGS/a11oy`. Platform
files must not be published over the unrelated read-only `szl-atelier` Space.
