# Branch Protection Policy

> SZL Holdings Platform Governance · April 2026

This document defines the branch protection policy for the SZL Holdings platform repository. These settings must be applied manually in the GitHub repository settings UI. See the specific steps in `.github/BRANCH_PROTECTION.md`.

---

## Default Branch: `master`

### Protection Rules

| Rule | Setting | Rationale |
|------|---------|-----------|
| Require pull request before merging | Enabled | No direct pushes to master |
| Required approvals | 1 | Minimum; increase to 2 when team grows |
| Dismiss stale approvals on new push | Enabled | Prevents rubber-stamping |
| Require Code Owner review | Enabled | CODEOWNERS enforced; every path lists two owners so self-authored maintenance PRs are reviewable without disabling `enforce_admins` (see `CONTRIBUTING.md` → "Code Owner Reviewer Policy") |
| Require conversation resolution | Enabled | No unresolved threads at merge |
| Require branches to be up to date | Enabled | Prevents stale PR merges |
| Do not allow bypassing for admins | Enabled | Admins follow the same process |
| Allow force pushes | Disabled | History is immutable |
| Allow deletions | Disabled | Default branch cannot be deleted |

### Required Status Checks

The following status checks must pass before merge:
- `CI Gate` — lint, typecheck, test, build, smoke
- `E2E Gate` — Playwright end-to-end tests
- `Lighthouse Gate` — Performance thresholds
- `dependency-review` — Vulnerability scan
- `analyze` — CodeQL analysis

---

## Branch Naming Convention

```
feat/<scope>/<description>
fix/<scope>/<description>
refactor/<scope>/<description>
docs/<description>
chore/<description>
```

Scope is the affected artifact or library: `api-server`, `vessels`, `terra`, `command`, `shared-ui`, `db`, etc.

---

## Merge Strategy

| Strategy | Status |
|----------|--------|
| Squash merge | Enabled — default for PRs |
| Merge commit | Disabled |
| Rebase merge | Disabled |
| Auto-delete head branches | Enabled |

Squash merging keeps the master history clean and readable. Every merged PR is a single commit with a conventional commits message.

---

## Emergency Changes

In a genuine production emergency:
1. The emergency fix must still go through a PR
2. The required reviewer can be another trusted engineer (or self-review with a detailed audit log entry)
3. The PR must be labeled `emergency-hotfix`
4. A post-incident review entry must be added to the incident log within 24 hours

There is no bypass mechanism for branch protection. This is by design.

---

*SZL Holdings Platform Governance · April 2026*
