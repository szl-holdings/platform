# SZL Holdings

> The governed operational intelligence layer — connecting what is observable to what is executable, under governance, with full attribution.

[Architecture](./SYSTEM-OVERVIEW.md) · [Platform Primitives](./PLATFORM_PRIMITIVES.md) · [Trust Center](./docs/trust/trust-center.md) · [Security](./SECURITY.md) · [Category Positioning](./CATEGORY_POSITIONING.md) · [Investor Docs](./docs/investor/platform-thesis.md)

---

## What This Is

Enterprise operations have an accountability gap. Dashboards show what happened. Alerts show what's wrong. Neither tells operators *what to do next*, *who is responsible*, or *whether the recommended action is safe to execute*.

AI tools compound the problem. They add recommendation volume without governance. Operators end up with more data, more noise, and more untracked decisions running in parallel.

SZL Holdings builds the governed decision layer that sits between signal detection and action execution:

```
Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome
```

Every step is instrumented. Every decision is attributed. Every AI recommendation carries source citations and confidence scores. Every consequential action requires human confirmation.

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMMAND SURFACES                                                    │
│                                                                      │
│  Lyte              Command Portal        CORTEX                     │
│  Operator command   Ecosystem overview    Unified mobile command    │
│  PRISM framework    8-domain dashboard    All domains, one app      │
├─────────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                        │
│                                                                      │
│  Aegis         Vessels       Terra        PRISM Counsel  Carlota Jo │
│  Security &    Maritime      Real Estate  Legal Matter   Premium    │
│  Defense       Intelligence  Intelligence Command        Advisory   │
├─────────────────────────────────────────────────────────────────────┤
│  GOVERNANCE INFRASTRUCTURE                                           │
│                                                                      │
│  Outcome Graph  ·  Proof Chain  ·  Covenant Policy  ·  Monte Carlo  │
│  Workflow Engine  ·  PRISM Bus  ·  AI Engine  ·  RBAC + Auth        │
├─────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                          │
│                                                                      │
│  PostgreSQL 16 (Drizzle ORM)  ·  685 tables  ·  112 schema files   │
│  External feeds: AIS, STIX/TAXII, sanctions, court records          │
└─────────────────────────────────────────────────────────────────────┘
```

**Lyte** is the command surface — where operators observe signals, review recommendations, and make decisions.

**Alloy** is the execution fabric — where workflows are orchestrated, approvals are enforced, and audit trails are generated.

**Domain packs** extend the same governance infrastructure into domain-specific intelligence: security (Aegis), maritime (Vessels), real estate (Terra), legal (PRISM Counsel), and advisory (Carlota Jo).

**CORTEX** provides unified mobile command across all domains in a single native app.

---

## Five Platform Primitives

What makes this structurally different from dashboards, copilots, and workflow tools:

| Primitive | What It Does | Why It Matters |
|-----------|-------------|----------------|
| **Outcome Graph** | Tracks the full lifecycle: recommendation → decision → outcome | Closed-loop learning — the platform knows which recommendations led to which results |
| **Proof Chain** | Immutable, verifiable audit trail for every significant action | Compliance teams can reconstruct any decision chain. AI outputs carry provenance. |
| **Covenant Policy** | Defines what agents and users can do, with what approval requirements | Human-in-the-loop is enforced at the policy layer — AI cannot bypass it |
| **Monte Carlo** | Probabilistic simulation before action — confidence intervals and sensitivity analysis | Operators see not just "what should we do" but "what could happen if we do it" |
| **Workflow Engine** | Durable multi-step process orchestration with agent coordination | Complex decisions are tracked, governed, and recoverable — not opaque one-shots |

See [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) for the full specification of each primitive.

---

## Products

| Product | Domain | Purpose | Status |
|---------|--------|---------|--------|
| **Lyte** | Governed command | Command surface — PRISM framework, signal timeline, action queue, approval chains | Functional alpha |
| **Alloy** | Execution fabric | Workflow orchestration, approval gates, immutable audit trail | Functional alpha |
| **Aegis** | Security & defense | SOC command, MITRE ATT&CK, SOAR playbooks, threat intelligence | Functional alpha |
| **Vessels** | Maritime intelligence | AIS fleet tracking, sanctions screening, voyage economics, dark vessel detection | Functional alpha |
| **Terra** | Real estate intelligence | NYC distress pipeline, ownership graph, deal workflow, market signals | Functional alpha |
| **PRISM Counsel** | Legal command | Matter management, court filings, AI-assisted review with proof chain | Functional alpha |
| **Carlota Jo** | Premium advisory | UHNW advisory operations — client portal, service catalog, booking | Live |
| **IMPERIUM** | Cloud sovereignty | Infrastructure control, tenant provisioning, cost governance | Functional alpha |
| **CORTEX** | Unified mobile | All domain workspaces in one app — biometric auth, cross-domain signals | Functional alpha |
| **Command Portal** | Ecosystem hub | Real-time 8-domain dashboard, executive briefing, global search | Functional alpha |

---

## Trust

An AI-assisted operations platform carries a distinct trust burden. SZL Holdings addresses it structurally:

| Concern | How It Is Addressed |
|---------|---------------------|
| AI without oversight | Covenant Policy enforces approval gates — AI cannot execute consequential actions without human confirmation |
| Opaque AI outputs | All recommendations include source citations, confidence scores, and retrieval provenance via Proof Chain |
| Audit accountability | Every action generates an immutable audit event with actor attribution via Proof Chain |
| Access control | 11-role RBAC with org-scoped tenant isolation. Deny-by-default global auth enforcer |
| Multi-tenancy | All queries scoped by `org_id`. Cross-org access returns 404 to prevent information leakage |
| AI governance | Advisory agents only — governance enforced at the Alloy layer, not the UI layer |
| Decision traceability | Outcome Graph tracks the full chain: signal → recommendation → decision → outcome |

See [Trust Center](docs/trust/trust-center.md) · [Security](SECURITY.md) · [Proof and Policy Model](PROOF_AND_POLICY_MODEL.md)

---

## Technology

| Layer | Stack |
|-------|-------|
| Language | TypeScript (full stack) |
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Mobile | Expo / React Native, NativeWind |
| Backend | Express 5, Node.js |
| Database | PostgreSQL 16, Drizzle ORM (685 tables, 112 schema files) |
| AI | OpenAI, Anthropic, Gemini — multi-provider with fallback. 9 schema-validated decision types |
| Auth | OIDC/PKCE, 11-role RBAC, SCIM 2.0, Azure AD multi-tenant SSO |
| Real-time | WebSocket (signed tickets), SSE, push notifications |
| Event system | PRISM Bus (cross-domain), Forge Runtime (agent execution) |
| Monorepo | pnpm workspaces — 51 packages |

---

## Local Development

```bash
git clone https://github.com/szl-holdings/szl-holdings-platform.git
cd szl-holdings-platform
pnpm install
pnpm dev
```

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for staging and production deployment.

---

## Documentation

### Platform Narrative
| Document | Purpose |
|----------|---------|
| [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md) | What "governed operational intelligence" means and why it matters |
| [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) | The five core abstractions that define the platform |
| [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) | How trust is recorded and enforced |
| [DECISION_SIMULATION.md](DECISION_SIMULATION.md) | Monte Carlo simulation across domains |

### Technical Reference
| Document | Purpose |
|----------|---------|
| [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md) | Architecture organized around the governed decision loop |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Service topology, shared libraries, data flow |
| [API-SPEC.md](API-SPEC.md) | Full REST/GraphQL/MCP API catalogue |
| [DATA-MODEL.md](DATA-MODEL.md) | Database schema overview |
| [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) | Role/route/permission mappings |

### Product
| Document | Purpose |
|----------|---------|
| [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) | Every user-facing artifact with purpose and audience |
| [PRODUCT_SURFACE_MAP.md](PRODUCT_SURFACE_MAP.md) | Which primitives power which surfaces |
| [NAVIGATION_STRATEGY.md](NAVIGATION_STRATEGY.md) | Information architecture and navigation model |
| [DEMO_GUIDE.md](DEMO_GUIDE.md) | How to run demos for different audiences |
| [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) | Complete route inventory with classification |

### Operations
| Document | Purpose |
|----------|---------|
| [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md) | Monitoring, incident triage, failure modes |
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | Staging and production deployment |
| [SECURITY.md](SECURITY.md) | Security policy and responsible disclosure |
| [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) | Incident handling procedures |

### Brand & Company
| Document | Purpose |
|----------|---------|
| [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) | Visual identity, voice, and standards |
| [COMPANY_FACT_SHEET.md](COMPANY_FACT_SHEET.md) | One-page company summary |
| [PRESS_KIT.md](PRESS_KIT.md) | Media-ready overview and boilerplate |
| [TRUST_CENTER_INDEX.md](TRUST_CENTER_INDEX.md) | Index for all trust documentation |

### Investor
| Document | Purpose |
|----------|---------|
| [docs/investor/platform-thesis.md](docs/investor/platform-thesis.md) | Category thesis and investment case |
| [docs/investor/investor-overview.md](docs/investor/investor-overview.md) | Company overview for investors |
| [docs/investor/product-readiness.md](docs/investor/product-readiness.md) | Honest product status assessment |
| [docs/investor/go-to-market.md](docs/investor/go-to-market.md) | GTM strategy and sequencing |

---

**Stephen Lutar** — Founder & CEO, SZL Holdings
