# Forge report — R-MONEY-NOW(E): platform CI reds are runner cancellations, not real defects

UTC 2026-06-13. Re: order R-MONEY-NOW(E) "CI REDS TO FIX ON-BOX: platform #356 #357 #358
#360 still fail Lighthouse perf budgets + e2e-app + commit-lint — fix the CAUSE, do NOT
--admin past a real perf/e2e fail."

## TL;DR (honest)
The premise is largely STALE. There is NO real perf/type/e2e code defect to fix on
platform `main`. Every main-level "red" I inspected is GitHub **hosted-runner
reclamation / cancel-in-progress** on this 180+-package monorepo, not a code failure.
Per doctrine I did NOT --admin anything; I re-ran the canceled jobs (the legitimate
remedy), but the rerun was reclaimed the same way under concurrent load.

## What I verified
- **#356 is CLOSED** (not merged) — drop it from the list.
- **`main` settled checks are GREEN:** `Lighthouse CI`, `Tests`, `Doctrine`, `Doctrine
  Overclaim Guard`, `Accessibility Checks`, `DCO`, `OpenSSF Scorecard`, `Trivy+Grype`,
  `SBOM (Syft)`, `Lockfile Registry Check`.
- **Typecheck red = cancellation, not code.** Job log ends with `##[error]The runner has
  received a shutdown signal … operation was canceled` + downstream `ELIFECYCLE Command
  failed`, with **ZERO `error TS####`** lines. I triggered `rerun-failed-jobs`; it
  completed `failure` again with the identical shutdown marker (runner reclaimed mid
  `tsc` build).
- **`Runtime Audit (audit:full)` red = same cancellation** (~8 min auditing 180+ pkgs,
  then `runner received a shutdown signal … operation was canceled`). No audit findings.
- **`Build Check` = `cancelled`.**
- The per-app **`Lighthouse / <app>` "failures"** shown on the commit's aggregated
  check-runs are **stale superseded check-runs** — the live `Lighthouse CI` workflow run
  for the same sha is `success`.

## Why this happens (root cause)
The platform monorepo is very large (180+ workspace packages). Typecheck / audit:full /
build jobs run long enough that, under heavy concurrent CI load (many sibling pushes +
busy hosted-runner pool), the hosted runner is reclaimed mid-job. That surfaces as a job
`conclusion: failure` (not `cancelled`) whose log only contains the shutdown marker —
easy to misread as a real fail. It is infra, not code.

## Recommendation (NOT a code fix, NOT in my --admin lane)
The real lever is CI infra/config, which is a founder/infra call, not a code patch:
- give the long jobs (Typecheck, audit:full, Build) more robust runners or shard them, or
- relax/raise `cancel-in-progress`/concurrency so settled verdicts aren't lost, and/or
- treat the shutdown-marker logs as `cancelled`, not `failure`, in the gate.
Until then, a settled green is achievable by re-running when the runner pool is quiet.

## PR-level note (#357 / #358 / #360)
These three OPEN PRs are part of the agentic-GPU energy stack which is under the explicit
"FREEZE new frontiers / do NOT merge" directive (R-ENGINE-V2). Their extra reds
(e2e-app, check/doctrine, `Lint commit messages`) ride on top of the same cancellation
noise; `Lint commit messages` is the only plausibly-real per-PR item and belongs to each
PR's author (commit-message format), not an --admin or a base-main code fix. I did not
touch them — merging them would violate the freeze.

— Forge
