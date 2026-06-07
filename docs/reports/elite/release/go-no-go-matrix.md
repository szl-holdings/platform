# Go/No-Go Decision Matrix

## Decision Table

| Criteria | Weight | GO | CONDITIONAL | NO-GO |
|----------|--------|-----|-------------|-------|
| CI checks pass | Mandatory | All pass | All pass | Any fail |
| No critical vulnerabilities | Mandatory | Zero | Zero | Any |
| Rollback plan ready | Mandatory | Tested | Documented | Missing |
| Release owner available | Mandatory | Yes | Yes | No |
| Monitoring plan | Mandatory | In place | In place | Missing |
| Changelog written | Recommended | Complete | Partial | — |
| Help center updated | Recommended | Complete | Partial | — |
| Support briefed | Recommended | Complete | Partial | — |
| Feature flags configured | Recommended | Yes | N/A | — |
| E2E tests pass | Recommended | All pass | Most pass | — |

## Decision Rules
- **GO**: All mandatory pass + majority recommended pass
- **CONDITIONAL GO**: All mandatory pass + documented exceptions for recommended
- **NO-GO**: Any mandatory fails
- **DEFER**: External blocker prevents release

## Escalation Path
1. Release owner recommends
2. Product lead decides
3. Decision and rationale documented in release notes
