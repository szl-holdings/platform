# Acceptance Criteria — Terra Production Readiness
**Date:** April 2, 2026
**Phase:** Post-Payload Phase 3
**Version:** 1.0

---

## Purpose

This document defines the acceptance criteria for Terra as the first credible vertical wedge in the SZL Holdings product platform. Terra must meet all criteria below to be considered the reference implementation that Aegis and Vessels will follow.

---

## Workflow Acceptance Criteria

### AC-01: Portfolio List → Asset Navigation
- [ ] Portfolio list renders all 8 demo assets with correct status indicators (performing/watch/critical)
- [ ] Each asset row is clickable and navigates to `/property/:id`
- [ ] Filter/search/sort controls function without page reload
- [ ] Map view shows all property pins with color-coded status
- [ ] Clicking a map pin opens a property preview panel with "Full Detail" link
- [x] **PASS** — All criteria met in listings.tsx + property-map.tsx + property-map-page.tsx

### AC-02: Asset Detail — Overview Tab
- [ ] Property metrics (value, revenue, NOI, cap rate, occupancy, appreciation) display correctly
- [ ] Financial performance chart shows 12-month revenue vs NOI
- [ ] Occupancy donut chart renders with correct percentage
- [ ] Tenant roster displays for all properties with tenants
- [ ] Maintenance schedule shows tasks with priority, due date, assignee, and cost
- [ ] Property alerts show with severity-coded left border
- [ ] Comment thread and activity feed are present
- [ ] Export PDF button triggers document generation API
- [x] **PASS** — All criteria met in property-detail.tsx (overview tab)

### AC-03: Asset Detail — Ownership & Debt Tab
- [ ] Ownership entity, type, jurisdiction, and principals display for critical/watch properties
- [ ] Lender name, loan balance, maturity date, LTV, and DSCR display
- [ ] DSCR < 1.0 triggers a visible covenant warning
- [ ] Loan maturity < 6 months triggers an urgency alert
- [ ] Source provenance label present on ownership section
- [ ] Data freshness label present on ownership section
- [x] **PASS** — All criteria met; Skyline Lofts (prop-007) shows all three warnings

### AC-04: Asset Detail — Diligence Tab
- [ ] Diligence checklist renders for critical/watch assets
- [ ] Each item shows status (complete/in-progress/pending/flagged), assignee, and due date
- [ ] Flagged items are visually distinct with red highlight
- [ ] Tab badge shows count of flagged items
- [ ] Empty state shown for performing assets without active diligence
- [x] **PASS** — All criteria met; prop-001 and prop-007 have realistic checklists

### AC-05: Asset Detail — Action Routing Tab
- [ ] Open action items display for properties with issues
- [ ] Each action item shows: issue description, severity badge, named owner, owner role, due date, recommended action, and status
- [ ] Critical and high severity items are visually prioritized
- [ ] Tab badge shows count of open/in-progress items
- [ ] Empty state shown for properties with no open actions
- [x] **PASS** — All criteria met; prop-007 has 4 critical/high action items

### AC-06: Watchlist / Risk Engine
- [ ] Distress Engine (`/distress-engine`) renders signal list with opportunity scoring
- [ ] Filter by distress type (pre-foreclosure, foreclosure, auction, REO, tax-lien, expired)
- [ ] Each distress property shows confidence level and score rationale
- [ ] Convert to deal and save actions function
- [ ] Opportunity queue on dashboard links to distress engine
- [x] **PASS** — All criteria met in distress-engine.tsx

### AC-07: Lender & Investor Reporting Pack
- [ ] Lender/LP Report accessible at `/lender-report` and from property detail header
- [ ] Executive Summary tab shows portfolio narrative, NOI chart, capital allocation pie, and risk summary
- [ ] Portfolio Performance tab shows asset-level table with all metrics
- [ ] Debt Schedule tab shows all 5 lenders with LTV, DSCR, maturity, and URGENT flag
- [ ] LP Investor Report tab shows all 5 LPs with IRR, MOIC, distribution history
- [ ] Covenant Status tab shows all covenants with breach/watch/current classification
- [ ] Source provenance and freshness labels on all data sections
- [ ] Export PDF and Print buttons present (wired to API / window.print)
- [x] **PASS** — All criteria met in lender-report.tsx

### AC-08: Source Provenance Labels
- [ ] All data views on property detail carry a `ProvenanceTag` showing the authoritative source
- [ ] All data views on lender report carry appropriate provenance tags
- [ ] Provenance tags are visually distinct and non-intrusive
- [x] **PASS** — ProvenanceTag component used consistently throughout

### AC-09: Data Freshness Indicators
- [ ] All data views on property detail carry a `FreshnessTag` with update timestamp
- [ ] All data views on lender report carry freshness tags
- [ ] High/Medium confidence is visually indicated with color coding
- [x] **PASS** — FreshnessTag component with confidence levels implemented

### AC-10: Navigation & Routing
- [ ] Sidebar nav includes "Lender & LP Report" under Reporting section
- [ ] All new routes (`/lender-report`) are registered in App.tsx router
- [ ] Breadcrumb navigation (Back to Dashboard) present on all detail pages
- [ ] Command palette includes navigation shortcuts
- [x] **PASS** — All navigation updated

---

## Non-Functional Acceptance Criteria

### AC-NF-01: Design Quality
- [ ] All new pages use the established Terra dark theme (bg: #0a0c10, gold/emerald/blue accent palette)
- [ ] All new pages are mobile-responsive (no horizontal overflow on < 768px)
- [ ] Typography, spacing, and border styles consistent with existing Terra pages
- [x] **PASS** — Design system maintained throughout

### AC-NF-02: Backbone Integration (Phase 3 Scope)
- [x] `CommentThread` and `ActivityFeed` used from shared-ui on property detail overview tab
- [x] Document export wired to shared `/api/documents/generate` endpoint (both property detail and lender report)
- [x] Print report wired to native `window.print()` on lender report
- [x] `OperationalQueueRow` from shared-ui operational-primitives used in Action Routing tab (canonical cross-domain queue display component)
- [x] Action Routing Tab — DB-backed: `terra_action_items` table, GraphQL query/mutation/subscription; auto-seeds on first load; `open → in_progress → resolved` transitions wired and verified end-to-end
- [x] Action item mutations write to shared `alloyAuditLog` for cross-domain audit trail
- [x] WebSocket pub (TERRA_SIGNALS) + GraphQL subscription on every action status change
- **Ownership/Diligence scope note:** Ownership entity and diligence checklist data are frontend presentation layer (static arrays in property-detail.tsx). This is intentional for Phase 3 — these are display-only with no state transitions. Full ownership database wiring is Phase 4 scope.
- [x] **PASS** — All in-scope backbone items verified; OperationalQueueRow and alloyAuditLog link Terra to shared platform primitives

### AC-NF-03: Demo Data Quality
- [ ] All demo data is realistic, coherent, and internally consistent
- [ ] Critical/watch assets (Skyline Lofts, The Atrium) have richer data to demonstrate urgency
- [ ] Ownership records reference realistic entity structures (LLC, LP, Delaware/CA/IL)
- [ ] Lender names are real institutional lenders (Wells Fargo, JPMorgan, Berkadia)
- [x] **PASS** — All demo data realistic and internally consistent

### AC-NF-04: Reference Pattern
- [ ] The 4-tab detail page pattern (Overview / Ownership / Diligence / Actions) is documented
- [ ] ProvenanceTag + FreshnessTag pattern is documented
- [ ] Action routing (issue → owner → action → due date → status) is documented
- [ ] Reporting pack structure (exec summary / performance / debt / investors / covenants) is documented
- [x] **PASS** — terra-operationalization.md documents all patterns

---

## Out of Scope (Must Not Block)

- Live external data integrations (MLS, ACRIS, county records APIs)
- Terra mobile app depth
- Aegis and Vessels operationalization
- Automated covenant breach workflows
- Lender portal external access

---

## Sign-Off Checklist

| Criterion | Status | Notes |
|-----------|--------|-------|
| Core workflow complete (UI) | ✅ PASS | portfolio → asset → ownership → diligence → actions → reporting |
| UX production-grade | ✅ PASS | 4-tab detail + 5-tab reporting pack |
| Source provenance UI | ✅ PASS | ProvenanceTag on all data sections |
| Data freshness UI | ✅ PASS | FreshnessTag with confidence levels |
| Action routing UI | ✅ PASS | Issue → owner → action → due → status; OperationalQueueRow used |
| Lender/investor reporting pack | ✅ PASS | Export wired to API; Print wired to window.print() |
| Shared-ui primitives used | ✅ PASS | CommentThread, ActivityFeed, OperationalQueueRow used from shared-ui |
| Action routing backend | ✅ PASS | terra_action_items table + GraphQL query/mutation/subscription; alloyAuditLog cross-domain audit; verified end-to-end |
| Ownership/diligence data | ⚠️ PRESENTATION | Static frontend arrays — display-only, no mutations. Full DB wiring is Phase 4. |
| TypeScript clean | ✅ PASS | No @ts-nocheck; tsc --noEmit passes with zero errors |
| No stale/orphan code | ✅ PASS | LayoutDashboard2 stub removed; unused imports cleaned |
| Reference patterns documented | ✅ PASS | terra-operationalization.md + this doc |
| Navigation complete | ✅ PASS | Reporting section in sidebar; all routes registered |

**Overall Status: ACCEPTED for Phase 3 scope**

**Honest scope statement:**
- Action routing: fully backend-wired (DB + GraphQL + real-time + audit log + shared-ui OperationalQueueRow)
- Ownership tab: presentation layer — static data with ProvenanceTag/FreshnessTag UI. No DB writes.
- Diligence tab: presentation layer — static checklist with status UI. No DB writes.
- Reporting pack: demo data with real export endpoint wiring

**Phase 4 Deferred Work (explicitly not in scope for this task):**
- Ownership entity persistence (title record DB, chain-of-title mutations)
- Diligence checklist DB backend (checklist item status write operations)
- Connect county recorder / ACRIS / title report external API integrations
- Real-time action assignment (beyond current status transitions)
