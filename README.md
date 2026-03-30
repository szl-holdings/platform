# SZL Holdings — Platform Ecosystem

**Business Observability at enterprise scale.** SZL Holdings builds and operates technology platforms that connect operational signal to strategic decision — across maritime logistics, security operations, AI research, and enterprise management.

## The Architecture

The SZL platform is organised into four functional layers. This is not a product portfolio arranged for presentation — it is a working architecture where each layer has a defined contract with the adjacent ones.

```
┌─────────────────────────────────────────────────────────────┐
│  ADVISE                                                     │
│  Carlota Jo Consulting — Brand, Strategy, Advisory          │
├─────────────────────────────────────────────────────────────┤
│  EXECUTE                                                    │
│  AlloyScape — Execution Fabric & Agent Coordination         │
├─────────────────────────────────────────────────────────────┤
│  UNDERSTAND                                                 │
│  INCA — AI Research Command     Nimbus — Predictive Intel   │
├─────────────────────────────────────────────────────────────┤
│  OBSERVE                                                    │
│  Vessels · Maritime    Rosie · Security    Beacon · Ops     │
└─────────────────────────────────────────────────────────────┘
```

**Observe** — Acquire and structure operational signals across domains.
**Understand** — Reason across those signals: patterns, anomalies, predictions, confidence.
**Execute** — Route intelligence into confirmed, traceable human action.
**Advise** — Translate platform intelligence into strategic decisions, with expert accountability.

---

## Products

### Observe Layer

**Vessels** — Maritime intelligence for fleet operations
Real-time AIS telemetry, voyage economics, route intelligence, maintenance readiness, dark vessel detection, and sanctions screening. Built for fleet executives, operations teams, and commercial directors who need fleet-wide visibility without information overload.

**Rosie (MSP)** — Threat and incident command
SOC-grade incident management, threat intelligence, MITRE ATT&CK coverage, forensics timeline, XDR console, and compliance readiness. Designed for security teams where the cost of a slow response is quantifiably high.

**Beacon (Terra)** — Business telemetry
KPI monitoring, SLO tracking, anomaly detection, workflow latency analysis, and portfolio signal aggregation. Connects infrastructure behaviour to business outcomes for operators and executives.

### Understand Layer

**INCA** — AI research command
Agent orchestration, model registry, experiment management, ensemble evaluation, LLM assessment, GPU monitoring, and explainability tooling. The internal intelligence layer where SZL's AI outputs become traceable, versioned, and accountable.

**Nimbus (Dreamscape)** — Predictive intelligence
Scenario construction, drift monitoring, confidence visualisation, and anomaly correlation. Forward signal analysis for teams that need structured reasoning about what comes next.

### Execute Layer

**AlloyScape (Alloy)** — Execution fabric
The agent coordination layer for the SZL platform. Routes signals through the agent network (Helmsman, Sentinel, Beacon, and others), enforces human-in-the-loop governance, and maintains the audit trail for every confirmed action. Advisory agents recommend; AlloyScape governs what happens next.

### Advise Layer

**Carlota Jo Consulting** — Principal advisory
Brand strategy, content architecture, and operational transformation advisory. Distinct from typical consulting: the advisory capability is informed by the same observability infrastructure that powers the platform products.

### Identity

**Stephen Lutar — Career** — Founder identity
Not a portfolio site. A platform architect's narrative: the thesis, the tech, the track record, and the strategic intent behind the ecosystem.

---

## Key Capabilities

| Capability | Description |
|---|---|
| Shared design system | Every product shares `@workspace/shared-ui` — a TypeScript component library with unified navigation, command palette, agent indicators, and interaction model |
| Agent network | Coordinated advisory agents (Helmsman, Sentinel, Beacon, Muse, Compass) operating under AlloyScape governance |
| Human-in-the-loop | Advisory agents cannot execute consequential actions without explicit human confirmation — enforced at the workflow level |
| Audit trail | Immutable, attributed event log across all products. Every signal, finding, recommendation, and action is traceable |
| Role-based access | Product-specific RBAC (exec, ops, compliance, maintenance) with shared enforcement infrastructure |
| Explainability | AI outputs include reasoning and confidence signals. No black-box scoring |
| Demo / live transparency | Platform state (demo mode, live data, stale cache) is always explicitly labelled |

---

## Technology Stack

| Category | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Routing | Wouter (client-side, path-based monorepo routing) |
| State management | TanStack Query, React Context |
| UI components | Custom `@workspace/shared-ui` (Radix UI primitives) |
| Backend | Node.js, Express, TypeScript |
| AI inference | OpenAI (GPT series), Anthropic (Claude series) |
| Database | PostgreSQL (Drizzle ORM) |
| Charts | Recharts |
| Monorepo | pnpm workspaces |

---

## Repository Structure

```
/
├── artifacts/
│   ├── alloy/               # AlloyScape — Execution Fabric
│   ├── carlota-jo/          # Carlota Jo Consulting
│   ├── dreamscape/          # Nimbus — Predictive Intelligence
│   ├── firestorm/           # Firestorm Security Simulation
│   ├── inca/                # INCA AI Research Command
│   ├── lyte-command-center/ # Lyte / Beacon — Business Telemetry
│   ├── msp/                 # Rosie — Threat & Incident Command
│   ├── stephen-site/        # Career — Founder Identity
│   ├── szl-holdings/        # SZL Holdings — Portfolio Site
│   ├── terra/               # Beacon / Terra — Business Intelligence
│   ├── vessels/             # Vessels Maritime Intelligence
│   └── api-server/          # Centralised API and integration layer
├── lib/
│   └── shared-ui/           # Shared design system and components
├── docs/
│   ├── architecture.md      # Four-layer model, entity graph, agent network
│   ├── trust-center.md      # Platform trust, security, AI governance
│   └── investor-narrative.md# Strategic narrative and investment thesis
└── README.md
```

---

## Documentation

- [Architecture](docs/architecture.md) — Four-layer model, entity graph, agent network, technology stack
- [Trust Center](docs/trust-center.md) — Access control, AI governance, deployment discipline, incident readiness
- [Investor Narrative](docs/investor-narrative.md) — Strategic thesis, category definition, expansion logic, defensibility

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Push database schema (development)
pnpm --filter @workspace/db run push

# Seed demo data
pnpm --filter @workspace/scripts run seed

# Start all services (handled by Replit workflows)
# Each artifact reads PORT from environment
```

---

## Strategic Thesis

The enterprises that will win the next decade are not the ones with the most data. They are the ones that can reason across their data, connect operational signal to strategic decision, and act with confidence — faster than their competitors, and with more accountability than their regulators require.

SZL Holdings is building the platform infrastructure for that outcome. Not as a single product, but as a layered ecosystem where every product makes the others stronger, every data signal compounds across domains, and every AI recommendation is traceable, explainable, and confirmed by a human who understood it.

The category is Business Observability. The architecture is explicit. The compounding has started.

---

*SZL Holdings · Built for operators who cannot afford to be wrong.*
