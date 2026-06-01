# PLATFORM FACTS — SOURCE OF TRUTH

Captured: 2026-04-23. This file is the single authoritative count source. Public-facing docs (README, press kit, fact sheet, deployment readiness) MUST reconcile to these numbers.

## Verified counts (from `find` / `ls` / `rg` on this commit)

| Metric | Count | How verified |
| --- | --- | --- |
| **Production web artifacts** | 13 | `ls artifacts/` minus `mockup-sandbox` (design surface) and `szl-holdings-mobile` (mobile) and `api-server` (backend) and `szl-demo-video` (video). Web artifacts: aegis, carlota-jo, command, counsel, lyte-command-center, pulse, sentra, szl-holdings, terra, vessels + 3 derivatives |
| Web + mobile + video artifacts (all-up) | 14 | adds szl-holdings-mobile + szl-demo-video |
| Backend artifacts (api-server) | 1 | `artifacts/api-server/` |
| Design / sandbox artifacts | 1 | `artifacts/mockup-sandbox/` |
| **Packages + libs** | 119 | `ls packages/ lib/` directories |
| **DB schema files** | 170 | `find lib/db/src/schema -name "*.ts"` |
| **Drizzle migrations** | 50+ | `ls lib/db/drizzle/*.sql` |
| **API route files (api-server)** | 262 | `ls artifacts/api-server/src/routes/*.ts` |
| **API route handler registrations** | 3,367 | `rg -c "router\.(get|post|put|patch|delete)" artifacts/api-server/src/routes/` |
| **Skipped / `.todo` tests** | 114 | ripgrep `it\.skip`, `describe\.skip`, `\.todo` across test files |
| **Stale brand-string baseline entries** | 3,892 | `wc -l scripts/banned-brand-strings.baseline.json` |
| **Banned-brand violations beyond baseline** | 0 | `pnpm brand:strings` PASS |

## Authoritative artifact list (canonical names + slugs)

| Slug | Title | Kind |
| --- | --- | --- |
| sentra | Sentra — Cyber Resilience Command | web |
| api-server | API Server | web (backend) |
| lyte-command-center | Lyte — Decision Intelligence | web |
| counsel | Counsel — Legal Matter Command | web |
| carlota-jo | Carlota Jo Consulting | web |
| szl-holdings | SZL Holdings Dashboard | web |
| vessels | Vessels Maritime Intelligence | web |
| szl-holdings-mobile | SZL Holdings — Mobile Command | mobile |
| szl-demo-video | SZL Holdings — Governed Autonomy Demo | video |
| pulse | Pulse — AI Executive Briefing | web |
| aegis | SZL Holdings — Investor Pitch Deck | web |
| terra | Terra — Real Estate Intelligence | web |
| command | Unified Command | web |
| mockup-sandbox | NEXUS — Unified Agentic AI Layer | design |

## Test surface (verified PASS this pass)

| Suite | Result |
| --- | --- |
| `nexus-smoke-e2e` Playwright | 22/22 PASS, 15.6s |
| `lp-portal-uploads.test.ts` | 13/13 PASS |
| `mobile-auth-token-exchange.test.ts` | 8/8 PASS |
| `carlota-metrics.test.ts` | 5/5 PASS |
| `carlota-inquiry-inbox.test.ts` | 6/6 PASS (Task #1419 just merged) |
| `brand-names.test.ts` | 3/3 PASS |
| `brand-strings` | 0 new violations |

## Release status (truthful)

- **Validation:** GREEN at every measurement point this pass.
- **Hard blockers remaining:** 4 (see `GO_LIVE_BLOCKERS.md`).
- **Recommended go/no-go:** Conditional go (see `GO_LIVE_EXECUTIVE_SUMMARY.md`).

## How to use this file

When updating any public-facing doc with counts (README, fact sheet, press kit, demo guide, changelog, deployment readiness, trust center), use the numbers in this file. Do not hand-edit counts elsewhere without updating this file first. If you change a count here, scan for divergence:

```bash
rg -F "<old number>" docs/ README.md
```

and reconcile every match.
