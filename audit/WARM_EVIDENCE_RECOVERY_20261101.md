# Flagship probe evidence retention

- Workcell: `warm-evidence-recovery-20261101`
- Agent / recorded by: OpenAI Codex, implementing the owner's operational repair request
- Recorded: 2026-11-01
- Base: `a465a0aa182f5eb88bdf3131372ca7a9b8199e87`
- Proof level: 2, bounded source and local test evidence

## Problem and plan

In [warm-flagships run 41361708249, Lyte job 125013329750](https://github.com/szl-holdings/platform/actions/runs/41361708249/job/125013329750), all three health probes returned HTTP 200. A `RemoteDisconnected` exception during the following GitHub issue-list read unwound `main` before it wrote `reports/flagship-health/lyte.json`. The artifact upload consequently failed because no report existed. This is an evidence-retention defect; the GitHub transport failure is not evidence of a Lyte outage.

The pre-edit plan was to preserve probe evidence through issue-reconciliation failure, retain failure visibility and avoid retrying a write whose remote outcome might be unknown. Scope: controller, its existing tests, one known-gaps entry and this proof. No workflow, credential, deployment or UI change.

## Patch and verification

The controller initializes an explicit issue lifecycle status and writes the report in `finally`. Expected transport/API/configuration/response-decoding errors record only the exception class, leave lifecycle action and status `UNKNOWN`, and return exit code 1. A disconnect after a recovery comment or close request never becomes a claim that no write occurred and is not retried. The probe health state and original attempts remain unchanged. Successful reconciliation keeps its existing action and adds `COMPLETED`; read-only runs use `NOT_REQUESTED`. Unexpected exceptions propagate after evidence retention. Filesystem report failures also propagate.

Seven added tests cover healthy, unhealthy and unknown observations under disconnect; URL, timeout, partial-response, API and JSON errors; no exception-body leakage; a comment accepted before a failed close response; missing repository configuration; successful and read-only calls; unexpected code defects; and report-write failure. They use synthetic local doubles, not live issue mutation.

## Commands and results

All commands ran in a scoped materialization whose downloaded source Git blob hashes were verified against the pinned revision. Counts below belong only to the named controller suites, not the platform-wide test total. The [structured measurement record](WARM_EVIDENCE_RECOVERY_20261101.json) binds the command, source revision, result and retained log digest for each measurement.

| Check | Exit | Evidence |
|---|---:|---|
| Baseline `python .github/scripts/test_warm_flagships.py` | 0 | Existing 14 controller tests passed |
| Six new regression tests against original source | 1 | 13 failing subcases, including missing retained report after the observed disconnect |
| Candidate `python .github/scripts/test_warm_flagships.py` | 0 | 21 controller tests passed, including the seventh report-write failure test |
| `python packages/szl-kernels/tests/test_szl_kernels_organ.py` | 0 | Existing 22 kernel controller contract tests passed |
| `python -m py_compile` on both controller/test pairs | 0 | Python syntax validation |
| Pinned `pnpm@10.26.1 typecheck`, before and after | 1 | Identical `turbo: not found`; workspace dependencies are absent in this scoped materialization. No monorepo typecheck pass is claimed |
| `node scripts/qa/scan-secrets.js .` | 0 | Scoped source scan: clean |

`git diff --no-index --check` produced no whitespace diagnostics on each changed existing file (exit 1 indicates their content differs); a separate trailing-whitespace assertion passed for the two Python files and new proof.

The initial truth-drift run rejected the two unqualified controller-count cells as platform-wide claims. This follow-up names the controller scope explicitly and adds the structured record; `platform_tests` remains `UNAVAILABLE`. The unchanged `claimFailuresForLines` guard, run locally against the actual canonical metrics without an allowlist, reproduces both original diagnostics and returns no diagnostics for this corrected proof. No guard, metric or allowlist is changed.

Full hosted exact-head CI remains required. No screenshot or route QA applies: no application UI or route changed. The historical `docs/APP_STATUS.md` remains unchanged. The appended known-gaps note describes a source candidate only.

## Security, limits and release effects

No credentials, exception response bodies, environment values or private key material are introduced in the patch or proof. The report stores only exception class names for handled reconciliation errors. No public production, customer, compliance or availability claim is added.

This does not add a durable queue, cross-run issue idempotency, cancellation recovery or a retry mechanism. Local report creation still depends on writable storage. Remote issue outcomes can remain unknown. Full hosted acceptance and independent review remain separate from these local tests.

A merge to main would activate the existing warm workflow, including optional GitHub incident lifecycle updates and the wake-receipt step, and trigger the existing staging deployment workflow through its main-push rule. No such merge or deployment was performed by this workcell. Existing protected admission must remain enforced. Rollback is a normal protected revert; no migration is involved.

## Follow-up: partial probe streams and complete incident reads

Recorded 2026-11-02 against parent candidate `e0ec6283b7dbeb078cb32810c6dbf27ccd230e25`.
The pre-edit plan extended this same workcell after independent source review
reproduced two older gaps: an HTTP protocol/body-read exception could discard
completed probe observations, and a first-page-only or malformed issue read
could be mistaken for no existing incident. The relevant functions were
unchanged from original main `a465a0aa182f5eb88bdf3131372ca7a9b8199e87`.

Protocol and truncated-body failures now produce UNKNOWN attempts containing
only the exception class, preserving earlier attempts and the existing bounded
probe schedule. A final failed response cannot satisfy final-200 recovery.
Successful HTTP observations retain their existing classification rules.
Network error text and partial bodies are omitted from diagnostics.

Incident lookup reads pages in creation order until a short final page proves
the bounded enumeration complete. It rejects malformed pages and records,
repeated issue numbers, multiple matching incidents and exhaustion of the
ten-page bound. An early match does not authorize a write before later pages
are inspected. Failed enumeration leaves lifecycle status UNKNOWN, retains
the health report and fails the process. No write is retried. Pagination is a
bounded API observation, not a transaction or cross-run concurrency lock.

The scoped controller suite passes 32 / 32 cases. Against the unchanged parent
controller, the same suite exits with 25 failing subcases and seven errors.
The kernel controller contract remains 22 / 22 cases. The structured record
retains the exact command, source blobs and output digests. Strict Python
compilation, changed-file secret scanning and unchanged claims-guard checks
are recorded separately. Pinned root typecheck still fails before and after
because Turbo and workspace dependencies are absent locally.

Before this follow-up, the parent candidate's required hosted checks had
passed; those results do not qualify the new source. Fresh hosted checks,
current-base admission, signature admission and protected review remain
required. No independent human approval or verified commit signature is
claimed. No application UI, routes, workflows or credentials changed; no
screenshot or route QA applies. The corresponding known-gaps entry records
only this source candidate, not current fleet operation or remote mutation.
