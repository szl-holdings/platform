# Demo Seed Plan
**Phase:** 4  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Demo Seed Philosophy

All demo data is deterministic, idempotent, and realistic. The central narrative across all domain packs is the **Vantex Acquisition** ($4.2M / 47-day stalled approval chain) — `LYTE-SEED-v2`. All seeded scenarios use consistent entity names, amounts, and timelines to create a coherent cross-domain story.

---

## Demo Org Setup

| Org | ID | Purpose |
|---|---|---|
| SZL Holdings Demo | `org-demo-szl` | Default demo organization |
| Vantex Capital (target) | `org-vantex` | Acquisition target for Lyte narrative |

---

## Demo Users

| Email | Role | Domain | Persona |
|---|---|---|---|
| `demo-investor@szl.demo` | `executive` | Platform-wide | Investor — read-only; executive dashboards |
| `demo-ceo@szl.demo` | `executive` | Platform-wide | CEO — strategic view |
| `demo-coo@szl.demo` | `operator` | Command + Lyte | COO — operational surfaces |
| `demo-ciso@szl.demo` | `operator` | Aegis + Sentra | CISO — security surfaces |
| `demo-analyst@szl.demo` | `analyst` | Lyte | Analyst — decision intelligence |
| `demo-admin@szl.demo` | `tenant_admin` | Platform | Admin — full tenant management |

---

## Seeded Scenarios by Domain

### Lyte — Decision Intelligence
- **Central scenario:** Vantex Acquisition — $4.2M / 47-day stalled approval
- Signals: 47 active signals across risk, compliance, market, and operational domains
- Recommendations: 8 ranked, scored (evidence-backed, policy-validated)
- Monte Carlo simulation: 3 outcome scenarios (approve, delay, reroute)
- Entity graph: 12 nodes (entities, counterparties, advisors)
- Proof chain: Full 9-step audit trail from signal → outcome
- Workflow: Multi-step approval with 2 human gates

### Command / Alloy
- Workflows: 6 active (Vantex approval, 3 routine ops, 2 compliance)
- Policies: 8 covenant policies (3 active, 2 draft, 3 archived)
- Agent runs: 12 trace entries with latency, cost, and outcome
- Approvals inbox: 3 pending approvals at different stages

### Aegis — Cyber Resilience
- Threats: 15 active (3 critical, 5 high, 7 medium)
- Incidents: 4 open incidents with MITRE ATT&CK mapping
- Vulnerabilities: 22 with CVSS scores and patch status
- SOAR playbooks: 3 triggered with human review gates

### Vessels — Maritime Intelligence
- Fleet: 8 vessels with route and cargo profiles
- Voyage Risk Twin: Active voyage with 3 risk scenarios
- Sanctions hits: 2 flagged entities (OFAC + EU lists)
- Route anomalies: 1 active alert with evidence chain

### Terra — Real Estate Intelligence
- Properties: 24 properties across 3 NYC boroughs
- Why This Property Now: 5 ranked theses with supporting evidence
- Distress scores: 8 high-distress properties with lien data
- Deals pipeline: 6 active deals at various stages
- Portfolio: 3 portfolios with IRR and yield projections

### Carlota Jo — Premium Advisory
- Clients: 6 VIP clients with preference profiles
- Cases: 8 active service requests (3 high-priority)
- Service history: 18 completed interactions

### Counsel / PRISM Counsel
- Matters: 5 legal matters (2 active litigation, 3 contract review)
- Documents: 12 evidence items with chain of custody
- Timeline: 24 events across all matters

### Pulse — Executive Briefings
- Briefings: 7 AI-drafted briefings (seeded content; labeled as demo)
- Topics: Vantex acquisition, market analysis, portfolio performance

---

## Seed Commands

| Command | When to Run |
|---|---|
| `pnpm db:migrate` | Before first seed in any environment |
| `pnpm seed:demo` | Initial demo environment setup; safe to re-run |
| `pnpm seed:all` | Full seed including domain-specific data |
| Demo reset from UI | `/command/demo` → Reset button (one-click, no terminal) |

---

## Demo Reset (In-Platform)

The Demo Launchpad at `/command/demo` includes a **Reset** button that:
1. Calls `POST /api/demo/reset` with `orgId: 'org-demo-szl'`
2. API wipes demo org data (decisions, signals, workflows, approvals)
3. Re-seeds from `packages/demo-seed` canonical fixtures
4. Returns success with fresh timestamp
5. Presenter can continue demo immediately — no terminal required

**Reset time:** ~8 seconds (full org wipe + re-seed)

---

## Data Labeling Requirements

| Data Type | Required Label |
|---|---|
| Demo AIS vessel positions | "(Demo)" tab label |
| Pulse seeded briefing content | "Demo Content" badge |
| Hardcoded corporate dashboard stats | "Illustrative" label |
| SIEM connector placeholder | "Integration Pending" label |
