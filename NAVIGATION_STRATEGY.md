# Navigation Strategy — SZL Holdings

**Version:** 2.0 · **Last updated:** April 2026

---

## Information Architecture

The platform's navigation and content hierarchy follows a three-tier model:

```
PLATFORM (Command, Alloy, CORTEX, SZL Holdings)
    │
    ├── PRIMITIVES (Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine)
    │
    └── DOMAIN PACKS (Aegis, Vessels, Terra, Carlota Jo)
```

### Tier 1: Platform

The shared infrastructure and command surfaces that every user interacts with.

| Surface | Purpose | Entry Point |
|---------|---------|-------------|
| **Command** | Unified ops command — strategy, operations, infrastructure | `/command/` |
| **Alloy** | Execution fabric — workflows, approvals, audit | Embedded in SZL Holdings (`/alloy/*` routes) |
| **CORTEX** | Mobile command — all domains in one app | Expo mobile app (`artifacts/szl-holdings-mobile`) |
| **SZL Holdings** | Corporate, marketing, trust center, investor hub | `/` |

### Tier 2: Primitives

The five core abstractions that power the governed decision loop. These are not user-visible navigation destinations — they are capabilities that surface through every product interaction.

| Primitive | Where It Surfaces |
|-----------|------------------|
| Outcome Graph | Command action queue, CORTEX command feed, domain dashboards |
| Proof Chain | Alloy governance audit, export controls |
| Covenant Policy | Approvals center, CORTEX approval cards, admin policy manager |
| Monte Carlo | Domain detail pages, recommendation cards, CORTEX approval context |
| Workflow Engine | Alloy factory floor, action queue state tracking |

### Tier 3: Domain Packs

Domain-specific intelligence modules built on shared governance infrastructure. Each domain pack provides:
- Domain-specific signal sources
- Domain-specific analysis models
- Domain-specific action vocabularies
- Domain-specific UI surfaces

| Domain Pack | Audience | Entry Point |
|-------------|----------|-------------|
| **Aegis** | SOC analysts, CISOs, MSPs | `/aegis/` |
| **Vessels** | Fleet operators, maritime compliance | `/vessels/` |
| **Terra** | Brokers, RE investors | `/terra/` |
| **Carlota Jo** | UHNW advisory clients | `/carlota-jo/` |

---

## Cross-Domain Navigation

### Web Navigation Model

All web apps share the SZL Holdings navigation shell:

```
┌─────────────────────────────────────────────────────┐
│  SZL Holdings  │  Platform  │  Solutions  │  Trust  │
│  (brand)       │  (Command, │  (domain    │  (trust │
│                │  Alloy)    │  packs)     │  center)│
└────────────────┴────────────┴─────────────┴─────────┘
```

When an operator navigates from Command to a domain pack (e.g., clicking a Vessels alert in the signal timeline), the navigation context shifts to the domain pack's surface while maintaining the platform shell.

### Mobile Navigation Model (CORTEX)

CORTEX uses a workspace switcher pattern:

```
┌─────────────┐
│ Workspace    │  ← Selects domain (Command, Aegis, Vessels, Terra, etc.)
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

PRISM Bus enables cross-domain signal references. When a signal in one domain references an entity in another (e.g., a Vessels sanctions alert links to a legal case), the UI provides deep links between domain packs.

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

- `/command/*` — Command unified ops workspace
- `/alloy/*` — Alloy execution fabric
- `/aegis/*` — Aegis domain pack
- `/vessels/*` — Vessels domain pack
- `/terra/*` — Terra domain pack
- `/carlota-jo/*` — Carlota Jo domain pack
- `/investors/*` — Investor hub (NDA-gated)
- `/admin` — CMS administration

---

## Archived Surfaces

The following surfaces are archived (code removed, marker files remain):

| Surface | Disposition | Content Moved To |
|---------|-------------|-----------------|
| Lyte Command Center | Merged into Command | `/command/` |
| Firestorm | Superseded by Aegis | `/aegis/` |
| IMPERIUM | Merged into Command | `/command/` (infrastructure mode) |
| PRISM Counsel | Deprecated (task #579) | — |
| Stephen Site | Content moved | `/founder` in SZL Holdings |

---

## Target State Changes

The current navigation works. The following improvements would strengthen the governed decision narrative:

1. **Elevate Command as the primary entry point** for authenticated users — it should be the first screen after login, with domain packs accessible as drill-downs
2. **Add primitive indicators** to recommendation cards — show which primitives were involved (e.g., "Simulated with Monte Carlo · Policy checked · Proof recorded")
3. **Unify the approval experience** — approvals from all domain packs surface in a single Command approvals center and CORTEX approval feed
4. **Cross-domain breadcrumbs** — when navigating from a Command signal to a domain pack detail, maintain the trail back to Command

---

## Related Documents

| Document | Path |
|----------|------|
| Product surface map | [PRODUCT_SURFACE_MAP.md](PRODUCT_SURFACE_MAP.md) |
| Route inventory | [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) |
| Demo guide | [DEMO_GUIDE.md](DEMO_GUIDE.md) |
