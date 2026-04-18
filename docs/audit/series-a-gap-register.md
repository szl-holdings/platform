# Series A Gap Register

**Date:** April 16, 2026  
**Maintained by:** Platform Engineering  
**Scope:** All gaps identified during the Series A Wave 1–2 audit  
**Status:** Living document — update as gaps close or new gaps are identified

---

## Severity Definitions

| Severity | Definition |
|----------|-----------|
| **CRITICAL** | Blocks Series A close or live tenant onboarding |
| **HIGH** | Must resolve before general commercial availability |
| **MEDIUM** | Should resolve before broad go-to-market |
| **LOW** | Quality improvement; does not block revenue |
| **INFO** | Tracked for awareness; no action urgency |

---

## Open Gaps

### GAP-001 — Zod Input Validation Coverage at 21%

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Area** | API Server — backend route security |
| **Finding** | Only 21 of 170 top-level route files apply Zod input validation. Highest-risk routes (auth, forms, payments) are validated; low-traffic and admin routes are not. |
| **Risk** | Unvalidated inputs could bypass type expectations; injection surface for unexpected inputs. All DB queries use parameterized Drizzle ORM (no raw SQL), partially mitigating this. |
| **Owner** | Platform Engineering |
| **Target** | Q2 2026 — ≥80% coverage |
| **Wave** | 3–4 |
| **Tracking** | `docs/audit/security-remediation-log.md` REM-002 |

---

### GAP-002 — Route Security Matrix Not Automated

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Area** | API Server — security tooling |
| **Finding** | 155/170 routes have auth middleware, but the count is from manual inspection. No CI step automatically detects routes missing auth. New routes can slip through without auth. |
| **Risk** | Gradual auth coverage regression as routes are added. |
| **Owner** | Platform Engineering |
| **Target** | Q2 2026 |
| **Wave** | 3–4 |
| **Tracking** | `docs/audit/security-remediation-log.md` REM-003 |

---

### GAP-003 — In-Memory Session Store

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Area** | API Server — session management |
| **Finding** | Sessions stored in memory. Sessions lost on server restart. Does not support horizontal scaling. |
| **Risk** | Users are logged out on server restart or deployment. Limits production reliability for multi-instance scenarios. |
| **Mitigation** | Short session TTL; single-instance deployment currently. |
| **Owner** | Platform Engineering |
| **Target** | Before first paid production tenant |
| **Wave** | 3–4 |
| **Tracking** | `docs/audit/security-remediation-log.md` REM-004 |

---

### GAP-004 — CORS_ORIGINS Not Set for Production Custom Domain

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Area** | Infrastructure — production readiness |
| **Finding** | `CORS_ORIGINS` in `.replit [userenv.production]` is set to `*.replit.app,*.replit.dev,*.repl.co`. When `szlholdings.com` goes live as the primary domain, this must be updated. |
| **Risk** | CORS errors for users on custom domain if not updated before launch. |
| **Owner** | Infrastructure |
| **Target** | Before custom domain DNS cutover |
| **Wave** | 3–4 |

---

### GAP-005 — Stripe in Demo/Test Mode

| Field | Value |
|-------|-------|
| **Severity** | HIGH (before revenue launch) |
| **Area** | Billing — production readiness |
| **Finding** | Stripe integration is fully implemented but requires live `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Currently in test/demo mode — no real charges processed. |
| **Risk** | No revenue can be collected until live keys are configured. |
| **Owner** | Founder / Finance |
| **Target** | Before first paid transaction |
| **Wave** | External credential — not a code change |

---

### GAP-006 — No External Error Monitoring (Sentry)

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Area** | Observability — production operations |
| **Finding** | No `SENTRY_DSN` configured. Production errors logged to console/pino only. No alerting on error spikes. |
| **Risk** | Silent failures in production. No proactive error alerting. |
| **Owner** | Platform Engineering |
| **Target** | Before first paying tenant |
| **Wave** | 3–4 |
| **Status** | **CLOSED — April 18, 2026** — `SENTRY_DSN` (API server) and `VITE_SENTRY_DSN` (web frontends) configured as Replit secrets. Sentry SDK fully wired in codebase: Express error handler (`artifacts/api-server/src/lib/sentry.ts`), unhandled exception + rejection capture, PII scrubbing on Authorization/Cookie/x-internal-token headers, browser tracing + session replay (10% session / 100% on error) across all six web apps (`lib/observability/src/react/sentry.ts`), and custom lightweight HTTP reporter for Expo mobile (`artifacts/szl-holdings-mobile/lib/sentry.ts`). Global error boundaries with Sentry capture in `lib/shared-ui/src/error-boundary.tsx`. Sentry init status exposed in `/api/healthz` under `services.errorTracking` (dsnConfigured + initialized fields). Scope: web frontends + API server — mobile (`EXPO_PUBLIC_SENTRY_DSN`) tracked as a separate follow-up (task #1753). |

---

### GAP-007 — No Rate Limiting on Public Marketing Pages

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Area** | Security — DDoS mitigation |
| **Finding** | Rate limiting is applied to auth and write endpoints. Public marketing routes (/, /trust-center, etc.) have no rate limiting. |
| **Risk** | Susceptible to crawling and DDoS traffic spikes on public pages. |
| **Owner** | Platform Engineering |
| **Target** | Q2 2026 |
| **Wave** | 3–4 |

---

### GAP-008 — `container-publish.yml` References Archived Artifact

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Area** | CI/CD — workflow hygiene |
| **Finding** | `container-publish.yml` build matrix includes `lyte-command-center` as a service. This artifact is archived and no longer has a Dockerfile. The workflow would fail for this matrix entry if triggered. |
| **Risk** | Container publish workflow fails on `lyte-command-center` entry. Affects CI signal quality. |
| **Owner** | Platform Engineering |
| **Status** | **CLOSED — April 16, 2026** — `lyte-command-center` entry removed from build matrix and summary in `container-publish.yml` |

---

### GAP-009 — `ci.yml` Integration Test Job Uses Inconsistent pnpm/Node Versions

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Area** | CI — consistency |
| **Finding** | The `integration-test` job in `ci.yml` uses `pnpm/action-setup@v4` with `version: 9` and `setup-node` with `node-version: '20'`, while all other CI jobs use pnpm 10 and Node 22. |
| **Risk** | Integration tests run in a different environment than unit tests. Could mask version-specific failures. |
| **Owner** | Platform Engineering |
| **Target** | Wave 3–4 |
| **Wave** | 3–4 |

---

### GAP-010 — Remaining Stale Azure References in Operational Docs

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Area** | Documentation — deployment narrative |
| **Finding** | Several documents reference Azure App Service, Azure Bicep, and Azure Key Vault as deployment infrastructure. The canonical deployment model is Replit. The primary stale reference in `REPLIT_OPERATIONS.md` release section has been fixed directly in Wave 1–2. Remaining references are in deprecated/historical docs. |
| **Fixed in Wave 1–2** | `REPLIT_OPERATIONS.md` release section — "Deploy via Azure Bicep" replaced with Replit deployment instructions |
| **Remaining affected files** | `DEPLOYMENT_READINESS.md` (already marked deprecated), `docs/production-readiness.md §2`, `docs/DEPLOYMENT_MODEL.md` |
| **Owner** | Platform Engineering |
| **Target** | Wave 3–4 doc cleanup for remaining files |
| **Wave** | 3–4 |
| **Tracking** | `docs/architecture/canonical-deployment-model.md` §Stale References |

---

### GAP-011 — `cortex-mobile` Artifact Unscaffolded

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Area** | Artifact management |
| **Finding** | `artifacts/cortex-mobile` has Expo configuration and `app/` directory but is not registered as an artifact in `artifact.toml`. Separate from `szl-holdings-mobile`. |
| **Risk** | Artifact limit of 15 active — must coordinate before registering. |
| **Owner** | Platform Engineering |
| **Target** | Wave 3–4 or when CORTEX mobile scope is clarified |
| **Wave** | 3–4 |

---

### GAP-012 — Archived Artifact Directories Not Fully Cleaned Up

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Area** | Repository hygiene |
| **Finding** | Five archived artifact directories remain (`firestorm`, `lyte-command-center`, `imperium`, `prism-counsel`, `stephen-site`). Each has residual dist/, node_modules/, or config files. The `stephen-site` workflow may still be running. |
| **Risk** | Confusing to new team members; creates artifact count pressure at the 15-artifact limit. |
| **Owner** | Platform Engineering |
| **Target** | Wave 3–4 |
| **Wave** | 3–4 |

---

### GAP-013 — E2E Test Coverage Sparse

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Area** | Testing — quality assurance |
| **Finding** | `playwright.config.ts` exists and workflows are configured for E2E. Per `QA_SUMMARY.md`, E2E test files exist but test coverage is limited — mutation/write paths for several apps are not covered. |
| **Risk** | Regressions in critical user flows may not be caught before deployment. |
| **Owner** | Platform Engineering |
| **Target** | Wave 5–6 |
| **Wave** | 5–6 |
| **Tracking** | `QA_SUMMARY.md` Known QA Gaps |

---

### GAP-014 — No Persistent Production Log Aggregation

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Area** | Observability — operations |
| **Finding** | Production logs go to pino (console) only. No Logtail, Datadog, or structured log aggregation service configured. Logs not searchable post-restart. |
| **Risk** | Incident investigation limited to real-time console access. |
| **Owner** | Platform Engineering |
| **Target** | Before first paying tenant |
| **Wave** | 5–6 |

---

### GAP-015 — `PUBLIC_APP_URL` Needs Update When Custom Domain Live

| Field | Value |
|-------|-------|
| **Severity** | INFO |
| **Area** | Infrastructure |
| **Finding** | `.replit [userenv.production]` has `PUBLIC_APP_URL = "https://szlholdings.replit.app"`. Must be updated to `https://szlholdings.com` when custom domain is pointed. |
| **Risk** | OG tags, canonical URLs, and email links may reference the `.replit.app` domain. |
| **Owner** | Infrastructure |
| **Target** | DNS cutover |

---

## Closed Gaps (Verified Clean)

| Gap ID | Description | Closed Date |
|--------|-------------|------------|
| GAP-006 | No external error monitoring (Sentry) | April 18, 2026 — SENTRY_DSN and VITE_SENTRY_DSN configured; SDK fully wired across API server and all six web apps; mobile (EXPO_PUBLIC_SENTRY_DSN) pending |
| GAP-C001 | Secrets in source-controlled files | April 16, 2026 — None found |
| GAP-C002 | GitHub Actions not pinned to SHAs | April 16, 2026 — All 13 workflows fully pinned (ci, e2e, build, deploy-staging, deploy-production, security, codeql, dependency-review, lighthouse, release, npm-publish, container-publish, prism-counsel-ci) |
| GAP-C003 | Dormant maven/nuget/rubygems publish workflows | April 16, 2026 — These workflows do not exist |
| GAP-C004 | Workflow permissions not least-privilege | April 16, 2026 — All workflows verified |
| GAP-C005 | `codeql.yml` missing top-level deny-by-default permissions | April 16, 2026 — `permissions: {}` present |
| GAP-C006 | Demo credentials embedded in `replit.md` | April 16, 2026 — No credential values present, only references to SECRETS_SETUP.md |
| GAP-C007 | Real secrets in `.env.example` | April 16, 2026 — All values are safe placeholders |
| GAP-C008 | Deployment doctrine ambiguity (Replit vs Azure) | April 16, 2026 — Resolved: Replit is primary. Documented in canonical-deployment-model.md. Direct fixes applied to: REPLIT_OPERATIONS.md (release section), docs/production-readiness.md (section 2 clarification), docs/DEPLOYMENT_MODEL.md (superseded notice). DEPLOYMENT_READINESS.md already deprecated. |
| GAP-008 | `container-publish.yml` references archived `lyte-command-center` artifact | April 16, 2026 — `lyte-command-center` entry removed from build matrix and summary step |

---

_For remediation owners: link your PR or task to the gap ID when closing. Update status to "CLOSED" and add closed date._
