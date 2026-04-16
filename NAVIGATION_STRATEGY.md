# Navigation Strategy — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026

---

## Information Architecture

The platform's navigation and content hierarchy follows a three-tier model:

```
PLATFORM (Lyte, Alloy, CORTEX, Command)
    │
    ├── PRIMITIVES (Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine)
    │
    └── DOMAIN PACKS (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM)
```

### Tier 1: Platform

The shared infrastructure and command surfaces that every user interacts with.

| Surface | Purpose | Entry Point |
|---------|---------|-------------|
| **Lyte** | Primary operator command surface — observe, decide, act | `/lyte-command-center/` |
| **Alloy** | Execution fabric — workflows, approvals, audit | Embedded in Lyte (`/alloy/*` routes) |
| **CORTEX** | Mobile command — all domains in one app | iOS/Android app |
| **Command Portal** | Ecosystem-wide dashboard — 8-domain overview | `/command/` |
| **SZL Holdings** | Corporate, marketing, trust center, investor hub | `/` |

### Tier 2: Primitives

The five core abstractions that power the governed decision loop. These are not user-visible navigation destinations — they are capabilities that surface through every product interaction.

| Primitive | Where It Surfaces |
|-----------|------------------|
| Outcome Graph | Lyte action queue, CORTEX command feed, domain dashboards |
| Proof Chain | PRISM Counsel proof viewer, Alloy governance audit, export controls |
| Covenant Policy | Lyte approvals center, CORTEX approval cards, admin policy manager |
| Monte Carlo | Domain detail pages, Lyte recommendation cards, CORTEX approval context |
| Workflow Engine | Alloy factory floor, Lyte action queue state tracking |

### Tier 3: Domain Packs

Domain-specific intelligence modules built on shared governance infrastructure. Each domain pack provides:
- Domain-specific signal sources
- Domain-specific analysis models
- Domain-specific action vocabularies
- Domain-specific UI surfaces

| Domain Pack | Audience | Entry Point |
|-------------|----------|-------------|
| **Aegis** | SOC analysts, CISOs, MSPs | `/firestorm/` |
| **Vessels** | Fleet operators, maritime compliance | `/vessels/` |
| **Terra** | Brokers, RE investors | `/terra/` |
| **PRISM Counsel** | Attorneys, case managers | `/prism-counsel/` |
| **Carlota Jo** | UHNW advisory clients | `/carlota-jo/` |
| **IMPERIUM** | Infrastructure operators | `/imperium/` |

---

## Cross-Domain Navigation

### Web Navigation Model

All web apps share the SZL Holdings navigation shell:

```
┌─────────────────────────────────────────────────────┐
│  SZL Holdings  │  Platform  │  Solutions  │  Trust  │
│  (brand)       │  (Lyte,    │  (domain    │  (trust │
│                │  Alloy)    │  packs)     │  center)│
└────────────────┴────────────┴─────────────┴─────────┘
```

When an operator navigates from Lyte to a domain pack (e.g., clicking a Vessels alert in the Lyte signal timeline), the navigation context shifts to the domain pack's surface while maintaining the platform shell.

### Mobile Navigation Model (CORTEX)

CORTEX uses a workspace switcher pattern:

```
┌─────────────┐
│ Workspace    │  ← Selects domain (Lyte, Aegis, Vessels, Terra, etc.)
│ Switcher     │
├─────────────┤
│ Tab Bar      │  ← Domain-specific tabs (adapts per workspace)
│ (adaptive)   │
├─────────────┤
│ SpotlightFab │  ← Quick actions (cross-domain)
└─────────────┘
```

Each workspace inherits its domain's accent color and icon set.

### Cross-Domain Links

PRISM Bus enables cross-domain signal references. When a signal in one domain references an entity in another (e.g., a Vessels sanctions alert links to a PRISM Counsel case), the UI provides deep links between domain packs.

---

## Public vs. Authenticated Navigation

### Public (Unauthenticated)

Accessible to all visitors — marketing, trust, and informational content:

- `/` — SZL Holdings landing
- `/platform` — Platform overview
- `/solutions/*` — Domain pack landing pages
- `/trust-center`, `/trust/*` — Trust and security documentation
- `/docs/*` — Developer and technical documentation
- `/contact`, `/pricing`, `/demo` — Commercial pages
- `/legal/*` — Privacy, terms, accessibility

### Authenticated

Requires login — operational surfaces:

- `/lyte-command-center/*` — Lyte operator workspace
- `/alloy/*` — Alloy execution fabric
- `/firestorm/*` — Aegis domain pack
- `/vessels/*` — Vessels domain pack
- `/terra/*` — Terra domain pack
- `/prism-counsel/*` — PRISM Counsel domain pack
- `/carlota-jo/*` — Carlota Jo domain pack
- `/command/*` — Command Portal
- `/investors/*` — Investor hub (NDA-gated)
- `/admin` — CMS administration

---

## Target State Changes

The current navigation works. The following improvements would strengthen the governed decision narrative:

1. **Elevate Lyte as the primary entry point** for authenticated users — it should be the first screen after login, with domain packs accessible as drill-downs
2. **Add primitive indicators** to recommendation cards — show which primitives were involved (e.g., "Simulated with Monte Carlo · Policy checked · Proof recorded")
3. **Unify the approval experience** — approvals from all domain packs surface in a single Lyte approvals center and CORTEX approval feed
4. **Cross-domain breadcrumbs** — when navigating from a Lyte signal to a domain pack detail, maintain the trail back to Lyte

---

## Related Documents

| Document | Path |
|----------|------|
| Product surface map | [PRODUCT_SURFACE_MAP.md](PRODUCT_SURFACE_MAP.md) |
| Product surfaces (detailed) | [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) |
| Route inventory | [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) |
| Demo guide | [DEMO_GUIDE.md](DEMO_GUIDE.md) |
