# Exact-head screenshot evidence hardening — proof packet

- **workcell_id:** `platform-pr658-exact-head-audit-20260820`
- **agent:** Codex, independent pull-request reviewer
- **objective:** Audit PR #658 at exact head
  `02f8b3b7ac691a8f7f30f8c28d5bb1f38734b301` and harden screenshot
  provenance, exact-ref race handling, dependency and port selection, artifact
  integrity, duplicate work-item behavior, and fail-closed errors.
- **plan_summary:** Read repository doctrine and the complete PR diff, inspect the
  A11oy router and runtime configuration, read current review threads and
  workflow results, exercise adversarial contract cases, then create a
  forward-only local correction with focused regressions.
- **patch_summary:** Preserved the staging workflow from protected base
  `48b0ea169de75990e44b6ec924e59fe7d76e6020`; retained the real `/a11oy/`
  default route; bound the open same-repository PR, candidate
  branch, checkout, packet, and publication to one SHA; pinned pnpm 10.26.1 and
  A11oy port 4110; required an unchanged tracked tree immediately before
  capture; rejected HTTP-200 not-found, unfinished, redirected,
  overflowing, placeholder, transient, and browser-error surfaces; added
  ISO-dated surface filenames and PNG dimension checks; isolated the seven
  retained files; emitted every screenshot-doctrine catalog field; scanned
  visible body text for unmarked connecting states; moved issue-write authority
  into a post-capture job; and
  bound the work item to the exact attempt-scoped artifact ID, URL, name, and
  archive digest while making updates deterministic and duplicate-failing.
- **test_results:**
  - Local `pnpm typecheck` could not begin because the
    package-manager shim attempted a network acquisition that the execution
    environment denied. No TypeScript result is claimed.
  - `node --test scripts/ci/exact-head-screenshot-evidence.test.mjs` — exit 0;
    10 passed, 0 failed. Regressions cover real-route naming, checkout and clean
    tracked-tree mismatch,
    HTTP-200 SPA 404, route/readiness/error rejection, valid packet admission,
    duplicate screenshot identity, incomplete catalog metadata, unbound artifact
    pollution, symlink output escape, visible connecting state, and workflow
    permission/ref/work-item contracts.
  - `node --check scripts/ci/capture-series-a-exact-head.mjs` and the test file
    — exit 0.
  - PyYAML safe-load of the capture and staging workflows — exit 0; jobs parsed as
    `contract,capture,publish` and `deploy-staging`.
  - `node scripts/audit/validate-source-of-truth.js` — exit 0; all 66 checks
    passed, including the tracked 46-workflow inventory.
  - Protected-base comparison of `.github/workflows/deploy-staging.yml` — exit
    0; the preserved file is byte-identical.
  - `node --test scripts/qa/scan-secrets.test.js` — exit 0; 15 passed, 0 failed.
  - `node scripts/qa/scan-secrets.js .` — exit 0; no secrets found.
  - `node scripts/audit/validate-overclaim-ledger.js` — exit 0; evidence
    digests, bindings, labels, and computed metrics agree.
  - Canonical local-truth workflow inventory — 46 workflow files and
    `artifacts/SOURCE_OF_TRUTH.json#metrics.ci_workflows.value` both record 46,
    correcting the hosted `local truth drift: ci_workflows` failure.
  - `git diff --check` — exit 0.
- **screenshot_refs:** Not applicable. This correction changes CI, capture
  tooling, tests, and its operational standard; it does not change a rendered
  UI surface. A live five-viewport capture remains the responsibility of the
  protected `workflow_dispatch` job after the controller is merged.
- **verification_notes:** The A11oy router has real home routes at `/a11oy/`
  and `/a11oy`, while `/a11oy/start` falls through to the HTTP-200 SPA 404.
  The package is `@workspace/a11oy`, Vite binds port 4110, root metadata pins
  pnpm 10.26.1, and the lockfile provides Playwright 1.60.0. The verifier now
  rereads every bound byte, validates the full doctrine catalog entry, and
  rejects extra artifact files before upload.
- **public_claim_check:** Passed. The standard describes admission conditions
  and explicit claim boundaries; it introduces no customer, revenue,
  compliance, deployment, traffic, uptime, or authorization claim.
- **security_check:** Passed. No secret or environment value is committed.
  Candidate-controlled install and application processes run without an
  issue-write token; the separate publication job never checks out or executes
  candidate code.
- **known_gaps_update:** No product gap was introduced or closed, so
  `docs/operations/known-gaps.md` is unchanged. A full hosted capture was not
  reproducible in this dependency-less local worktree and is explicitly not
  claimed.
- **proof_level:** Level 2 — Standard Proof; non-UI CI and tooling correction.
- **recorded_at:** `2026-08-20T12:05:10Z`
- **recorded_by:** Codex
