# Domain Pack Strategy — SZL Holdings Platform

Generated: 2026-04-16
Authority: Phase 2-3 Product Topology & Portfolio Rationalization

---

## What Is a Domain Pack?

A **domain pack** is a canonical, investor-ready vertical application built on the SZL platform. Each domain pack:

1. Serves a specific industry vertical with deep, domain-specific functionality
2. Runs on the shared platform backbone (`api-server`, `shared-ui`, `ai-engine`, `lib/db`, `proof-chain`)
3. Is sold independently under its own brand and pricing model
4. Contributes domain-specific signals to the cross-domain intelligence layer
5. Inherits platform primitives (Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine) without rebuilding them

The key insight: **the platform investment compounds across every domain pack.** Auth, governance, audit trail, real-time infrastructure, and AI orchestration are built once and used by all. The marginal cost of a new domain pack is the vertical intelligence layer — not the platform infrastructure.

---

## Current Domain Pack Inventory

| Domain Pack | Artifact | Vertical | Status | Buyer Profile |
|-------------|----------|----------|--------|---------------|
| **Aegis** | `artifacts/aegis` | Security & Defense | Functional alpha | CISOs · SOC analysts · MSPs |
| **Vessels** | `artifacts/vessels` | Maritime Intelligence | Functional alpha | Fleet executives · Commercial directors |
| **Terra** | `artifacts/terra` | Real Estate Intelligence | Functional alpha | NYC brokers · Distressed property investors |
| **Carlota Jo** | `artifacts/carlota-jo` | Premium Advisory | Live | UHNW · Founders · Executives |

---

## How Domain Packs Relate to the Platform

### The Platform is the Backbone

```
                        api-server (sole backend)
                              │
              ┌───────────────┼──────────────────┐
              │               │                  │
           aegis           vessels             terra
      (security intel)  (maritime intel)   (real estate intel)
              │               │                  │
              └───────────────┼──────────────────┘
                              │
                        carlota-jo
                       (advisory layer)
                              │
                          command
                     (operator command surface)
```

Every domain pack:
- **Auth**: Delegates to `api-server` RBAC (11 roles, org-scoped)
- **Audit trail**: Uses `lib/proof-chain` — every significant action is immutable and attributed
- **AI**: Uses `lib/ai-engine` — multi-provider (OpenAI, Anthropic, Gemini), schema-validated outputs
- **Design**: Uses `lib/shared-ui` — consistent design language across all surfaces
- **Real-time**: WebSocket and SSE from `api-server` — no domain pack runs its own socket server
- **Database**: Drizzle ORM schemas in `lib/db` — domain-isolated tables, shared infrastructure

### What Is Domain-Specific

Each domain pack owns:
- Its React/Vite frontend (`artifacts/<domain>/src/`)
- Its domain-specific API routes within `api-server` (registered under its domain namespace)
- Its database schema files within `lib/db/schema/` (domain-isolated)
- Its AI agent prompts and reasoning schemas (registered in `lib/ai-engine`)
- Its intelligence feeds and external data connectors (registered in `lib/intelligence-feeds`)

---

## Domain Pack Architecture Pattern

Each domain pack follows the same internal structure:

```
artifacts/<domain>/
├── src/
│   ├── pages/          # Route-level components
│   ├── components/     # Domain-specific UI components
│   ├── lib/            # Domain-specific data fetching and utilities
│   └── main.tsx        # Vite entry point
├── package.json        # Workspace package
└── vite.config.ts      # Vite config (inherits base config)
```

The domain pack's backend routes live in `api-server`, not in the frontend artifact:

```
artifacts/api-server/src/routes/<domain>/
├── index.ts            # Domain router
├── [resource].ts       # Individual resource routes
└── schema.ts           # Zod validation schemas
```

---

## Domain Pack Lifecycle

### Stage 1: Design Partner Alpha
- Core UI complete
- API routes defined and partially connected
- One or two real data sources integrated
- First design partner using the surface
- Status: "Functional alpha"

### Stage 2: Live
- All core data sources connected
- RBAC fully enforced
- Audit trail active on all consequential actions
- Error states handled; no silent fallbacks
- At least one paying customer or named design partner
- Status: "Live"

### Stage 3: Domain Intelligence
- Cross-domain signals flowing to `command` and CORTEX
- AI agents active with schema-validated output
- Monte Carlo simulation available for consequential decisions
- Outcome Graph closed-loop tracking active
- Status: "Full platform integration"

### Current Status

| Domain Pack | Stage | Notes |
|-------------|-------|-------|
| Carlota Jo | Stage 2 (Live) | Most production-ready; client-facing workflows operational |
| Aegis | Stage 1 | Core SOC UI real; threat intel feeds in demo mode |
| Vessels | Stage 1 | Commercial modules wired to DB; AIS feed is demo/stub |
| Terra | Stage 1 | API routes exist; some data sources in demo mode |

---

## Domain Pack Expansion Strategy

### Expansion Criteria

A new domain pack is justified when:
1. The vertical has quantifiable high-stakes decision-making (cost of poor observability is measurable)
2. A design partner exists or is identified before build begins
3. The domain-specific intelligence layer can be defined (what signals, what agents, what actions)
4. The vertical does not require rebuilding platform primitives

### Expansion Cost Model

Because the platform backbone is shared, a new domain pack requires only:
- Frontend: ~60–100 new source files (based on Terra, Carlota Jo precedent)
- API routes: ~20–40 new route files
- Database schema: ~10–30 new tables
- AI agents: domain-specific prompts and output schemas
- Intelligence feeds: domain-specific data source connectors

The platform investment (auth, governance, real-time, design system, AI orchestration) is amortized across all domain packs. Marginal cost decreases with each new vertical.

### Candidate Verticals (Future Consideration)

These are not committed roadmap items — they are directional hypotheses for board and investor narrative:

| Vertical | Domain Pack Name | Signal Rationale |
|----------|-----------------|-----------------|
| Legal matter command | PRISM Counsel (deprecated) | High-stakes decisions; existing codebase; needs revival with design partner |
| Healthcare operations | (TBD) | Regulatory risk, decision accountability requirements |
| Financial services risk | (TBD) | Trade-off decisions with measurable compliance risk |
| Government / defense | Aegis extension | FedRAMP track already referenced; high barrier, high value |

---

## Domain Pack Relationship to CORTEX Mobile

Each domain pack has a corresponding CORTEX workspace — a focused mobile view of the domain's most critical signals and actions:

| Domain Pack | CORTEX Workspace |
|-------------|-----------------|
| Aegis | Security workspace — alerts, threat feed, active incidents |
| Vessels | Maritime workspace — fleet status, voyage status, compliance flags |
| Terra | Real estate workspace — deal pipeline, distress alerts |
| Carlota Jo | Advisory workspace — client messages, upcoming bookings |
| Command | Command workspace — approval queue, signal timeline |
| SZL Holdings | Holdings workspace — portfolio health, investor signals |

CORTEX does not replace domain pack web apps. It surfaces the most time-sensitive, mobile-appropriate subset of each domain's intelligence. Full workflow management happens in the web domain packs.

---

## Domain Pack Branding Rules

1. **Each domain pack has its own name and identity.** Aegis is not "SZL Security." Vessels is not "SZL Maritime." The domain-specific brand is intentional — it allows the pack to be sold to buyers who do not (yet) know SZL Holdings.
2. **The SZL Holdings brand is the parent umbrella.** Platform-level documentation, investor materials, and the corporate website (`szl-holdings`) reference the full domain pack portfolio.
3. **Carlota Jo is the clearest example of brand independence.** It can be marketed entirely on its own without reference to the SZL platform. The platform relationship is a backstory, not a selling point for advisory clients.
4. **Aegis and Vessels should be marketed to their verticals first.** The SZL Holdings parent story is relevant for enterprise procurement (single vendor, one security posture) — not for initial outreach.

---

## Legal Domain Pack — Deprecation Note

The legal matter command domain pack was deprecated in task #579 and has a `DEPRECATED.md` marker. The code remains in the repository as an archival reference.

**If PRISM Counsel is to be revived as a domain pack:**
1. A design partner in the legal vertical must be identified first
2. The codebase requires a fresh assessment — it was substantial (138 src files, 128 pages) but is now stale
3. The seed script issues documented in existing tasks must be resolved
4. It should be re-entered into the portfolio at Stage 1 (Design Partner Alpha) with a new timeline

**Until that work is scoped, PRISM Counsel does not appear in investor materials or public documentation.**

---

## Related Files

- `ops/portfolio/portfolio-architecture.md` — Full canonical topology
- `ops/portfolio/public-narrative-map.md` — Audience and narrative mapping per surface
- `ops/portfolio/archive-plan.md` — Archive and deprecation instructions
- `ops/frontier/product-surface-census.md` — File counts and feature inventory per domain pack
