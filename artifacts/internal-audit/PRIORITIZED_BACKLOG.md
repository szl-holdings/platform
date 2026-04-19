# Prioritized Backlog
**SZL Holdings — Governed Operational Intelligence**  
**Audit Date:** April 19, 2026  
**Sorted by:** Priority, then impact

---

## P0 — In Progress / Done

| Item | Domain | Owner | Status |
|---|---|---|---|
| Demo Launchpad | Command | Platform | ✅ Done |
| Capability manifest | Internal Audit | Platform | ✅ Done |
| Founder review pack | Internal Audit | Platform | ✅ Done |
| Port conflict fixes (lyte, counsel) | Platform | Platform | ✅ Done |

---

## P1 — Before Next Investor Meeting

| Item | Domain | Est. Time | Notes |
|---|---|---|---|
| Activate email (RESEND_API_KEY) | Platform | 5 min | Unblocks notifications, contact forms, approvals |
| Wire Carlota Jo Stripe checkout | Carlota Jo | 1 day | Billing demo path |
| Add MARINETRAFFIC_API_KEY | Vessels | 2 hrs | Live AIS demo |
| Fix DB migration tables | Platform | 2 hrs | `pnpm seed:all` |

---

## P2 — Before First Design Partner

| Item | Domain | Est. Time | Notes |
|---|---|---|---|
| Connect Pulse to live AI generation | Pulse | 3 days | Connect OPENAI_API_KEY to briefing pipeline |
| Terra ETL health monitor page | Terra | 1 day | Prove data freshness |
| SIEM reference connector (Sentinel) | Aegis | 1 week | One live vendor path |
| SOC 2 Type II audit engagement | Compliance | External | Engage audit firm |
| Add PDF export to Pulse reader | Pulse | 2 days | Premium leave-behind |
| Wire SSO for enterprise pilot | Platform | 3 days | Configure IdP |
| Demo request form end-to-end tracking | Platform | 1 day | Analytics + email |

---

## P3 — Before GA

| Item | Domain | Est. Time | Notes |
|---|---|---|---|
| Self-serve Terra demo mode | Terra | 1 week | Guided walkthrough |
| Self-serve Vessels demo mode | Vessels | 1 week | Guided walkthrough |
| OpenAPI portal at /api/docs | Platform | 1 day | Swagger UI |
| Enable NVD CVE + CISA KEV polling | Aegis | 4 hrs | Enable schedule |
| Add CourtListener API token | PRISM Counsel | 1 hr | Rate limit fix |
| Activate Redis cache | Platform | 1 hr | REDIS_URL |
| IP_HASH_SALT security hardening | Platform | 30 min | |
| Terra + Vessels trust pages | Terra, Vessels | 2 days | |
| Interactive persona switcher in demo | Command | 3 days | Richer demo tool |

---

## P4 — Post-GA

| Item | Domain | Est. Time | Notes |
|---|---|---|---|
| Dedicated admin panel app | Platform | 2 weeks | Full admin UI |
| Memory Fabric UI surface | Platform | 1 week | Low investor priority |
| SCIM provisioning | Platform | 1 week | Enterprise HR system sync |
| CourtListener/PACER direct integration | PRISM Counsel | 1 week | Enhanced legal data |

---

## Ongoing / Continuous

| Item | Cadence | Notes |
|---|---|---|
| Docs drift check | Weekly | Ensure docs match running code |
| Deprecated link scan | On merge | check-deprecated-links workflow |
| Integration smoke test | Daily | smoke-test-integrations workflow |
| Capability manifest update | Monthly | Re-audit capabilities |
