# SZL Holdings — Investor Diligence Readiness

**Date:** 2026-04-27
**Scope:** Honest, evidence-backed assessment of what is verifiable vs. aspirational for investor due diligence
**Evidence base:** Diligence audit task #3206; `generated/platform-metrics.json`; build/lint/typecheck outputs

---

## Executive Summary

SZL Holdings operates a TypeScript monorepo whose generated truth artifact currently measures 197 workspace packages. Other inventory totals in this historical diligence snapshot require fresh measurement before reuse. The platform concept — governed agentic decision infrastructure — is architecturally differentiated and implemented in code. Release-readiness and production-readiness claims remain gated by current verification evidence.

**Bottom line:** The platform has genuine technical depth and a real implementation. It is not a mockup. It is also not production-ready. Honest framing for investor conversations: early-alpha infrastructure with a functioning demo tier.

---

## What Is Verifiable (Evidence-Backed)

### Architecture & Code Substance
| Claim | Evidence | Status |
|-------|----------|--------|
| TypeScript pnpm monorepo | 6,235 TS/TSX files (3,801 TS + 2,434 TSX); pnpm-lock.yaml present | ✅ verified |
| 15 registered product artifacts | workspace artifact registry; artifact directories present | ✅ verified |
| 152 shared packages | `generated/platform-metrics.json` lib:51 + standalone:101 | ✅ verified |
| 1,047 database table definitions | `lib/db/src/schema`; Drizzle pgTable grep count via `generated/platform-metrics.json` | ✅ verified |
| 59 SQL migrations | `generated/platform-metrics.json` `migrations: 59` | ✅ verified |
| 180 API route files; 6,063 route handlers | `generated/platform-metrics.json` route handler grep count | ✅ verified |
| 12/12 platform primitives declared | packages present on disk (outcome-graph, proof-chain, replay-core, trace-graph, covenant-policy, guardian, signal-mesh, prism-bus, monte-carlo, forge-runtime, skill-library, shared-ui) | ✅ verified |
| 387 test files | git ls-files count | ✅ verified |
| 25 GitHub CI workflows | `.github/workflows/` directory count | ✅ verified |
| Append-only proof chain | `lib/proof-chain` implemented; hash-linkage in source | ✅ verified |
| Policy-governed AI (covenant policy) | `lib/covenant-policy`; approval gates in middleware | ✅ verified |
| Multi-provider AI routing | Anthropic + OpenAI proxied; API health confirmed | ✅ verified |
| OIDC/PKCE authentication | `lib/auth`; Replit OIDC configured | ✅ verified |
| PostgreSQL with Drizzle ORM | `@szl-holdings/db`; health endpoint returns 11ms DB latency | ✅ verified |

### Product Surfaces (Demo-Tier)
| Surface | What Is Real | What Is Seeded/Simulated |
|---------|-------------|--------------------------|
| SZL Holdings Dashboard | Static content, auth, public feed integrations | Dashboard KPIs, genome score |
| Aegis (PARAGON) | CISA KEV, NVD CVE, MITRE ATT&CK v14 live | Security event scenarios |
| Counsel | Matter tracking, legal hold, obligation mapping | e-signature pending; CourtListener token pending |
| Pulse (LUMINA) | AI multi-provider briefing generation | Some signal inputs seeded |
| Carlota Jo | Service catalog, contact flow, live integrations | Task queue partially seeded |
| API Server | All auth-gated routes; health endpoint | Demo-mode data for most domains |
| Vessels (SEXTANT) | Port monitoring, vessel tracking, delay detection | AIS telemetry simulated; commercial modules pending |
| Terra (DOMAINE) | NYC distress property data | Maps blank (Mapbox token required) |
| Lyte (KORA) | Decision intelligence routes functional | Signal fusion runs on seeded data |

---

## What Requires Disclosure

### Engineering Pipeline Failures (as of 2026-04-27)

| Check | Result | Details |
|-------|--------|---------|
| TypeScript typecheck | **FAIL** | 9 packages: `aef-sdk`, `reflection-engine`, `aef-storage-adapters`, `alloy-rank-worker`, `alloy-embed-worker`, `aef-retrieval-core`, `aef-policy-guard`, `@szl-holdings/db`, `api-client-react` |
| Biome lint | **FAIL** | 23 errors, 15,060 warnings across 6,780 files |
| Build (`turbo run build`) | **FAIL** | `@szl-holdings/sdk` TypeScript errors cascade to 10 dependent packages including `a11oy`, `szl-holdings-mobile`, `szl-demo-video` |
| Unit tests | **FAIL** | api-server governance test failures (4); `billing_audit_log` relation missing (schema/migration gap) |
| E2E tests | **NOT RUN** | Playwright not executed this audit run |

**Implication:** Any investor claim that the CI pipeline is fully green is not currently accurate. The platform has active build failures that would block a clean CI run.

### Known Gaps

| Gap | Impact |
|----|--------|
| AIS telemetry simulated (not live) | Vessels demo does not reflect live maritime data |
| Mapbox token not configured | Terra map visualization completely blank |
| In-memory sessions only (no Redis) | Session loss on server restart in production |
| No production error monitoring (Sentry not configured) | Errors in production undetectable |
| SOC 2 Type II not initiated | Enterprise procurement likely blocked |
| No SBOM in CI | Supply chain transparency gap |
| No production customers | Zero revenue; no live enterprise deployment |
| Migration ordering issue (Task #2886) | 12 DB statements fail on missing table relations at startup; non-fatal but present |

---

## What Should Not Be Claimed to Investors

| Claim to Avoid | Why |
|---------------|-----|
| "Production-ready" or "GA" | Build fails; no production customers; no SOC 2 |
| "All CI checks pass" | Typecheck, lint, and build all fail as of 2026-04-27 |
| "Real-time AIS data" | AIS is simulated in the demo environment |
| "100 packages" or "14 artifacts" | Stale numbers; use 15 registered artifacts, 152 packages |
| "Strict TypeScript throughout" | TypeScript is used everywhere but typecheck does not pass cleanly |
| Screenshots as "live platform captures" | No screenshots in git index; provenance unverifiable from code |

---

## Honest Investor Framing

**What to say:**

> SZL Holdings has built a governed agentic decision infrastructure platform — a real TypeScript codebase with 6,235 source files, 15 product surfaces, 152 packages, and 1,047 database table definitions. The core primitives — proof chain, policy engine, signal mesh, Monte Carlo simulation, decision replay — are implemented in code, not described in a deck. Seven product surfaces are functional in alpha. The platform is at early-alpha stage: demo-ready for investor walkthroughs, not yet production-deployed with live customers. We have identified active build failures in the engineering pipeline that we are resolving as a priority before our next release milestone.

---

## Diligence Package Status

| Document | Status |
|----------|--------|
| CLAIM_RECONCILIATION_MATRIX.md | ✅ Created this audit |
| RELEASE_READINESS_SCORECARD.md | ✅ Updated this audit |
| EXECUTIVE_AUDIT_SUMMARY.md | ✅ Updated this audit |
| OPEN_RISKS.md | ✅ Updated this audit |
| OPERABILITY_MATRIX.md | ✅ Updated this audit |
| FIX_LOG.md | ✅ Updated this audit |
| DEPENDENCY_AND_SCRIPT_DRIFT.md | ✅ Created this audit |
| generated/platform-metrics.json | ✅ Regenerated 2026-04-27 |
| SOC 2 audit report | ❌ Not initiated |
| External security pentest | ❌ Not conducted |
| SBOM | ❌ Not generated |

---

*Generated by diligence audit task #3206 — 2026-04-27. Do not distribute without legal review.*
