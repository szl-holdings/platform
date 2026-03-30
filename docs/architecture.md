# SZL Holdings — Platform Architecture

**Version:** 1.0 · **Last updated:** March 2026

---

## Overview

The SZL platform is built around a four-layer Business Observability architecture. Each layer has a defined function, a defined product set, and a defined interface contract with the adjacent layers. The architecture is not incidental — it is the thesis.

---

## The Four-Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4 · ADVISE                                           │
│  Carlota Jo Consulting                                      │
│  Principal advisory grounded in platform intelligence       │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3 · EXECUTE                                          │
│  AlloyScape — Execution Fabric                              │
│  Agent coordination · Human-confirmed workflow routing      │
│  Governance layer for the agent network                     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2 · UNDERSTAND                                       │
│  INCA — AI Research Command     Nimbus — Predictive Intel   │
│  Model management · Reasoning   Scenarios · Drift · Signals │
│  Agent evaluation · Explainability                          │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1 · OBSERVE                                          │
│  Vessels            Rosie              Beacon               │
│  Maritime Intel     Threat & Incident  Business Telemetry   │
│  Fleet · Route      SOC · MITRE        KPI · SLO · Anomaly  │
│  Economics · AIS    Compliance         Workflow · Portfolio  │
└─────────────────────────────────────────────────────────────┘
```

---

## Product-to-Doctrine Mapping

| Product | Layer | Vertical | Primary User | Thesis One-Liner |
|---|---|---|---|---|
| Vessels | Observe | Maritime & Logistics | Fleet Exec, Ops, Commercial | Real-time fleet and voyage intelligence for operators who cannot afford to be wrong. |
| Rosie | Observe | Cyber & Security | SOC Analyst, CISO, Compliance | SOC-grade threat and incident command, designed to work at the speed of an actual incident. |
| Beacon | Observe | Business Operations | Ops Lead, CFO, PMO | Operational telemetry that connects infrastructure signals to business outcomes. |
| INCA | Understand | AI Research | ML Engineer, Research Lead | The intelligence layer where models are evaluated, agents are governed, and AI outputs become traceable decisions. |
| Nimbus | Understand | Predictive Analytics | Data Scientist, Strategy Lead | Forward signal analysis and scenario reasoning for teams that need to see around corners. |
| AlloyScape | Execute | Platform / Cross-Domain | Platform Architect, Operations | The execution fabric that turns intelligence into confirmed, accountable action. |
| Carlota Jo | Advise | Brand & Strategy | Founder, CMO, Executive | Advisory at the intersection of brand, operations, and platform intelligence. |
| Stephen Site | Identity | Founder / Career | Investors, Partners | A founder identity platform that reflects platform architecture, not a CV. |

---

## Intelligence Stack

The intelligence stack describes how raw signal becomes actionable output across the platform.

```
Raw Signal
    │
    ▼
[OBSERVE LAYER] — Domain-specific ingestion and structuring
    │   Vessels: AIS telemetry, voyage data, port calls
    │   Rosie:   Security events, threat feeds, CVE data
    │   Beacon:  Operational metrics, KPIs, SLO data
    │
    ▼
[UNDERSTAND LAYER] — Pattern recognition, reasoning, explainability
    │   INCA:   Model evaluation, agent coordination, confidence scoring
    │   Nimbus: Anomaly detection, drift analysis, scenario modelling
    │
    ▼
[EXECUTE LAYER] — Workflow routing and human-confirmed action
    │   AlloyScape: Agent network governance, approval workflows
    │               Human-in-the-loop gates for consequential actions
    │
    ▼
Confirmed Action + Audit Trail
```

---

## Entity Model

The SZL entity model defines the core objects that appear across the platform. Sharing a model across products is what makes cross-domain traceability possible.

| Entity | Description | Appears In |
|---|---|---|
| Signal | A raw or normalised data point indicating a state change or anomaly | All Observe layer products |
| Finding | A validated signal with attribution and severity classification | Rosie, Vessels, Beacon |
| Incident | An active operational event requiring triage and response | Rosie, Vessels, Beacon |
| Recommendation | An AI-generated advisory with reasoning and confidence score | AlloyScape, INCA, agent network |
| Action | A human-confirmed response to a finding or recommendation | AlloyScape |
| Actor | A person, role, or agent responsible for an action or decision | All products |
| Audit Event | An immutable record of any actor action or system state change | All products |
| Model | A versioned AI model with tracked provenance and evaluation history | INCA |
| Experiment | A structured test of a model hypothesis with measurable outcome | INCA |

---

## Agent Network

The SZL agent network is coordinated through AlloyScape. Agents are advisory by design — they surface intelligence and recommendations but do not execute consequential actions without explicit human confirmation.

| Agent | Domain | Product | Function |
|---|---|---|---|
| Helmsman | Maritime | Vessels | Fleet intelligence, route risk, weather analysis |
| Sentinel | Security | Rosie / Firestorm | Threat analysis, incident response, vulnerability triage |
| Beacon | Operations | Lyte / Beacon | Signal correlation, incident triage, SLO analysis |
| Muse | Creative | Dreamscape / Carlota Jo | Content strategy, campaign ideation |
| Compass | Readiness | AlloyScape | Gap analysis, maturity assessment, improvement roadmaps |
| Navigator | Portfolio | SZL Holdings | Ecosystem navigation, portfolio overview |
| Stephen AI | Identity | Stephen Site | Founder narrative, expertise positioning |

---

## Shared Infrastructure

All SZL products are built on a shared technical foundation:

**Design System:** `@workspace/shared-ui` — A TypeScript component library covering UI primitives, navigation patterns, command palette, keyboard shortcuts, agent indicators, and welcome overlays. Every product that imports from this library shares its design language automatically.

**Event Schema:** A common event format for platform-wide audit logging. All products emit events in the same schema. This is the prerequisite for cross-domain traceability.

**Authentication:** Shared session management and role-based access control infrastructure. Role models are product-specific but the enforcement layer is shared.

**API Layer:** Centralised API server handling AI inference routing, integration connectors, data persistence, and health reporting across all products.

**Intelligence Layer:** AlloyScape coordinates agent routing, context passing, and approval workflows across the agent network. Model versions, prediction provenance, and recommendation chains are tracked through INCA.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Routing | Wouter (client-side), path-based monorepo routing |
| State | TanStack Query, React Context |
| UI Library | Custom shared-ui (workspace library), Radix UI primitives |
| Backend | Node.js, Express, TypeScript |
| AI / LLM | OpenAI (GPT series), Anthropic (Claude series) — routed via Replit AI proxy |
| Database | PostgreSQL (via Replit managed DB) |
| Charts | Recharts |
| Monorepo | pnpm workspaces |

---

## Design Principles

**Explicit over implicit.** Platform state — data freshness, demo mode, model version, agent confidence — is always visible. Users are never left to assume what they are looking at.

**Advisory before autonomous.** AI outputs are presented as recommendations with reasoning. Execution requires human confirmation. This is architectural, not just policy.

**Traceability as a feature.** Every significant event — signal, finding, recommendation, action — is logged with attribution and context. The audit trail is not a compliance artefact; it is an operational tool.

**Shared infrastructure, domain-specific surfaces.** The four-layer architecture is shared. The domain expertise — maritime terminology, security taxonomy, AI research workflow — is built into each product's Observe layer. The compounding value of shared infrastructure is the platform's structural advantage.

**Premium restraint in design.** The SZL design system favours density with clarity, subdued palettes with deliberate accent use, and information hierarchy over decoration. Every UI decision should make the user faster and more confident, not more impressed.

---

## Ecosystem Map

```
                    ┌─────────────────┐
                    │   SZL Holdings  │
                    │  Portfolio Site  │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌───────▼──────┐   ┌──────▼──────┐
   │   OBSERVE   │   │  UNDERSTAND  │   │   EXECUTE   │
   │─────────────│   │──────────────│   │─────────────│
   │ Vessels     │   │ INCA         │   │ AlloyScape  │
   │ Rosie       │   │ Nimbus       │   │             │
   │ Beacon      │   │              │   │             │
   └──────┬──────┘   └───────┬──────┘   └──────┬──────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │     ADVISE      │
                    │─────────────────│
                    │ Carlota Jo      │
                    └─────────────────┘

Supporting:
  Stephen Site — Founder identity and platform narrative
  Firestorm    — Security simulation and adversarial readiness (Observe/Security)
```

---

## Changelog

| Version | Date | Summary |
|---|---|---|
| 1.0 | March 2026 | Initial architecture documentation |
