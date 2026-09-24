# P0 Series A product upgrade — 2026-09-24 evidence packet

## Record and disposition

| Field | Recorded value |
| --- | --- |
| Workcell | `P0-SERIES-A-PRODUCT-WIRING-20260811` |
| Canonical task | [P0_SERIES_A_PRODUCT_WIRING_20260811.md](../.codex/tasks/P0_SERIES_A_PRODUCT_WIRING_20260811.md) |
| Agent / recorded by | Codex desktop agent for Stephen Lutar |
| Recorded at | `2026-09-24T08:20:47-04:00` |
| Packet state | **IN PROGRESS — scoped qualification passed; exact-source capture and publication PENDING** |
| Evidence authority | Local source and browser evidence only; non-authoritative for hosted promotion |
| Proof level | Level 4 required for the public-facing changes; not yet established for the final candidate |

This record continues the existing task and branch. Fresh scoped checks passed
after the pinned dependency installation; aggregate qualification, final-source
browser evidence, and publication remain pending. It does not declare the
product fully operational or a push successful. Final receipts belong in the
completion table before this packet is presented as completed proof.

## Objective, scope, and execution plan

Make the thread's A11oy product-wiring implementation durable on the existing
`codex/p0-platform-work-20260811` branch: preserve current protected source,
complete the qualified product journey and fixture interfaces, verify the
changed behavior, capture exact-source presentation evidence, and publish by
normal push. If publication is unavailable, provide a complete binary-safe
patch with its exact base, resulting tree, digest, commands, and outcomes.

The scoped implementation covers A11oy route wiring, shared presentation and
mobile navigation, deterministic Workcell availability fields and seed data,
the modified demo/proof/governance/trust/architecture/resource surfaces, route
inventories, and the product-specific browser evidence tools. The execution
sequence is protected-source reconciliation, scoped fixes, fresh qualification,
source freeze, exact-source capture and visual review, durable proof, then
normal branch publication with remote readback. This is a record of the active
execution contract, not authorization for additional estate-wide changes.

No new PR, PR reopening, PR merge, deployment, force-push, protection bypass,
credential introduction, or weakening of claims or security gates is included.

## Source and publication identity

| Identity | Value / disposition |
| --- | --- |
| Repository | `szl-holdings/platform` |
| Existing publication branch | `codex/p0-platform-work-20260811` |
| Existing PR | [#601](https://github.com/szl-holdings/platform/pull/601), observed CLOSED and draft; not reopened by this task |
| Remote branch head observed September 24 | `4c26025098553390f23fd1273638d8e0c33b2114` |
| Current protected source incorporated | `ff8e29514a6560e269a875027db240b580b05b25` |
| Signed normal integration merge | `d4c3c471684b09d5c975c00cdb55d054f9e7d7c5` |
| Final implementation source commit | **PENDING — current source freeze** |
| Final implementation source tree | **PENDING — exact `HEAD^{tree}` at capture** |
| Final evidence/publication commit and tree | **PENDING — qualification, capture, and evidence completion** |
| Remote publication readback | **PENDING — normal push and authoritative remote ref readback** |

The integration merge preserves history. The review confirmed that
`origin/main` resolves to the protected source above and is an ancestor of the
local integration HEAD. The PR and remote-branch observations were refreshed
September 24. Refresh the remote again before publication; a push does not
itself reopen a closed PR or establish exact-head hosted CI.

The previously reported `8243029` object was not recoverable in the earlier
task inspection. Its bytes and tests were not reproduced, so it is not restored
or relied upon as implementation evidence. Its disposition remains
**BLOCKED / SUPERSEDED BY REPRODUCIBLE CURRENT SOURCE**.

## Patch summary

Changes observed in the candidate diff include:

- Preserve `/a11oy/start` and `/a11oy/investor-demo` on the protected
  `SeriesAView`; add `/a11oy/series-a` as another alias and
  `/a11oy/product-journey` as the qualified investor/developer navigation path.
  Preserve the Atelier route, navigation entry, and GraphQL provider.
- Separate Workcell workflow progress from typed operational availability
  (`REAL`, `DEMO`, `UNAVAILABLE`, `DEGRADED`, `BLOCKED`, `ROADMAP`). Require an
  evidence explanation; keep the 20 seeded Workcells deterministic `DEMO`
  records rather than relabeling them live operations.
- Qualify demo, proof, governance, trust, replay, and fabric copy. Illustrative
  proof identifiers use fixture labels; the chain check says it is not
  computed. The demo completion state explicitly produces no policy
  evaluation, external execution, receipt, hash, or signature.
- Repair narrow-screen Proof Ledger headers, attestation fields, timeline
  cards, replay controls, identifiers, and evidence references. Wrap Workcell
  filters and replay-speed controls; remove truncation that hid fixture
  content. The additional Series A command styling wraps text without
  changing the protected command-source bytes.
- Use a native modal navigation dialog below the desktop breakpoint, with
  focus containment, an internal close button, Escape handling, background
  inertness, scroll restoration, and focus restoration. Preserve desktop
  navigation and minimum-sized interactive controls.
- Correct local replay pause/resume behavior so resuming does not reset
  progress, and align the speed labels with their step intervals. These
  controls advance fixture presentation only.
- Update page metadata and documentation to describe the active prototype;
  retain explicit operational non-claims and use system fonts.
- Add a product-specific exact-source build/capture wrapper and interaction
  verifier, while preserving the protected Series A capture wrapper. Bind
  the capture plan, verifier inputs, interaction receipt, image digests,
  browser/tool versions, and served-asset manifest to the source revision.
- Strengthen layout verification to detect overflow inside scrollable main
  containers and text-range overruns, not just document-level scroll width.
  A horizontal-scroll exemption requires an explicitly declared, named,
  keyboard-accessible nested region and does not exempt outer clipping.
  Add browser regression fixtures for those conditions.
- Keep scroll-triggered capture bounded and require reveal/readback and
  restoration evidence. Bound the interaction suite with active owned-browser
  closure; write the final source-bound receipt only after successful cleanup
  and checkout verification.

These source observations are qualified by the command results below; final
exact-source browser evidence remains pending.

## Protected-source preservation and review

On the current candidate, the following comparison returned exit `0` with no
diff. It verifies preservation of the tracked protected Git content for the
named paths, not dependency bytes or a production deployment:

```powershell
git diff --exit-code origin/main -- .github pnpm-lock.yaml pnpm-workspace.yaml artifacts/a11oy/vite.config.ts artifacts/a11oy/src/pages/SeriesAView.tsx artifacts/a11oy/src/pages/A11oyAtelier.tsx artifacts/a11oy/src/data/seriesASolutions.ts artifacts/a11oy/src/graphql scripts/qa/capture-series-a-proof.mjs
git merge-base --is-ancestor origin/main HEAD
```

The ancestry check also returned exit `0`. App routing inspection confirmed
that the protected Series A routes and GraphQL/Atelier integration remain.
The root package change adds the product-proof command; the artifact package
adds product qualification commands without removing the protected tests.
The Biome configuration change enables parsing existing Tailwind directives;
it does not disable a lint rule or weaken a gate.

The read-only capture review identified startup cleanup gaps and an unbounded
interaction-suite risk. The candidate now reads/parses its plan before browser
launch, validates dependency manifests before creating its build directory,
and closes its owned browser on the ten-minute interaction deadline. Review
of those fixes found no remaining proven source-freeze blocker in the four
reviewed capture/verifier files. This review is not a claim of exhaustive
security review or successful final execution.

## Qualification ledger

All results in this ledger are fresh September 24 observations. The PATH
package manager was pnpm `11.19.0`, while the repository declares
`pnpm@10.26.1`. The cached pinned executable was used explicitly:

```powershell
$env:CI = 'true'
node C:/Users/steph/AppData/Local/npm-cache/_npx/fc0c0bfc49531a9a/node_modules/pnpm/bin/pnpm.cjs install --frozen-lockfile --ignore-scripts
```

Installation returned exit `0`: 203 workspace projects, 1,736 packages,
resolution skipped because the lockfile was up to date, and lifecycle scripts
intentionally not run. The first attempt without `CI=true` exited `1` with
`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; the successful retry is the
dependency basis for the scoped tests below. This proves a completed frozen
installation, not successful lifecycle scripts or a production deployment.

| Command / check | Current result | Boundary |
| --- | --- | --- |
| Pinned pnpm 10.26.1 installation above | **PASS — exit 0** | Frozen lockfile; scripts ignored; 203 projects / 1,736 packages |
| Aggregate workspace typecheck | **NOT QUALIFIED — both attempts exited 1** | First attempt selected the wrong child pnpm and refused noninteractive installation; pinned-PATH retry stopped after an unrelated nested package selected its own pnpm 11.9.0 and implicitly linked three dev dependencies. No aggregate pass claimed. Its generated untracked lockfile was retained under ignored `output/evidence-doctrine-generated-lock-20260924.yaml`; root manifests and lockfile were unchanged. |
| `node node_modules/vitest/vitest.mjs run` from `packages/a11oy-runtime` | **PASS — exit 0; 3 files / 37 tests** | Vitest 4.1.11; current pinned dependencies |
| `node node_modules/typescript/bin/tsc -p packages/a11oy-runtime/tsconfig.json --noEmit` | **PASS — exit 0** | No diagnostics |
| `node node_modules/typescript/bin/tsc -p lib/a11oy-fabric/tsconfig.json --noEmit` | **PASS — exit 0** | No diagnostics |
| `node --test artifacts/a11oy/test/series-a-contract.test.mjs artifacts/a11oy/test/product-wiring-contract.test.mjs scripts/qa/series-a-proof-helpers.test.mjs` | **PASS — exit 0; 23/23 tests** | Includes protected contracts, product wiring, and proof helpers; no failures or skips |
| `node node_modules/typescript/bin/tsc -p artifacts/a11oy/tsconfig.json --noEmit` | **PASS — exit 0** | No diagnostics |
| A11oy `lint:ci` | **PASS — exit 0; 192 files; 563 warnings / 74 infos** | Warning-bearing result, not a warning-free baseline |
| `node --test scripts/qa/screenshot-layout-helpers.test.mjs` | **PASS — exit 0; 9/9 Chromium tests** | Post-install regression run; no failures or skips |
| Product interaction suite inside exact-source wrapper | **PENDING** | Five widths; local fixture behavior, not an external execution witness |
| Diagnostic product interaction suite against loopback production preview | **PASS — exit 0, 155 states, Chromium 148.0.7778.96** | Includes 75 initial route/width states plus filters, detail links, replay pause/resume/reset, proof tabs, demo completion/reset, and mobile Escape, close-button, backdrop, resize, and navigation. Initial cold navigation timed out; unchanged checks passed on retry, then the expanded drawer suite passed. Final source-bound rerun remains required. |
| `node artifacts/a11oy/node_modules/vite/bin/vite.js build --config artifacts/a11oy/vite.config.ts --configLoader runner --outDir ../../output/a11oy-diagnostic-dist --logLevel error` | **PASS — exit 0** | Diagnostic production build; not the frozen-source wrapper receipt |
| Fresh production build inside exact-source wrapper | **PENDING** | Record immutable served-asset count and digest |
| `A11OY_URL=http://127.0.0.1:4417 node scripts/qa/smoke-routes.js --web-only --json` | **A11oy 21/21 PASS; overall exit 1** | Sixty routes for five stopped unrelated web services failed to connect. HTTP status checks do not establish rendered behavior. |
| `node node_modules/tsx/dist/cli.mjs scripts/brand-check.ts` | **PASS — exit 0** | No stdout |
| `node --experimental-vm-modules scripts/docs/check-docs-claims.js` | **PASS — exit 0; 26/26 checks** | Scoped documentation claims check |
| `node --experimental-vm-modules scripts/qa/verify-claims.js --strict` | **FAIL — exit 1** | Vessels/AIS requires absent `MARINETRAFFIC_API_KEY`; report: 90 working, 12 partial, 3 dormant, 1 mock, 0 broken |
| Pre-freeze diff, added-line credential/retired-name patterns, and environment-file checks | **PASS** | Diff check exit 0; zero matching added lines; zero changed environment files. Scoped pattern scan, not exhaustive secret detection. |
| Final signed-commit verification | **PENDING** | Verify the final commit, not only the prior integration merge |
| Normal push and remote exact-SHA readback | **PENDING** | Existing branch only; no force or merge |

The post-install results above supersede historical September 5 and
pre-install diagnostics as current scoped qualification. They apply to the
working candidate based on the signed integration merge; record the frozen
source commit separately and rerun checks affected by subsequent source edits.
The strict-claims failure is retained, not waived or converted to a pass.

## Screenshot disposition and exact-source reproduction

The earlier 70-image packet for
`8f3f8b530fb4c2748bf4b1d9b4367844cab87701` is **REJECTED / SUPERSEDED** as
completion evidence. Original-resolution inspection of its 320-pixel Proof
Ledger image found clipped chain-label, attestation, and timeline content,
despite the old verifier reporting success. The old detector treated ancestor
horizontal `auto` overflow as an exemption; a vertically scrolling main
container can acquire that computed horizontal overflow and hide the defect.
That packet must not be promoted or represented as the new candidate's proof.

The current candidate plan declares 15 routes at widths 320, 390, 768, 1366,
and 1728: 75 captures. The matrix includes the canonical `/a11oy/start`, product journey, Series A aliases,
Workcell registry/detail/replays, demo, proof, governance, trust, architecture,
resources, and fabric. **The new packet, visual inspection, durable screenshot
paths, and catalog entries remain PENDING.** Screenshot files will belong under
`docs/assets/screenshots/current/`, with matching entries in
[screenshot-catalog.md](screenshot-catalog.md) and source-bound sidecars.

Run this from the repository root only after committing the final source,
recording the fresh qualification results, and leaving a clean checkout. It
resolves the actual local executables and exact source identity; it does not
fetch, mutate a remote, read credentials, or claim a successful outcome merely
because the commands are documented here.

```powershell
$ErrorActionPreference = 'Stop'
$captureGit = (Get-Command git -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
$captureNode = (Get-Command node -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
$captureBranch = (& $captureGit symbolic-ref --quiet --short HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $captureBranch -ne 'codex/p0-platform-work-20260811') {
  throw 'Capture requires the existing task branch.'
}
$captureStatus = & $captureGit status --porcelain=v1
if ($LASTEXITCODE -ne 0 -or $captureStatus) {
  throw 'Commit the candidate and proof draft before exact-source capture.'
}
$env:SOURCE_REVISION = (& $captureGit rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve source revision.' }
$env:SOURCE_TREE_SHA = (& $captureGit rev-parse 'HEAD^{tree}').Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve source tree.' }
$env:SOURCE_REF = $captureBranch
$env:SOURCE_REPOSITORY = 'szl-holdings/platform'
$env:CAPTURE_ENVIRONMENT = 'local-exact-head'
$env:CAPTURED_BY = 'Codex desktop agent for Stephen Lutar'
$env:GIT_EXECUTABLE = $captureGit
$env:SCREENSHOT_PLAN = 'audit/series-a-screenshot-capture-plan.json'
$env:RUN_IDENTITY = 'PowerShell: node scripts/qa/capture-series-a-product-matrix-proof.mjs for source ' + $env:SOURCE_REVISION
$captureStamp = Get-Date -Format 'yyyyMMddTHHmmss'
$env:SCREENSHOT_OUTPUT_DIR = 'output/a11oy-product-matrix-' + $env:SOURCE_REVISION.Substring(0, 12) + '-' + $captureStamp
& $captureNode scripts/qa/capture-series-a-product-matrix-proof.mjs
$captureExitCode = $LASTEXITCODE
if ($captureExitCode -ne 0) { throw "Exact-source capture failed with exit code $captureExitCode." }
```

The wrapper builds into a fresh owned temporary directory, serves those assets
on its own loopback origin, runs the interaction verifier, captures the matrix,
checks source and asset stability, and closes/removes its owned resources. Its
`source-bound-metadata.json` binds `metadata.json`, `interactions.json`, image
SHA-256 values, and the served build manifest. A successful exit still requires
inspection of the actual images before promotion to the durable catalog.

If the later evidence-only commit differs from the captured source commit,
record both identities and prove that all source/build/capture inputs are
unchanged. Do not relabel a screenshot with a commit it did not capture.

## Operational, claims, and security boundary

The interface and its seeded workflow states remain `DEMO`. Missing
authenticated operational evidence remains `UNAVAILABLE`; external actions
without authority remain `BLOCKED`. Workflow completion, a green fixture
badge, local browser behavior, HTTP 200, and a signed source commit do not
establish a production execution, durable external Proof Ledger, hosted
deployment, current provider integration, customer outcome, or certification.

The current task does not fill the fail-closed operational registry with
invented sources or issue an independent-witness claim for a solo build.
The fresh strict-claims run still fails on Vessels/AIS because the required
provider authority is absent. No credential is added to make that gate pass.

Public-claim review of the scoped copy and the fresh claims-check outcomes are
recorded above; the final secret/environment-file review remains PENDING.
Current source inspection does not establish deployment authority or
exhaustive absence of secrets. The applicable gaps are tracked in
[known-gaps.md](../docs/operations/known-gaps.md); the final run must append its
actual disposition there without overwriting historical receipts. This draft
does not change artifact readiness in `docs/APP_STATUS.md`.

## Completion receipt — not yet issued

| Required receipt | Status |
| --- | --- |
| Exact source commit / tree and signature verification | **PENDING** |
| Pinned dependency relink and scoped command outcomes | **RECORDED ABOVE — aggregate and final-source qualification remain pending** |
| Interaction result, state count, browser version, and receipt SHA-256 | **PENDING** |
| Seventy-five capture records, image digests, and visual inspection | **PENDING** |
| Durable screenshot paths and catalog / sidecar identities | **PENDING** |
| Final protected-source preservation and source-byte continuity | **PENDING** |
| Final claims, security, known-gaps disposition | **PENDING** |
| Final publication commit / tree and normal-push outcome | **PENDING** |
| Remote exact-SHA readback and separately observed hosted checks | **PENDING** |
| Binary-safe fallback patch, base/tree/digest if push is unavailable | **PENDING — conditional fallback; not yet generated for this final candidate** |

No merge, deployment, production-readiness, customer-use, or all-green hosted
CI assertion is made by this in-progress packet.
