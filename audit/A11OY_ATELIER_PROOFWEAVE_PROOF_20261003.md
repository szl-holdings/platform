# A11oy Atelier Proofweave compile-only proof

- workcell_id: `A11OY-ATELIER-PROOFWEAVE-20261003`
- agent: Codex / Pathfinder / WorkGraphWeaver / ForgeMind / BuildWarden / PixelProof / ClaimGuard / SecretHawk / ProofSmith
- objective: Build an original A11oy compile-only research-to-plan surface informed by public workflow-builder patterns while preserving A11oy doctrine, provenance, licensing, authorization, and evidence boundaries.
- source_revision: `5341c52477317680991adf958b635d33f3a876b8`
- protected-main baseline: `f2f8df6f89056e9104587674ccec0855dd5b177a`
- branch: `feat/a11oy-atelier-proofweave-release-20261003`
- proof_level: **4 — local source, focused tests, exact-source live UI, claim and security review**
- recorded_at: `2026-10-03T12:39:33.7455277Z`
- recorded_by: Codex

## Plan summary

The recorded workcell plan scoped five deterministic compile stages —
`PATTERN -> CUT -> STITCH -> FITTING -> LABEL` — and five doctrine roles:
Pathfinder, WorkGraphWeaver, ForgeMind, MirrorEval, and ProofSmith. The success
criteria required one strict request/response contract shared by API, CLI, and
UI; canonical request-bound digests; a separate evidence-ledger append; no
provider, source, tool, subagent, or plan execution; no durable plan storage;
strict source and license declarations; responsive live UI evidence; and a
proof packet that does not collapse source, test, runtime, deployment, or
independent witness into one claim.

Public xAI material was treated as prior art, not as source code or product
copy. The implementation is original A11oy code and language. Adapted-code
materials require HTTPS, a full 40-character revision, and a permissive license;
AGPL, custom, unlicensed, or incomplete declarations fail closed. See the
[license boundary](../docs/A11OY_ATELIER_LICENSE_BOUNDARY.md) and the cited
sources in the [Proofweave design note](../docs/A11OY_ATELIER_PROOFWEAVE.md).

## Patch summary

The release branch was cut directly from the recorded protected-main baseline
after a scope audit found that a development merge's pre-commit formatter had
touched unrelated incoming files. Thirty-one unrelated formatting paths were
excluded. Four continuity-state paths were retained as required integration
work because the intended Atelier contract standardizes local meter output as
`MEASURED`. The estate-contract manifest was regenerated after the
OpenAPI source changed. The resulting source patch spans 42 relevant paths.

The patch adds:

- a strict Proofweave contract, canonical serializer, deterministic compiler,
  and request-bound response verifier;
- bounded claims and materials, explicit license/revision requirements, five
  fixed stages, limitation ordering, policy digest, and plan digest;
- a fail-closed authenticated API route at
  `POST /api/a11oy/v1/atelier/proofweave/compile` with `no-store`, tenant
  attribution, policy checks, and mandatory evidence-ledger append before 200;
- CLI `weave` support that validates locally before transport and verifies the
  entire response before rendering any result or ledger identifier;
- an A11oy Atelier UI workbench using the shared verifier, with production
  browser actions visibly **BLOCKED** and a loopback-only development path;
- an OpenAPI 3.1 contract, generated catalogue update, release-manifest refresh,
  documentation, known-gaps entries, and responsive screenshot evidence.

The compiler output is **SIMULATED**. Its lifecycle is
`COMPILED_NOT_EXECUTED` and `IN_PROCESS_NOT_STORED`. Compilation does not fetch
sources, call a provider, invoke tools or subagents, execute a plan, authorize
an action, or durably store the compiled plan.

## Verification commands and results

All passing results below were rerun against source revision
`5341c52477317680991adf958b635d33f3a876b8` unless a command is explicitly
described as an earlier setup attempt.

| Command | Result |
|---|---|
| `node ../../node_modules/vitest/vitest.mjs run --config vitest.config.ts` from `packages/a11oy-atelier` | **MEASURED — exit 0; 4 files, 58/58 tests passed.** |
| `node ../../node_modules/vitest/vitest.mjs run src/routes/v1/atelier.test.ts src/atelier-continuity-store.test.ts --maxWorkers 1 --no-file-parallelism` from `apps/alloy-runtime-api` | **MEASURED — exit 0; 2 files, 40/40 tests passed.** |
| `corepack pnpm --dir packages/a11oy-cli test` | **MEASURED — exit 0; 12/12 tests passed.** Includes the terminal-injection rejection case for ledger entry IDs and a live-loopback assertion that a full-contract validation failure makes zero HTTP requests. |
| `corepack pnpm --dir artifacts/a11oy test` | **MEASURED — exit 0; 29/29 Node contract tests and 5/5 Vitest UI tests passed.** Vitest printed its known close-timeout warning after successful completion; the command exited 0. |
| `node --test lib/api-spec/scripts/codegen.test.mjs` | **MEASURED — exit 0; 3/3 tests passed.** |
| `node --test packages/estate-contract-release/src/build.test.mjs` | **MEASURED — exit 0; 13/13 tests passed.** |
| `node ../../node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` from `packages/a11oy-atelier` and `packages/a11oy-cli` | **MEASURED — exit 0 for both packages.** |
| `corepack pnpm --dir artifacts/a11oy typecheck` | **MEASURED — exit 0.** |
| `node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext --types node apps/alloy-runtime-api/src/middleware/auth.ts apps/alloy-runtime-api/src/routes/v1/atelier.ts` | **MEASURED — exit 0.** This is the changed API route plus its request-augmentation boundary, not a whole API-project claim. |
| `corepack pnpm --dir artifacts/a11oy build` | **MEASURED — exit 0; Vite 8.0.16 transformed 3,358 modules.** |
| `node scripts/docs/generate-api-catalogue.js --check` | **MEASURED — exit 0.** |
| direct YAML parse/count of `lib/api-spec/openapi.yaml` | **MEASURED — OpenAPI 3.1.0, 4,090 paths, 5,066 operations, Proofweave path present.** |
| `node scripts/docs/check-docs-claims.js` | **MEASURED — exit 0; 24/24 active claims passed.** The two access-control checks remained explicitly skipped because their optional file was absent. |
| `node packages/estate-contract-release/src/build.mjs --check` | **MEASURED — exit 0; release `sha256:858b209c12216967068a083a1b357d218a93dad2354da48ea0cb10c71b4b8dcf`, six components.** |
| `corepack pnpm install --lockfile-only --offline --ignore-scripts --frozen-lockfile` | **MEASURED — exit 0 across 203 workspace projects.** This verifies lockfile consistency only; it is not a clean dependency installation. |
| `node node_modules/tsx/dist/cli.mjs scripts/brand-check.ts` | **MEASURED — exit 0.** |
| `node node_modules/tsx/dist/cli.mjs scripts/check-banned-brand-strings.ts --changed-from f2f8df6f89056e9104587674ccec0855dd5b177a` | **MEASURED — exit 0; 22 changed files scanned, no new violations beyond the audit baseline.** |
| focused Biome check of the changed runtime, CLI, UI, and manifest sources | **MEASURED — exit 0 after import-order normalization.** |
| high-confidence credential-pattern scan of 44 materialized changed/evidence text paths and the one changed sparse Git object, plus manual classification of the one `xai-` prefix candidate | **MEASURED — exit 0; all 45 logical text paths were covered and no credential candidate remained.** The single prefix candidate was the cited public xAI Frontier Framework PDF URL. |
| `git diff --check`, `git diff origin/main...HEAD --check`, and unmerged-path query | **MEASURED — exit 0; no whitespace errors or unmerged paths.** |

Focused test total: **160 passed** across the six listed test commands. This is
not a repository-wide test total.

## Explicit failed or unavailable checks

- The first package-script attempts for the core and API Vitest suites exited 1
  because those sparse package directories did not expose a local `vitest`
  executable. The same suites passed through the repository-resolved Vitest
  binary, as recorded above.
- The full `apps/alloy-runtime-api` project typecheck exited 1 in this sparse
  checkout because unrelated Observability and Ouroboros source/dependency
  directories were not fully materialized. The changed route and its auth type
  augmentation compiled with strict settings and the runtime tests passed.
  Whole-project API typecheck status is **UNAVAILABLE** from this local sparse
  harness, not green.
- A full materialized banned-brand scan exited 1 on 42 existing `TENAX`
  occurrences in files unchanged from `origin/main`. None of the reported paths
  is in this branch diff. The repository-wide banned-string gate is therefore
  **BLOCKED** on existing baseline drift; this packet does not relabel it green
  or expand this feature into an unrelated brand migration.
- An earlier capture attempt on predecessor source `c4a5301` omitted the
  required exact run identity and exited 1 before browser capture. The final
  source command below exited 0 with two verified captures and zero failures.
- One final-source brand-check setup attempt addressed an internal pnpm package
  path that was not materialized and exited 1 with `MODULE_NOT_FOUND`. The
  repository-resolved command listed above then exited 0. No source or
  evidence file changed between those invocations.
- A file-system-only relative-link probe over the entire historical screenshot
  catalogue reported one absent sparse-checkout path,
  `audit/frontier/VERTICAL_RUNTIME_CONTRACT_PROOF_2026-07-31.md`. `git ls-tree`
  and `git cat-file -e` confirmed that exact file remains tracked in the
  protected-main baseline. Every link in this Proofweave packet and both new
  catalogue links resolved from the working tree.

## Runtime and screenshot evidence

The final exact-source sequence was run in PowerShell, with the preview kept
live while the capture process ran:

```powershell
corepack pnpm --dir artifacts/a11oy build
corepack pnpm --dir artifacts/a11oy exec vite preview --host 127.0.0.1 --port 4110 --strictPort
$env:SOURCE_REVISION = '5341c52477317680991adf958b635d33f3a876b8'
$env:SCREENSHOT_PLAN = '.verification/a11oy-atelier-proofweave-capture-plan.json'
$env:SCREENSHOT_BASE_URL = 'http://127.0.0.1:4110'
$env:SCREENSHOT_OUTPUT_DIR = '.verification/a11oy-atelier-proofweave-screenshot-proof-5341c52'
$env:CAPTURE_ENVIRONMENT = 'local-exact-head'
$env:CAPTURED_BY = 'Codex / PixelProof'
$env:RUN_IDENTITY = 'corepack pnpm --dir artifacts/a11oy build; corepack pnpm --dir artifacts/a11oy exec vite preview --host 127.0.0.1 --port 4110 --strictPort; SOURCE_REVISION=5341c52477317680991adf958b635d33f3a876b8 SCREENSHOT_PLAN=.verification/a11oy-atelier-proofweave-capture-plan.json SCREENSHOT_BASE_URL=http://127.0.0.1:4110 SCREENSHOT_OUTPUT_DIR=.verification/a11oy-atelier-proofweave-screenshot-proof-5341c52 CAPTURE_ENVIRONMENT=local-exact-head CAPTURED_BY="Codex / PixelProof" node scripts/qa/capture-screenshot-proof.mjs'
node scripts/qa/capture-screenshot-proof.mjs
```

The capture command returned `VERIFIED`, two captures, and zero failures.
Chromium was `148.0.7778.96`; Playwright was `1.60.0`; Node was `v24.19.0`.
Both responses were HTTP 200 and both layouts reported one `main`, one `h1`, no
horizontal overflow, no clipped or overflowing text, no unnamed or undersized
controls, no console/page/request failures, no bad responses, no undeclared
requests, and no local-link failures.

- [Desktop 1440 x 1164 viewport; 1440 x 1706 full page](../docs/assets/screenshots/current/a11oy-atelier-proofweave-2026-10-03-1440x1164.png) — SHA-256 `b222810bcaad94df4f994143d59d8017047f38ffc5498b5cc7a3ea02f7873e75`
- [Mobile 390 x 900 viewport; 390 x 2650 full page](../docs/assets/screenshots/current/a11oy-atelier-proofweave-2026-10-03-390x900.png) — SHA-256 `c6431c9c9864643e8dd478f8305245011e889eb60daf0f6c94bf8e6e73839237`
- [Source-bound metadata sidecar](a11oy-atelier-proofweave-2026-10-03.screenshot.json)
- [Screenshot catalogue entry](screenshot-catalog.md)

Recomputed file hashes match the sidecar. Visual review confirms the five-stage
Proofweave workbench, responsive mobile layout, visible `BLOCKED · RUNTIME
UNKNOWN` disclosure, compiler-health boundary, and separate existing Atelier
controls. The desktop viewport ends at the exact bottom of both the final
visible `Ecosystem Roadmap` link and the complete `COMMAND FABRIC` navigation
group; independent geometry checks found no partially clipped link, group
heading, or group at that boundary. No image editing or generated mockup was
used.

## Verification notes

- The canonical verifier rebuilds the expected plan from the submitted request,
  recomputes the policy and plan digests, binds the tenant, requires exact stage
  order and limitations, and rejects extra or reordered output.
- Ledger entry IDs must match `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`; newline,
  carriage-return, tab, spaces, Unicode, empty, and oversized identifiers are
  rejected before CLI rendering.
- The API uses the existing `X-Api-Key` production guard, rejects missing
  production key configuration, derives tenant attribution from the request,
  and returns 503 when ledger append fails. Tenant attribution is **DECLARED**,
  not authenticated identity.
- Material URLs are declarations only. Proofweave does not fetch them, so they
  cannot create an SSRF path in this compiler.
- Two separate read-only security reviews found no actionable branch-owned
  blocker in authentication, request binding, injection resistance, execution
  boundaries, SSRF behavior, or fail-closed handling. Those reviews are local
  review evidence, not an independent production witness.

## Public claim check

The UI and documentation describe an active prototype and compile-only path.
They do not claim owned Grok weights, model training, leaderboard rank,
autonomy, production use, customer deployment, certification, human approval,
or successful provider inference. Public xAI and Grok references remain
third-party attribution and prior art. A source listing, local test, compiled
bundle, or HTTP 200 is not represented as a deployment or proof of provider
runtime.

## Security check

Provider secrets remain server-side. The production browser path is disabled
without an authenticated server-side session or BFF. The development bridge is
loopback-only and does not expose an API key to browser code. Strict schemas
bound string lengths, identifiers, enums, counts, budgets, materials, and
additional properties. The model/compiler can propose only; A11oy policy and
the kernel remain the decision boundary. No credential or `.env` file is part
of the branch diff.

## Known gaps update

`docs/operations/known-gaps.md` records the remaining boundaries:

- production browser action path: **BLOCKED**;
- compiler/provider runtime: **UNKNOWN**;
- compiled-plan durable storage: `IN_PROCESS_NOT_STORED`;
- evidence-ledger durability: **UNKNOWN**;
- tenant attribution: **DECLARED**;
- deployment, publication, protected CI, and independent replay/witness:
  **UNKNOWN**;
- plan output: **SIMULATED** and `COMPILED_NOT_EXECUTED`.

## Limitations and nonclaims

This packet establishes local source behavior, focused tests, deterministic
contract generation, local bundle generation, and exact-source local UI layout
at the declared revision. It does not establish provider execution, source
truth of user-supplied materials, durable production persistence, production
authorization, deployment, publication, protected-branch acceptance, model
quality, scientific validity, or an independent witness. Those layers require
separate receipts.
