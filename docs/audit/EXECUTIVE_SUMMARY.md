# Executive Summary — Launch-Readiness Audit

**Date:** April 18, 2026  
**Auditor:** Platform Engineering  
**Scope:** Full SZL Holdings monorepo — all 11 artifacts, 34 shared libraries, 15 packages  
**Status:** AUTHORITATIVE — supersedes all prior partial audit summaries

---

## What This Audit Covered

1. Workflow health repair (6 failing dev workflows)
2. Capability inventory (100 capabilities across 11 domains)
3. Surface visibility map (every route + nav entry)
4. Mock/stub/placeholder register (severity-tagged)
5. Environment variable and secrets audit (156 variables)
6. Database schema and migration review
7. Test pyramid and CI gap analysis
8. Release readiness gate assessment
9. Known limitations register
10. Demo script (investor-ready click-path)
11. Gap matrix with remediation priorities

---

## What the Platform Claims — and Whether It Delivers

### Governed Autonomy Platform
**Claim:** A signal-to-decision loop across 8 domains with proof chain, approval gates, and AI-generated rationale.  
**Reality:** ✅ **Confirmed.** Outcome Graph, Proof Chain, Covenant Policy, and Alloy Workflow Engine are live and functional. Decision loop UI is demo-ready across Command, Vessels, Terra, and Carlota Jo.

### Multi-Domain Enterprise Intelligence
**Claim:** Maritime, real estate, defense, consulting, and business observability on a single platform.  
**Reality:** ✅ **Confirmed.** Seven deployed web apps, one mobile app, one API server — all running on shared schema, shared auth, and shared intelligence feeds.

### Real Intelligence (Not Just Pretty Charts)
**Claim:** Live data feeds — weather, geopolitics, CVEs, real estate, financial data.  
**Reality:** ✅ **Confirmed.** 14+ live API integrations active: NOAA, GDELT, CISA KEV, NVD, MITRE ATT&CK, NYC Open Data, Census ACS, FEMA NRI, SEC EDGAR, BLS, Open-Meteo, World Bank, AbuseIPDB, GitHub Trending.

### Production-Grade Security
**Claim:** OIDC auth, RBAC, audit trail, Zod validation, field encryption.  
**Reality:** ✅ **Mostly confirmed.** One critical note: `ALLOY_INTERNAL_TOKEN` grants full super_admin — needs scoping before first external tenant.

---

## What Was Found Broken — And What Was Fixed

### Fixed April 18, 2026

| Item | Root Cause | Fix Applied |
|------|-----------|------------|
| **6 artifact dev workflows failing** (aegis, carlota-jo, terra, command, pulse, vessels) | `localPort` in `artifact.toml` misconfigured — not matching shared proxy port 9090 | Set `localPort = 9090` in each artifact's `artifact.toml` |

All 8 critical workflows are now `RUNNING`:
- `artifacts/szl-holdings: web` ✅
- `artifacts/api-server: api` ✅
- `artifacts/command: web` ✅
- `artifacts/vessels: web` ✅
- `artifacts/terra: web` ✅
- `artifacts/aegis: web` ✅
- `artifacts/carlota-jo: web` ✅
- `artifacts/pulse: web` ✅

### Previously Fixed (Before This Audit)

| Item | Closed Date |
|------|------------|
| Zod validation coverage 12% → 84% (CI-enforced) | April 18, 2026 |
| Session store: in-memory → PostgreSQL | April 18, 2026 |
| Sentry: not configured → active on all apps | April 18, 2026 |
| `container-publish.yml` archived artifact reference | April 16, 2026 |

---

## Demo Blockers — Status

| Blocker | Status | Action Required |
|---------|--------|----------------|
| **Map views blank (Mapbox token missing)** | ❌ NOT FIXED | Configure `MAPBOX_ACCESS_TOKEN` in Replit Secrets (free tier OK for demos) |
| 6 failing workflows | ✅ FIXED | Done |
| Seeded data clearly labeled | ✅ Already acceptable | Demo/Pilot/Live badges in UI |

**One action required before investor demo:** Configure `MAPBOX_ACCESS_TOKEN`.

---

## Ship Blockers — Status

| Blocker | Status | Priority |
|---------|--------|---------|
| Stripe live keys not configured | ❌ Open | Before first charge |
| Resend API key not configured (emails dropped) | ❌ Open | Before customer emails |
| ALLOY_INTERNAL_TOKEN super_admin scope | ❌ Open | Before first external tenant |
| No persistent job queue (tasks lost on restart) | ❌ Open | Before scale |
| CORS not updated for custom domain | ❌ Open | Before DNS cutover |

---

## What Is Demo-Ready (Safe to Show)

| Area | Confidence |
|------|-----------|
| szl-holdings landing, Trust Center, legal pages | High |
| Unified Command — Strategy, Operations, Approvals, Blocker Board, Alloy Canvas, Infrastructure | High |
| Pulse executive briefing (demo mode) | High |
| Vessels — Fleet, Intelligence, Ports (avoid Insurance/Trading/Platform modules) | High |
| Terra — Properties, Portfolio, Market (skip map if no Mapbox) | High |
| Aegis — Pitch deck, Threats, Vulnerabilities, Compliance, Incidents | High |
| Carlota Jo — Landing, Services, Contact | High |
| Mobile (CORTEX) — manual demo | Medium |

---

## What Must NOT Be Shown in a Demo

1. Vessels → Insurance / Trading / Platform modules (blank UI)
2. Aegis → CISO Dashboard / 8 new security modules (not connected)
3. Pulse → Live AI generation / PDF export / Email subscription (not implemented)
4. Any map view if Mapbox token is not configured
5. szl-holdings Autopilot header (hardcoded placeholder values)

---

## Risk Assessment

| Risk | Severity | Notes |
|------|---------|-------|
| ALLOY_INTERNAL_TOKEN leakage | HIGH | Full platform compromise. Rotate immediately if exposed. |
| In-process job loss | MEDIUM | No queue. Acceptable pre-scale. |
| 16% test coverage | MEDIUM | Mitigate with careful change management. |
| Silent email drop | LOW-MEDIUM | No Resend key — users don't know emails failed. |
| Single-process backend | LOW | No scale risk at demo volume. |

---

## Canonical Commands Reference

```bash
# Start all workflows
# (via Replit Workflow panel — start all RUNNING)

# Run full demo seed
pnpm seed:demo
# or: bash scripts/seed-demo-canonical.sh

# Run all tests locally
pnpm lint && pnpm typecheck && pnpm test

# Run Playwright E2E
pnpm --filter @workspace/szl-holdings run test:e2e

# Smoke test all services
node scripts/qa/smoke-test-integrations.js

# Check deprecated links
node scripts/qa/check-deprecated-links.js

# Verify Zod coverage
bash scripts/check-zod-coverage.sh

# Push DB schema changes
pnpm db:push

# Health check
curl https://<your-domain>/api/health/detailed
```

---

## Recommended Next Actions (Ordered by Priority)

| Priority | Action | Effort | Owner |
|---------|--------|--------|-------|
| 1 | Configure `MAPBOX_ACCESS_TOKEN` in Replit Secrets | 5 min | Ops |
| 2 | Confirm financial figures with founder before external share | 1 hr | Founder |
| 3 | Configure `RESEND_API_KEY` | 15 min | Ops |
| 4 | Scope `ALLOY_INTERNAL_TOKEN` | 1–2 days | Platform Eng |
| 5 | Configure live Stripe keys | 1 hr | Founder/Finance |
| 6 | Implement persistent job queue (BullMQ/Redis) | 2–4 weeks | Platform Eng |
| 7 | Update `CORS_ORIGINS` + `PUBLIC_APP_URL` for custom domain | 30 min | Ops |
| 8 | Wire Pulse live AI briefing generation | 1–2 weeks | Platform Eng |
| 9 | Connect Aegis new modules + Vessels commercial modules | 2–4 weeks | Platform Eng |
| 10 | Add E2E test coverage for Pulse | 1 week | Platform Eng |

---

## Audit Documents Produced

All documents in `docs/audit/`:

| Document | Purpose |
|----------|---------|
| `CAPABILITY_INVENTORY.md` + `capability-inventory.json` | 100 capabilities with status and coverage |
| `SURFACE_MAP.md` | Route-by-route visibility audit |
| `MOCK_AND_STUB_REGISTER.md` | Severity-tagged mock/stub register |
| `GAP_MATRIX.md` + `gap-matrix.json` | 20 open gaps with owners and targets |
| `ENV_AND_SECRETS_REGISTER.md` | 156 env vars with tier and fallback analysis |
| `DB_SCHEMA_AND_MIGRATION_AUDIT.md` | 569-table schema, seed scripts, data integrity |
| `TEST_MATRIX.md` | Test pyramid, coverage, gaps |
| `RELEASE_READINESS.md` | 5-gate release checklist |
| `DEMO_SCRIPT.md` | Investor demo click-path with avoidance guide |
| `KNOWN_LIMITATIONS.md` | 19 documented limitations with remediation paths |
| `EXECUTIVE_SUMMARY.md` | This document |

---

*Audit completed: April 18, 2026. Next review target: Q2 2026 (before growth capital external close).*
