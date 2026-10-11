# Branch Protection and GitHub Settings

This document records the observed repository control plane. It is not a
checklist of settings that might exist. Re-read the GitHub API after every
ruleset change and update the dated receipt below.

## Observed `main` ruleset

Authenticated readback on **2026-10-06** returned active repository ruleset
[`22286649`](https://github.com/szl-holdings/platform/rules/22286649),
`Protect main - solo-builder exact-head`, targeting `~DEFAULT_BRANCH`. The
privacy-safe readback receipt is
[`audit/evidence/github-platform-ruleset-summary-2026-10-06.json`](../audit/evidence/github-platform-ruleset-summary-2026-10-06.json).

| Control | Observed value |
|---|---|
| Pull request required | Yes |
| Required approving reviews | `0` |
| Dismiss stale reviews on push | No |
| Code-owner review required | No |
| Approval of the last reviewable push required | No |
| Review-thread resolution required | Yes |
| Extra approval for unattributed changes | Yes |
| Allowed merge methods | Squash only |
| Required signed commits | Yes |
| Branch deletion | Blocked |
| Non-fast-forward updates | Blocked |
| Ruleset bypass actors | None |
| Current caller can bypass | Never |
| Required checks use strict/up-to-date mode | Yes |

The observed required status contexts are:

| Context | GitHub Actions integration |
|---|---|
| `Runtime Audit (audit:full)` | `15368` |
| `Security Gate (blocking)` | `15368` |
| `E2E Gate` | `15368` |
| `severity-gate` | `15368` |
| `lockfiles / No lockfile references a Replit-internal registry host` | Not returned by the API |

The candidate branch also defines these promotion controls, but they must not
be described as branch-required until they have passed on the exact candidate
head and the live ruleset has been updated and read back:

| Candidate context | Workflow | Source-declared behavior |
|---|---|---|
| `Grype filesystem/SCA gate (fail on HIGH/CRITICAL)` | `.github/workflows/trivy.yml` | Raw filesystem/SCA findings block unless an exact, registered, digest-bound, behavior-tested, unexpired local patch is verified |
| `repro` | `.github/workflows/repro-check.yml` | Two clean forced builds of one candidate SHA must have identical complete output manifests |

Organization-level ruleset details were unavailable to the authenticated
caller (`403`), so organization-wide inheritance remains **UNKNOWN**. The
repository readback above does not establish GitHub environment protection,
repository secret-scanning configuration, secret values, deployment health,
or organization-wide controls.

## Change procedure

1. Observe the candidate context passing on the exact pull-request head.
2. Fetch the complete live ruleset immediately before mutation.
3. Preserve every condition, rule, integration ID, and bypass setting; append
   only the exact context that was observed.
4. Write the complete ruleset update through the GitHub API.
5. Read it back and compare every field, then retain a sanitized dated receipt
   under `audit/evidence/`.
6. Merge only while every required context is successful for the same head.

Never weaken or remove an existing rule merely to make a pull request
mergeable. Never infer a passing check from workflow source or a local run.

## Merge and deployment boundaries

The live ruleset permits squash merging only. Repository-level merge-button
preferences, automatic head-branch deletion, GitHub environments, secrets,
deployment tokens, and secret-scanning settings require independent
authenticated observations before they are reported as configured.

Workflow source declares deployment and release behavior, but source alone is
not evidence that a deployment ran or that an environment is protected. See
[`docs/operations/ci-overview.md`](../docs/operations/ci-overview.md) and the
dated estate audit for the source-versus-live evidence boundary.
