# SZL Holdings — Platform Architecture

**Version:** 2.0 · **Last updated:** March 2026

---

## Overview

The SZL platform is built around a focused operating wedge: **Lyte + Alloy**. Lyte delivers business observability — making every operational surface visible, contextual, and actionable through the PRISM framework. Alloy delivers execution accountability — the workflow engine, audit trail, and human-in-the-loop gates that close the loop from signal to confirmed action.

The thesis: **business observability and execution accountability** delivered together, as a system, to organizations where execution drift compounds into operational failure.

Four additional domain platforms (Aegis, Terra, Vessels, Carlota Jo) share the same architecture as expansion paths — one data layer, one execution fabric, one AI engine. The compounding value comes from shared infrastructure, not from portfolio diversity alone.

---

## The Architecture Model

```
┌─────────────────────────────────────────────────────────────────────┐
│  ADVISE                                                             │
│  Carlota Jo — Private Advisory & Strategy Consulting                │
│  Principal advisory grounded in platform intelligence               │
├─────────────────────────────────────────────────────────────────────┤
│  EXECUTE                                                            │
│  Alloy — Execution Fabric                                           │
│  Workflow engine · Audit trail · Agent coordination                 │
│  Human-in-the-loop gates for consequential actions                  │
├─────────────────────────────────────────────────────────────────────┤
│  OBSERVE · DECIDE · ACT                                             │
│  Lyte              Aegis              Terra           Vessels       │
│  Business          Defense &          Real Estate     Maritime      │
│  Observability     Intelligence       Intelligence    Intelligence  │
│  PRISM Framework   Defense/Cmd/Labs   NYC Distress    Fleet & AIS   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Platform-to-Doctrine Mapping

| Platform | Layer | Vertical | Primary User | Thesis |
|---|---|---|---|---|
| Lyte | Observe / Interpret | Business Operations | Ops Lead, CFO, PMO | Business observability — making every operational surface visible, contextual, and actionable via PRISM |
| Aegis | Observe / Respond | Cybersecurity & Defense | SOC Analyst, CISO, MSP | Unified defense and intelligence — three workspaces (Defense/Command/Labs) sharing one context |
| Terra | Observe / Underwrite | NYC Real Estate | Broker, Investor, Portfolio | Property intelligence — distress signals, ownership structures, deal pipeline management |
| Vessels | Track / Analyze | Maritime & Logistics | Fleet Exec, Ops, Commercial | Maritime intelligence — fleet positions, voyage economics, route risk, compliance |
| Carlota Jo | Advise | Brand & Strategy | Founder, CMO, Executive | Private advisory at the intersection of brand, operations, and platform intelligence |

---

## Intelligence Stack

How raw signal becomes actionable output:

```
Raw Signal
    │
    ▼
[OBSERVE] — Domain-specific ingestion and structuring
    │   Lyte:    Operational metrics, approval queues, workflow signals
    │   Aegis:   Security events, threat feeds, CVE data, MITRE ATT&CK
    │   Terra:   Distress filings, ownership records, market data
    │   Vessels: AIS telemetry, voyage data, port calls, sanctions lists
    │
    ▼
[ANALYZE] — Pattern recognition, scoring, explainability
    │   PRISM (Lyte):      Pulse/Risk/Intelligence/Signals/Motion decomposition
    │   INCA (Aegis Labs): Model evaluation, experiment tracking, confidence scoring
    │   Dreamscape:        Entity scoring engine, anomaly detection
    │
    ▼
[EXECUTE] — Workflow routing and human-confirmed action
    │   Alloy:  Agent network governance, approval workflows
    │           Human-in-the-loop gates for consequential actions
    │
    ▼
Confirmed Action + Audit Trail
```

---

## Entity Model

Core objects shared across the platform:

| Entity | Description | Appears In |
|---|---|---|
| Signal | A raw or normalised data point indicating a state change or anomaly | All platforms |
| Finding | A validated signal with attribution and severity classification | Aegis, Vessels, Terra |
| Incident | An active operational event requiring triage and response | Aegis, Lyte |
| Recommendation | An AI-generated advisory with reasoning and confidence score | Alloy, INCA |
| Action | A human-confirmed response to a finding or recommendation | Alloy |
| Actor | A person, role, or agent responsible for an action or decision | All platforms |
| Audit Event | An immutable record of any actor action or system state change | All platforms |

---

## Agent Network

Coordinated through Alloy. Agents are advisory by design — they surface intelligence and recommendations but do not execute consequential actions without explicit human confirmation.

| Agent | Domain | Platform | Function |
|---|---|---|---|
| Helmsman | Maritime | Vessels | Fleet intelligence, route risk, weather analysis |
| Sentinel | Security | Aegis | Threat analysis, incident response, vulnerability triage |
| Compass | Readiness | Alloy | Gap analysis, maturity assessment, improvement roadmaps |
| Navigator | Portfolio | SZL Holdings | Ecosystem navigation, portfolio overview |

---

## Shared Infrastructure

**Design System:** `@workspace/shared-ui` — TypeScript component library covering UI primitives, navigation, command palette, keyboard shortcuts, and agent indicators.

**Database:** PostgreSQL with Drizzle ORM. Single shared database with per-domain schema organization (vessels_*, alloy_*, etc.).

**Authentication:** OpenID Connect (PKCE) with session cookies. Role-based access control: `founder_admin`, `admin`, `operator`, `analyst`, `viewer`, `client`.

**API Layer:** Centralized Express API server handling all platform backends, AI inference routing, integration connectors, and health reporting.

**Real-time:** WebSocket with HMAC-signed tickets (5-minute TTL), per-channel role ACL, and automatic reconnection with exponential backoff.

**Execution Fabric:** Alloy coordinates workflow execution, agent routing, and approval workflows with full audit trail.

**PDF Generation:** Server-side pdfkit with 8 branded document templates across all platforms.

**Email:** Multi-provider (Resend → SendGrid → SMTP) with branded HTML templates per platform.

**Payments:** Stripe (Checkout, Subscriptions, Invoicing, Customer Portal) with per-platform pricing tiers.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, Recharts, Framer Motion |
| Mobile | Expo / React Native, expo-auth-session |
| Routing | Wouter (client-side), path-based monorepo routing |
| State | TanStack Query, React Context |
| UI | Custom shared-ui, Radix UI primitives |
| Backend | Node.js, Express, TypeScript, esbuild |
| Database | PostgreSQL, Drizzle ORM |
| Real-time | WebSocket (ws library) |
| AI / LLM | OpenAI, Anthropic, Google Gemini |
| Maps | Mapbox GL JS |
| Payments | Stripe |
| PDF | pdfkit |
| Email | Resend, SendGrid, nodemailer |
| Monorepo | pnpm workspaces |
| IaC | Azure Bicep |

---

## Design Principles

**Explicit over implicit.** Platform state — data freshness, demo mode, model version, agent confidence — is always visible. Users never assume what they are looking at.

**Advisory before autonomous.** AI outputs are presented as recommendations with reasoning. Execution requires human confirmation. This is architectural, not policy.

**Traceability as a feature.** Every significant event is logged with attribution and context. The audit trail is an operational tool, not a compliance artifact.

**Shared infrastructure, domain-specific surfaces.** The architecture is shared. Domain expertise — maritime terminology, security taxonomy, real estate distress signals — is built into each platform's surface layer.

**Premium restraint in design.** Dark, immersive aesthetic. Density with clarity, subdued palettes with deliberate accent use, information hierarchy over decoration. Every UI decision makes the user faster and more confident.

---

## Changelog

| Version | Date | Summary |
|---|---|---|
| 2.0 | March 2026 | Updated for current platform naming (Aegis, PRISM, etc.), WebSocket, Stripe, Mapbox, PDF, mobile |
| 1.0 | March 2026 | Initial architecture documentation |
