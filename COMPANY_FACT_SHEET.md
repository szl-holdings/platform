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

Enterprise operations have a **accountability gap**:
- Dashboards show what happened — not what to do next
- Alerts show what's wrong — not who is responsible
- AI tools add recommendation volume without governance
- Decisions run in parallel with no attribution, no audit trail, no closure mechanism

---

## The Solution

SZL Holdings builds the **governed operational intelligence layer** — connecting observable business signals to accountable executable action, under governance, with full audit attribution.

The platform is not a dashboard. It is a **decision surface** with built-in accountability.

---

## Platform Structure

**Command surfaces:** Lyte (web) · CORTEX (mobile) · Command Portal (ecosystem hub)

**Execution fabric:** Alloy — workflow orchestration, approval gates, immutable audit trail

**Domain packs:**

| Domain Pack | Domain | Status |
|-------------|--------|--------|
| **Aegis** | Security & Defense | Functional alpha |
| **Vessels** | Maritime Intelligence | Functional alpha |
| **Terra** | Real Estate Intelligence | Functional alpha |
| **PRISM Counsel** | Legal Matter Command | Functional alpha |
| **Carlota Jo** | Premium Advisory | Live |
| **IMPERIUM** | Cloud Sovereignty | Functional alpha |

**Five platform primitives** (shared by all surfaces):
- **Outcome Graph** — decision lifecycle tracking
- **Proof Chain** — immutable audit trail with provenance
- **Covenant Policy** — permission and human-in-the-loop approval gates
- **Monte Carlo** — probabilistic risk simulation
- **Workflow Engine** — durable process orchestration

---

## Platform Scale

- **15 active artifacts** (10 web, 2 mobile, 1 API, 1 design system, 1 dev sandbox)
- **685 database tables** across 112 schema files (Drizzle ORM)
- **51 shared packages** in pnpm monorepo
- **11-role RBAC** with org-scoped tenant isolation
- **9 schema-validated AI decision types**
- **Immutable audit trail** across all products via Proof Chain

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4 |
| **Backend** | Node.js, Express 5, PostgreSQL 16, Drizzle ORM |
| **AI** | HuggingFace Inference (Qwen3-8B), evidence-backed hybrid retrieval |
| **Auth** | OIDC/PKCE, 11-role RBAC, SCIM 2.0, Azure AD SSO |
| **Mobile** | Expo / React Native |
| **Infrastructure** | Azure (App Service, PostgreSQL Flexible, Key Vault, Redis, CDN) |
| **IaC** | Azure Bicep |
| **Monorepo** | pnpm workspace |

---

## Differentiation

| Dimension | SZL Holdings | Typical Dashboard Tools | Typical AI Tools |
|-----------|--------------|------------------------|-----------------|
| Decision attribution | Full (actor, signal, action, outcome) | None | None |
| Human-in-the-loop | Enforced at governance layer | Optional or absent | Absent |
| Audit trail | Immutable, append-only | Partial or none | None |
| AI governance | Advisory only, policy-gated | Not applicable | Absent |
| Domain depth | Domain-specific intelligence packs | Generic | Generic |

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

## Contact

| Purpose | Contact |
|---------|---------|
| Enterprise & design partner | [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com) |
| Investment conversations | [stephen@szlholdings.com](mailto:stephen@szlholdings.com) |
| Security disclosures | [security@szlholdings.com](mailto:security@szlholdings.com) |
| LinkedIn | [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240) |
