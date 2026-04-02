# SZL Holdings — Surface Scorecard

## Scoring Model (1-10)

| Surface | Product Clarity | UX Quality | Frontend | Mobile | Backend | Security | Accessibility | Performance | Observability | Release Discipline | Investor Ready | Production Ready | Overall |
|---------|----------------|-----------|----------|--------|---------|----------|--------------|-------------|--------------|-------------------|---------------|-----------------|---------|
| Lyte | 8 | 7 | 8 | 6 | 7 | 7 | 5 | 6 | 7 | 5 | 7 | 5 | 6.5 |
| Alloy (engine) | 8 | — | — | — | 8 | 7 | — | 7 | 7 | 5 | 7 | 5 | 6.8 |
| Aegis (Firestorm) | 7 | 7 | 8 | 6 | 7 | 7 | 5 | 6 | 6 | 5 | 6 | 5 | 6.3 |
| Terra | 7 | 7 | 8 | 7 | 7 | 7 | 5 | 5 | 6 | 5 | 6 | 5 | 6.3 |
| Vessels | 7 | 7 | 8 | 6 | 7 | 7 | 5 | 5 | 6 | 5 | 6 | 5 | 6.2 |
| Carlota Jo | 7 | 7 | 7 | 6 | 6 | 6 | 5 | 7 | 5 | 5 | 6 | 5 | 6.0 |
| SZL Holdings | 8 | 7 | 8 | 6 | 7 | 7 | 5 | 6 | 6 | 5 | 7 | 5 | 6.4 |
| Stephen Site | 7 | 7 | 7 | 5 | 5 | 6 | 5 | 7 | 5 | 5 | 5 | 5 | 5.8 |
| Mobile Suite | 6 | 6 | — | 6 | 6 | 6 | 5 | 6 | 5 | 5 | 5 | 4 | 5.5 |
| Platform Core | 8 | — | — | — | 8 | 7 | — | 7 | 7 | 5 | 7 | 5 | 6.8 |

## Target Scores

| Surface | Current | Target | Delta |
|---------|---------|--------|-------|
| Lyte | 6.5 | 8.5 | +2.0 |
| Alloy | 6.8 | 8.5 | +1.7 |
| Aegis | 6.3 | 8.0 | +1.7 |
| Terra | 6.3 | 8.0 | +1.7 |
| Vessels | 6.2 | 8.0 | +1.8 |
| Carlota Jo | 6.0 | 8.0 | +2.0 |
| SZL Holdings | 6.4 | 8.5 | +2.1 |
| Stephen Site | 5.8 | 7.5 | +1.7 |
| Mobile Suite | 5.5 | 7.5 | +2.0 |
| Platform Core | 6.8 | 9.0 | +2.2 |

## Classification

| Surface | Purpose | Target User | Business Value | Status | Recommendation |
|---------|---------|-------------|----------------|--------|---------------|
| SZL Holdings | Parent shell / trust / investor | Investors, lenders, partners | High | Active | **Keep and harden** |
| Lyte | Flagship command plane | Operators, executives | Critical | Active | **Keep and harden** (primary wedge) |
| Alloy | Execution fabric | Internal / API consumers | Critical | Active | **Keep and harden** |
| Aegis (Firestorm) | Security / defense ops | SOC analysts, CISO | High | Active | **Keep and harden** |
| Terra | Real estate intelligence | RE operators, investors | High | Active | **Keep and harden** |
| Vessels | Maritime intelligence | Fleet operators | High | Active | **Keep and harden** |
| Carlota Jo | Premium advisory | Clients, prospects | Medium | Active | **Keep and harden** |
| Stephen Site | Founder credibility | Recruiter, investor, network | Low-Medium | Active | **Keep** (separate from product) |
| Mockup Sandbox | Internal design tool | Developers | Low | Active | **Internal-only** |

## Top Blockers Per Surface

### SZL Holdings
- Bundle size, some pages are marketing-heavy with no real data behind them
- Investor pages need truth alignment

### Lyte
- alloy-intelligence.tsx uses local components instead of shared-ui
- No E2E tests
- Action center needs real workflow integration

### Aegis (Firestorm)
- 60+ routes, many are decorative/placeholder
- Naming drift (Firestorm vs Aegis)

### Terra
- Mapbox bundle is 1.7MB
- Many data endpoints return seeded data

### Vessels
- Same mapbox bundle issue
- Sanctions/dark-vessel features may overstate capability

### Carlota Jo
- No clear route definitions found in scan
- Limited backend integration

### Mobile Suite
- No E2E test coverage
- Needs systematic empty/loading/error state audit
