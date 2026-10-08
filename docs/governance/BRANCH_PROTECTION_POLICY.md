# Branch Protection Policy

> Current repository observation · 2026-10-06

This document supersedes the April 2026 manual-settings policy formerly kept
at this path. It records an authenticated, repository-scoped observation; it
does not turn workflow source or a desired future policy into live GitHub
configuration.

## Evidence and scope

GitHub returned active repository ruleset
[`22286649`](https://github.com/szl-holdings/platform/rules/22286649),
`Protect main - solo-builder exact-head`, targeting `~DEFAULT_BRANCH`. The
default branch is `main`. The sanitized readback is retained at
[`audit/evidence/github-platform-ruleset-summary-2026-10-06.json`](../../audit/evidence/github-platform-ruleset-summary-2026-10-06.json),
with a human-readable operational companion in
[`.github/BRANCH_PROTECTION.md`](../../.github/BRANCH_PROTECTION.md).

Organization-level ruleset detail was not authorized for the observing caller
(`403`), so organization-wide inheritance is **UNKNOWN**. This receipt also
does not establish check conclusions, deployment health, GitHub environment
protection, repository secret-scanning configuration, secret values, or
repository-level merge-button preferences.

## Observed `main` controls

| Control | Observed value |
|---|---|
| Pull request required | Yes |
| Required approving reviews | `0` |
| Dismiss stale reviews on push | No |
| Code-owner review required | No |
| Approval of the last reviewable push required | No |
| Review-thread resolution required | Yes |
| Extra approval for unattributed changes | Yes |
| Allowed merge methods in the ruleset | Squash only |
| Required signed commits | Yes |
| Required checks use strict/up-to-date mode | Yes |
| Branch deletion | Blocked |
| Non-fast-forward updates | Blocked |
| Ruleset bypass actors | None |
| Current caller can bypass | Never |

Zero required approvals is the observed mechanical minimum. It is not an
independent-review receipt and must not be rewritten as one required approval.

## Required status contexts

Exactly five contexts were returned by the authenticated readback:

| Context | GitHub Actions integration |
|---|---|
| `Runtime Audit (audit:full)` | `15368` |
| `Security Gate (blocking)` | `15368` |
| `E2E Gate` | `15368` |
| `severity-gate` | `15368` |
| `lockfiles / No lockfile references a Replit-internal registry host` | Not returned by the API |

Only this live list is branch-required as of the observation. Additional jobs
declared in workflow files, including future candidate promotion gates, are
source-defined checks rather than required ruleset contexts until they pass on
the exact candidate head, are added without weakening existing controls, and
appear in a new authenticated readback.

## Change and emergency boundary

Every change, including an emergency change, remains subject to the observed
pull-request rule, the five required contexts, signed commits, conversation
resolution, and the no-bypass ruleset. Before reporting any change as active,
read back the complete repository ruleset and retain a new sanitized receipt.
Repository policy must never infer live enforcement from YAML or documentation
alone.
