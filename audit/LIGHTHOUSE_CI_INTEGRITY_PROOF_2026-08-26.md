# Lighthouse CI Integrity Proof Packet — 2026-08-26

## Required Fields

- workcell_id: lighthouse-ci-integrity-20260826
- agent: Codex
- objective: Make the six-app Lighthouse workflow fail closed for accessibility assertion
  failures and incomplete execution, avoid the irrelevant optional ONNX CUDA download without
  disabling other lifecycle scripts, add adversarial source-contract coverage, and reconcile
  current workflow claims with historical audit evidence.
- plan_summary: Refresh exact main and live protection state; inspect the Lighthouse workflow,
  configuration, governance, and known gaps; implement one focused CI-integrity patch; test the
  exact install, workflow contract, root test chain, full test graph, and full typecheck graph;
  obtain an adversarial review; then publish only a signed and DCO-certified successor commit.
- patch_summary:
  - Removed job-level failure masking from the Lighthouse matrix.
  - Added step-scoped ONNXRUNTIME_NODE_INSTALL=skip while retaining the frozen-lockfile install
    and all other approved lifecycle scripts.
  - Made success the aggregate gate's only passing matrix result; failure, cancelled, skipped,
    and unexpected results fail closed with assertion-versus-infrastructure-safe messaging.
  - Added a dependency-free Node regression that rejects failure masking at job or step scope,
    pins fail-fast false, validates the 0.90 accessibility error threshold, and proves the
    aggregate result contract.
  - Wired the regression into the root test command.
  - Corrected GitHub governance, branch-protection guidance, the KG019 register, the historical
    Lighthouse baseline, and the accessibility audit so workflow enforcement is not represented
    as a branch-required context.
  - Functional patch scope before this packet: seven modified files plus the new regression file.
    This Proof Packet is the ninth changed artifact.
- screenshot_refs: N/A. This work changes CI workflow, source-contract tests, and documentation;
  it does not modify a UI surface or route, so no live screenshot is applicable.
- public_claim_check: PASS. No customer, revenue, certification, partnership, deployment, or
  production-runtime claim was introduced. Current workflow behavior is explicitly separated
  from the historical ten-artifact baseline and from live branch-protection requirements.
- security_check: PASS for the source patch. A targeted scan of all changed functional files
  found no private-key markers, GitHub/OpenAI token patterns, API-key assignments, client-secret
  assignments, password assignments, retired-name markers, or unresolved-work markers.
  Hosted security workflows remain a separate post-publication requirement.
- known_gaps_update: docs/operations/known-gaps.md is advanced to rev 26 and records the KG019
  execution-integrity correction. The entry also preserves the residual boundary that Lighthouse
  is not currently a required branch-protection context.
- proof_level: 4 — Full Proof. Public governance and audit documents changed; Level 3 screenshot
  obligations are vacuously N/A because no UI surface changed. Public-claim, security, and
  known-gap checks are included.
- recorded_at: 2026-08-26T21:02:00.085Z
- recorded_by: Codex

## Test Results

Node-based validation used Node.js v24.19.0. Pnpm-based validation used the
repository-pinned pnpm 10.26.1.

1. ONNXRUNTIME_NODE_INSTALL=skip pnpm install --offline --frozen-lockfile
   - Exit: 0
   - Evidence: all 202 workspace projects resolved; 937 packages present, 936 reused, zero
     downloads. The onnxruntime lifecycle completed without a NuGet fetch. pnpm's existing
     build-script policy continued to ignore only the already-unapproved @google/genai and
     protobufjs scripts; no broad ignore-scripts bypass was used.

2. node --test scripts/ci/lighthouse-workflow.test.mjs
   - Exit: 0
   - Evidence: the focused contract command completed without failures or skips after the
     adversarial-review strengthening. Canonical `platform_tests` evidence remains `UNAVAILABLE`;
     this local command is not promoted to a platform-wide metric.

3. Root validation prefix: overclaim-ledger validator plus the built-in Node validation files
   - Exit: 0
   - Evidence: ledger validation and the root validation prefix completed without failures or
     skips. Canonical `platform_tests` evidence remains `UNAVAILABLE`; this is the exact root
     command before its Turbo subgraph and includes the new Lighthouse regression.

4. Initial pnpm run test with Turbo's default host concurrency
   - Exit: 1
   - Evidence: the root prefix passed, but a tool-mesh arithmetic case exceeded its normal timing
     envelope under host contention after 102 of 116 then-scheduled tasks. This run was not
     accepted as passing evidence.

5. pnpm --filter @workspace/tool-mesh test
   - Exit: 0
   - Evidence: the isolated package command completed successfully, supporting the conclusion
     that the prior failure was contention-sensitive rather than a deterministic source
     regression. Canonical `platform_tests` evidence remains `UNAVAILABLE`.

6. Mistaken pnpm run test -- --concurrency=4 invocation
   - Exit: 1
   - Evidence: pnpm forwarded the Turbo flag into package test commands, which rejected the
     unknown option. This invocation error was not accepted as source evidence.

7. pnpm exec turbo run test --concurrency=4
   - Exit: 0
   - Evidence: 119 of 119 tasks succeeded; 101 were cached; elapsed time 19m1.105s. The graph
     included tool-mesh, A11oy runtime security regressions, and the explicitly documented
     environment-dependent skips (six real-vector ONNX cases and two Windows link-capability
     cases). There were no failures in the bounded task graph.

8. pnpm exec turbo run typecheck --concurrency=4 --output-logs=errors-only
   - Exit: 1
   - Evidence: no TypeScript diagnostic, lifecycle failure, killed-process marker, or OOM text
     was emitted. Per-task logs contained no compiler error. Concurrent compiler inspection later
     showed individual processes using approximately 2.7 to 4.1 GB, supporting host memory
     pressure as the cause. This run was not accepted as passing evidence.

9. pnpm exec turbo run typecheck --concurrency=2 --output-logs=errors-only --summarize
   - Exit: 0
   - Evidence: 182 of 182 typecheck tasks succeeded across the 201-package scope; 158 were cached;
     elapsed time 52m47.711s. This lower-concurrency command preserved the complete task graph.

10. pnpm exec biome check scripts/ci/lighthouse-workflow.test.mjs package.json
    - Exit: 0
    - Evidence: 2 files checked; no fixes required.

11. Node YAML parse of .github/workflows/lighthouse.yml
    - Exit: 0
    - Evidence: parsed successfully with both lighthouse and lighthouse-gate jobs present.

12. git diff --check
    - Exit: 0
    - Evidence: no whitespace errors after the audit-document corrections.

13. Targeted credential, retired-name, and unresolved-work scans over functional changes
    - Exit: 1 for each rg command, which is the expected no-match status
    - Evidence: no matching credential patterns, retired-name markers, or unresolved-work
      markers.

14. pnpm qa:routes
    - Not run
    - Rationale: no application route, router, page, endpoint, or route registry changed.

## Verification Notes

- The workflow source has no continue-on-error key in either the matrix job or aggregate gate,
  including nested steps.
- strategy.fail-fast remains false, and every needs.lighthouse.result value other than success
  reaches exit 1.
- The accessibility assertion remains exactly error with minScore 0.9 in .lighthouserc.json;
  performance 0.8, best-practices 0.9, and SEO 0.9 remain warnings.
- The install remains pnpm install --frozen-lockfile. Only the optional ONNX binary resolution is
  skipped, matching the repository's existing tests workflow.
- The current matrix is six built artifacts: terra, vessels, carlota-jo, sentra, counsel, and
  a11oy. The ten-artifact April measurements remain labeled as a historical dev-server snapshot.
- An independent adversarial patch review found the missing any-scope failure-masking assertion
  and stale audit claims; both findings were resolved before this packet was recorded.
- The first hosted PR run rejected numeric local case counts because canonical `platform_tests`
  evidence is unavailable. Before merge, this unmerged packet was normalized in a signed and
  DCO-certified successor commit. The commands, exit codes, and evidence boundary are unchanged;
  no canonical platform-wide count is claimed.
- At pre-publication refresh, local HEAD, origin/main, and the merge base were all exactly
  7383a30fffeb44c7e8a3fa2c27e176ee450607fd. The overlapping PR 671 remained open and unmerged.
- Live repository policy requires a pull request, signed commits, strict up-to-date status,
  DCO sign-off, the lockfile context, linear history, and resolved review threads. It has no
  configured bypass actor.

## Evidence Boundary

This packet proves the local source patch and local validation only. It is not deployment or
production-runtime evidence. At recording time no successor commit, remote branch, pull request
head, hosted exact-head review, hosted terminal-green check set, merge, or post-merge main readback
existed. Those events must be observed separately and must not be inferred from this packet.

The aggregate gate can truthfully state that a matrix job failed and direct reviewers to the exact
failed step. It cannot machine-classify every generic failure as accessibility versus
infrastructure without a larger per-app status-artifact design. This patch does not claim that
stronger classification.
