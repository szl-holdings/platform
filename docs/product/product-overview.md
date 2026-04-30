# Product Overview — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026  
**Audience:** Enterprise evaluators, investors, design partners, operators

---

## What SZL Holdings Builds

SZL Holdings builds **governed decision infrastructure** — the structural layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential enterprise decision.

This is a distinct category from dashboards (which show what happened), AI copilots (which recommend without governance), and workflow tools (which automate without accountability). The platform connects signals to accountable actions through a governed decision loop with a mandatory human-in-the-loop gate, immutable audit trail, and closed-loop outcome tracking.

---

## The Problem

Enterprise operations have an accountability gap:

- **Dashboards** show what happened — not what to do next or who is responsible
- **Alerts** show what is wrong — not what action is authorized or what the risk of acting is
- **AI copilots** add recommendation volume without governance — no attribution, no approval gate, no outcome tracking
- **Decisions** run in parallel with no structured record connecting signal to decision to outcome

As AI adoption accelerates, the accountability gap grows. More recommendations. More automation. More decisions made informally with no audit trail.

---

## The Governed Decision Loop

Every consequential decision on the SZL Holdings platform follows the same nine-step loop:

```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```

| Step | What happens | Who acts |
|---|---|---|
| **Signal** | A business event is detected and ingested | Automated |
| **Context** | Cross-domain intelligence enriches the signal | Automated |
| **Recommendation** | AI proposes an action with evidence and confidence | Automated |
| **Simulation** | Monte Carlo models the risk of each scenario | Automated |
| **Policy** | Covenant Policy checks authorization rules | Automated |
| **Execution** | Approved action runs as a durable, tracked workflow | Automated |
| **Proof** | Immutable Proof Chain record is sealed | Automated |
| **Outcome** | Actual result is recorded and compared to prediction | Human + Automated |
| **Learning** | Outcome feeds back into model calibration | Automated |

The human operator's role: step 6 — approve or reject. Everything else is infrastructure.

---

## Platform Architecture

### The Hierarchy

| Layer | Product | Role |
|---|---|---|
| **Platform** | SZL Holdings | Governed decision layer — shared governance infrastructure |
| **Flagship command** | Lyte | The operator command surface — PRISM framework, signal-to-action |
| **Execution fabric** | Alloy | The governance backbone — workflow orchestration, approval gates, audit trail |
| **Mobile command** | CORTEX | Unified mobile command — all domains, iOS and Android |
| **Domain packs** | Aegis, Sentra, Vessels, Terra, Counsel, Carlota Jo | Domain-specific intelligence on shared governance infrastructure |

### The Six Platform Primitives

Shared across every surface — the structural difference from dashboards, copilots, and workflow tools:

| Primitive | What it does | Why it matters |
|---|---|---|
| **Outcome Graph** | Tracks the full decision lifecycle — recommendation → decision → outcome | Closed-loop AI learning. The platform gets smarter because it records what worked. |
| **Proof Chain** | Immutable audit trail with provenance for every action | Compliance, audit, and litigation readiness. Every AI output is traceable to its source. |
| **Covenant Policy** | Permission and approval gates enforced at the platform layer | Human-in-the-loop is not a UI pattern — it is an architectural constraint that AI cannot bypass. |
| **Decision Simulation** | Probabilistic simulation before consequential action | Operators see not just what to do but what could happen — confidence intervals and sensitivity analysis. |
| **Workflow Engine** | Durable multi-step process orchestration with agent coordination | Complex decisions are broken into tracked steps, not executed as opaque one-shots. |
| **Event Fabric** | Cross-domain signal backbone — normalizes, routes, and correlates signals | Cross-domain intelligence requires a common signal layer. Maritime + security + legal signals can now trigger correlated responses. |

---

## Domain Packs

Domain packs extend the platform's governance infrastructure into specific operational domains.

### Lyte — Flagship Governed Command Surface
The PRISM framework (People, Revenue, Infrastructure, Security, Market) in a single command surface. Signal timeline, priority action queue, Monte Carlo simulation, and execution accountability.

**Status:** Functional alpha  
**Target buyer:** Enterprise operators and executive teams in regulated industries

### Aegis — Security & Defense
SOC command, MITRE ATT&CK mapping, SOAR playbook execution with human approval gates, XDR, threat intelligence, and cross-domain security correlation.

**Status:** Functional alpha  
**Target buyer:** CISOs, SOC leads, enterprise security teams

### Vessels — Maritime Intelligence
Fleet command, live AIS telemetry, sanctions screening, dark vessel detection, voyage P&L, freight rate benchmarking, and exception-based decision workflows.

**Status:** Functional alpha  
**Target buyer:** Fleet operators, maritime compliance leads, chartering desks

### Terra — Real Estate Intelligence
NYC distress pipeline detection, ownership graph analysis, AI-powered underwriting with evidence citations, deal workflow management, and portfolio tracking.

**Status:** Functional alpha  
**Target buyer:** Real estate operators, distress investors, asset managers

### Counsel — Legal Matter Command
Matter management, AI-assisted triage with approval gates, Proof Chain audit trail for legal actions, court filing integration.

**Status:** Functional alpha  
**Target buyer:** Law firms, in-house legal teams, compliance officers

### Carlota Jo — Premium Advisory
Client portal, service catalog, booking system, and secure document delivery for high-net-worth advisory clients.

**Status:** Live  
**Target buyer:** Premium advisory clients

---

## Platform Scale (April 2026)

- **2,816 API endpoints** across 357 route files with deny-by-default global auth enforcement
- **798 database tables** in PostgreSQL 16 with org-scoped tenant isolation
- **11-role RBAC** with OIDC/PKCE, SCIM 2.0, and Azure AD SSO
- **14 registered artifacts** (web domain apps + API + mobile + design sandbox)
- **40+ shared packages** in a pnpm monorepo
- **6 platform primitives** shared across all domain packs
- **9 schema-validated AI decision types**
- **All P0 security gaps resolved** in the April 2026 hardening sprint

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express 5, PostgreSQL 16, Drizzle ORM |
| AI | OpenAI, Anthropic, Gemini — multi-provider with fallback, evidence-backed hybrid retrieval |
| Auth | OIDC/PKCE, 11-role RBAC, SCIM 2.0, Azure AD SSO |
| Mobile | Expo / React Native |
| Infrastructure | Azure (App Service, PostgreSQL Flexible, Key Vault, Redis, CDN) |
| IaC | Azure Bicep |
| Monorepo | pnpm workspace |

---

## What This Is Not

| It is not... | Because... |
|---|---|
| A dashboard | Dashboards show what happened. This platform shows what to do next, who is responsible, and whether the action is authorized. |
| An AI copilot | Copilots generate recommendations without accountability. Covenant Policy enforces governance on every AI output — no approval, no execution. |
| A SIEM / SOC platform | Aegis provides security intelligence as a domain pack, not a standalone point solution. |
| A workflow tool | Workflow tools automate sequences. This platform adds policy enforcement, simulation, and immutable attribution to every workflow step. |
| An analytics platform | Analytics tools visualize historical data. This platform connects real-time signals to forward-looking decisions with consequence modeling. |

---

## Reference

- [Feature Overview](feature-overview.md) — Complete feature map
- [Platform Primitives](../architecture/platform-primitives.md) — Technical specification
- [Category Positioning](../sales/category-positioning.md) — Market positioning and differentiation
- [Technical Diligence Packet](../investor/technical-diligence-packet.md) — Full technical reference
