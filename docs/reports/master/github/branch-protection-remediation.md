# Branch Protection Remediation Report

Generated: 2026-04-02

## Repository: stephenlutar2-hash/szl-holdings-platform

## Branch: `master`

## Actions Taken

| Setting | Before | After | Status |
|---------|--------|-------|--------|
| Require PR before merging | Unknown | Enabled | DONE |
| Required approvals | None | 1 | DONE |
| Dismiss stale reviews | Unknown | Enabled | DONE |
| Require code owner reviews | Unknown | Enabled | DONE |
| Require conversation resolution | Unknown | Enabled | DONE |
| Allow force pushes | Unknown | Disabled | DONE |
| Allow deletions | Unknown | Disabled | DONE |
| Enforce admins | Unknown | Enabled | DONE |
| Required status checks | None | 7 checks | DONE |
| Strict status checks (up-to-date) | Unknown | Enabled | DONE |

## Required Status Checks Configured

1. `CI / build-api` — API server TypeScript build
2. `CI / build-web (all apps)` — All 7 web app builds (matrix)
3. `CI / lint` — ESLint across workspace
4. `CI / typecheck` — TypeScript type checking across workspace
5. `CI / test` — Vitest unit + component tests
6. `E2E Tests / e2e` — Playwright smoke tests for all 7 web apps
7. `CodeQL Analysis / analyze` — GitHub CodeQL security scanning

## Security Features (Confirmed Active)

| Feature | Status |
|---------|--------|
| Secret scanning | Enabled |
| Secret scanning push protection | Enabled |
| Dependabot security updates | Enabled |
| Dependency vulnerability alerts | Enabled |
| Automated security fixes | Enabled |

## Branch Protection Method

Branch protection rules were configured programmatically via the GitHub REST API using the Replit GitHub integration (OAuth token with `repo` scope). The API endpoint used was:

```
PUT /repos/stephenlutar2-hash/szl-holdings-platform/branches/master/protection
```

## Notes

- `secret_scanning_non_provider_patterns` and `secret_scanning_validity_checks` remain disabled — these are advanced features not required for baseline security
- Restrictions (team/user access) are not applied — `restrictions: null` means all collaborators with write access can push to PRs
- Branch protection `enforce_admins: true` means admins are also subject to protection rules
