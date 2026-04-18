# App-Moats — Canonical Product Map

**Version:** 1.0 | **Date:** April 2026 | **Status:** Canonical — supersedes `MOAT_MAP.md` and `DOMAIN_PACK_CATALOG.md` for product naming

> **Navigation:** [architecture.md](architecture.md) · [ontology.md](ontology.md) · [policy-model.md](policy-model.md) · [MOAT_MAP.md](MOAT_MAP.md)

---

## Purpose

This document is the single source of truth for:
1. Which product name resolves to which artifact (or planned artifact)
2. Where each product fits in the platform hierarchy
3. What the structural moats are for the "Living Infrastructure / Adaptive Intelligence Mesh" vision

---

## Canonical Product Map

### Active Artifacts (Registered and Running)

| Product Name | Artifact Dir | Preview Path | Kind | Role |
|-------------|-------------|-------------|------|------|
| **SZL Holdings** | `artifacts/szl-holdings` | `/` | Web | Corporate portal + Lyte surfaces (business observability) |
| **API Server** | `artifacts/api-server` | `/api` | Web | Single backend for all surfaces |
| **Command** | `artifacts/command` | `/command` | Web | Unified operations hub (8-domain SSE dashboard) |
| **Vessels** | `artifacts/vessels` | `/vessels` | Web | Maritime intelligence domain pack |
| **Terra** | `artifacts/terra` | `/terra` | Web | Real estate intelligence domain pack |
| **Carlota Jo** | `artifacts/carlota-jo` | `/carlota-jo` | Web | Advisory + client portal |
| **Pulse** | `artifacts/pulse` | `/pulse` | Web | AI executive briefing |
| **CORTEX (mobile)** | `artifacts/szl-holdings-mobile` | `/szl-holdings-mobile` | Mobile | Expo mobile command |
| **NEXUS** | `artifacts/mockup-sandbox` | `/nexus` | Design | Unified agentic AI layer (sandbox) |
| **Aegis (pitch deck)** | `artifacts/aegis` | `/aegis` | Web | Investor pitch deck |
| **Demo Video** | `artifacts/szl-demo-video` | `/szl-demo-video` | Video | Governed autonomy demo |

### Planned Products (Not Yet Built as Artifacts)

| Product Name | Status | Notes |
|-------------|--------|-------|
| **Lyte** | Planned — flagship | Will be the primary command surface. Currently the `szl-holdings` artifact carries Lyte's business observability surfaces. The `lyte-command-center` directory is archived (merged into `szl-holdings`). |
| **Sentra** | Planned | New domain pack (details TBD). No current artifact. |
| **Counsel** | Planned | Legal matter command. May absorb `prism-counsel` (archived). The `prism-counsel` artifact is deprecated — frontend removed, some API routes retained in `api-server`. |

### Archived Artifacts (No Active Workflow)

| Product Name | Artifact Dir | Status |
|-------------|-------------|--------|
| Firestorm / Aegis (security) | `artifacts/firestorm` | Archived — marker file only |
| IMPERIUM | (merged into command) | Archived — no running workflow |
| PRISM Counsel | `artifacts/prism-counsel` | Deprecated — frontend removed |
| Stephen Site | `artifacts/stephen-site` | Deprecated — source removed |

---

## Platform Hierarchy

```
SZL Holdings Platform
    │
    ├── COMMAND SURFACES
    │   ├── Lyte (planned flagship — business observability)
    │   ├── SZL Holdings (corporate + current Lyte surfaces)
    │   ├── Command (unified hub — operators and cross-domain)
    │   ├── Pulse (executive briefing)
    │   └── CORTEX (mobile command)
    │
    ├── EXECUTION FABRIC
    │   └── Alloy (@workspace/alloy + lib/workflow-engine)
    │
    └── DOMAIN PACKS
        ├── Vessels — maritime intelligence
        ├── Terra — real estate intelligence
        ├── Carlota Jo — advisory
        ├── Sentra — (planned)
        └── Counsel — (planned, may absorb prism-counsel)
```

---

## Living Infrastructure Vision — Structural Moats

The following moats describe why the "Living Infrastructure / Adaptive Intelligence Mesh" is defensible. Each moat compounds with use. See [MOAT_MAP.md](MOAT_MAP.md) for the full analysis; this section summarizes the architecture-grounded properties that make the vision durable.

### Moat 1: Decision Memory
Every governed decision is recorded in the Outcome Graph (`lib/outcome-graph`) with agent, human, outcome, and calibration linkage. After ~10k decisions, the corpus itself becomes a sales asset and a calibration advantage no new entrant can bootstrap. Decision records freeze `policy_version` and `simulation_snapshot` at decision time — auditors can reconstruct the exact context years later.

### Moat 2: Proof and Provenance
The Proof Chain (`lib/proof-chain`) produces an immutable, cryptographically verifiable audit trail. Once an organization's decision history lives in the proof chain, migrating is technically complex and legally fraught. This is an enterprise switching cost that accumulates every month.

### Moat 3: Governed Autonomy Infrastructure
The Covenant Policy engine and `packages/policy-engine` enforce human-in-the-loop at the library layer — not the UI. This is structural compliance, not retrofitted governance. As AI regulations tighten (EU AI Act, SEC AI governance), structural compliance becomes a moat that cannot be replicated quickly.

### Moat 4: Calibrated Simulation
The Monte Carlo engine (`lib/monte-carlo`) is calibrated over time against real outcome data. Domain-specific calibration depth (e.g. maritime voyage P&L after thousands of real voyages) cannot be synthetic-generated. The simulation is only as good as its calibration corpus.

### Moat 5: Cross-Domain Signal Correlation
The Prism Bus (`lib/prism-bus`) and the correlation contract (defined in [telemetry-model.md](telemetry-model.md)) allow a sanctions hit in Vessels to surface a legal risk flag in Counsel, which triggers a policy escalation in Command. No single-domain tool can offer this. The correlation value grows nonlinearly with the number of domain packs.

### Moat 6: Governed Agent Gateway
The MCP gateway and `packages/tool-mesh` provide a governed, role-enforced, audit-logged interface for AI agents across all domains. Every agent call is tenant-scoped and policy-gated. As enterprise IT departments face pressure to govern AI agent activity, this becomes a procurement requirement, not a feature preference.

### Moat 7: Domain-Pack Extensibility
Each new domain pack inherits the full governance infrastructure: Proof Chain, Covenant Policy, Outcome Graph, Monte Carlo, Workflow Engine, Event Fabric, RBAC, and CORTEX. The marginal governance cost of Domain Pack N decreases as N grows. Cross-domain compounding means each new pack adds signal value for all existing packs.

### Moat 8: Enterprise Trust Infrastructure
The Trust Center, Proof Chain, Covenant Policy, RBAC model, and multi-tenant isolation are inspectable by enterprise security teams. Each organization that completes diligence creates a reference architecture that accelerates the next procurement. Transparent gap registries (e.g. `KNOWN-GAPS.md`) are themselves trust signals.

### Moat 9: Living Signal Mesh (Planned — next phase)
As signal connectors for each domain pack become real-time, continuously refreshed, and cross-domain correlated, the platform becomes a living intelligence layer — not a query tool. Freshness state propagates forward to every entity, recommendation, and approval that depends on it. This is the "Living Infrastructure" thesis: the platform's world model stays current automatically, without human data entry. Implemented via `packages/constellation` (world model graph), `packages/memory-fabric` (tiered memory), and the freshness registry in [telemetry-model.md](telemetry-model.md).

---

## Domain Pack — Concept Mapping

For each domain in the platform, the following packages own the relevant concepts:

| Domain | Signal connectors | Domain agents | Ontology entities | UI artifact |
|--------|-----------------|--------------|------------------|-------------|
| Vessels | `lib/intelligence-feeds` (AIS, sanctions) | Helmsman, Lookout, Quartermaster | `vessel`, `voyage` | `artifacts/vessels` |
| Terra | `lib/intelligence-feeds` (property records) | Surveyor, Cartographer, Closer | `property`, `deal` | `artifacts/terra` |
| Security | `lib/intelligence-feeds` (STIX/TAXII, CVE) | Sentinel, Watchkeeper, Rampart | `incident`, `threat` | (aegis surfaces in szl-holdings) |
| Counsel | CourtListener adapter (in api-server) | Counsel, Recorder, Recoverer | `matter` | (planned — was prism-counsel) |
| Carlota | Booking/engagement data | Concierge, Steward, Curator | `engagement` | `artifacts/carlota-jo` |
| Pulse | AI inference + briefing pipeline | Briefer | `brief` | `artifacts/pulse` |
| Command | Cross-domain aggregation | Navigator | (composite) | `artifacts/command` |
| Lyte | Business metrics, workflow signals | Compass | (composite) | `artifacts/szl-holdings` (planned: own artifact) |

---

*Supersedes product-naming sections of: [MOAT_MAP.md](MOAT_MAP.md) · [DOMAIN_PACK_CATALOG.md](DOMAIN_PACK_CATALOG.md). For full moat analysis, see [MOAT_MAP.md](MOAT_MAP.md). For artifact runtime config, see [docs/PLATFORM_CANONICAL.md](docs/PLATFORM_CANONICAL.md).*
