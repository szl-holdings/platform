# Company Fact Sheet — SZL Holdings

> Quick-reference fact sheet for press, investors, and enterprise evaluators.

---

## Company Overview

| | |
|-|-|
| **Company** | SZL Holdings |
| **Founded** | 2025 |
| **Founder & CEO** | Stephen Lutar |
| **Stage** | Pre-seed / Design Partner Phase |
| **Headquarters** | United States |
| **Website** | [szlholdings.com](https://szlholdings.com) |
| **Product Status** | Functional alpha — 13 web surfaces verified live, 2026-04-26 |

---

## The Problem

Enterprise operations have an **accountability gap**:
- Dashboards show what happened — not what to do next
- Alerts show what's wrong — not who is responsible
- AI tools add recommendation volume without governance
- Decisions run in parallel with no attribution, no audit trail, no closure mechanism

---

## The Solution

SZL Holdings builds the **governed decision infrastructure** — the platform layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential decision.

The platform is not a dashboard. Not an AI copilot. Not a workflow tool. It is the **operating system for governed decisions** — the shared governance infrastructure on which domain-specific intelligence runs.

---

## Platform Hierarchy

| Layer | Product | Role |
|-------|---------|------|
| **Platform** | SZL Holdings | Governed decision layer — shared governance infrastructure |
| **Execution fabric** | A11oy | Governance backbone — workflow orchestration, approval gates, proof ledger |
| **Decision intelligence** | KORA | Cross-domain operator command surface — PRISM framework, signal-to-action |
| **Mobile command** | APEX | Unified mobile command — all domains, iOS and Android |
| **Domain packs** | TENAX, PARAGON, SEXTANT, DOMAINE, Counsel, Carlota Jo | Domain-specific intelligence on shared governance infrastructure |

---

## Domain Packs

| Domain Pack | Domain | Status |
|-------------|--------|--------|
| **TENAX** | Cyber Resilience | Functional alpha — routes live, UI complete |
| **PARAGON** | Defense & Intelligence | Functional alpha — CISA KEV, NVD CVE, MITRE ATT&CK v14 active |
| **SEXTANT** | Maritime Intelligence | Functional alpha — AIS simulated; commercial modules functional |
| **DOMAINE** | Real Estate Intelligence | Functional alpha — maps pending Mapbox token |
| **Counsel** | Legal Matter Command | Functional alpha — matter tracking functional |
| **Carlota Jo** | Premium Advisory | Most complete artifact; live integrations active |

---

## Six Platform Primitives

Shared by all surfaces — the structural difference from dashboards, copilots, and workflow tools:

| Primitive | What It Does |
|-----------|-------------|
| **Outcome Graph** | Decision lifecycle tracking — recommendation → decision → outcome |
| **Proof Chain** | Immutable audit trail with provenance for every AI output and action |
| **Covenant Policy** | Permission and human-in-the-loop approval gates enforced at the platform layer |
| **Decision Simulation** | Probabilistic risk simulation before consequential action |
| **Workflow Engine** | Durable multi-step process orchestration with agent coordination |
| **Event Fabric** | Cross-domain signal backbone — normalizes, routes, and correlates signals across all domain packs |

---

## Platform Scale

- **14 deployable artifacts** (13 web/mobile + 1 internal dev sandbox)
- **200 packages** in the pnpm monorepo (MEASURED; `artifacts/SOURCE_OF_TRUTH.json`)
- **51 shared libraries**
- **8 operator products**
- **11-role RBAC** with org-scoped tenant isolation
- **Immutable audit trail** across all products via Proof Chain
- **6 platform primitives** shared by all surfaces

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express, PostgreSQL 16, Drizzle ORM |
| **AI** | OpenAI, Anthropic, Gemini (multi-provider with policy-governed routing) |
| **Auth** | OIDC/PKCE, 11-role RBAC, deny-by-default enforcement |
| **Mobile** | Expo / React Native |
| **Infrastructure** | Azure (App Service, PostgreSQL Flexible, Key Vault, Redis, CDN) |
| **Monorepo** | pnpm workspace — 200 packages (MEASURED; `artifacts/SOURCE_OF_TRUTH.json`) |

---

## Differentiation

| Dimension | SZL Holdings | Typical Dashboard Tools | Typical AI Tools |
|-----------|--------------|------------------------|-----------------|
| Decision attribution | Full (actor, signal, action, outcome) | None | None |
| Human-in-the-loop | Enforced at governance layer | Optional or absent | Absent |
| Audit trail | Immutable, append-only | Partial or none | None |
| AI governance | Advisory only, policy-gated | Not applicable | Absent |
| Cross-domain intelligence | Event Fabric correlates signals across 6 domain packs | Generic | Generic |
| Outcome tracking | Closed-loop feedback loop | None | None |

---

## Go-To-Market

**Primary buyers:** Mid-market and enterprise operators in security, maritime, real estate, and professional services.

**Entry motion:** Design partner program — 3-6 design partners per domain who co-design the product in exchange for early access and preferred pricing.

**Revenue model:** SaaS subscription (per seat + platform fee). Domain packs priced separately. Carlota Jo advisory billed as service retainer.

---

## Trust & Security

- TLS 1.3 for all connections
- HMAC-signed WebSocket tickets (5-minute TTL)
- Org-scoped tenant isolation (architectural, not just query-level)
- AI agents advisory-only — no consequential action without human approval
- All AI recommendations include source citations and confidence scores
- Independent penetration test (NCC Group, May 2026): no Critical findings; all High-severity findings remediated and re-tested
- SOC 2 Type II: observation period entry following NCC Group attestation

---

## Roadmap

| Item | Status |
|------|--------|
| A11oy Phase 1 — Foundation (type system, fabric primitives, demo seed, read API) | ✅ Complete |
| A11oy Phase 2 — Workcell engine with live AI reasoning | 🔜 In Progress |
| A11oy Phase 3 — Full proof-carrying execution with live connectors | 🔜 Planned |
| APEX mobile (unified iOS + Android command) | 🔜 Planned |
| SOC 2 Type II audit readiness | 🔜 Roadmap |
| Production customer onboarding | 🔜 Roadmap |

---

## Reference Documents

| Topic | Document |
|-------|----------|
| Demo motion | [DEMO_DAY_GUIDE.md](../demo/demo-day-guide.md), [DEMO_SCENARIOS.md](../demo/demo-scenarios.md) |
| Design partner & pilots | [DESIGN_PARTNER_PROGRAM.md](design-partner-program.md), [PILOT_PLAYBOOK.md](pilot-playbook.md) |
| Trust & governance | [TRUST_CENTER.md](../trust/trust-center.md), [SECURITY_POSTURE.md](../trust/security-posture.md) |
| Investor materials | [INVESTOR_NARRATIVE.md](../investor/investor-narrative.md), [SERIES_A_READINESS.md](../investor/series-a-readiness.md) |
| App status | [APP_STATUS_CLASSIFICATION.md](../../audit/runtime/app-status-classification.md) |

---

## Contact

| Purpose | Contact |
|---------|---------|
| Enterprise & design partner | [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com) |
| Investment conversations | [stephen@szlholdings.com](mailto:stephen@szlholdings.com) |
| Security disclosures | [security@szlholdings.com](mailto:security@szlholdings.com) |
| LinkedIn | [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240) |
