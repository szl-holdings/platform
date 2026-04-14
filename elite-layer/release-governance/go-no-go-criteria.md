# Go/No-Go Criteria — SZL Holdings

## Mandatory (All Must Pass for GO)

| # | Criteria | Owner |
|---|----------|-------|
| 1 | All CI checks pass (lint, typecheck, build) | Engineering |
| 2 | No critical/high security vulnerabilities | Security |
| 3 | Rollback plan documented and tested | Engineering |
| 4 | Release owner identified and available | Management |
| 5 | Post-release monitoring plan in place | Engineering |

## Strongly Recommended (Should Pass Unless Exception Documented)

| # | Criteria | Owner |
|---|----------|-------|
| 6 | Changelog and release notes written | Product |
| 7 | Help center updated for user-facing changes | Support |
| 8 | Support team briefed | Support |
| 9 | Feature flags configured for new features | Engineering |
| 10 | E2E tests pass on affected areas | QA |

## Nice to Have (Track, Don't Block)

| # | Criteria | Owner |
|---|----------|-------|
| 11 | Performance benchmarks stable | Engineering |
| 12 | Mobile app tested | Mobile |
| 13 | Trust center updated | Compliance |
| 14 | Analytics events instrumented | Product |

## Decision Framework
- **GO**: All mandatory criteria pass, majority of recommended pass
- **CONDITIONAL GO**: All mandatory pass, some recommended have documented exceptions
- **NO-GO**: Any mandatory criteria fails, or multiple recommended criteria fail without mitigation
- **DEFER**: External dependency blocks release (e.g., vendor API change)

## Escalation
If consensus cannot be reached:
1. Release owner makes recommendation
2. Product lead makes final call
3. Decision and rationale documented
