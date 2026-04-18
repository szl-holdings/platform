# Mock, Stub, and Placeholder Register

**Date:** April 18, 2026  
**Supersedes:** `docs/audit/mock-stub-placeholder-register.md` (April 16 version)  
**Purpose:** Canonical register of every mock, stub, placeholder, and hardcoded value — tagged by severity  
**Severity tags:** `ship-blocker` | `demo-blocker` | `polish` | `acceptable`

---

## Severity Definitions

| Tag | Meaning |
|-----|---------|
| `ship-blocker` | Must be resolved before any paying customer traffic |
| `demo-blocker` | Prevents credible investor/partner demo in this area |
| `polish` | Noticeable gap but won't derail a demo; fix before broad launch |
| `acceptable` | Intentional placeholder; clearly labeled; acceptable pre-revenue |

---

## Section 1: Hardcoded UI Values

| ID | Item | Artifact | Location | Severity | Notes |
|----|------|---------|----------|---------|-------|
| HC-001 | Autopilot header genome score | szl-holdings | Autopilot header component | `polish` | Static number; not wired to live API |
| HC-002 | Autopilot header job count | szl-holdings | Autopilot header component | `polish` | Static number |
| HC-003 | Client satisfaction scores | szl-holdings | Forge client module | `polish` | Hardcoded; needs live survey data |
| HC-004 | Command domain health scores (Aegis 91, Vessels 87, etc.) | command | Strategy dashboard | `acceptable` | Seeded/demo values — clearly labeled |
| HC-005 | CORTEX cross-domain badge counts | command | Command sidebar | `polish` | Not wired to live signal counts |
| HC-006 | Command Overview KPIs | command | Overview dashboard | `polish` | New modules not yet wired |

---

## Section 2: Seeded / Simulated Data (Intentional — Acceptable)

These items are populated via idempotent seed scripts and are by design for pre-commercial operation.

| ID | Domain | Item | Script | Severity |
|----|--------|------|--------|---------|
| SD-001 | Lyte | Business metrics (revenue, pipeline, headcount) | `seed-demo-data.ts` | `acceptable` |
| SD-002 | Lyte | PRISM scores | `seed-demo-data.ts` | `acceptable` |
| SD-003 | Lyte | Approval latency metrics | `seed-demo-data.ts` | `acceptable` |
| SD-004 | Aegis | SIEM event logs | `seed-demo-data.ts` | `acceptable` |
| SD-005 | Aegis | Incident tickets | `seed-demo-data.ts` | `acceptable` |
| SD-006 | Aegis | SOC analyst workload metrics | `seed-demo-data.ts` | `acceptable` |
| SD-007 | Vessels | AIS vessel positions | `seed-marine-extended.ts` | `acceptable` |
| SD-008 | Vessels | Voyage P&L calculations | `seed-marine-extended.ts` | `acceptable` |
| SD-009 | Vessels | Dark vessel detection events | `seed-marine-extended.ts` | `acceptable` |
| SD-010 | Terra | Portfolio performance metrics | `seed-demo-data.ts` | `acceptable` |
| SD-011 | Terra | Broker CRM data | `seed-demo-data.ts` | `acceptable` |
| SD-012 | Command | Workflow completion metrics | `seed-demo-data.ts` | `acceptable` |
| SD-013 | Command | Agent performance metrics | `seed-agent-os.ts` | `acceptable` |
| SD-014 | Carlota Jo | Client engagement history | `seed-carlota-clients.ts` | `acceptable` |
| SD-015 | Carlota Jo | Advisory session notes | `seed-carlota-clients.ts` | `acceptable` |

---

## Section 3: Stub Integrations (Missing Credentials)

| ID | Integration | Location | Missing Secret | Severity | Demo Impact |
|----|------------|---------|----------------|---------|-------------|
| ST-001 | Stripe billing | `api-server/src/routes/billing.ts` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `ship-blocker` | No revenue collection; demo mode OK |
| ST-002 | Transactional email (Resend) | `lib/services` email module | `RESEND_API_KEY` | `ship-blocker` | Emails silently dropped |
| ST-003 | Mapbox maps | Vessels, Terra frontends | `MAPBOX_ACCESS_TOKEN` | `demo-blocker` | Map views blank in demo |
| ST-004 | Live AIS feed | `lib/intelligence-feeds` | No subscription (MarineTraffic/AISHub) | `demo-blocker` | Vessels uses simulated positions |
| ST-005 | Azure AD SSO/SCIM | `api-server/src/routes/scim.ts` | Tenant admin consent needed | `ship-blocker` | Enterprise SSO blocked |
| ST-006 | Power BI embedded analytics | Various | Per-tenant Power BI workspace token | `ship-blocker` | Enterprise analytics blocked |
| ST-007 | Slack bot | Various | `SLACK_BOT_TOKEN` | `polish` | No Slack notifications |
| ST-008 | Twilio SMS | Various | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | `polish` | No SMS alerts |
| ST-009 | Google OAuth | carlota-jo | `GOOGLE_CLIENT_ID` | `polish` | Google sign-in unavailable |
| ST-010 | Notion API | aegis | `NOTION_API_KEY` | `polish` | Notion integration inactive |
| ST-011 | SendGrid | `lib/services` | `SENDGRID_API_KEY` | `acceptable` | Resend is canonical; SendGrid is backup |
| ST-012 | HuggingFace Inference API | `lib/ai-engine` | `HF_TOKEN` | `polish` | Falls back to OpenAI/Anthropic |

---

## Section 4: Placeholder UI Panels (Not Yet Wired)

| ID | Surface | Artifact | Notes | Severity |
|----|---------|---------|-------|---------|
| PL-001 | CISO Executive Dashboard | aegis | 8 new security module KPIs not aggregated | `polish` |
| PL-002 | New Aegis security modules (8) | aegis | UI complete; case management APIs not wired | `polish` |
| PL-003 | Vessels insurance module | vessels | UI complete; DB/API not connected | `polish` |
| PL-004 | Vessels trading module | vessels | UI complete; not connected | `polish` |
| PL-005 | Vessels platform module | vessels | UI complete; not connected | `polish` |
| PL-006 | Pulse morning briefing (live AI) | pulse | Static demo content; AI model not wired | `polish` |
| PL-007 | Pulse PDF export | pulse | Not implemented | `polish` |
| PL-008 | Pulse email subscription | pulse | Not implemented | `polish` |

---

## Section 5: Known Broken/Risky Items

| ID | Item | Location | Severity | Notes |
|----|------|---------|---------|-------|
| BK-001 | `seed-prism-counsel.ts` recovery tables | `scripts/` | `acceptable` | Broken seed script for deprecated PRISM Counsel |
| BK-002 | ALLOY_INTERNAL_TOKEN — super_admin scope | API server | `ship-blocker` | Token grants full super_admin; no granular scoping |
| BK-003 | In-process background jobs (no queue) | API server | `ship-blocker` | Tasks lost on server restart (AI inference, notifications) |
| BK-004 | No persistent message queue (Redis/RabbitMQ) | API server | `ship-blocker` | Single process; no horizontal scaling for jobs |
| BK-005 | Firestorm seed endpoint | api-server | `ship-blocker` | Must be guarded in production (existing task) |

---

## Section 6: Demo Mode Artifacts (Intentionally Fake — Clearly Labeled)

| ID | Item | Location | Purpose |
|----|------|---------|---------|
| DM-001 | Demo data badges ("Demo", "Pilot", "Live") | `lib/shared-ui/data-state-badge.tsx` | Explicit user-facing labeling |
| DM-002 | Command demo-mode scenario engine | `artifacts/command/src/operations/lib/demo-mode.tsx` | Simulates PRISM workflow for demos |
| DM-003 | Pulse `?demo` mode | `artifacts/pulse` | Demo flag persists for session |
| DM-004 | Cognitive Consoles fallback demo data | `artifacts/command/src/cognitive/` | Rich fallback when API endpoints not yet live |
| DM-005 | OS Layer demo data (`os-demo-data.ts`) | `lib/shared-ui/src/os-demo-data.ts` | Cross-variant seed for all 7 portfolio domains |

---

## Remediation Priorities

### Immediate (before next investor demo)
1. **ST-003** — Configure `MAPBOX_ACCESS_TOKEN` — map views are blank
2. **HC-001/002** — Wire Autopilot header to live API or note as "demo value"

### Before first paying customer
1. **ST-001** — Configure live Stripe keys
2. **ST-002** — Configure Resend API key
3. **BK-002** — Scope ALLOY_INTERNAL_TOKEN properly
4. **BK-003/004** — Implement persistent job queue
5. **ST-005** — Activate Azure AD SSO/SCIM for enterprise tenants

---

*See also: `docs/audit/KNOWN_LIMITATIONS.md`, `docs/audit/GAP_MATRIX.md`*
