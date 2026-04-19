# Branch Rulesets and Protections — SZL Holdings Platform

Last updated: 2026-04-19

> **Resolved (2026-04-19):** Repository was made **public** to unlock the branch protection API (alternative to the GitHub Team upgrade). Branch protection is now active on both `main` and `master` with all six required status checks. The repo is owned by the `szl-holdings` organization (the earlier `stephenlutar2-hash` reference was incorrect and has been fixed throughout this directory).
>
> **Visibility decision (2026-04-19):** Owner explicitly chose to **stay public** rather than upgrade the org to GitHub Team and re-privatize. Rationale, secret/PII sweep evidence, and the reversal path are recorded in [`repo-visibility-decision.md`](./repo-visibility-decision.md).

This document defines the exact branch protection and ruleset configuration required for the repository. It pairs with `/ops/github/manual-click-paths.md` which provides the step-by-step GitHub UI instructions.

---

## Configuration Status

| Item | Status | Notes |
|------|--------|-------|
| `codeql.yml` workflow | **Done** | Runs on every PR; job name `analyze` |
| `dependency-review.yml` workflow | **Done** | Runs on every PR; fails on high/critical CVE |
| Branch protection on `main` | **Done** | Applied 2026-04-19 via REST API (equivalent of `configure-branch-protection.sh`) |
| Branch protection on `master` | **Done** | Applied 2026-04-19 — all six required checks active |
| `CodeQL Analysis / analyze` as required check | **Done** | Listed in required contexts on both branches |
| `Dependency Review` as required check | **Done** | Listed in required contexts on both branches |
| `Security Audit & SBOM / Security Gate (blocking)` as required check | **Done** | Listed in required contexts on both branches |

### Verification evidence (2026-04-19)

`GET /repos/szl-holdings/szl-holdings-platform/branches/{main,master}/protection` returned identical config on both branches:

- `required_status_checks.strict: true`
- `required_status_checks.contexts: ["CI Gate","E2E Gate","Lighthouse Gate","CodeQL Analysis / analyze","Dependency Review","Security Audit & SBOM / Security Gate (blocking)"]`
- `enforce_admins.enabled: true`
- `required_pull_request_reviews.required_approving_review_count: 1`
- `required_pull_request_reviews.require_code_owner_reviews: true`
- `allow_force_pushes: false`, `allow_deletions: false`, `required_conversation_resolution: true`

> **How it was unblocked:** Repository visibility was changed from private to **public**. This is the no-cost alternative to upgrading the org to GitHub Team — both unlock the branch protection API. If the repo needs to be made private again later, the org must first be upgraded to GitHub Team or the protection rules will become unenforceable.

---

## End-to-end gate verification (task #2043, 2026-04-19)

A throwaway PR was opened to verify that branch protection actually blocks a PR introducing known high/critical CVEs.

### Test PR

- **PR:** [szl-holdings/szl-holdings-platform#25](https://github.com/szl-holdings/szl-holdings-platform/pull/25) — `verify(security): prove branch protection blocks vulnerable deps (task #2043)`
- **Branch:** `verify/security-gates-2026-04-19` (deleted after verification)
- **Base:** `master`
- **Change:** Added two known-vulnerable dependencies to root `package.json`:
  - `minimist@1.2.5` — CVE-2021-44906 (Critical, prototype pollution)
  - `lodash@4.17.20` — CVE-2021-23337 (High, command injection)

### Result

| Aspect | Status | Evidence |
|---|---|---|
| PR opened against protected branch | ✅ | `POST /repos/.../pulls` → 201 |
| Merge button disabled | ✅ | `GET /repos/.../pulls/25` → `mergeable_state: "blocked"` |
| Branch protection enforces required checks | ✅ | Combined status: `pending`; required checks not satisfied |
| `Dependency Review` workflow ran on the PR | ❌ | `GET /repos/.../commits/{sha}/check-runs` → `total_count: 0` |
| `CodeQL Analysis / analyze` workflow ran on the PR | ❌ | Same — no check runs at all |
| `Dependency Review` actively *failed* on the CVEs | ❌ **NOT PROVEN** | Workflow never executed |

### Critical gap discovered

The required workflow files (`dependency-review.yml`, `codeql.yml`, `ci.yml`, `e2e.yml`, `lighthouse.yml`, `security.yml`) exist in this Replit workspace under `.github/workflows/` but **are not present in the GitHub repository**:

```
GET /repos/szl-holdings/szl-holdings-platform/contents/.github/workflows
→ 404 Not Found
```

The only workflow registered in GitHub Actions is the auto-generated `Dependabot Updates`. Because the actual workflow files were never pushed to the remote, the required checks will *always* be pending, which means:

- ✅ **Negative case proven:** merging is blocked when the required checks have not reported (mergeable_state = `blocked`).
- ❌ **Positive case NOT proven:** we cannot demonstrate that `Dependency Review` actively fails on a known CVE, because the workflow does not run.

This is the equivalent of "the alarm wiring is in place, but the alarm itself was never installed." Branch protection is doing its job by refusing to merge — but if the workflows ever do get pushed and start passing trivially (e.g. they crash before the gate runs), nothing here would catch a regression. The verification needs to be re-run once the workflow files are actually present in the repo.

### Cleanup

- The verification PR was closed without merging.
- The vulnerable-dep commit on the verification branch was reverted (the branch was rolled back to the original `package.json` content).
- The verification branch was deleted via `DELETE /repos/.../git/refs/heads/verify/security-gates-2026-04-19` → 204.

### Re-check attempted (task #2188, 2026-04-19)

Task #2188 was opened to re-run the verification end-to-end once the security workflow files were pushed to the remote. Re-checking the prerequisite today:

| Probe | Result |
|---|---|
| `GET /repos/szl-holdings/szl-holdings-platform/contents/.github/workflows` | `404 Not Found` |
| `GET /repos/szl-holdings/szl-holdings-platform/actions/workflows` | `total_count: 1` — only `Dependabot Updates` (auto-generated) |
| `master` branch tip | `660b308` @ `2026-04-15T20:56:01Z` (unchanged since the original verification) |
| Replit GitHub connector OAuth scopes | `read:org, read:project, read:user, repo, user:email` — still **no `workflow` scope** |

**Conclusion:** The precondition for this task — security workflow files actually present on the remote — has not changed since 2026-04-19's original attempt. The positive case (Dependency Review reporting `conclusion: failure` on a known CVE) still cannot be proven from this environment. Re-running the vulnerable-PR test is deferred until the "Push the security workflow files to GitHub" follow-up is completed (requires a local `git push` from a clone with normal credentials, or a re-issued connector token that includes the `workflow` scope). The "Unblock playbook" steps 1–6 above remain the procedure to execute once that prerequisite is met.

### Why the positive case could not be completed from this environment

We attempted a second variant — a single PR adding *both* the workflow YAML files (so they would run from the PR head) *and* the vulnerable dependencies. GitHub rejected the writes with `404 Not Found` on `PUT /repos/.../contents/.github/workflows/dependency-review.yml`. The Replit GitHub connector's OAuth token holds scopes `read:org, read:project, read:user, repo, user:email` — it does **not** hold the `workflow` scope, and GitHub blocks any API write that touches `.github/workflows/*` without that scope. The fallback branch was deleted; no workflow files were left in the repo.

### Unblock playbook (to finish task #2043 end-to-end)

Run these steps from a local clone with normal `git` credentials (which have full repo access including workflow files), or re-issue the connector with the `workflow` scope:

1. From a local clone of `szl-holdings/szl-holdings-platform`, copy the `.github/workflows/` directory from this Replit workspace and `git push` it to `master` (and `main`).
2. Confirm the Actions tab now lists `Dependency Review`, `CodeQL Analysis`, `CI Gate`, `E2E Gate`, `Lighthouse Gate`, and `Security Audit & SBOM`.
3. Re-create branch `verify/security-gates` with the same `package.json` change (add `minimist@1.2.5` and `lodash@4.17.20`).
4. Open a PR against `master` and wait for `Dependency Review` to report `conclusion: failure`.
5. Capture a screenshot of the failed check + the disabled merge button and append it to this section.
6. Close the PR and delete the branch.

---

## Target Branch: `main` (and `master` if present)

Both `main` and `master` should have identical protection rules applied. The canonical default branch is `main`; `master` is kept for legacy compatibility.

---

## Required Ruleset Configuration

### Ruleset Name: `main-protection`

| Setting | Value | Rationale |
|---------|-------|-----------|
| Enforcement status | **Active** | Always enforced |
| Target branches | `main`, `master` | Both trunk branches |
| Restrict deletions | **On** | Prevent accidental branch deletion |
| Require linear history | **Off** | Allow merge commits for release branches |
| Require signed commits | **Off** (recommended to enable later) | Enables commit provenance |
| Require a pull request before merging | **On** | No direct commits to trunk |
| Required approvals | **1** | Minimum review gate |
| Dismiss stale reviews on new commits | **On** | Force re-review after changes |
| Require review from CODEOWNERS | **On** | Domain-specific ownership enforced |
| Restrict who can dismiss reviews | **On** (owner only) | Prevent self-dismissal |
| Require status checks to pass | **On** | CI must be green |
| Required status checks | See below | All CI gates must pass |
| Require branches to be up to date | **On** | No stale-branch merges |
| Block force pushes | **On** | Preserve history integrity |
| Restrict force pushes | **On** | No exceptions |
| Require deployments to succeed | **Off** (optional) | Enable once staging deploy is reliable |

---

## Required Status Checks

The following status checks must be listed as required in the branch ruleset:

| Check Name | Workflow | Purpose |
|-----------|---------|---------|
| `CI Gate` | `ci.yml` | Lint + typecheck + test + build must all pass |
| `E2E Gate` | `e2e.yml` | Playwright E2E must pass across all apps |
| `Lighthouse Gate` | `lighthouse.yml` | Perf/accessibility thresholds enforced |
| `CodeQL Analysis / analyze` | `codeql.yml` | SAST must complete without critical findings |
| `Dependency Review` | `dependency-review.yml` | No high/critical CVE introductions |
| `Security Audit & SBOM / Security Gate (blocking)` | `security.yml` | Fan-in gate: secret scanning (Gitleaks), dependency vulnerability scan, and lockfile integrity must all pass |

> **Note**: GitHub requires status checks to have run at least once before they can be selected as required checks in the UI. Merge a test PR first if adding a new check.

### Continuous secret scanning (non-blocking, post-merge)

In addition to the PR-time Gitleaks gate above, the repo runs continuous
secret scanning so any credential that slips past the PR gate (or that
existed before the gate was added) is caught daily:

| Layer | Where | Cadence |
|---|---|---|
| GitHub native secret scanning + push protection | Repo Settings → Code security (must be **Enabled** — public repos get this free) | Continuous (push-time + history) |
| `Secret Scan (Scheduled — main)` workflow | `.github/workflows/secret-scan-scheduled.yml` | Daily 06:17 UTC + manual dispatch; uploads SARIF to the Security tab and opens a triage issue on any finding |

Triage flow and one-time enablement steps for the GitHub-native toggles
are in [`secret-scanning-runbook.md`](./secret-scanning-runbook.md).

---

## GitHub Environment Protection Rules

### `staging` Environment

| Setting | Value |
|---------|-------|
| Required reviewers | None (auto-deploys on push to main) |
| Wait timer | None |
| Deployment branches | `main`, `master` |

### `production` Environment

| Setting | Value |
|---------|-------|
| Required reviewers | 1 (repo owner or designated reviewer) |
| Wait timer | None (review serves as gate) |
| Deployment branches | Protected branches only (`main`, `master`) |

---

## Dependabot Configuration Reference

File: `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    reviewers:
      - "stephenlutar2-hash"
    labels:
      - "dependencies"
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        dependency-type: "development"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/New_York"
    reviewers:
      - "stephenlutar2-hash"
    labels:
      - "dependencies"
      - "github-actions"
```

---

## Recommended Repository Settings

These settings should be configured in **Settings → General**:

| Setting | Value |
|---------|-------|
| Default branch | `main` |
| Allow merge commits | On |
| Allow squash merging | On (default for PRs) |
| Allow rebase merging | Off (keeps history clean) |
| Automatically delete head branches | On |
| Allow auto-merge | Off (manual review only) |

---

## CodeQL Configuration

CodeQL is configured in `.github/workflows/codeql.yml` for `javascript-typescript`. It runs:
- On every push to `main`/`master`
- On every PR targeting `main`/`master`
- Weekly on Mondays at 06:00 UTC

Findings are reported in **Security → Code scanning alerts**. Critical and high findings block merging when the status check is required.

---

## Audit and Compliance

- All merges to `main` produce an audit trail via GitHub's audit log
- CODEOWNERS ensures every path change is reviewed by the designated owner
- The deploy-production environment requires approval, creating a human gate before production changes
- SBOM artifacts are retained for 90 days for compliance purposes
