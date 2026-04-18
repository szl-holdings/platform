# Product Surfaces — SZL Holdings Platform

**Version:** 2.0 · **Date:** April 2026
**Audience:** Engineers, product managers, investors, enterprise evaluators

> Every user-facing surface in the SZL ecosystem — command surfaces, domain packs, mobile, and corporate — with purpose, taxonomy, audience, and key dependencies.
> For the product surface-to-primitive mapping see [PRODUCT_SURFACE_MAP.md](PRODUCT_SURFACE_MAP.md). For the category narrative see [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md).

---

## Surface Taxonomy

Understanding what each type of surface is — and is not — is essential to understanding the platform.

| Type | What It Is | Examples |
|------|-----------|---------|
| **Platform** | The governed decision layer itself — the brand, the thesis, the shared governance infrastructure | SZL Holdings |
| **Flagship command surface** | The primary operator interface for signal-to-action — where governance is exercised | Lyte |
| **Execution fabric** | The governance backbone — workflows, approvals, audit trail — shared by all surfaces | Alloy |
| **Mobile command layer** | Unified mobile access to all domain workspaces and the governance layer | CORTEX |
| **Ecosystem hub** | Cross-domain real-time overview for platform administrators and ecosystem operators | Command Portal |
| **Domain pack** | Domain-specific intelligence extension built on the shared governance infrastructure | Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM |
| **Corporate platform** | Investor portal, trust center, and ecosystem overview — not an operator tool | SZL Holdings (web) |
| **Platform primitive** | A structural abstraction shared by all surfaces — not a product | Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric |

A domain pack is not a standalone product. It contributes domain-specific signal sources, analysis models, and action vocabulary to the platform. It inherits all six primitives, Alloy governance, CORTEX mobile access, and shared RBAC automatically.

---

## Platform Architecture Model

```
┌─────────────────────────────────────────────────────────────────┐
│  PLATFORM                                                       │
│  SZL Holdings — Governed Operational Intelligence               │
├─────────────────────────────────────────────────────────────────┤
│  COMMAND SURFACES                                               │
│  Lyte (flagship)   Command Portal (hub)   CORTEX (mobile)      │
│  PRISM framework   8-domain SSE dash      All domains, one app │
├─────────────────────────────────────────────────────────────────┤
│  EXECUTION FABRIC                                               │
│  Alloy — Workflow orchestration · Approval gates · Audit trail  │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                   │
│  Aegis         Vessels       Terra        PRISM Counsel        │
│  Security &    Maritime      Real Estate  Legal Matter         │
│  Defense       Intelligence  Intelligence Command              │
│  Carlota Jo — Premium Advisory   IMPERIUM — Cloud Sovereignty  │
├─────────────────────────────────────────────────────────────────┤
│  GOVERNANCE INFRASTRUCTURE (shared by all surfaces)            │
│  Outcome Graph · Proof Chain · Covenant Policy                 │
│  Decision Simulation · Workflow Engine · Event Fabric          │
│  AI Engine · RBAC + Auth                                       │
├─────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                     │
│  PostgreSQL 16 (Drizzle) · External feeds · AI providers       │
└─────────────────────────────────────────────────────────────────┘
```

All surfaces share six platform primitives — see [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) for the full specification.

---

## Status Definitions

| Label | Meaning |
|-------|---------|
| **Concept** | Thesis and spec only, no working software |
| **Prototype** | Core flows working, not hardened |
| **Functional Alpha** | Full feature set, seeded/demo data, not commercially deployed |
| **Internal Beta** | In use by real users internally |
| **Public Beta Candidate** | Ready for limited public exposure |
| **Generally Available** | Commercially deployed with paying customers |

---

## Web Applications

**Related:** [ARCHITECTURE.md](ARCHITECTURE.md) · [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md) · [API-SPEC.md](API-SPEC.md) · [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md)

### Lyte — Business Observability

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/lyte-command-center` |
| **Preview Path** | `/lyte-command-center/` |
| **Status** | Functional alpha |
| **Components** | 142 web components |
| **Audience** | Operations leads, CFOs, PMOs, executive teams, CTOs, SRE/DevOps teams |
| **Problem solved** | Organizations cannot see across their operational systems in real time — signals are siloed, risks surface too late, manual correlation dominates |
| **Core capability** | PRISM framework (Pulse/Risk/Intelligence/Signals/Motion), Autonomous NOC, AI-driven alert correlation, self-healing orchestration, revenue impact mapping, approval latency detection, signal-to-action lifecycle with full audit trail |
| **Key modules** | PRISM dashboard, signal timeline, action queue, approval chains, AIOps, APM, MSP/RMM tooling, ML pipeline management, cost governance |
| **Stack** | React 19, Vite, `@szl-holdings/ai-engine`, `@szl-holdings/forge-runtime`, `@szl-holdings/observability`, `@szl-holdings/prism-bus`, `@szl-holdings/shared-ui` |
| **Key dependencies** | `@szl-holdings/ai-engine`, `@szl-holdings/forge-runtime`, `@szl-holdings/observability`, `@szl-holdings/prism-bus`, `@szl-holdings/shared-ui` |
| **Primitives used** | All 6 — Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric |
| **Strategic role** | Operating wedge and flagship platform. Primary command surface for the governed decision loop. Entry point to all domain packs. Primary commercial entry point for the SZL ecosystem |

---

### Aegis / Firestorm — Unified Defense & Intelligence

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/firestorm` |
| **Preview Path** | `/firestorm/` |
| **Status** | Functional alpha |
| **Components** | 157 web components |
| **Audience** | CISOs, SOC analysts, managed security providers (MSPs), compliance officers |
| **Problem solved** | Security and intelligence operations are fragmented across disconnected tools — threat detection, managed ops, and AI research each require separate context |
| **Core capability** | Three unified workspaces sharing one intelligence layer: Defense (SOC operations and threat response), Command (managed services operations), Intelligence (AI research and model governance) |
| **Key modules** | MITRE ATT&CK v14 detection, SOAR playbook engine, STIX/TAXII protocol, XDR console, Sentinel AI agent, INCA analytics, Citadel crisis war room, deception grids, vulnerability management, dark vessel detection |
| **Stack** | React 19, Vite, `@szl-holdings/ai-engine`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/forge-runtime`, `@szl-holdings/proof-chain`, `@szl-holdings/shared-ui` |
| **Key dependencies** | `@szl-holdings/ai-engine`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/forge-runtime`, `@szl-holdings/proof-chain`, `@szl-holdings/shared-ui` |
| **DB Tables** | 22 tables covering the full security lifecycle |
| **Primitives used** | Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine |
| **Strategic role** | Security & defense domain pack. MSP Command module creates managed services revenue path. FedRAMP readiness track |

---

### Vessels — Maritime Intelligence

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/vessels` |
| **Preview Path** | `/vessels/` |
| **Status** | Functional alpha |
| **Audience** | Fleet executives, maritime operations teams, commercial directors, compliance officers, insurers |
| **Problem solved** | Fleet operators lack real-time visibility into vessel behavior, voyage economics, and compliance risk |
| **Core capability** | AIS telemetry integration, voyage economics modeling, dark vessel detection, sanctions screening (OFAC/UN/EU/UK), route intelligence, exception center with consequence modeling, Helmsman AI agent |
| **Key modules** | Fleet map (Mapbox), vessel digital twin, voyage P&L, dark vessel alerts, sanctions screening, exception center, commodity trading, marine insurance, Helmsman AI agent |
| **Stack** | React 19, Vite, `@szl-holdings/intelligence-feeds`, `@szl-holdings/worldline`, `@szl-holdings/shared-ui`, `@szl-holdings/db` |
| **Key dependencies** | `@szl-holdings/db`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/worldline`, `@szl-holdings/shared-ui` |
| **Components** | 83 web components |
| **DB Tables** | 30+ tables |
| **Primitives used** | Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine |
| **Strategic role** | Maritime domain pack. High-stakes buyer profile: enterprise, government, insurance |

---

### Terra — Real Estate Intelligence

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/terra` |
| **Preview Path** | `/terra/` |
| **Status** | Functional alpha |
| **Components** | 77 web components |
| **Audience** | NYC brokers, real estate investors, portfolio managers |
| **Problem solved** | Distressed property intelligence is fragmented across public records, manual research, and disconnected tools |
| **Core capability** | Live NYC distress data pipeline (HPD, DOF, DOB, ACRIS, ECB), AI distress scoring, ownership entity graph, deal pipeline management, broker workflow integration, MLS listing ingestion |
| **Key modules** | Distress property map, ownership graph, deal pipeline, MLS listing ingestion, commercial analytics, lead scoring, market signal intelligence, broker CRM |
| **Stack** | React 19, Vite, `@szl-holdings/monte-carlo`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/shared-ui`, `@szl-holdings/db` |
| **Key dependencies** | `@szl-holdings/db`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/monte-carlo`, `@szl-holdings/shared-ui` |
| **DB Tables** | 17 tables |
| **Primitives used** | Outcome Graph, Monte Carlo |
| **Strategic role** | Real estate domain pack. Foundation for national expansion beyond NYC |

---

### PRISM Counsel — Legal Matter Command *(Archived)*

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/prism-counsel` |
| **Preview Path** | `/prism-counsel/` |
| **Status** | **Archived** — frontend app source code (pages, components, routes) removed; no running workflow. API routes (`/api/prism-counsel/*`) remain for data access but are no longer actively developed. Database schema (120+ tables) is intact. |
| **Audience** | Legal partners, case managers, discovery analysts, recovery specialists |
| **Problem solved** | High-stakes litigation and recovery operations require cross-domain intelligence that standalone LegalTech platforms lack |
| **Core capability** | Agentic legal operating system — Matter Twin case management, AI-assisted document review, court filing integration, recovery ops, NY No-Fault module, pressure/friction boards |
| **Key modules** | Matter management, court filing integration (NY courts), document review, multi-jurisdictional support, recovery tracking (liens, settlements), proof chain audit, pressure/friction boards, copilot workbench, No-Fault module |
| **Stack** | React 19, Vite, `@szl-holdings/ai-engine`, `@szl-holdings/proof-chain`, `@szl-holdings/receipt-graph`, `@szl-holdings/covenant-policy`, `@szl-holdings/shared-ui` |
| **Key dependencies** | `@szl-holdings/ai-engine`, `@szl-holdings/proof-chain`, `@szl-holdings/receipt-graph`, `@szl-holdings/covenant-policy`, `@szl-holdings/shared-ui` |
| **Components** | 127 web components (archived) |
| **DB Tables** | 120+ tables across 10 schema modules (schema retained) |
| **Primitives used** | All 6 — Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric |
| **Strategic role** | Legal domain pack with cross-domain intelligence from defense, maritime, and financial domains |

---

### Carlota Jo — Private Advisory

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/carlota-jo` |
| **Preview Path** | `/carlota-jo/` |
| **Status** | Live (web) |
| **Audience** | Founders, executives, UHNW clients seeking brand and operational strategy |
| **Problem solved** | Premium advisory is disconnected from operational reality — advice is intuition-based rather than intelligence-informed |
| **Core capability** | White-glove advisory operations — strategic diagnostic engine, secure client portal, scenario simulator, booking and reservation system, document delivery, client messaging, inquiry tracking |
| **Key modules** | Client profile management, service catalog, booking system, document delivery, secure messaging, inquiry intake, reservation management |
| **Stack** | React 19, Vite, `@szl-holdings/ai-engine`, `@szl-holdings/shared-ui`, `@szl-holdings/db` |
| **Key dependencies** | `@szl-holdings/ai-engine`, `@szl-holdings/shared-ui`, `@szl-holdings/db` |
| **Components** | 60 web components |
| **DB Tables** | 10 tables |
| **Primitives used** | Proof Chain, Covenant Policy |
| **Strategic role** | Advisory domain pack. Live, client-facing. Demonstrates principal-led advisory grounded in platform intelligence |

---

### Command Portal — Ecosystem Intelligence Hub

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/command` |
| **Preview Path** | `/command/` |
| **Status** | Functional alpha |
| **Audience** | Internal administrators, ecosystem operators, prospective clients, founder, platform admin |
| **Problem Solved** | No single surface provides cross-domain operational health and signal aggregation across the full SZL ecosystem |
| **Core Capability** | Real-time 8-domain dashboard (SSE), composite health scoring, per-domain drill-downs, global command bar (Cmd+K), executive briefing view, timeline with filter chips, Cortex Voice AI assistant, event timeline |
| **Key Modules** | 8-domain real-time dashboard (SSE), composite health scoring, global Cmd+K search, executive briefing, per-domain drill-downs, event timeline |
| **Stack** | React 19, Vite, `@szl-holdings/shared-ui`, `@szl-holdings/prism-bus` |
| **Components** | 24 components |
| **Strategic Role** | Central portal for ecosystem-wide management, cross-platform orchestration, and enterprise marketing demos |

---

### SZL Holdings — Corporate Platform

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/szl-holdings` |
| **Preview Path** | `/` |
| **Status** | Public Beta Candidate |
| **Audience** | Investors, fund managers, venture partners, design partners, enterprise evaluators, strategic partners |
| **Problem Solved** | The ecosystem needs a coherent corporate presence presenting the platform hierarchy, trust posture, and investor narrative |
| **Core Capability** | Investor and venture intelligence platform — portfolio health radar, cap table management, fund operations, LP reporting, trust center, developer portal, PRISM Counsel integration, Alloy workflow surface |
| **Key Modules** | Landing page, platform product pages, trust center, investor hub (NDA-gated data room), admin CMS, PRISM Counsel integration, Alloy workflow integration |
| **Stack** | React 19, Vite, Tailwind CSS, `@szl-holdings/shared-ui`, `@szl-holdings/db`, `@szl-holdings/api-zod`, `@szl-holdings/prism-bus` |
| **Strategic Role** | Top of the brand hierarchy. Primary destination for investor and enterprise evaluation |

---

### Stephen Lutar — Founder Authority Site *(Archived)*

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/stephen-site` |
| **Preview Path** | `/stephen-site/` |
| **Status** | **Archived** — app source code (pages, components, routes) removed; residual config and dist files may remain. No running workflow. |
| **Audience** | Prospective partners, employers, clients, collaborators |
| **Core Capability** | Research impact tracking, media relations, audience intelligence, digital product storefront, work showcase |
| **Key Modules** | Professional portfolio, research showcase, media relations |
| **Stack** | React 19, Vite, `@szl-holdings/shared-ui` |
| **Components** | 58 components (archived) |
| **Strategic Role** | Founder positioning and personal brand — independent from SZL Holdings corporate identity |

---

### API Server

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/api-server` |
| **Preview Path** | `/api/` |
| **Status** | Live (internal service) |
| **Audience** | All web and mobile frontends — not user-facing |
| **Core Capability** | Centralized Express 5 API server. Handles all authentication, business logic, data access, AI orchestration, WebSocket connections, and billing for the entire ecosystem |
| **Stack** | Node.js 20, Express 5, TypeScript, `@szl-holdings/db`, `@szl-holdings/auth`, `@szl-holdings/ai-engine`, `@szl-holdings/forge-runtime`, `@szl-holdings/observability`, `@szl-holdings/services` |
| **Entry Point** | `GET /api/health` (public), `GET /api/docs` (Swagger UI), `POST /api/auth/login` |

---

## Mobile Surfaces

### CORTEX — Unified Mobile Command

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/szl-holdings-mobile` |
| **Preview Path** | `/szl-holdings-mobile/` (Expo tunnel) |
| **Status** | Functional alpha |
| **Platform** | iOS + Android (Expo / React Native) |
| **Audience** | Executives, investors, SZL ecosystem operators, all platform users requiring mobile access |
| **Core Capability** | All 8 domain workspaces in one Expo/React Native app — biometric authentication, workspace switcher with cross-domain badge counts, unified command feed, workspace-adaptive AI copilot, SpotlightFab quick actions |
| **Domains** | Lyte, Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM, Command, SZL Holdings |
| **Stack** | Expo, React Native, NativeWind, `@szl-holdings/mobile-shared`, `@szl-holdings/shared-ui`, `@szl-holdings/ai-engine`, `@szl-holdings/offline-engine` |
| **Screens** | 116 mobile screens |
| **API** | `EXPO_PUBLIC_API_URL` (points to `/api/`) |

---

### Domain-Specific Mobile Apps — Roadmap (Not Yet Built)

> **Status disclosure (resolves TD-006):** None of the apps in the table below are
> registered artifacts or built code. They are planned domain-specific companions to
> CORTEX (`artifacts/szl-holdings-mobile`), which today already exposes every domain
> workspace inside one Expo/React Native app. Domain-specific mobile apps will only
> be split out from CORTEX when a paying customer or design partner requires a
> standalone, single-domain mobile experience. Until then, mobile coverage for these
> domains is delivered through CORTEX.

| App | Planned Artifact | Domain | Status | Earliest Build Window |
|-----|------------------|--------|--------|------------------------|
| Aegis Mobile — SOC Command | `artifacts/aegis-mobile` (not registered) | Security | Roadmap — not yet built | H2 2026, contingent on Aegis design-partner demand |
| Vessels Mobile — Fleet Command | `artifacts/vessels-mobile` (not registered) | Maritime | Roadmap — not yet built | H2 2026, contingent on Vessels commercial pilot |
| Terra Mobile — Field Intelligence | `artifacts/terra-mobile` (not registered) | Real Estate | Roadmap — not yet built | 2027, after Terra field-ops paid pilot |
| Lyte Mobile — AIOps Command | `artifacts/lyte-mobile` (not registered) | Business Ops | Roadmap — not yet built | 2027, after Lyte enterprise GA |
| Carlota Jo Mobile — Client App | `artifacts/carlota-jo-mobile` (not registered) | Advisory | Roadmap — not yet built | H2 2026, contingent on Carlota Jo client demand |

For the live mobile surface available today, see **CORTEX — Unified Mobile Command** above (`artifacts/szl-holdings-mobile`).

---

### CORTEX Mobile (cortex-mobile)

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/cortex-mobile` |
| **Preview Path** | `/cortex-mobile/` |
| **Status** | Work in progress |
| **Purpose** | Next-generation CORTEX mobile experience (separate from szl-holdings-mobile) |

---

## Development / Internal Surfaces

### Component Preview Server (mockup-sandbox)

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/mockup-sandbox` |
| **Preview Path** | `/__mockup` |
| **Audience** | Internal — design and frontend engineers only |
| **Purpose** | Design sandbox for iterating on `@szl-holdings/shared-ui` components in isolation |

---

## Unregistered / Work in Progress

The following directories exist under `artifacts/` but are not yet deployed artifacts:

| Directory | Notes |
|-----------|-------|
| `artifacts/partner-portal` | In-progress partner/channel portal |
| `artifacts/alloy-mobile` | Mobile companion for Alloy |

---

*Last verified against code on 2026-04-17 (drift review — prism-counsel and stephen-site marked Archived; status now consistent with OPERATIONS-RUNBOOK.md)*

---

## Forge — AI Runtime, Agent Factory & Promotion Pipeline (April 2026)

Forge is the governed lifecycle layer for every AI agent on the platform. It owns
the registry, runtime capture, drift evaluator, promotion validator (8 blocker
codes) and rollback orchestrator. Surfaced inside the SZL Holdings dashboard
under `/forge/*`.

| Item | Location |
| --- | --- |
| Schema (20 tables, `forge_*`) | `lib/db/src/schema/forge.ts` |
| Service layer | `artifacts/api-server/src/services/forge/index.ts` |
| REST API (mounted under `/forge/*`) | `artifacts/api-server/src/routes/forge.ts` |
| UI pages (Overview · Registry · Agent Detail · Drift · Promotions · Telemetry) | `artifacts/szl-holdings/src/pages/forge/` |
| Seed (5 agents · 10 versions · 4 models · 4 tools · 4 prompts · 8 promotions · 4 drift events · 30 runs) | `pnpm --filter @workspace/scripts run seed:forge` |
| End-to-end smoke (10 governance checks) | `pnpm --filter @workspace/scripts run smoke:forge` |
| Detailed README | `artifacts/api-server/src/services/forge/README.md` |

---

## Decision Fabric surfaces (April 2026)

The Decision Fabric exposes a single, governed API namespace
(`/api/decision-fabric/*`) for every cross-primitive view. Each surface
lists the primary user, the question it answers, and the route that powers
it.

### Workflow 360
- **User:** ops lead, auditor, support engineer.
- **Question:** "What happened during this workflow run, end to end?"
- **Route:** `GET /api/decision-fabric/workflows/:runId/360`
- **Returns:** decision record + chronological primitive timeline.

### Entity Investigation
- **User:** analyst, account manager, auditor.
- **Question:** "Show me everything that ever touched this entity."
- **Route:** `GET /api/decision-fabric/entities/:type/:id/investigation`
- **Returns:** decisions, primitive events, primitives touched, first /
  last seen.

### Recommendation Trace
- **User:** product owner, ML observer.
- **Question:** "What flowed downstream from this recommendation?"
- **Route:** `GET /api/decision-fabric/recommendations/:id/trace`
- **Returns:** decisions, events, predicted vs. actual outcome.

### Approval Bottlenecks
- **User:** ops lead.
- **Question:** "Where is the approval queue stuck?"
- **Route:** `GET /api/decision-fabric/approvals/bottlenecks`
- **Returns:** pending counts + oldest / mean wait time per
  `(actionClass, resourceType)`.

### Policy Failures
- **User:** policy owner, governance lead.
- **Question:** "Which policies deny the most?"
- **Route:** `GET /api/decision-fabric/policies/failures`
- **Returns:** denials per policy + last denied timestamp.

### Prediction Drift
- **User:** model owner, ML observer.
- **Question:** "Where are predictions diverging most from reality?"
- **Route:** `GET /api/decision-fabric/predictions/drift`
- **Returns:** top-N decisions by `abs(predictionError)`.

### Decision Records
- **User:** any role with read-access to the org.
- **Question:** "Give me the durable record for this decision."
- **Routes:** `POST /decisions`, `GET /decisions`, `GET /decisions/:id`,
  `POST /decisions/:id/actual-outcome`.

### Snapshots
- **User:** governance / engineering.
- **Routes:** `POST /policy-snapshots`, `POST /simulation-snapshots`.

### Playbook Suggestions
- **User:** ops lead, head of product.
- **Question:** "What patterns are emerging that we should productize?"
- **Routes:** `GET /playbooks`, `POST /playbooks/generate` (admin),
  `POST /playbooks/:id/review` (admin).

### Cluster Stats
- **User:** product, ops.
- **Question:** "Where is decision volume concentrated and how reliable is
  it?"
- **Route:** `GET /api/decision-fabric/clusters`.

### Learning Cycle
- **User:** platform admin.
- **Question:** "Run a calibration cycle on the recent decision corpus."
- **Route:** `POST /api/decision-fabric/learning/run` (admin) — persisted
  as a row in `outcome_graph_learning_jobs`.

All routes require an authenticated session. Org isolation is enforced from
the user session at the route layer, not optional in the library.

---

## Trust & Provenance Surface

Every domain pack exposes a dedicated `/trust-provenance` route that surfaces
proof, policy, audit, and simulation primitives in a single 4-tab workspace.

| Artifact | Route | Focus |
|----------|-------|-------|
| Aegis | `/trust-provenance` | Security ops: threat assessments, SIEM evidence, response policy |
| Terra | `/trust-provenance` | Real estate: deal scenarios, tax appeals, property provenance |
| Vessels | `/trust-provenance` | Maritime: voyage risk, AIS anomalies, vessel provenance |

Each tab is backed by a shared primitive from `@szl-holdings/shared-ui`:

- **Proof Chains** → `ProofPanel` (source class, model/provider/version, confidence,
  reviewer state, export-safety state, derivation lineage, contradiction markers).
- **Policy Results** → `PolicyResult` (Allow/Deny/Escalate, matched rules,
  what-needs-to-change guidance, approval history, **Appeal** flow that POSTs to
  `/api/audit-log/policy-appeal`).
- **Audit Trail** → `AdminAuditTrail` (searchable timeline with actor attribution,
  risk tagging, and immutable hash display; `human_override` action type sourced
  from the approvals audit trail and equivalent persisted audit tables).
- **Decision Cockpit** → `SimulationCockpit` (best/base/worst scenarios,
  Monte Carlo ranges, sensitivity drivers, cost-of-waiting, Predicted vs Actual).

### Policy Appeal endpoint

- **Route:** `POST /api/audit-log/policy-appeal`.
- **Auth:** any authenticated user; CSRF-protected (requires `X-CSRF-Token`
  matching the `csrf_token` cookie).
- **Body:** `{ requestId: string, action: "escalate" | "appeal", justification?: string }`.
- **Validation:** for `action: "appeal"`, `justification` must be ≥ 8 characters.
- **Response:** `{ requestId, action, recordedAt, actorId }`.
- **Observability:** emits a structured `policy.appeal.recorded` log line with
  actor id, role, org, correlation id, `requestId`, `action`, and
  `justificationLength`. The `requestId` is treated as an opaque,
  caller-supplied identifier — this endpoint does not cross-validate it against
  an approvals row. For appeals that must persist to the tamper-evident audit
  trail, route them through `POST /api/approvals/:id/review` with
  `decision: "revised"` and a `note`, which writes an authoritative
  `human_override` entry in the approvals audit log.

### Approval flow integration

Approval records created via `POST /api/approvals` accept a free-form `payload`.
Callers should include the chosen `SimulationScenario` and a snapshot of
`ProofPanelData` so that approvers see the same simulation and evidence the
requester did. The existing `POST /api/approvals/:id/review` endpoint records
the approver's decision with `decision`, `note`, `actorId`, and
`serviceAttribution`, producing the end-to-end trace visible in the Audit Trail
tab.
