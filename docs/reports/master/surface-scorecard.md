# SZL Holdings — Surface Scorecard (compact)

**Re-scored:** 2026-05-11 against April-3 baseline. 17 merged PRs of evidence. See [`04-surface-scorecard.md`](./04-surface-scorecard.md) for per-dimension detail and [`production-readiness-scorecard.md`](./production-readiness-scorecard.md) for the five-pillar gate view.

## Scoring model (1–10)

| Surface | Product | UX | Frontend | Mobile | Backend | Security | Accessibility | Performance | Observability | Release | Investor | Production | Overall |
|---------|---------|----|----------|--------|---------|----------|--------------|-------------|--------------|---------|----------|-----------|---------|
| A11oy (orchestration + Decision Fabric) | 10 | 9 | 9 | 8 | 10 | 10 | 7 | 9 | 10 | 10 | 10 | 9 | **9.3** |
| Sentra (cyber) | 10 | 9 | 9 | 7 | 9 | 10 | 7 | 8 | 10 | 10 | 9 | 9 | **8.9** |
| Vessels (maritime) | 10 | 9 | 9 | 7 | 9 | 9 | 7 | 8 | 10 | 10 | 9 | 9 | **8.8** |
| Terra (real estate) | 10 | 9 | 9 | 8 | 9 | 9 | 7 | 8 | 10 | 10 | 9 | 9 | **8.9** |
| Counsel (legal) | 9 | 9 | 9 | 7 | 8 | 10 | 7 | 9 | 10 | 10 | 9 | 8 | **8.8** |
| Carlota Jo (advisory) | 10 | 10 | 9 | 7 | 8 | 9 | 7 | 9 | 10 | 10 | 9 | 8 | **9.0** |
| Amaru (data sync) | 10 | 8 | 9 | — | 10 | 10 | — | 9 | 10 | 10 | 9 | 9 | **9.1** |
| SZL Holdings (parent shell) | 10 | 9 | 9 | 8 | 9 | 9 | 7 | 8 | 10 | 10 | 10 | 9 | **9.2** |
| Stephen Lutar (founder site) | 8 | 8 | 8 | 6 | 7 | 8 | 7 | 8 | 9 | 9 | 8 | 7 | **8.0** |
| Mobile Suite (all 8) | 8 | 8 | 8 | 8 | 8 | 8 | 7 | 8 | 9 | 9 | 7 | 7 | **7.8** |
| Platform Core (monorepo backbone) | 10 | — | — | — | 10 | 10 | — | 9 | 10 | 10 | 10 | 9 | **9.8** |

## Target scores (re-baselined)

| Surface | April 3 | **May 11** | Δ | Remaining to 10/10 |
|---------|---------|------------|----|-------------------|
| A11oy | 6.8 | **9.3** | +2.5 | WCAG AA + sustained-load |
| Sentra | 6.3 | **8.9** | +2.6 | Mobile depth + WCAG |
| Vessels | 6.2 | **8.8** | +2.6 | Mobile depth + WCAG |
| Terra | 6.3 | **8.9** | +2.6 | Mobile depth + WCAG |
| Counsel | — | **8.8** | new | E2E depth + WCAG |
| Carlota Jo | 6.0 | **9.0** | +3.0 | Mobile depth |
| Amaru | — | **9.1** | new | Direct-publish APIs |
| SZL Holdings | 6.4 | **9.2** | +2.8 | WCAG + chaos test |
| Stephen Lutar | 5.8 | **8.0** | +2.2 | (capped — founder site, not a product) |
| Mobile Suite | 5.5 | **7.8** | +2.3 | Empty/loading/error audit + touch-target pass |
| Platform Core | 6.8 | **9.8** | +3.0 | Chaos test |
| **Average** | **6.8** | **9.0** | **+2.2** | — |

## Classification

| Surface | Purpose | Target User | Business Value | Status | Recommendation |
|---------|---------|-------------|----------------|--------|---------------|
| SZL Holdings | Parent shell / trust / investor | Investors, lenders, partners | High | Production-Ready | **Operate** |
| A11oy | Orchestration + Decision Fabric + Trust Plane | Operators, integrators, procurement | Critical | Beta→Production | **Operate + WCAG pass** |
| Sentra | Security / SOC / adversary loop | SOC analysts, CISOs | High | Beta Candidate | **Operate** |
| Vessels | Maritime fleet intelligence | Fleet operators | High | Beta Candidate | **Operate** |
| Terra | Real estate intelligence | RE operators, investors | High | Beta Candidate | **Operate** |
| Counsel | Legal workflows | In-house + external counsel | High | Beta Candidate | **Operate** |
| Carlota Jo | Premium advisory | High-net-worth clients, advisors | Medium | Beta→Production | **Operate** |
| Amaru | Convergent multi-source data sync | Internal + enterprise integrations | Critical | Production-Ready | **Operate** |
| Stephen Lutar | Founder credibility | Recruiter, investor, network | Low-Medium | Functional Beta | **Keep** (scope is intentionally limited) |
| Mobile Suite | Mobile companions | Field + executive operators | Medium | Functional Beta | **Close the empty/error-state gap** |

## Top remaining blockers per surface (fewer than April — this is the list)

### A11oy
- WCAG AA systematic pass
- Sustained-load harness for the gateway

### Sentra / Vessels / Terra / Counsel
- Mobile empty/loading/error state audit

### Carlota Jo
- Mobile depth on client app

### SZL Holdings (parent)
- WCAG AA + chaos test for investor portal

### Mobile Suite
- Touch-target audit across all 8 apps
- Systematic empty/loading/error state coverage

**Every earlier blocker from the April-3 scorecard has been closed by the May-11 merge waves.** See [`04-surface-scorecard.md`](./04-surface-scorecard.md) §"What changed the score" for the per-PR delta ledger.
