# SZL Holdings — Demo Gap Report

*Prepared: April 2026*  
*Purpose: Document what is in scope for the current demo readiness effort, what is partially implemented, and what remains as future work.*

---

## 1. What Is Fully Demonstrable Now

These capabilities are live, data-seeded, and suitable for prospect, partner, and investor demonstrations:

### Lyte (Business Observability)
- Command Inbox with pending approval items
- PRISM framework — all five dimensions (Pulse, Risk, Intelligence, Signals, Motion)
- Signal lifecycle: signal → context → recommendation → approval → execution
- Approval gateway with human-in-the-loop enforcement
- Decision Ledger / audit trail with actor attribution
- Readiness module with SLA tracking
- Role-based views (executive vs. operator vs. analyst)

### Aegis (Security Command)
- SOC dashboard with active incident queue
- MITRE ATT&CK framework mapping
- CISA KEV and NVD CVE signal integration (live data)
- Incident lifecycle: detection → triage → containment
- Playbook recommendation engine with confidence scoring
- Evidence package generation
- Compliance readiness posture (SOC 2, ISO 27001 framework alignment)
- Dual-persona demo: CISO approval view + analyst execution view

### Vessels (Maritime Intelligence)
- Fleet command dashboard with vessel cards
- Voyage Twin model: cargo, route, crew, compliance, P&L
- AIS anomaly detection (dark vessel, route deviation)
- OFAC / sanctions screening workflow
- Voyage exception center
- Voyage P&L with revenue-at-risk modeling
- Compliance audit trail: full voyage decision record
- Dual-persona demo: Fleet Ops Director + CCO auditor view

### PRISM Counsel (Legal Matter Command)
- Matter Twin: parties, deadlines, documents, insurer behavior
- Statutory deadline tracking (NY DFS Regulation 68)
- Demand readiness scoring
- Settlement band forecasting
- Insurer behavior profiling
- Demand packet export to Word with source citations
- Proof chain: privilege-protected audit trail for every action
- Bad faith trigger detection

### Platform-Wide
- Demo data banners and data state badges (all platforms)
- Alloy execution fabric: workflow routing with approval gates
- Full audit trail with actor attribution on all consequential actions
- Demo reset scripts (`scripts/demo-reset/`)
- Role-based persona switching (executive, operator, analyst, auditor)
- Four polished demo narratives with realistic scenario data

---

## 2. Partially Implemented (Demo-Ready with Caveats)

These capabilities are functional but require verbal caveats during demo presentations.

### Live AIS Data (Vessels)
- **Current state:** Vessel positions are simulated. The AIS telemetry model is real; live feed integration requires an enterprise AIS provider subscription (e.g., Spire Maritime, exactEarth).
- **Demo caveat:** "Fleet positions are simulated in this environment. Live AIS is available at enterprise tier — the integration model is built."
- **Remaining work:** Activate an AIS provider contract; configure the Helmsman agent's live data connector.

### Live SIEM / EDR Connector (Aegis)
- **Current state:** Security signals in the demo are seeded. The Sentinel agent's connector framework supports SIEM integration (Splunk, Microsoft Sentinel). Live connections require tenant-side API access.
- **Demo caveat:** "Threat signals in this demo are representative. For your environment, we'd connect to your existing SIEM in the activation phase."
- **Remaining work:** Activate a tenant-configurable SIEM connector with OAuth flow.

### CRM Data Integration (Lyte)
- **Current state:** Pipeline signals in Lyte are seeded. CRM connectors (Salesforce, HubSpot) are in the connector registry but require tenant OAuth provisioning.
- **Demo caveat:** "This pipeline data represents a typical RevOps setup. For your organization, we'd connect directly to your CRM."
- **Remaining work:** Complete the Salesforce and HubSpot OAuth connector flows in Alloy.

### Medicare Lien Data (PRISM Counsel)
- **Current state:** The CMS MSPRP integration is modeled but the live query endpoint requires a registered CMS provider account.
- **Demo caveat:** "The Medicare lien query is seeded here. Live CMS MSPRP integration is available with the appropriate provider registration."
- **Remaining work:** Register CMS provider credentials; activate the MSPRP API connector.

### Mobile (CORTEX)
- **Current state:** The Expo mobile app is functional with seeded data. Push notification deep-linking and cross-domain badge counts are not yet live.
- **Demo caveat:** "The mobile command surface works — you can approve actions and see cross-domain alerts. Deep-linking from push notifications is on the roadmap."
- **Remaining work:** Push notification integration with approval deep-linking; live badge count API endpoints.

---

## 3. Out of Scope (Explicit Exclusions)

The following are explicitly excluded from the current demo readiness work:

- **Video production or GIF capture automation** — not required for live demos; screen recording is handled ad hoc
- **External marketing materials** (one-pagers, pitch decks, brochures) — handled separately
- **Pricing and packaging decisions** — pre-revenue; pricing is not part of the demo flow
- **Live customer data** — all demo environments use seeded or synthetic data only; no production data is ever used in demos
- **Automated sales sequences** — demo access requests route to the founder directly; no automated CRM sequences

---

## 4. Recommended Future Work

These items are not blockers for current demonstrations but would significantly improve demo quality or accelerate commercial activation:

### P1 — High Impact, Demo Quality

| Item | Benefit | Estimated Effort |
|------|---------|-----------------|
| Live AIS data activation (Vessels) | Removes "simulated" caveat; demonstrates real-time fleet intelligence | Medium — commercial AIS subscription + connector activation |
| Persona switcher UI in demo toolbar | Instant role switching during live demos without re-authentication | Small — UI component + session mock |
| Demo reset API endpoint | Allows one-click reset from within the platform during demos | Small — REST endpoint wrapping the seed scripts |
| Seeded "before vs. after" comparison view | Shows the impact of Lyte/Aegis recommendations visually | Small — UI state toggle |

### P2 — Supports Commercial Activation

| Item | Benefit | Estimated Effort |
|------|---------|-----------------|
| Salesforce CRM connector (Lyte) | Removes pipeline data caveat; enables live RevOps demos | Medium |
| SIEM connector (Aegis) | Enables prospect-connected security demos | Medium |
| Live AIS alert replay | Shows a real dark-vessel event from historical AIS data | Small |
| Stripe billing activation | Converts demo interest to commercial pilots | Small — infrastructure built, activation required |

### P3 — Platform Completeness

| Item | Benefit | Estimated Effort |
|------|---------|-----------------|
| Terra public-facing demo mode | Enables self-serve Terra exploration | Medium |
| PRISM Counsel public demo mode | Enables self-serve legal matter exploration | Medium |
| Demo environment isolated from production | Prevents any risk of demo data touching production | Medium |
| Guided product tour (interactive overlay) | Enables async demos without a presenter | Large |

---

## 5. Known Gaps — Current Demo Environment

| Gap | Impact | Workaround |
|-----|--------|-----------|
| Push notification deep-linking not live | Mobile demo requires manual navigation | Presenter drives mobile demo directly |
| CRM connector not live | Pipeline signals are seeded, not connected | Verbal caveat during Lyte narrative |
| AIS positions simulated | Vessel positions don't update in real time | Present as "representative fleet view" |
| SIEM not connected | Security signals are seeded | Present as "representative threat posture" |
| Terra demo flow not in formal narrative | Terra is shown as a live app but without a structured narrative | Use the distress map and deal pipeline as supporting evidence |
| Carlota Jo not in formal narrative | Carlota Jo is accessible but not part of the core four narratives | Show as "premium advisory surface" in the platform compounding section |

---

## 6. Data State Policy

All demo data follows the SZL Holdings Demo Data Policy (`docs/DEMO_DATA_POLICY.md`):

- All demo data is synthetic or anonymized
- No real customer, personal, or production data is used in demo environments
- Data state badges are visible in every platform when demo mode is active
- Demo environments are isolated from production databases

---

*For narrative scripts and talking points, see `docs/demo/demo-scenarios.md`.*  
*For setup and presentation guidance, see `docs/demo/demo-day-guide.md`.*
