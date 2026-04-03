# Platform Overview

SZL Holdings builds governed operational intelligence software. The platform connects observability to action through a governed signal pipeline — surfacing risk, routing decisions, enforcing approval gates, and generating immutable audit trails.

---

## Core Architecture

The platform is organized into two foundational layers and four domain packs:

**Lyte** — The command surface. Surfaces operational risk, bottlenecks, ownership gaps, and execution priorities across the PRISM framework (People, Revenue, Infrastructure, Security, Market).

**Alloy** — The execution fabric. Normalizes signals, routes workflows, enforces human-in-the-loop approval, and maintains an immutable audit trail. Every AI-assisted action runs through Alloy's governance layer.

**Domain packs** apply the same architecture to specific verticals with domain-specific data pipelines, specialized signal types, and purpose-built UX.

---

## Product Portfolio

| Product | Domain | Function | Status |
|---------|--------|----------|--------|
| **Lyte** | Business observability | Command surface, PRISM framework, signal-to-action | Functional alpha |
| **Alloy** | Execution fabric | Workflow engine, approval gates, audit trail | Functional alpha |
| **Aegis** | Security & defense | SOC command, threat intelligence, SOAR | Functional alpha |
| **Vessels** | Maritime intelligence | Fleet command, AIS, sanctions screening | Functional alpha |
| **Terra** | Real estate intelligence | Distress detection, deal pipeline, ownership graph | Functional alpha |
| **Carlota Jo** | Premium advisory | UHNW client operations, private intake | Live |

---

## Signal-to-Action Pipeline

The core architecture processes signals from any source through a normalized pipeline to governed action:

```
External Signals (integrations, telemetry, data feeds)
        │
        ▼
  Signal Normalization (Alloy)
        │
        ▼
  Context Engine (correlation, attribution, severity scoring)
        │
        ▼
  Routing Logic (priority classification, role assignment)
        │
   ┌────┴────────────────────────────┐
   ▼                                 ▼
Auto-Execute (policy-approved)   Human Review Gate
   │                                 │
   └────────────────┬────────────────┘
                    ▼
             Action Execution
                    │
                    ▼
          Immutable Audit Trail
```

---

## Technology Foundation

**Monorepo:** pnpm workspace with 16 artifacts — 7 web apps, 7 mobile apps, 1 API server, 1 design system.

**Languages:** TypeScript throughout. No JavaScript. Strict typing enforced.

**Frontend:** React + Vite (web), Expo/React Native (mobile).

**Backend:** Express 5, PostgreSQL 16, Drizzle ORM. 120+ tables with domain-isolated schemas.

**AI:** HuggingFace Inference (Qwen3-8B primary), evidence-backed hybrid retrieval, 9 schema-validated decision types, policy-gated tool execution.

**Auth:** OIDC/PKCE, 11-role RBAC, SCIM 2.0 provisioning, Azure AD multi-tenant SSO.

**Infrastructure:** Azure (App Service, PostgreSQL Flexible, Key Vault, Redis, CDN). IaC via Bicep templates.

---

## Why It's Structured This Way

**Shared fabric, domain specialization.** Lyte and Alloy are not product-specific infrastructure — they are the platform. Domain packs (Aegis, Vessels, Terra, Carlota Jo) are structured applications built on the same foundation. This means governance, audit, and AI orchestration capabilities are not reinvented per domain.

**AI governance by design.** AI agents in this platform cannot execute consequential actions without explicit human approval. This is enforced at the workflow level (Alloy) — not just in the UI. The platform is built for operators who need AI assistance with human accountability, not AI autonomy without oversight.

---

## Further Reference

- [[Architecture]] — Technical architecture deep dive
- [[Deployment-Model]] — Infrastructure and deployment options
- [[Security-Posture]] — Auth, access control, and data security
- [[Trust-Center]] — AI governance, compliance templates, audit trail
- [System Overview](../../docs/architecture/system-overview.md) — In-repo architecture doc
