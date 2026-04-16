# Portfolio Coherence Pass

**Last updated:** April 2026
**Purpose:** Ensure all products feel like one system, not a collection of tools

---

## Competitive Coherence Benchmarks

### Palantir: One Ontology, Many Surfaces
- Every product (Foundry, AIP, Apollo, Gotham) operates on the same ontological data layer
- Users move between surfaces without re-learning the data model
- Visual identity is consistent but each surface has a distinct purpose
- "One system" feel comes from shared data, not shared UI

### Rippling: One Record, Many Apps
- Employee record is the universal system of record
- HR, IT, Finance, Benefits all read/write the same employee data
- Adding a new app automatically has access to employee context
- "One system" feel comes from data flowing automatically between apps

### Cloudflare: One Dashboard, Many Products
- Workers, Pages, R2, D1, KV are separate products
- All accessible from a single dashboard with consistent navigation
- Shared authentication, billing, and analytics
- "One system" feel comes from unified chrome and shared account context

---

## SZL Coherence Requirements

### 1. Shared Primitives as Unifier
Every product surface should visibly use the same six primitives:
- Event Fabric events should look identical whether viewed in Aegis, Vessels, or Lyte
- Proof Chain records should have identical format across all domains
- Covenant Policy decisions should render the same UI components everywhere
- Monte Carlo results should use the same distribution charts across domains

### 2. Consistent Visual Language
All surfaces should share:
- Color palette (dark theme with domain accent colors)
- Typography (font-display for headings, system font for body)
- Component library (shared shadcn/ui components)
- Icon system (lucide-react across all surfaces)
- Information density patterns (same card/table/timeline components)

### 3. Unified Navigation
- Top bar: SZL logo + platform name + domain doctrine badges
- Side navigation: domain-specific (Aegis has different nav than Vessels)
- Command palette (⌘K): universal across all surfaces
- Search: cross-domain signal and decision search

### 4. Cross-Domain Awareness
- Every surface should show cross-domain correlation indicators
- Notifications from other domains should appear in the current surface
- Decision Theater should be accessible from any domain pack

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | SZL Mitigation |
|-------------|-------------|----------------|
| Separate login per domain | Breaks "one system" illusion | Single auth with domain-scoped permissions |
| Different data models per domain | Cross-domain correlation impossible | Shared PrismBusEvent schema + domain-specific payload |
| Different visual languages | Feels like a portfolio company, not a platform | Shared component library + design system |
| Domain silos with no cross-reference | Misses the platform value | Cross-domain correlation engine + unified Decision Theater |
| Feature sprawl without governance | Weakens category positioning | Every feature must map to one of six primitives |

---

## Coherence Checklist

- [ ] All domain packs use the same PrismBusEvent schema for signals
- [ ] All domain packs render Proof Chain records with identical UI
- [ ] All domain packs use the same Covenant Policy evaluation flow
- [ ] All domain packs support Monte Carlo simulation inline
- [ ] All surfaces share the same authentication and authorization model
- [ ] All surfaces use the same component library (shadcn/ui)
- [ ] All surfaces support the command palette (⌘K)
- [ ] Cross-domain correlations are visible from any domain surface
- [ ] Decision Theater is accessible from Core Command (shared)
