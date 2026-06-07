# Required Status Checks Matrix

Generated: 2026-04-02

## Branch Protection: `master`

All checks configured via GitHub API. Strict mode enabled (branch must be up-to-date before merging).

| Check Name | Workflow | Trigger | Required for Merge | Blocking |
|-----------|----------|---------|-------------------|----------|
| `CI / lint` | `ci.yml` | push, PR | Yes | Yes |
| `CI / typecheck` | `ci.yml` | push, PR | Yes | Yes |
| `CI / test` | `ci.yml` | push, PR | Yes | Yes |
| `CI / build-api` | `ci.yml` | push, PR | Yes | Yes |
| `CI / build-web (all apps)` | `ci.yml` | push, PR | Yes | Yes |
| `E2E Tests / e2e` | `e2e.yml` | push, PR | Yes | Yes |
| `CodeQL Analysis / analyze` | `codeql.yml` | push, PR, weekly | Yes | Yes |
| `CI` (gate job) | `ci.yml` | push, PR | Recommended | Aggregate |
| `Build Check / build-all` | `build.yml` | push only | No | No |
| `Dependency Review` | `dependency-review.yml` | PR only | Recommended | Yes (high severity) |
| `Lighthouse CI` | `lighthouse.yml` | push, PR | No (advisory) | No |
| `Release` | `release.yml` | tag push only | N/A | N/A |

## Notes

- 7 required status checks are active on the `master` branch (verified via GitHub API)
- The `CI` aggregate gate job validates that all CI sub-jobs passed (lint, typecheck, test, build-api, build-web)
- `build.yml` runs sequentially and is informational — it catches sequential build chain issues but is not a PR gate
- Lighthouse scores are advisory (continue-on-error); thresholds set to warn, not fail
- Dependency Review blocks PRs introducing high-severity vulnerabilities or GPL-3.0/AGPL-3.0 licensed dependencies

## Adding New Required Checks

To add a check to branch protection, use the GitHub API:

```bash
# Get current protection
GET /repos/stephenlutar2-hash/szl-holdings-platform/branches/master/protection

# Update required status checks (include ALL existing checks + new one)
PUT /repos/stephenlutar2-hash/szl-holdings-platform/branches/master/protection
```

Always include the full list of existing contexts when updating — the API replaces, not appends.
