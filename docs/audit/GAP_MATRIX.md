# Gap Matrix — SZL Holdings Platform

**Date:** April 18, 2026  
**Supersedes:** `docs/audit/series-a-gap-register.md` for the purposes of this audit  
**Machine-readable:** `docs/audit/gap-matrix.json`  
**Status:** AUTHORITATIVE for launch-readiness decisions

---

## Severity Scale

| Severity | Meaning |
|----------|---------|
| **CRITICAL** | Blocks Series A close or live tenant onboarding |
| **HIGH** | Must resolve before commercial availability |
| **MEDIUM** | Should resolve before broad GTM |
| **LOW** | Quality improvement; does not block revenue |

---

## Open Gaps

| ID | Severity | Area | Finding | Owner | Target | Waived? |
|----|----------|------|---------|-------|--------|---------|
| GAP-004 | HIGH | Infrastructure | `CORS_ORIGINS` not updated for custom domain `szlholdings.com` | Ops | Before DNS cutover | No |
| GAP-005 | HIGH | Billing | Stripe in test/demo mode — no live charges | Founder/Finance | Before first charge | No |
| GAP-007 | MEDIUM | Security | No rate limiting on public marketing routes | Platform Eng | Q2 2026 | No |
| GAP-002 | MEDIUM | Security | Route auth coverage not CI-enforced (manual at 91%) | Platform Eng | Q2 2026 | No |
| GAP-010 | MEDIUM | Docs | Stale Azure infrastructure references in docs | Platform Eng | Q2 2026 | No |
| GAP-011 | MEDIUM | Features | Mapbox token not configured — map views blank | Ops | Before demo | No — demo blocker |
| GAP-012 | MEDIUM | Features | Resend API key not configured — emails silently dropped | Ops | Before customer email | No |
| GAP-013 | MEDIUM | Features | Live AIS subscription missing — Vessels uses simulated positions | Ops/BD | Commercial launch | No |
| GAP-014 | MEDIUM | Features | Pulse live AI briefing generation not wired | Platform Eng | Q2 2026 | No |
| GAP-015 | MEDIUM | Infrastructure | `PUBLIC_APP_URL` still Replit hostname — update for custom domain | Ops | Before DNS cutover | No |
| GAP-016 | HIGH | Security | `ALLOY_INTERNAL_TOKEN` grants full super_admin — no granular scoping | Platform Eng | Q2 2026 | No |
| GAP-017 | HIGH | Architecture | No persistent message queue — background tasks lost on restart | Platform Eng | Before scale | No |
| GAP-018 | MEDIUM | Testing | Low unit test coverage (~16% route coverage) | Platform Eng | Q3 2026 | No |
| GAP-019 | LOW | Testing | No cross-browser E2E (Chromium only in CI) | Platform Eng | Q3 2026 | No |
| GAP-020 | LOW | Testing | No mobile E2E coverage (Playwright cannot target RN) | Platform Eng | Q3 2026 | No |
| GAP-021 | MEDIUM | Features | Aegis 8 new security modules not connected to APIs | Platform Eng | Q2 2026 | No |
| GAP-022 | MEDIUM | Features | Vessels 3 commercial modules not connected to DB/API | Platform Eng | Q2 2026 | No |
| GAP-023 | LOW | Features | Pulse PDF export not implemented | Platform Eng | Q2 2026 | No |
| GAP-024 | LOW | Features | Pulse email subscription not implemented | Platform Eng | Q2 2026 | No |
| GAP-025 | MEDIUM | Workflows | 6 artifact workflows (aegis, carlota-jo, command, pulse, terra, vessels) were FAILED | Platform Eng | **FIXED April 18** | **Closed** |

---

## Closed Gaps (Reference)

| ID | Severity | Finding | Closed On | Notes |
|----|----------|---------|-----------|-------|
| GAP-001 | HIGH | Zod input validation 12% → 84% | April 18, 2026 | CI script enforces 80% floor |
| GAP-003 | MEDIUM | In-memory session store | April 18, 2026 | Sessions now in PostgreSQL |
| GAP-006 | MEDIUM | No Sentry error monitoring | April 18, 2026 | Sentry wired across all 6 web apps + API |
| GAP-008 | LOW | `container-publish.yml` archived artifact entry | April 16, 2026 | Entry removed |
| GAP-009 | LOW | CI integration test pnpm/Node version mismatch | April 16, 2026 | Standardized to pnpm 10 / Node 22 |
| GAP-025 | HIGH | **6 failing artifact dev workflows** | **April 18, 2026** | **localPort changed to 9090 (shared proxy)** |

---

## Gap Summary by Area

| Area | Critical | High | Medium | Low | Total |
|------|---------|------|--------|-----|-------|
| Security | 0 | 2 | 2 | 0 | 4 |
| Infrastructure | 0 | 1 | 1 | 0 | 2 |
| Billing | 0 | 1 | 0 | 0 | 1 |
| Features (data/integrations) | 0 | 0 | 4 | 0 | 4 |
| Features (UI/functionality) | 0 | 0 | 2 | 2 | 4 |
| Testing | 0 | 0 | 1 | 2 | 3 |
| Architecture | 0 | 1 | 0 | 0 | 1 |
| Docs | 0 | 0 | 1 | 0 | 1 |
| **Total** | **0** | **5** | **11** | **4** | **20** |

---

## Launch Decision Recommendation

**CONDITIONAL GO for investor demo.** No critical gaps. Five HIGH gaps must be resolved before first paying customer:
1. GAP-004 — CORS for custom domain
2. GAP-005 — Stripe live keys
3. GAP-016 — ALLOY_INTERNAL_TOKEN scoping
4. GAP-017 — Persistent job queue
5. GAP-015 — PUBLIC_APP_URL for custom domain

**Immediate action needed for demo:** GAP-011 (Mapbox token) is a demo blocker — map views are blank.

---

*See also: `docs/audit/gap-matrix.json`, `docs/audit/KNOWN_LIMITATIONS.md`, `docs/audit/RELEASE_READINESS.md`*
