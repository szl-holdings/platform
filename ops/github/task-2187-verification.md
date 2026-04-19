# Task #2187 — workflow push verification

## Summary
The `.github/workflows/` directory was missing entirely from
`szl-holdings/szl-holdings-platform` on GitHub even though the YAMLs existed
in this Replit workspace. Task #2187 pushes them so the six required status
checks (CI Gate, E2E Gate, Lighthouse Gate, CodeQL Analysis / analyze,
Dependency Review, Security Audit & SBOM / Security Gate) actually run.

Direct push to `master` and `main` is blocked by branch protection (which is
working as designed), so the YAMLs were landed via PRs.

## Pull requests
- master: <https://github.com/szl-holdings/szl-holdings-platform/pull/26>
  - branch: `chore/add-security-workflows`
  - 16 workflow files added under `.github/workflows/`
- main: <https://github.com/szl-holdings/szl-holdings-platform/pull/27>
  - branch: `chore/add-security-workflows-main`
  - same 16 workflow files

## Required check status (PR #26 → master)
| Required status check                              | Status     |
|----------------------------------------------------|------------|
| CI Gate                                            | failure    |
| E2E Gate                                           | failure    |
| Lighthouse Gate                                    | failure    |
| CodeQL Analysis / analyze                          | success    |
| Dependency Review                                  | success    |
| Security Audit & SBOM / Security Gate (blocking)   | failure    |

Run links:
- CI: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630592781>
- E2E Tests: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630592763>
- Lighthouse CI: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630592762>
- CodeQL Analysis: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630592759>
- Dependency Review: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630592772>
- Security Audit & SBOM: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630592771>

## Required check status (PR #27 → main)
| Required status check                              | Status     |
|----------------------------------------------------|------------|
| CI Gate                                            | failure    |
| E2E Gate                                           | failure    |
| Lighthouse Gate                                    | failure    |
| CodeQL Analysis / analyze                          | success    |
| Dependency Review                                  | success    |
| Security Audit & SBOM / Security Gate (blocking)   | failure    |

Run links:
- CI: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630594871>
- E2E Tests: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630594883>
- Lighthouse CI: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630594864>
- CodeQL Analysis: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630594867>
- Dependency Review: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630594879>
- Security Audit & SBOM: <https://github.com/szl-holdings/szl-holdings-platform/actions/runs/24630594882>

## Acceptance criteria from task #2187
- [x] All workflow YAMLs in `.github/workflows/` are committed to GitHub
      (in PR branches `chore/add-security-workflows` and
      `chore/add-security-workflows-main`).
- [x] A subsequent push or PR triggers each workflow at least once
      (verified via the run links above).
- [x] The job names produced by the workflows match the required-status-check
      contexts exactly. The required check contexts use the `WorkflowName / JobName`
      shape; here is the mapping:
      - **CI Gate** ← `name: CI` workflow → `ci-gate` job named "CI Gate"
      - **E2E Gate** ← `name: E2E Tests` workflow → `e2e-gate` job named "E2E Gate"
      - **Lighthouse Gate** ← `name: Lighthouse CI` workflow → `lighthouse-gate` job named "Lighthouse Gate"
      - **CodeQL Analysis / analyze** ← `name: CodeQL Analysis` workflow → `analyze` job
      - **Dependency Review** ← `name: Dependency Review` workflow → `dependency-review` job
      - **Security Audit & SBOM / Security Gate (blocking)** ← `name: Security Audit & SBOM` workflow → `security-gate` job named "Security Gate (blocking)"
- [ ] **Not in scope:** Both PRs cannot merge until the gate failures are
      remediated. That work is captured as follow-up #2230.

## Tooling added in this repo
- `ops/github/push-workflows.sh` — manual fallback script for an operator with
  a classic GitHub PAT (`workflow` scope) to clone, copy, and push the workflow
  files. Includes inline usage docs.
- `.local/scripts/push-workflows.mjs` — direct push script (uses the GitHub
  Git Data API; blocked by branch protection on `master`/`main` as expected).
- `.local/scripts/push-workflows-pr.mjs` — PR-based push script that creates
  a feature branch and opens a PR for each protected branch.

## Auth used
A classic GitHub Personal Access Token with the `workflow` scope, stored as the
Replit secret `GH_WORKFLOW_TOKEN`. The Replit GitHub OAuth connection only
carries the `repo` scope, which is insufficient for `.github/workflows/`
changes. Migrating to a more durable credential is captured as follow-up #2231.
