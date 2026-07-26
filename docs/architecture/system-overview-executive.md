# System Overview — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Non-technical stakeholders, investors, strategic partners, technical advisors

**Related:** [architecture.md](architecture.md) · [PRODUCT-SURFACES.md](../product/product-surfaces.md) · [KNOWN-GAPS.md](../operations/known-gaps.md)

---

## What SZL Holdings Builds

SZL Holdings builds the governed decision infrastructure layer for enterprise operators — connecting what is observable to what is executable, under governance, with full attribution.

The platform is organized in a clear hierarchy: SZL Holdings (platform) → Lyte (flagship command surface) → Alloy (execution fabric) → CORTEX (mobile command) → Domain packs (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM).

The defining characteristic of the platform is **architectural unity**. Every domain pack shares one governance infrastructure, one design system, one authentication model, and one data layer. This is not a portfolio of separate startups — it is a compounding system where shared investment in governance multiplies in value with each new domain added.

---

## The Problem Being Solved

Enterprise operations have an accountability gap:

- **Dashboards** show what happened.
- **Alerts** show what is wrong.
- **Neither** tells operators what to do next, who is responsible, or whether the recommended action is safe to execute.

AI tools compound the problem: they add recommendation volume without adding governance. Operators end up with more data, more noise, and more untracked decisions running in parallel.

SZL Holdings builds the **governed decision infrastructure layer** — the platform that connects what is observable to what is executable, under governance, with full attribution.

---

## Architecture Thesis

The SZL Holdings platform is organized around a single architectural principle: **every consequential decision follows the same governed loop**, regardless of which domain it originates in.

```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```

The platform provides the infrastructure for this loop. Domain packs provide the signal sources, analysis models, and action vocabularies. The loop itself — the governance — is shared.

---

## Platform Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMMAND SURFACES                                                        │
│                                                                          │
│  Lyte (web)        Command Portal (web)        CORTEX (mobile)          │
│  Operator command   Ecosystem overview          All domains, one app     │
│  surface            8-domain dashboard          Biometric auth           │
├─────────────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                            │
│                                                                          │
│  Aegis     Vessels    Terra    PRISM Counsel  Carlota Jo   IMPERIUM     │
│  Security &     Maritime       Real Estate   Legal Matter    Premium    │
│  Defense        Intelligence   Intelligence  Command         Advisory   │
│  Intelligence                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  GOVERNANCE INFRASTRUCTURE (shared by all domains)                      │
│                                                                          │
│  Outcome Graph   │  Proof Chain    │  Covenant Policy  │  Decision Sim.   │
│  Decision         │  Immutable      │  Permission &     │  Risk             │
│  lifecycle        │  audit trail    │  approval gates   │  simulation       │
│                                                                            │
│  Workflow Engine  │  Event Fabric   │  AI Engine  │  RBAC + Auth          │
│  Process          │  Cross-domain   │  Model      │  11-role hierarchy    │
│  orchestration    │  signal bus     │  orchestration│ Org-scoped isolation │
├─────────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                              │
│                                                                          │
│  PostgreSQL 16 (Drizzle ORM)  │  700+ tables  │  116 schema files       │
│  External feeds (AIS, STIX, sanctions, court records, market data)      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Platform Ecosystem

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          SZL HOLDINGS ECOSYSTEM                              │
│                                                                              │
│  OBSERVE · DECIDE · ACT                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │    LYTE    │  │   AEGIS    │  │   TERRA    │  │  VESSELS   │             │
│  │  Business  │  │  Security  │  │  Real Est. │  │  Maritime  │             │
│  │Observability│  │& Defense  │  │Intelligence│  │Intelligence│             │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘             │
│                                                                              │
│  ┌────────────┐  ┌────────────┐                                              │
│  │   PRISM    │  │  CARLOTA   │                                              │
│  │  COUNSEL   │  │    JO      │                                              │
│  │   Legal    │  │  Advisory  │                                              │
│  └────────────┘  └────────────┘                                              │
│                                                                              │
│  EXECUTE                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  ALLOY — Execution Fabric                                            │   │
│  │  Signal routing · Workflow orchestration · Approval gates            │   │
│  │  Human-in-the-loop controls · Immutable audit trail                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  COMMAND SURFACES                                                            │
│  ┌──────────────────────────────┐  ┌────────────────────────────────────┐   │
│  │  CORTEX — Unified Mobile     │  │  Command Portal — Ecosystem Hub    │   │
│  │  All domains · iOS/Android   │  │  8-domain real-time dashboard      │   │
│  └──────────────────────────────┘  └────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Platform Summary

| Product | Layer | What It Does | Who Uses It |
|---------|-------|-------------|-------------|
| **Lyte** | Flagship command | PRISM framework command surface — signal timeline, action queue, approvals, AI recommendations | Operations leads, CFOs, PMOs, SREs |
| **Alloy** | Execution fabric | Workflow orchestration, approval gates, immutable audit trail — the governance backbone | All platforms (shared infrastructure) |
| **CORTEX** | Mobile command | Unified mobile command — all domain workspaces on iOS/Android with biometric auth | All platform users on mobile |
| **Aegis** | Domain pack | Unified cybersecurity command — threat detection, SOC operations, AI-assisted triage | CISOs, SOC analysts, MSPs |
| **Vessels** | Domain pack | Real-time maritime fleet command — AIS tracking, sanctions screening, voyage economics | Fleet executives, operations, compliance |
| **Terra** | Domain pack | NYC property intelligence — distressed asset detection, ownership mapping, deal pipeline | Brokers, investors, portfolio teams |
| **PRISM Counsel** | Domain pack (legal module integrated into Aegis) | Agentic legal matter management — court filings, document review, recovery operations | Legal partners, case managers |
| **Carlota Jo** | Domain pack | Premium advisory platform — client portal, service delivery, advisory engagement | Founders, executives, UHNW clients |
| **IMPERIUM** | Domain pack (in dev) | Cloud sovereignty — multi-cloud governance, policy enforcement, cloud estate visibility | CIOs, infrastructure leads, cloud governance teams |
| **Command Portal** | Ecosystem hub | Cross-domain real-time dashboard — 8-domain SSE, executive briefing, global command bar | Platform admin, ecosystem operators |
| **SZL Holdings** | Corporate platform | Investor portal, trust center, ecosystem overview | Investors, enterprise evaluators |

---

## The Governed Decision Loop

### Step 1: Signal Ingestion

Signals arrive from external integrations, internal events, or scheduled data feeds.

| Domain | Signal Sources |
|--------|---------------|
| Aegis | STIX/TAXII threat feeds, MITRE ATT&CK, CVE databases, CISA KEV, endpoint telemetry |
| Vessels | AIS telemetry (MarineTraffic, AISHub, Digitraffic), port records, sanctions lists (OFAC, EU, UN) |
| Terra | NYC public records, MLS listings, Census/BLS data, FEMA risk indices |
| PRISM Counsel | CourtListener filings, NY court records, deadline triggers |
| Carlota Jo | Client inquiry forms, booking events, document delivery triggers |
| Lyte | Cross-domain operational metrics, approval queue changes, SLA breach signals |

Signals are normalized by the Event Fabric (`@szl-holdings/prism-bus`) into a common event format with domain, severity, correlation ID, and timestamp.

### Step 2: Context and Correlation

The signal is enriched with context from across domains. PRISM Bus enables cross-domain correlation — a sanctions alert from Vessels can trigger a related case check in PRISM Counsel, which can surface a risk flag in Lyte.

### Step 3: AI Recommendation

An AI agent (via `@szl-holdings/ai-engine`) analyzes the signal and proposes an action. The recommendation includes:
- Source citations (what evidence supports this recommendation)
- Confidence score (calibrated by historical outcome data)
- Proof chain entry (provenance metadata for the AI output)
- Domain context (which domain pack this recommendation applies to)

### Step 4: Risk Simulation

For high-stakes decisions, the Monte Carlo engine (`@szl-holdings/monte-carlo`) runs probabilistic simulations before the recommendation is presented. Operators see not just "what to do" but "what could happen" — with confidence intervals and sensitivity rankings.

### Step 5: Policy Check

The Covenant Policy engine (`@szl-holdings/covenant-policy`) evaluates whether the recommended action:
- Is permitted by the user's role and organizational context
- Requires human approval (and from whom)
- Meets domain-specific regulatory requirements
- Has been cleared for auto-execution (if applicable)

### Step 6: Human Approval

If the policy requires approval, the action enters the approval queue. The operator reviews the recommendation, the simulation results, and the evidence in Lyte (web) or CORTEX (mobile), then approves, rejects, or overrides.

### Step 7: Action Execution

The Workflow Engine (`@szl-holdings/workflow-engine`) executes the action as a durable, multi-step process. Each step is logged, state is preserved, and the process can recover from failures.

### Step 8: Proof Recording

The Proof Chain (`@szl-holdings/proof-chain`) records the complete audit trail: signal → context → recommendation → simulation → policy → execution → proof → outcome → learning. Every entry includes actor attribution, timestamp, and evidence references.

### Step 9: Outcome Tracking

The Outcome Graph (`@szl-holdings/outcome-graph`) records the real-world result. Was the recommendation accepted? Did the action achieve its intended outcome? This data feeds back into agent confidence calibration and Monte Carlo model tuning.

---

## How a Signal Becomes an Action (Summary)

Every consequential operation in the SZL ecosystem follows this path, regardless of domain:

1. **Signal surfaces** — a risk indicator, anomaly, or threshold breach is detected
2. **Context is added** — AI agents analyze the signal, attach reasoning and confidence scores
3. **Recommendation is routed** — Alloy routes the recommendation to the right operator
4. **Human reviews and approves** — in `controlled` mode (the default), the operator confirms or rejects the recommendation before execution. Alloy also supports `full` and `automated` workflow modes where execution proceeds without a manual approval step.
5. **Action executes** — the confirmed action runs
6. **Audit event is created** — an immutable record captures the full chain: signal → context → recommendation → simulation → policy → execution → proof

---

## Service Topology

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                              │
│                                                                       │
│  Web Apps (React + Vite)              Mobile (Expo / React Native)   │
│  szl-holdings  lyte-command-center    szl-holdings-mobile (CORTEX)   │
│  aegis         terra                  cortex-mobile                  │
│  vessels       prism-counsel                                         │
│  carlota-jo    command                                               │
│  imperium                                                            │
└────────────────────┬──────────────────┬──────────────────────────────┘
                     │  HTTPS           │  HTTPS
                     ▼                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  API SERVER  (artifacts/api-server)                                    │
│                                                                       │
│  Express 5  ·  172 route files  ·  5,065 OpenAPI operations          │
│  Global auth enforcer (deny-by-default on /api/*)                    │
│  REST + GraphQL (Apollo) + WebSocket + MCP                           │
│                                                                       │
│  Governance middleware chain:                                         │
│    correlationId → apiVersion → helmet → CORS → rateLimiter →        │
│    telemetry → auth → CSRF → globalAuthEnforcer → tenantScope        │
└────────────────────┬──────────────────┬──────────────────────────────┘
                     │                  │
                     ▼                  ▼
┌─────────────────────────┐  ┌─────────────────────────────────────────┐
│  PostgreSQL 16           │  │  External Services                      │
│  700+ tables (Drizzle)    │  │  AI: OpenAI, Anthropic, Gemini          │
│  Org-scoped isolation    │  │  Payments: Stripe                       │
│  116 schema files        │  │  Email: Resend / SendGrid / SMTP        │
│                          │  │  Intel: AIS, STIX/TAXII, sanctions      │
│                          │  │  Maps: Mapbox, Google Maps              │
│                          │  │  Legal: CourtListener                   │
└─────────────────────────┘  └─────────────────────────────────────────┘
```

---

## Authentication and Authorization

1. **Authentication:** OIDC/PKCE or password-based login. Session stored in database, delivered as `sid` cookie.
2. **Global auth enforcer:** Deny-by-default on all `/api/*` routes. Explicit public allowlist for health, auth, webhooks, SCIM, and docs endpoints.
3. **RBAC:** 11-role hierarchy (`super_admin` → `demo`). Route-level guards via `requireRole()`.
4. **Tenant isolation:** All queries scoped by `org_id`. Cross-org access returns 404 (not 403) to prevent information leakage.
5. **WebSocket:** HMAC-signed tickets with 5-minute TTL.
6. **CSRF:** Double-submit cookie on all mutating requests.

---

## Real-Time Communication

| Channel | Technology | Purpose |
|---------|-----------|---------|
| WebSocket | `ws` library with signed tickets | Aegis alerts, Vessels AIS, Lyte signals |
| SSE | Server-Sent Events | Command Portal 8-domain dashboard |
| Push | VAPID / Expo Push | CORTEX mobile notifications |
| PRISM Bus | Internal event bus | Cross-domain signal correlation |

---

## AI Architecture

All AI agents are **advisory only** — they surface intelligence and recommendations but require explicit human confirmation before executing consequential actions.

| Component | Purpose |
|-----------|---------|
| `@szl-holdings/ai-engine` | Model routing, safety rails, telemetry, multi-provider support |
| Provider fallback | OpenAI → Anthropic → Gemini (configurable priority) |
| Evidence retrieval | Hybrid retrieval with source citations and confidence scoring |
| Schema validation | 9 validated decision types (risk assessment, recommendation, forecast, etc.) |
| MCP server | 23 tools, 4 resources, 5 prompt templates via `/api/mcp` |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (full stack) |
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Mobile | Expo / React Native, NativeWind |
| Backend | Express 5, Node.js |
| Database | PostgreSQL 16, Drizzle ORM |
| AI | OpenAI, Anthropic, Gemini (multi-provider with fallback) |
| Auth | OIDC/PKCE, 11-role RBAC, SCIM 2.0 |
| Monorepo | pnpm workspaces, 40+ packages |
| Real-time | WebSocket, SSE, push notifications |
| Event system | PRISM Bus (cross-domain), Forge Runtime (agent execution) |

---

## Scale

| Metric | Value |
|--------|-------|
| Production Web Applications | 10 |
| Native Mobile Apps | CORTEX (unified) + 5 domain-specific |
| Shared Libraries | 37 packages |
| API Endpoints | 2,331 |
| Database Tables | 700+ |
| Source Files | 1,620 TypeScript files |
| Lines of Code | 450,000+ |
| UI Components | 252 web + 116 mobile screens |

---

## Current Status

All platforms are at **Functional Alpha** status — full feature sets with seeded/demo data, not yet commercially deployed. Carlota Jo (web and mobile) is live. SZL Holdings corporate site is a Public Beta Candidate. The platform is pre-commercial; no paying customers exist as of April 2026.

---

## Related Documents

| Document | Path |
|----------|------|
| Architecture (detailed) | [architecture.md](architecture.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](platform-primitives.md) |
| Category positioning | [CATEGORY_POSITIONING.md](../sales/category-positioning.md) |
| Product surfaces | [PRODUCT-SURFACES.md](../product/product-surfaces.md) |
| API specification | [API-SPEC.md](api-spec.md) |
| Data model | [DATA-MODEL.md](data-model.md) |
| Access control | [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) |

---

## Contact

- **Email:** inquiries@szlholdings.com
- **Security:** security@szlholdings.com
- **Website:** szlholdings.com

---

*Last verified against code on 2026-04-16*

---

## Decision Fabric (April 2026)

The platform now includes a unifying **Decision Fabric** layer that sits
above the canonical primitives (Outcome Graph, Proof Chain, Covenant Policy,
Prism Bus, Forge / Workflow Engine, Monte Carlo Simulation, Approvals).

### What it adds

1. **One correlation index across every primitive.** Every step of the
   canonical 9-step loop (Signal → Context → Recommendation → Simulation →
   Policy → Execution → Proof → Outcome → Learning) writes a row keyed by
   the same `correlationId`, so end-to-end timelines no longer require
   bespoke joins.
2. **Decision memory.** Every consequential decision is captured as an
   immutable `decision_record` with backlinks to the outcome graph, proof
   chain, frozen policy version, frozen simulation snapshot, approval, and
   workflow run, plus `predictedOutcome`, `actualOutcome`, and
   `predictionError`.
3. **Eight observability surfaces.** Workflow 360, Entity Investigation,
   Recommendation Trace, Approval Bottlenecks, Policy Failures, Prediction
   Drift, Domain Cluster Stats, Learning Jobs — all served from
   `/api/decision-fabric/*`.
4. **A learning loop.** `POST /decision-fabric/learning/run` walks recent
   decisions and emits a deterministic per-domain calibration report
   (ranking-weight delta + confidence multiplier) that the Decision Engine
   and Monte Carlo Simulation packages consume on their next cycle.
5. **Playbook suggestions.** Pattern retrieval clusters successful
   decisions and proposes `playbook_suggestions` that operators can promote
   into workflows.

See `DECISION_FABRIC.md` for architecture, `OBSERVABILITY_ARCHITECTURE.md`
for the surface contracts, and `OUTCOME_GRAPH_MODEL.md` for the deepened
data model.
