# GitHub Hardening Audit

## Current State (Before)

| Item | Status |
|------|--------|
| CI workflow | Minimal — only builds api-server |
| Build workflow | Duplicate of CI, only api-server |
| Deploy workflow | Placeholder |
| CodeQL | Missing |
| Dependency review | Missing |
| Release workflow | Missing |
| CODEOWNERS | Missing |
| PR template | Exists |
| Issue templates | Exists (bug_report, feature_request) |
| Dependabot | Exists (npm weekly, github-actions weekly) |
| Branch protection | Documented but may not be enforced |

## Actions Taken

| Item | Action | Status |
|------|--------|--------|
| CI workflow | Upgraded: matrix build for all 8 web apps + api-server, typecheck matrix | DONE |
| Build workflow | Upgraded: sequential build of all 9 services | DONE |
| CodeQL workflow | Created: JavaScript/TypeScript scanning, weekly + PR | DONE |
| Dependency review | Created: fail-on-severity high, deny GPL-3.0/AGPL-3.0 | DONE |
| Release workflow | Created: tag-triggered with auto-changelog | DONE |
| CODEOWNERS | Created: all paths assigned to @stephenlutar2-hash | DONE |

## Recommended Manual Actions (GitHub UI)

1. **Enable branch protection** on `master`:
   - Require PR before merging
   - Require at least 1 approval
   - Require status checks: `build-api`, `build-web`, `typecheck`
   - Block force push
   - Block branch deletion
2. **Enable secret scanning** and push protection
3. **Enable code scanning alerts**
4. **Review Dependabot alerts** and resolve any high/critical
