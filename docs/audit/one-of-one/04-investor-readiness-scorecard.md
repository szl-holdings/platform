# 04 — Investor Readiness Scorecard
*One-of-One Audit · SZL Holdings Platform · April 2026*

---

## Rubric

Each surface is scored 0–10 on 8 dimensions. Scores are based on a cold-load review of the artifact at its current state.

| Dimension | What it measures |
|-----------|-----------------|
| **Brand** | Consistent accent, typography, token application, no visual noise |
| **IA** | Navigation clarity, discoverability, depth vs. breadth balance |
| **Density** | Information richness per viewport — data should dominate, not whitespace |
| **States** | Quality of loading, empty, and error states — no bare spinners |
| **Provenance** | Proof chain visibility, source citations, confidence indicators |
| **Performance** | Perceived load speed, route splitting, no N+1 fetches |
| **Demo Narrative** | Existence and clarity of a 1-2-3-4-5 demo path for a first-time visitor |
| **Mobile/Responsive** | Usability on tablet and mobile viewport |

**Scores:** 0 = broken/absent, 5 = acceptable, 10 = best-in-class.

---

## Surface Scorecards

### SZL Holdings (`/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 8 | Strong teal accent, consistent typography, minor inconsistencies in admin pages |
| IA | 7 | Landing → platform → solutions → investors is logical; internal ops pages are harder to discover |
| Density | 6 | Landing is well-structured; internal dashboard pages are underutilized whitespace |
| States | 6 | Most pages have loading states; empty states are inconsistent in admin pages |
| Provenance | 7 | Trust center pages are thorough; investor-facing pages don't surface proof chain |
| Performance | 7 | Route splitting present; some heavy pages (Forge, Nuro) slow on cold load |
| Demo Narrative | 6 | No explicit demo path marked; investor flow requires knowing where to go |
| Mobile/Responsive | 7 | Marketing pages responsive; internal pages narrow on mobile |
| **Avg** | **6.75** | |

**Top 3 fixes:**
1. Mark demo path (5 steps) on landing page with numbered indicators
2. Add consistent empty states to admin section pages
3. Add "First 30 seconds" orientation copy to internal hub pages

---

### Sentra (`/sentra/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 8 | Red accent applied correctly; shared shell consistent |
| IA | 8 | Clear section grouping (OS Layer / Core / Operations) |
| Density | 7 | Dashboard and scorecard pages are information-rich |
| States | 7 | LoadingSkeleton used; error states present |
| Provenance | 7 | Trust provenance page exists; proof chain chips in approvals |
| Performance | 8 | Lean artifact, fast cold load |
| Demo Narrative | 5 | No demo path marked; investor doesn't know where to start |
| Mobile/Responsive | 7 | Shell collapses to hamburger correctly |
| **Avg** | **7.1** | |

**Top 3 fixes:**
1. Add demo path: Dashboard → Threat Overview → Incident Commander → Decision Center → Trust Provenance
2. Surface real-time "critical alerts" badge in sidebar
3. Ensure exposure board has non-empty state with seeded data

---

### Aegis (`/aegis/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 6 | Violet accent partially applied; bespoke shell diverges from platform |
| IA | 5 | ~150 routes with minimal hierarchy — overwhelming for first-time visitors |
| Density | 8 | Data-rich pages; MITRE ATT&CK, intelligence fusion are impressive |
| States | 5 | Many pages lack loading skeletons; some placeholder cards visible |
| Provenance | 7 | Audit chain, incident proof chain pages exist |
| Performance | 4 | 150+ routes, large bundle, no code splitting evidence in bespoke shell |
| Demo Narrative | 4 | No clear start point; investor overwhelmed by choices |
| Mobile/Responsive | 5 | Bespoke shell doesn't collapse correctly |
| **Avg** | **5.5** | **Lowest scorer — highest priority** |

**Top 3 fixes:**
1. **Migrate to shared DashboardShell** — single highest-impact change
2. Collapse to 30 canonical investor-demoable routes; hide advanced pages behind "Advanced" nav section
3. Add explicit 5-step investor demo path with "Start Here" banner

---

### Counsel (`/counsel/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 8 | Violet applied correctly via shared shell |
| IA | 8 | 11 routes, logical grouping |
| Density | 7 | Dashboard and matter overview are well-populated |
| States | 7 | Good loading states; empty matter board needs seeded data |
| Provenance | 8 | Trust provenance page; obligation timeline shows source clauses |
| Performance | 9 | Lean surface, fast cold load |
| Demo Narrative | 6 | Path exists but not marked explicitly |
| Mobile/Responsive | 7 | Shell mobile-ready |
| **Avg** | **7.5** | |

**Top 3 fixes:**
1. Add demo path marker to sidebar: Dashboard → Obligation Timeline → Risk Desk → Decision Center → Trust
2. Seed matter board with 3 active matters and 2 overdue obligations
3. Add "obligation countdown" chip to matter cards

---

### Counsel (`/prism-counsel/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 7 | Violet applied; shell unknown |
| IA | 7 | 9 routes, sensible grouping |
| Density | 7 | Obligation graph and matter board are information-rich |
| States | 6 | Some pages may lack full state coverage |
| Provenance | 9 | Proof chain export is the headline feature; well-executed |
| Performance | 8 | Small surface |
| Demo Narrative | 6 | Marketing landing → obligation graph → proof export is the path |
| Mobile/Responsive | 6 | Unknown |
| **Avg** | **7.0** | |

**Top 3 fixes:**
1. Wire shared EcosystemNav top bar (confirm shell pattern)
2. Add cross-link to Counsel app from PRISM header
3. Obligation graph: show entity labels, risk scores, overdue count prominently

---

### Vessels (`/vessels/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 9 | Cyan applied correctly; policy mode badge, onboarding wizard wired |
| IA | 8 | Deep surface but well-organized; maritime domains are discoverable |
| Density | 9 | Fleet map, voyage economics, AIS tracking — all information-dense |
| States | 8 | Onboarding wizard, loading states, sync badge — excellent |
| Provenance | 8 | Sanctions chain explorer, trust provenance, audit log present |
| Performance | 7 | Heavy mapping libraries; route splitting present |
| Demo Narrative | 8 | Onboarding config has 5-step walkthrough |
| Mobile/Responsive | 7 | Shell collapses; map interaction limited on mobile |
| **Avg** | **8.0** | **Highest scorer** |

**Top 3 fixes:**
1. Add AIS gap timeline visualization to dark vessel detection page
2. Polish sanctions screening card: all 4 required fields (entity, list, confidence, alt name)
3. Ensure offline queue indicator is visible when disconnected

---

### Terra (`/terra/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 8 | Green accent applied; terra-layout uses shared shell |
| IA | 7 | Deep surface; some routes are hard to discover |
| Density | 8 | Portfolio dashboard, property desk, underwriting copilot — well-populated |
| States | 7 | Loading states present; some empty states missing on specialized pages |
| Provenance | 8 | Evidence page, trust provenance, covenant monitoring |
| Performance | 7 | Heavy data pages; route splitting present |
| Demo Narrative | 7 | Good demo path through portfolio → deal → underwriting |
| Mobile/Responsive | 6 | Property map not mobile-friendly |
| **Avg** | **7.25** | |

**Top 3 fixes:**
1. Ownership graph: add UBO chain depth + stale data indicators
2. Portfolio scenario: add three-case (base/bull/bear) probability overlay
3. Property map: add mobile-optimized list fallback

---

### Lyte (`/lyte/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 7 | Cyan applied; shell needs verification |
| IA | 7 | 16 routes, logical for decision intelligence |
| Density | 8 | Entity graph, signals console, run console are data-rich |
| States | 6 | State coverage unknown on specialized pages |
| Provenance | 8 | Evidence explorer, policy center, decision replay all present |
| Performance | 7 | Lean surface |
| Demo Narrative | 6 | No explicit demo path |
| Mobile/Responsive | 6 | Unknown |
| **Avg** | **6.88** | |

**Top 3 fixes:**
1. Migrate to shared DashboardShell + EcosystemNav (confirm current pattern)
2. Add demo path: Overview → Signals Console → Decision Center → Policy Center → Evidence Explorer
3. Signals console: add delta from baseline + trend sparkline per signal

---

### Pulse (`/pulse/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 7 | Amber applied; custom shell needs review |
| IA | 8 | 12 routes, clear information hierarchy |
| Density | 8 | Briefing engine, confidence dashboard are information-dense |
| States | 7 | Briefing loading states present |
| Provenance | 9 | Source citations, confidence scores, dissent channel — standout |
| Performance | 8 | Lean surface |
| Demo Narrative | 7 | Today's Brief is an obvious start; path through confidence → dissent |
| Mobile/Responsive | 7 | Briefing cards responsive |
| **Avg** | **7.63** | |

**Top 3 fixes:**
1. Migrate to shared DashboardShell + EcosystemNav
2. Show confidence score inline on every briefing item (not just in confidence dashboard)
3. Add "3 things changed since yesterday" delta strip to Today's Brief

---

### Command (`/command/`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Brand | 8 | Cyan applied; shared shell used |
| IA | 7 | Cognitive sub-section has 10 pages — needs progressive disclosure |
| Density | 8 | Cross-platform analytics, eval lab, cognitive traces — rich |
| States | 7 | Good states; some eval lab pages sparse |
| Provenance | 8 | Evidence registry, cross-platform signal correlation |
| Performance | 7 | Route splitting present; cognitive pages are heavy |
| Demo Narrative | 8 | Demo launchpad page exists |
| Mobile/Responsive | 6 | Heavy dashboard not mobile-optimized |
| **Avg** | **7.38** | |

**Top 3 fixes:**
1. Collapse cognitive sub-section: default to Traces + Memory; hide 8 others behind "Advanced"
2. Add platform health strip to dashboard: shows status of all 6 domain surfaces
3. Improve cross-platform signal correlation page: add timeline scrubber

---

## Portfolio-Level Fixes (Prioritized by Investor Impact)

| Priority | Fix | Surfaces | Impact |
|----------|-----|----------|--------|
| P0 | Migrate Aegis to shared DashboardShell | Aegis | Eliminates worst performer |
| P0 | Remove all "Coming Soon" / placeholder pages | All | Any placeholder = trust deficit with investor |
| P0 | Wire ⌘K CommandPalette to all surfaces | All except Vessels | Unifies navigation UX |
| P1 | Add explicit 5-step demo path to every surface | All | Investor can navigate independently |
| P1 | Seed every surface's dashboard with 3–5 real-looking data points | All | No empty dashboards at demo time |
| P1 | Add cross-surface health strip to Command dashboard | Command | Shows platform scope at a glance |
| P1 | Remove duplicate /pulse, /governed-cockpit, /observability routes | Aegis, Vessels, Terra | Reduces confusion |
| P2 | Migrate Lyte, Pulse to shared EcosystemNav | Lyte, Pulse | Visual cohesion |
| P2 | Add mobile fallback to property map (Terra) | Terra | Mobile demo scenario |
| P2 | Collapse Aegis routes from 150 to 30 visible | Aegis | Eliminates IA overwhelm |
| P3 | Add AIS gap timeline to Vessels dark vessel detection | Vessels | Depth signal |
| P3 | Add three-case scenario overlay to Terra portfolio | Terra | Investment modeling depth |
