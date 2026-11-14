# Warm evidence recovery — current-main reconciliation

- Workcell: `PLATFORM-994-CURRENT-MAIN-20261109`.
- Actor and recorder: OpenAI Codex, implementing the owner's continuing audit request.
- Recorded: 2026-11-09.
- Feature parent: `5ac7fe0ec44be6b85cd736aeb887f281d7fd8650`.
- Main parent: `bb206ef01765af2e6cf1628ced0634142ed61543`.
- Proof level: scoped source and offline contract evidence; no release proof.

## Plan and patch

The pre-edit plan was to bring owned draft PR #994 onto current main through a
normal two-parent feature merge, preserve both lines of work and their proof
history, resolve the appended known-gaps conflict, and re-run the relevant
contracts. The root operating instructions, non-negotiables, proof and claims
doctrine, documentation index, historical application register and relevant
known gaps were reviewed. No narrower instructions govern these paths.

The sole merge conflict was `docs/operations/known-gaps.md`. Its warm-controller
entry is retained alongside all current-main readiness authority, lane
preflight and staging request entries. Current main's source, workflows,
dependency graph and other files are preserved. The two warm-controller Python
files are byte-identical to the feature parent. No new functional patch is
introduced by this reconciliation. The earlier
[proof](WARM_EVIDENCE_RECOVERY_20261101.md) and
[measurements](WARM_EVIDENCE_RECOVERY_20261101.json) remain immutable history.
This new packet records current-source measurements separately.

## Offline measurements

The [structured record](PLATFORM_994_CURRENT_MAIN_20261109.results.json)
contains command results, source blob identities and retained output digests.
The counts here apply only to the named subsystem, never canonical platform
metrics or operational readiness.

| Command / scoped subsystem | Exit | Result |
|---|---:|---|
| `python3 .github/scripts/test_warm_flagships.py` — warm controller | 0 | 32 controller cases pass |
| `python3 packages/szl-kernels/tests/test_szl_kernels_organ.py` — kernel controller | 0 | 22 controller cases pass |
| `python3 -B -S -m unittest test_khipu_publish.EmitFailsClosedTest -v` — readiness emission | 0 | 31 emission cases pass; current source includes more cases than the older packet |
| Python compilation of both controller/source pairs | 0 | Syntax passes |
| Unchanged claims-drift contract via Node's TypeScript support | 0 | 69 guard cases pass; only its relative compiled-module import is redirected to exact tracked TypeScript source in a temporary copy |
| `node --test scripts/ci/governance-workflows.test.mjs` — workflow source contracts | 0 | 19 governance cases pass after materializing their unchanged current-main inputs |
| `git apply --check` of PR #995's exact six-path patch | 0 | Canonical-key candidate applies to this candidate without changes; no PR #995 files are applied or published here |
| Pinned `corepack pnpm typecheck`, before and after | 1 | Both stop at `turbo: not found`; workspace dependencies are absent |
| Pinned root `pnpm test`, with recursive pnpm pinned too, before and after | 1 | Both stop because package `yaml` is absent during the compiled-runtime gate; full monorepo execution is unavailable |

The initially installed pnpm version was incompatible with the repository's
pinned version. Using Corepack obtained the declared pnpm version without
editing the manifest or lockfile. An initial governance attempt lacked sparse
checkout inputs; the subsequent pass uses verified unchanged files. These
setup failures remain in the retained logs and are not counted as source
regressions. Matching environment failures do not qualify full typecheck or
prove an absence of functional regressions.

No UI or application route changed, so screenshots and route QA do not apply.
`docs/APP_STATUS.md` remains explicitly historical. The canonical
`platform_tests` metric remains UNAVAILABLE. No metrics, allowlists, scanner
rules, failure classifications or protection policies are changed.

## Verification, security and remaining closure conditions

The complete candidate tree is compared against main plus the declared PR
paths, not just the sparse checkout. Scoped secret scanning, changed-text
claims validation with the tracked metrics, and whitespace checks are recorded
with the publication handoff. Historical proof files remain byte-identical to
the feature parent; all unrelated main paths retain their exact blob and mode.

Synthetic doubles exercise partial probe streams, transport failure, report
retention and complete bounded incident reads without contacting providers or
mutating GitHub issues. Complete pagination is still not a transaction or
cross-run incident lock. Writes are never retried after an ambiguous outcome;
local retention still requires writable storage and does not survive every
cancellation or host failure. These source contracts do not establish current
fleet health, durable artifact readback or deployed incident mutation.

Fresh exact-head hosted checks and protected admission remain required. No
independent human approval, DCO certification or verified commit signature is
claimed. The branch remains draft. Publishing it runs the existing PR checks;
a later main merge would activate write-capable warm reconciliation, wake
receipts and staging deployment. This work does not merge to main, dispatch,
deploy, change credentials, alter protection or suppress an alert. Rollback
would be a normal protected revert, with no history rewrite.
