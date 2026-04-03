# PRISM Counsel — Site Map & Content Architecture

## Public Marketing Layer

### Primary Entry Point
`/prism-counsel-public` — Premium marketing page (this document's subject)

**Sections (in order):**
1. Hero — headline, subhead, CTA buttons, "What PRISM Counsel answers" panel
2. Product Thesis — the problem, our answer, four core pillars
3. Module Overview — Matter Desk, NY Practice, Prep/Review/Sign-Off, Section 31
4. Flagship Workflow — six-step: Matter Twin → Proof Chain
5. Competitive Differentiation — six-dimension comparison vs. generic legal AI
6. Alloy as Engine — four Alloy capabilities + data flow diagram
7. M365 Copilot Companion — five M365 surfaces + Copilot connector story
8. Signal Sources — six external data sources in the matter model
9. Architecture Diagram — five-layer system diagram
10. Trust & Security Posture — six governance controls
11. What It Is / What It Isn't — three-column clarity statement
12. CTA — design partner engagement

### Supporting Public Pages

**`/solutions/prism-counsel`**
Product overview: observability pillars, NY wedge, Lyte+Alloy story, full delivery list, Copilot integration, trust summary. Links to command center, trust page.

**`/solutions/prism-counsel/trust`**
Governance deep-dive: six governance controls, data isolation, regulatory compliance (Reg 68, SOL, ethics walls, client consent). Links to platform trust center.

---

## Application Layer (Authenticated)

### Primary Shell
`LawyerLifeOSShell` — Sidebar nav with top mode switching

**Top modes:**
- Today → `/prism-counsel/today`
- Matter Desk → `/prism-counsel/matters`
- Prep → `/prism-counsel/prep`
- Review → `/prism-counsel/review-before-send`
- Sign-Off → `/prism-counsel/signoff-queue`
- Ops → `/prism-counsel/ops-lite`

### Matter Desk

| Path | Page |
|---|---|
| `/prism-counsel` | Dashboard (KPIs, matter health, AI recs, deadline queue, settlement forecast) |
| `/prism-counsel/matters` | Matters list (search, filter by status, health score, settlement) |
| `/prism-counsel/matters/:id` | Matter detail (9 tabs: Summary, Chronology, Damages, Medical, Forecast, Comms, Approvals, Recovery, Settlement Blockers) |

### NY Practice

| Path | Page |
|---|---|
| `/prism-counsel/ny` | NY Command Dashboard (5 KPIs, 9 widgets: breach watchlist, demand readiness, mediation, reserve/offer, silence tracker, AI defensibility, disclaimer queue, damages/lien gaps, approval queue) |
| `/prism-counsel/no-fault` | No-fault / PIP tracking |
| `/prism-counsel/ny/watchlist` | Deadline breach watchlist |
| `/prism-counsel/ny/mediation` | Mediation windows |
| `/prism-counsel/ny/forecast` | Reserve/offer tracker |
| `/prism-counsel/ny/insurer-intel` | Communication silence tracker |
| `/prism-counsel/ny/trust` | AI defensibility scores |
| `/prism-counsel/ny/coverage` | Disclaimer vulnerability queue |
| `/prism-counsel/ny/no-fault` | No-fault demand readiness |

### Prep / Review / Sign-Off

| Path | Page |
|---|---|
| `/prism-counsel/prep` | Prep mode (demand assembly, missing item detection) |
| `/prism-counsel/review-before-send` | Review Before Send queue |
| `/prism-counsel/signoff-queue` | Sign-Off / approval queue |
| `/prism-counsel/word-export` | Word export pipeline |
| `/prism-counsel/review-desk` | Review Desk (9 queue types: My Queue, Team Queue, High Risk, Low Confidence, Contradictions, Needs Attorney, Needs Partner, Ready to Export, Blocked) |

### Intelligence

| Path | Page |
|---|---|
| `/prism-counsel/forecast` | Settlement forecast |
| `/prism-counsel/deadlines` | Deadline risk queue |
| `/prism-counsel/insurer-intel` | Insurer behavior intelligence |
| `/prism-counsel/venue-intel` | Venue intelligence |
| `/prism-counsel/copilot-workbench` | Copilot workbench |

### Section 31 (Deep Intelligence)

| Path | Page |
|---|---|
| `/prism-counsel/matter-twin` | Matter Twin (14-domain digital twin with change tracking) |
| `/prism-counsel/proof-chain` | Proof Chain (SHA-256 hashed AI output registry) |
| `/prism-counsel/worldline` | Worldline signal dashboard |
| `/prism-counsel/pressure-graph` | Multi-dimensional pressure graph |
| `/prism-counsel/forecast-diff` | Forecast diff tracking |

### Recovery & Liens

| Path | Page |
|---|---|
| `/prism-counsel/recovery-view` | Recovery operations |
| `/prism-counsel/settlement-blockers-view` | Settlement blockers |

---

## Navigation Relationships

```
/prism-counsel-public (marketing)
  → /prism-counsel (dashboard — primary CTA)
  → /contact (design partner request — secondary CTA)
  → /solutions/prism-counsel (product overview)
  → /solutions/prism-counsel/trust (trust deep-dive)

/solutions/prism-counsel
  → /prism-counsel (enter command center)
  → /prism-counsel/ny (NY litigation command)
  → /solutions/prism-counsel/trust

/solutions/prism-counsel/trust
  → /solutions/prism-counsel
  → /trust (platform trust center)
  → /prism-counsel (enter command center)
```

---

## Content Gaps / Future Pages

- `/prism-counsel/pilot` — Pilot program onboarding and progress tracking
- `/prism-counsel/case-studies` — Anonymized matter intelligence outcomes
- `/prism-counsel/api` — API reference for integration teams
- `/prism-counsel/changelog` — Version history and feature releases
