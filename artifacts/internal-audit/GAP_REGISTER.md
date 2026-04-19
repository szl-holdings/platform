# Gap Register
**SZL Holdings — Governed Operational Intelligence**  
**Audit Date:** April 19, 2026  
**Priority:** P1 = investor demo blocker, P2 = design partner blocker, P3 = GA blocker, P4 = post-GA

---

| ID | Gap | Domain | Priority | Status | Fix Complexity | Notes |
|---|---|---|---|---|---|---|
| GAP-001 | Email delivery not activated | Platform | P1 | Open | Low (minutes) | Add RESEND_API_KEY |
| GAP-002 | Carlota Jo Stripe checkout not wired | Carlota Jo | P1 | Open | Low (1 day) | Build `/checkout` → Stripe session |
| GAP-003 | Vessels AIS is demo-only | Vessels | P1 | Open | Low (2 hrs) | Add MARINETRAFFIC_API_KEY |
| GAP-004 | DB tables missing (eval_forge_*) | Platform | P2 | Open | Low | platform_settings fixed 2026-04-19; eval_forge tables still need migration |
| GAP-005 | SSO/SCIM not configured | Platform | P2 | Open | Medium | Configure IdP credentials |
| GAP-006 | Pulse briefings not AI-generated live | Pulse | P2 | Open | Medium | Connect AI provider to briefing pipeline |
| GAP-007 | Terra ETL has no health monitor UI | Terra | P2 | Open | Low (1 day) | Build ingestion status page |
| GAP-008 | SIEM connectors stubbed | Aegis | P2 | Open | High | Wire one reference vendor (Sentinel) |
| GAP-009 | REDIS_URL not configured | Platform | P3 | Open | Low | Performance only; add REDIS_URL |
| GAP-010 | No self-serve Terra demo mode | Terra | P3 | Open | Medium | Guided walkthrough |
| GAP-011 | No self-serve Vessels demo mode | Vessels | P3 | Open | Medium | Guided walkthrough |
| GAP-012 | OpenAPI portal not hosted | Platform | P3 | Open | Low | Mount Swagger at /api/docs |
| GAP-013 | NVD CVE feed not actively polled | Aegis | P3 | Open | Low | Enable polling schedule |
| GAP-014 | CISA KEV feed not actively polled | Aegis | P3 | Open | Low | Enable polling schedule |
| GAP-015 | CourtListener API not using auth token | PRISM Counsel | P3 | Open | Low | Add COURT_LISTENER_API_TOKEN |
| GAP-016 | Admin panel has no dedicated UI app | Platform | P4 | Open | High | Build admin app post-GA |
| GAP-017 | Memory Fabric has no UI surface | Platform | P4 | Open | Medium | Low priority for investors |
| GAP-018 | SOC 2 Type II audit not engaged | Compliance | P2 | Open | High (external) | Engage audit firm |
| GAP-019 | IP_HASH_SALT not set | Platform | P3 | Open | Trivial | Security hardening |
| GAP-020 | PDF export for Pulse briefings not working | Pulse | P2 | Open | Medium | Wire PDF generation |

---

## Gap Count by Priority

| Priority | Count | Description |
|---|---|---|
| P1 | 3 | Must fix before investor demo |
| P2 | 6 | Must fix before design partner |
| P3 | 7 | Must fix before GA |
| P4 | 2 | Post-GA improvements |
| **Total** | **18** | |

---

## Closed Gaps (Fixed in Singularity Program)

| ID | Gap | Resolution |
|---|---|---|
| GAP-CLOSED-001 | Lyte workflow port conflict | Fixed by workflow restart |
| GAP-CLOSED-002 | Counsel workflow port conflict | Fixed by workflow restart |
| GAP-CLOSED-003 | No Demo Launchpad | Built at `/command/demo` |
| GAP-CLOSED-004 | No capability manifest | Created in internal-audit/ |
| GAP-CLOSED-005 | No founder review pack | 13 docs created |
| GAP-CLOSED-006 | No demo script | Created with 10/20/45 min tracks |
| GAP-CLOSED-007 | Demo Launchpad not in Command nav | Added to Strategy section |
| GAP-CLOSED-008 | platform_settings table missing from DB | Created via SQL + added migration 0079_platform_settings.sql |
| GAP-CLOSED-009 | governance-persistence test beforeAll hook timeout (10s) | Raised hookTimeout to 30s in vitest.config.ts |
| GAP-CLOSED-010 | runtime-crash-resume child poll window too tight (5s vs ~10s tsx startup) | Raised crash-child Postgres poll timeout to 20s |
