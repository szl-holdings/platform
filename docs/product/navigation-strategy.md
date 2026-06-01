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

The following surfaces are archived (app source removed — no pages/components/routes; marker files and stale build artifacts may remain):

| Surface | Disposition | Content Moved To |
|---------|-------------|-----------------|
| Lyte Command Center | Merged into Command | `/command/` |
| Firestorm | Superseded by Aegis | `/aegis/` |
| IMPERIUM | Merged into Command | `/command/` (infrastructure mode) |
| PRISM Counsel | Deprecated (task #579) | — |
| Stephen Site | Content moved | `/founder` in SZL Holdings |

---

## Terminology Consistency Rules

All app subtitles in the EcosystemNav app switcher must follow the canonical pattern:
`[Category] · [Canonical Name]`

| App | Correct Subtitle | Wrong (do not use) |
|-----|-----------------|-------------------|
| SZL Holdings | `Ecosystem · Parent Company` | "Corporate Platform", "Hub" |
| Alloy | `Execution Fabric · Governed Orchestration` | "Engine · SZL Holdings Module" |
| Lyte | `Command Surface · Business Observability` | "Platform · Business Observability" |
| Aegis | `Domain Pack · Unified Defense & Intelligence` | "Security · Defense & Intelligence Command" |
| Vessels | `Domain Pack · Maritime Intelligence` | "Platform · Maritime Command" |
| Terra | `Domain Pack · Real Estate Intelligence` | "Flagship · Broker Command" |
| Carlota Jo | `Domain Pack · Premium Advisory` | "Service · High-Trust Operations" |

**Critical rule:** Domain Packs (Aegis, Vessels, Terra, Carlota Jo) must never use "Platform" or "Flagship" in their subtitle. Only Lyte is the Flagship Command Surface. Only SZL Holdings is the Platform.

---

## UX Audit Findings (April 2026)

### Terminology Issues Fixed

- **Vessels subtitle** was "Platform · Maritime Command" — corrected to "Domain Pack · Maritime Intelligence"
- **Terra subtitle** was "Flagship · Broker Command" — corrected to "Domain Pack · Real Estate Intelligence"
- **Alloy subtitle** was "Engine · SZL Holdings Module" — corrected to "Execution Fabric · Governed Orchestration"
- **Carlota Jo subtitle** was "Service · High-Trust Operations" — corrected to "Domain Pack · Premium Advisory"
- **Aegis subtitle** was "Security · Defense & Intelligence Command" — corrected to "Domain Pack · Unified Defense & Intelligence"
- **Lyte subtitle** was "Platform · Business Observability" — corrected to "Command Surface · Business Observability"

### Navigation Patterns Observed

**Consistent across all apps:**
- All web surfaces render EcosystemNav as the global top bar
- All domain packs use SidebarNav with grouped sections
- Cmd+K CommandPalette available in all apps
- Realtime status, notification center, and user button present everywhere

**Legacy nav items in Vessels:**
- Vessels has both `primaryNavItems` (new dashboard routes at `/dashboard/*`) and `legacyNavItems` (older routes at `/fleet`, `/exceptions`, etc.)
- The legacy items remain in the sidebar to avoid breaking operator workflows
- Target state: migrate operators to `/dashboard/*` routes, then remove legacy items

### Empty State Coverage

All apps have `PageLoader` fallback components during Suspense. Specific empty states vary by page — the most critical patterns (alert centers, exception queues, fleet maps) should display domain-specific guidance, not generic "No data found" messages.

### Loading State Pattern

All apps use a thin circular spinner (`border-2 rounded-full animate-spin`) as the page-level `PageLoader`. This is consistent and appropriate. Skeleton loaders are used on some data tables; the target is to standardize skeleton use for list and table views.

### Error State Pattern

React error boundaries are implemented at the app level. Page-level error states show a simple "Page not found" fallback. Operator-facing errors should provide actionable next steps (retry, contact support link, navigate to parent section).

---

## Target State Changes

The current navigation works. The following improvements would strengthen the governed decision narrative:

1. **Elevate Command as the primary entry point** for authenticated users — it should be the first screen after login, with domain packs accessible as drill-downs
2. **Add primitive indicators** to recommendation cards — show which primitives were involved (e.g., "Simulated with Monte Carlo · Policy checked · Proof recorded")
3. **Unify the approval experience** — approvals from all domain packs surface in a single Command approvals center and CORTEX approval feed
4. **Cross-domain breadcrumbs** — when navigating from a Command signal to a domain pack detail, maintain the trail back to Command
5. **Consolidate Vessels legacy nav** — migrate operators from legacy `/fleet`, `/exceptions` routes to the unified `/dashboard/*` hierarchy, then deprecate the legacy sidebar section

---

## Related Documents

| Document | Path |
|----------|------|
| Product surface map | [PRODUCT_SURFACE_MAP.md](product-surface-map.md) |
| Route inventory | [ROUTE_INVENTORY.md](../architecture/route-inventory.md) |
| Demo guide | [DEMO_GUIDE.md](../sales/demo-guide.md) |
