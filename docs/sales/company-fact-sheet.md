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
| **Product Status** | Functional alpha across all products |

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
| **Flagship command** | Lyte | Operator command surface — PRISM framework, signal-to-action |
| **Execution fabric** | Alloy | Governance backbone — workflow orchestration, approval gates, audit trail |
| **Mobile command** | CORTEX | Unified mobile command — all domains, iOS and Android |
| **Domain packs** | Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM | Domain-specific intelligence on shared governance infrastructure |

---

## Domain Packs

| Domain Pack | Domain | Status |
|-------------|--------|--------|
| **Aegis** | Security & Defense | Functional alpha |
| **Vessels** | Maritime Intelligence | Functional alpha |
| **Terra** | Real Estate Intelligence | Functional alpha |
| **PRISM Counsel** | Legal Matter Command | Integrated into Aegis |
| **Carlota Jo** | Premium Advisory | Live |
| **IMPERIUM** | Cloud Sovereignty | In development |

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

- **10 canonical artifacts** (7 web domain apps, 1 API, 2 mobile) + 1 internal dev sandbox
- **700+ database tables** across 116 schema files (Drizzle ORM)
- **40+ shared packages** in pnpm monorepo
- **11-role RBAC** with org-scoped tenant isolation
- **9 schema-validated AI decision types**
- **Immutable audit trail** across all products via Proof Chain
- **6 platform primitives** shared by all surfaces

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4 |
| **Backend** | Node.js, Express 5, PostgreSQL 16, Drizzle ORM |
| **AI** | OpenAI, Anthropic, Gemini (multi-provider with fallback), evidence-backed hybrid retrieval |
| **Auth** | OIDC/PKCE, 11-role RBAC, SCIM 2.0, Azure AD SSO |
| **Mobile** | Expo / React Native |
| **Infrastructure** | Azure (App Service, PostgreSQL Flexible, Key Vault, Redis, CDN) |
| **IaC** | Azure Bicep |
| **Monorepo** | pnpm workspace — 40+ packages, 700+ DB tables |

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
- SOC 2 Type II: targeted for Phase 3 (post-funding)

---

## Reference Documents

| Topic | Document |
|-------|----------|
| Product packaging & editions | [PRODUCT_PACKAGING.md](../product/packaging.md), [PLATFORM_EDITIONS.md](../product/platform-editions.md), [PRICING_PACKAGING.md](../investor/pricing-packaging.md) |
| Demo motion | [DEMO_STRATEGY.md](demo-strategy.md), [EXECUTIVE_DEMO.md](executive-demo.md), [OPERATOR_DEMO.md](operator-demo.md), [TECHNICAL_DEMO.md](technical-demo.md) |
| Design partner & pilots | [DESIGN_PARTNER_PROGRAM.md](design-partner-program.md), [PILOT_PLAYBOOK.md](pilot-playbook.md), [ROI_MODEL.md](roi-model.md) |
| Go-to-market | [GO_TO_MARKET_MOTION.md](go-to-market.md), [BUYER_PERSONAS.md](buyer-personas.md), [SALES_NARRATIVE.md](sales-narrative.md), [OBJECTION_HANDLING.md](objection-handling.md), [EXPANSION_MOTION.md](expansion-motion.md) |
| Trust & governance | [TRUST_CENTER_INDEX.md](../security/trust-center-index.md), [AI_GOVERNANCE.md](../architecture/ai-governance.md), [BACKUP-RESTORE.md](../operations/backup-restore.md) |
| Revenue & expansion | [REVENUE_MODEL.md](../investor/revenue-model.md), [LAND_AND_EXPAND.md](land-and-expand.md), [ENTERPRISE_DEAL_DESIGN.md](enterprise-deal-design.md) |
| Series A readiness | [SERIES_A_READINESS.md](../investor/series-a-readiness.md), [NORTH_STAR_METRICS.md](north-star-metrics.md), [EXECUTIVE_SCORECARD.md](executive-scorecard.md), [INVESTOR_NARRATIVE.md](../investor/investor-narrative.md) |

---

## Contact

| Purpose | Contact |
|---------|---------|
| Enterprise & design partner | [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com) |
| Investment conversations | [stephen@szlholdings.com](mailto:stephen@szlholdings.com) |
| Security disclosures | [security@szlholdings.com](mailto:security@szlholdings.com) |
| LinkedIn | [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240) |
