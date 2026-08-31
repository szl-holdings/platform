# Exact-head pnpm runtime admission proof

**State:** VERIFIED_LOCAL — exact-head hosted CI, review, and merge pending

**Proof level:** Level 2 — Standard Proof

**Recorded at:** 2026-08-31T02:42:25Z

**Repository:** szl-holdings/platform

**Protected base:** 1f333543c3fb98b4636b9aa9e6f5ffe0e47b47e7

**Branch:** repair/proof-controller-current-main-20260828

**Workcell / task ID:** WORKCELL-EXACT-HEAD-PNPM-20260829

## Objective

Remove ambient pnpm discovery from the protected exact-head screenshot
controller. Bind setup, dependency resolution, application launch, and packet
verification to one runner-scoped pnpm 10.26.1 executable whose action outputs,
resolved path, permissions, and containment are checked before candidate code
can use it.

This closes a controller-integrity gap. It does not itself capture a
screenshot, deploy Platform, prove a rendered product surface, or publish a
release.

## Scope

The change is limited to:

- .github/workflows/exact-head-screenshot-evidence.yml;
- .github/workflows/lockfile-registry.yml;
- .github/workflows/pin-check.yml;
- audit/frontier/EXACT_HEAD_PNPM_RUNTIME_ADMISSION_PROOF_2026-08-29.md;
- docs/standards/exact-head-screenshot-evidence.md;
- scripts/ci/capture-series-a-exact-head.mjs; and
- scripts/ci/exact-head-screenshot-evidence.test.mjs.

No application UI, API, database, customer data, deployment target, credential,
or public runtime is changed.

## Patch summary

- The SHA-pinned pnpm/action-setup action installs standalone pnpm 10.26.1
  below a unique runner.temp root.
- The workflow binds the action's dest and bin_dest outputs to that root,
  resolves the executable, removes group/world write permission, and verifies
  candidate readability and whole-tree non-writability under the candidate's
  effective identity.
- Protected-controller install, candidate dependency resolution, and
  application launch use the admitted absolute executable. Candidate PATH
  cannot substitute a different pnpm.
- Controller code validates configured and resolved pnpm containment, file
  type, and Unix permission requirements before capture.
- The reusable lockfile and pin callers now use the released shared verifier
  revision 932817603e46212f4226347c95aeb0cc55ec58cb.
- Regressions cover output binding, symlink escape, peer-writable runtime
  rejection, ambient-path exclusion, action order, and shared-verifier pins.
- Host-independent path assertions and a Windows directory-junction case keep
  the local suite meaningful. Unix permission, Bash, and Git-symlink cases
  remain enabled on the hosted Ubuntu runner and are explicitly skipped on
  Windows.

The pinned action contract was checked against its immutable upstream
action.yml: it declares dest, standalone, dest output, and bin_dest output, and
describes standalone mode as the Node-bundled pnpm package.

## Baseline and observed commands

| Command | Exit | Observed result |
| --- | ---: | --- |
| Repository pnpm typecheck wrapper | 1 | Dependency reconstruction reused 1,711 packages and downloaded none, then failed closed before TypeScript because build scripts for six dependencies were not approved. No typecheck result is claimed. |
| Bundled Node syntax checks | 0 | Controller and test files parsed. |
| Bundled Node focused test | 0 | The complete focused suite passed; Unix-only cases were explicitly skipped on Windows and remain enabled in hosted Ubuntu CI. |
| YAML parse of changed workflows | 0 | Three workflow documents parsed with jobs present. |
| Git Bash syntax pass | 0 | 16 embedded Bash run blocks passed. |
| Repository Biome lint | 0 | No errors; two existing CLI-output console warnings outside changed hunks. |
| Repository oxlint | 0 | No errors; the same two existing console warnings. |
| Secret-scanner regression | 0 | The complete regression suite passed. |
| Full-tree secret scan | 0 | CLEAN — no secrets found. |
| Overclaim-ledger validator | 0 | Evidence digests, bindings, labels, and computed metrics agree. |
| Source-of-truth validator | 0 | All 66 checks passed. |
| Markdown asset validator | 0, content failed | 230 links passed and nine pre-existing launch-document links in docs/INDEX.md were missing. The generated report rewrite was removed and this is not treated as a pass. |
| git diff --check | 0 | No whitespace errors. |

The local dependency wrapper added a draft allowBuilds section while reporting
the unapproved scripts. That incidental working-tree change was removed before
testing and is not part of this patch. The six reported packages are unrelated
to the focused controller suite, which imports only Node built-ins and defers
Playwright loading until a real capture.

## Typecheck boundary

pnpm typecheck did not run. The local wrapper stopped at
ERR_PNPM_IGNORED_BUILDS for @google/genai, core-js, esbuild, isolated-vm,
onnxruntime-node, and protobufjs. Approving those scripts would be a separate
dependency-policy decision and was not performed to make this patch look
green. Exact-head hosted Typecheck remains authoritative.

## Screenshot evidence

Not applicable to this patch. It changes CI controller isolation, tests, and
the operational standard, not rendered UI. A five-viewport screenshot packet
can be admitted only after this controller is merged and a protected
workflow_dispatch run binds a real open pull request and exact candidate SHA.

## Security determination

- no secret, token, key, environment value, or credential path is committed;
- no candidate-controlled file selects the pnpm executable;
- the candidate identity must be able to execute, but not write, the admitted
  runtime, and a bounded identity-level tree scan rejects ACL or ownership
  anomalies;
- the runtime root remains disjoint from candidate source, private home, and
  runner-owned evidence;
- controller and candidate Git trees are rechecked around dependency
  resolution and capture;
- publication remains in the separate non-candidate job; and
- the repository secret scanner reports a complete clean scan.

## Public-claim determination

- source correction: VERIFIED_LOCAL;
- independent read-only local review: PASS, no blocking containment defect;
- exact-head hosted CI: PENDING;
- GitHub pull-request review: PENDING;
- merge to protected main: PENDING;
- screenshot capture: NOT_PERFORMED;
- deployment or production runtime: NOT_CHANGED.

No customer, revenue, compliance, availability, deployment, or product-runtime
claim is introduced.

## Merge gate

Do not merge until the immutable final pull-request head is GitHub-verified,
DCO-valid, free of unresolved review findings, and terminal green in every
required exact-head and merge-group check. After merge, verify protected main,
rerun the exact-main checks, and keep screenshot/runtime claims separate from
controller-source evidence.

## Known gaps

No product gap was introduced or closed. Local TypeScript evidence is
unavailable for the reason above. The Unix-only permission and shell
regressions require the hosted Ubuntu job. Hosted CI, review, merge, and any
post-merge protected capture remain pending. The baseline Markdown validator
also reports nine missing launch-document targets from docs/INDEX.md; that
unrelated documentation debt is not repaired or hidden in this controller PR.
