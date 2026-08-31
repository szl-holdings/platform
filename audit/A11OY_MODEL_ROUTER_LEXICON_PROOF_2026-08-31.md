# A11oy Model Router lexicon UI proof — 2026-08-31

Status: PASS
Proof level: 4

## Mandatory Proof Packet fields

- workcell_id: PLATFORM-PR-688-MODEL-ROUTER-PROOF
- agent: Codex task /root/graphql_signed_rewrite_688, with GitHub Actions as the
  exact-source verifier and publisher and stephenlutar2-hash as the authenticated
  repository actor for staging normalization.
- objective: Preserve the exact intended #688 governed-label patch while providing
  live, source-bound UI evidence and a doctrine-complete Level 4 Proof Packet.
- plan_summary: Recreate the six label replacements on current main; build and test
  exact source; serve /a11oy/model-router; capture the modified surface; bind the
  screenshot to source, workflow, viewport, SHA-256, and workcell; publish only
  evidence files; then normalize the reviewed tree into an authenticated signed commit.
- patch_summary: The final candidate changes seven paths relative to live main.
  Two TypeScript files carry six additions and six deletions. Five evidence paths add
  the screenshot, metadata, screenshot-catalog entry, docs-index entry, and this
  packet. This packet expands from 64 to 188 lines; the final tree is
  283 additions and 6 deletions relative to live main. Runtime behavior
  is unchanged; the rendered public category label is renamed.
- test_results: Every command, exit code, and output summary is recorded below.
- screenshot_refs: docs/assets/screenshots/current/a11oy-model-router-2026-08-31.jpg
  at /a11oy/model-router; catalog entry in audit/screenshot-catalog.md; sidecar at
  docs/assets/screenshots/current/a11oy-model-router-capture-metadata-2026-08-31.json.txt.
- verification_notes: Exact source and tree were checked before dependency resolution,
  build, capture, artifact upload, and publication. The changed label rendered twice;
  the superseded label rendered zero times; loading resolved; horizontal overflow was
  zero; browser errors and unexpected foreign requests were empty. Screenshot and
  metadata digests were rechecked in the proof-field verification run.
- public_claim_check: PASS. pnpm audit:overclaims exited 0. Manual changed-copy review
  classified the replacement as product nomenclature, not a customer, deployment,
  compliance, integration, performance, or quantitative claim. Existing qualifiers
  remain unchanged and the evidence carries explicit nonclaims.
- security_check: PASS for the exact seven-path candidate. No environment file, private
  key, certificate, credential file, or high-confidence added-line secret pattern was
  found. Checkout credentials were not persisted. This is a scoped change check and
  does not claim a release-wide credential audit.
- known_gaps_update: No gap was introduced or closed. The exact diff leaves
  docs/operations/known-gaps.md unchanged (git diff --quiet exit 0). Existing
  deployment, live-provider, customer-use, and external-service gaps remain open.
- proof_level: 4 — live UI screenshot plus public-claim, security, and known-gap checks.
- recorded_at: 2026-08-31T04:55:50Z
- recorded_by: Codex task /root/graphql_signed_rewrite_688; exact command evidence
  assembled by GitHub Actions run 33358694028.

## Claim under test

At exact UI source revision 9e66b0eebb52d4e183e2b9248fec1aa74caf8611,
the live built route /a11oy/model-router renders Governed Agent Change Management
and does not render the superseded public label Governed Inference Recipes.

## Source and evidence identity

| Field | Value |
|---|---|
| Repository | szl-holdings/platform |
| Candidate revision verified by this packet | 9508b26fe0a1d82e2357eee530a0dca389dd0201 |
| Candidate tree verified by this packet | 9d2145f7f22ec3a42828e6601885f7bc4c79b373 |
| Candidate base | 755f0824fe86b95c77a420423e2e29751c8e59de |
| UI source revision | 9e66b0eebb52d4e183e2b9248fec1aa74caf8611 |
| UI source tree | 51fa6d934538233b1ad83ec336ff59498b6b1a50 |
| Pull request verified | #693 |
| Capture workflow run | https://github.com/szl-holdings/platform/actions/runs/33357789150 |
| Proof-field workflow run | https://github.com/szl-holdings/platform/actions/runs/33358694028 |
| Proof-field workflow definition | ops/model-router-proof-fields-693-20260831 at c9aafa71288e02ac19045cdc7a6f120f0645e3c0 |
| Route | /a11oy/model-router |
| Viewport | 1440x900 CSS px; device scale factor 1 |
| Capture time | 2026-08-31T04:39:40.844Z |
| Screenshot SHA-256 | 3646d432fb1ca1a5176c2b4e6d52fbd2e2ef063247fc09e4eb0264ef510abfd0 |
| Metadata SHA-256 | 08c659642f0461dc75b57f419d82a2df8b1fe24abcf3de3b00dd00add0b13ca5 |

## Dependency and execution environment identity

| Field | Value |
|---|---|
| Dependency lockfile | pnpm-lock.yaml |
| Lockfile SHA-256 | 1f1f5f5b8401fce46b13aa80f9d169cf00c95a1c06a584103f67ce1ba6d14cc6 |
| Lockfile Git blob | 16c3c77a10ee717a76451e61a8c1d2a84e0ac34b |
| Package-manager declaration | pnpm@10.26.1 |
| Runner | GitHub-hosted ubuntu-24.04 |
| Runner image | ubuntu24 / 20260823.283.1 |
| Kernel | Linux 6.17.0-1022-azure x86_64 GNU/Linux |
| Node.js | v24.19.0 |
| pnpm | 10.26.1 |
| Playwright | 1.60.0 |
| Chromium | 148.0.7778.96 |
| Vite | vite/8.0.16 linux-x64 node-v24.19.0 |
| Git | 2.55.0 |
| Python | 3.12.3 |

## Test results

1. command: pnpm install --frozen-lockfile --ignore-scripts --ignore-pnpmfile
   - exit_code: 0
   - output_summary: Exact pnpm 10.26.1 lockfile install completed; lifecycle and pnpmfile execution disabled.
2. command: pnpm --filter @workspace/a11oy typecheck
   - exit_code: 0
   - output_summary: A11oy TypeScript typecheck passed.
3. command: pnpm --filter @workspace/a11oy test:series-a
   - exit_code: 0
   - output_summary: A11oy Series A test suite passed.
4. command: pnpm --filter @workspace/a11oy build
   - exit_code: 0
   - output_summary: A11oy Vite production build passed.
5. command: pnpm audit:overclaims
   - exit_code: 0
   - output_summary: Overclaim ledger validator and its test suite passed.
6. command: git diff --check 755f0824fe86b95c77a420423e2e29751c8e59de...9508b26fe0a1d82e2357eee530a0dca389dd0201
   - exit_code: 0
   - output_summary: No whitespace errors in the exact candidate diff.
7. command: python3 targeted added-line secret and credential-path scan
   - exit_code: 0
   - output_summary: Seven changed paths admitted; no credential-bearing path or high-confidence added-line secret pattern found.
8. command: git diff --quiet 755f0824fe86b95c77a420423e2e29751c8e59de 9508b26fe0a1d82e2357eee530a0dca389dd0201 -- docs/operations/known-gaps.md
   - exit_code: 0
   - output_summary: Known-gaps register is unchanged; scope review found no introduced or closed gap.
9. command: git diff --quiet 755f0824fe86b95c77a420423e2e29751c8e59de 9508b26fe0a1d82e2357eee530a0dca389dd0201 -- docs/APP_STATUS.md
   - exit_code: 0
   - output_summary: Artifact readiness register is unchanged; this lexicon-only change does not alter readiness.
10. command: python3 screenshot, metadata, catalog, source, route, workcell, and digest assertions
   - exit_code: 0
   - output_summary: Screenshot and metadata SHA-256 values, exact source/tree, route, workflow, and catalog bindings matched.
11. command: inline Playwright capture script in workflow run 33357789150
    - exit_code: 0
    - output_summary: Chromium loaded the exact built route; the changed label was
      visible twice; the superseded label was absent; loading resolved; overflow,
      browser-error, and unexpected-network arrays were empty; JPEG capture succeeded.

pnpm qa:routes was not applicable because no route definition or route path changed.
The route itself was exercised by the live Playwright capture.

## Public-claim check

Result: PASS. The only public-copy behavior change is a category-label replacement.
It does not assert production status, customers, revenue, certification, live vendor
integration, performance, exclusivity, or a quantitative fact. pnpm audit:overclaims
exited 0. The screenshot proof is explicitly limited to local exact-source rendering.

## Security check

Result: PASS for this candidate scope. A seven-path allowlist, credential-bearing path
check, high-confidence added-line secret scan, and git diff --check all exited 0.
The screenshot and metadata hashes matched their recorded values. The workflow used
job-scoped GitHub tokens and persist-credentials: false. No token value is recorded.

## Known-gaps result

Result: no new gap and no closed gap. The label replacement and evidence files do not
change route availability, provider connectivity, deployment, authentication, data
handling, or artifact readiness. docs/operations/known-gaps.md and docs/APP_STATUS.md
both remained byte-identical to the candidate base for this scope.

## Recovery and terminal failure record

- Workflow run 33357567259 failed before jobs because the initial temporary YAML was
  invalid. It published no evidence and changed no target branch.
- Workflow run 33357665353 passed source identity, typecheck, Series A tests, and build,
  then exited 1 before capture because the inline script imported an unavailable
  package name. It published no evidence; cleanup deleted the builder ref.
- Workflow run 33357789150 used the repository-provided @playwright/test import and
  completed capture, signed publication, and builder cleanup with exit 0.
- Current proof-field verification terminal_failure_state: none in this verification run.

## Evidence

- Screenshot: docs/assets/screenshots/current/a11oy-model-router-2026-08-31.jpg
- Machine-readable metadata:
  docs/assets/screenshots/current/a11oy-model-router-capture-metadata-2026-08-31.json.txt
- Screenshot catalog: audit/screenshot-catalog.md
- Exact-source capture run: https://github.com/szl-holdings/platform/actions/runs/33357789150
- Proof-field verification run: https://github.com/szl-holdings/platform/actions/runs/33358694028

## Acceptance result

PASS. The changed phrase is visible in the exact-source browser render, the prior
phrase is absent, all recorded successful commands exited 0, the environment and
lockfile are identified, and Level 4 doctrine checks are explicitly recorded.

## Nonclaims and limitations

This packet does not prove deployment, production runtime, provider connectivity,
customer use, external-service parity, or release readiness. API responses were
deterministically stubbed with ok:false JSON because the claim under test is lexicon
rendering, not live model-router data. Google font hosts received empty deterministic
responses. The security result is scoped to the exact candidate, not a full release audit.
