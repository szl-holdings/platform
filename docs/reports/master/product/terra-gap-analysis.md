# Terra Gap Analysis
**Date:** April 2, 2026
**Phase:** Post-Payload Phase 3
**Analyst:** Task Agent #274

---

## Summary

This document audits Terra's existing pages and data models against the required operational workflow (portfolio → asset → risk → ownership → diligence → action routing) and records the gaps identified at the start of Phase 3 and the resolution status for each.

---

## Workflow Coverage Audit

### Step 1: Portfolio List
| Requirement | Pre-Phase3 State | Gap | Resolution |
|-------------|-----------------|-----|------------|
| Portfolio list with filter/sort | ✅ Present (listings.tsx) | — | Already done |
| Status indicators (performing/watch/critical) | ✅ Present | — | Already done |
| Map coordination | ✅ Present (property-map-page.tsx) | — | Already done |
| Data freshness labels | ❌ Missing | ProvenanceTag + FreshnessTag not present | Added to property-detail.tsx and lender-report.tsx |
| Source provenance labels | ❌ Missing | No source attribution on data | Added to property-detail.tsx and lender-report.tsx |

### Step 2: Asset Detail
| Requirement | Pre-Phase3 State | Gap | Resolution |
|-------------|-----------------|-----|------------|
| Financial performance charts | ✅ Present | — | Already done |
| Tenant roster | ✅ Present | — | Already done |
| Maintenance schedule | ✅ Present | — | Already done |
| Property alerts | ✅ Present | — | Already done |
| Notes/discussion | ✅ Present (CommentThread) | — | Already done |
| Ownership/entity context | ❌ Missing | No ownership tab existed | Added "Ownership & Debt" tab |
| Diligence checklist | ❌ Missing | No diligence section existed | Added "Diligence" tab |
| Action routing (issue → owner) | ❌ Missing | Alerts shown but not routed | Added "Action Routing" tab |
| Source provenance on data | ❌ Missing | No provenance tags | Added ProvenanceTag + FreshnessTag |
| Tab-based navigation | ❌ Missing | Single-scroll page only | Upgraded to 4-tab layout |

### Step 3: Watchlists / Risk
| Requirement | Pre-Phase3 State | Gap | Resolution |
|-------------|-----------------|-----|------------|
| Distress signal detection | ✅ Present (distress-engine.tsx) | — | Already done |
| Opportunity scoring | ✅ Present | — | Already done |
| Watchlist filtering | ✅ Present | — | Already done |
| Risk routing to property | ✅ Present (link to property detail) | — | Already done |

### Step 4: Ownership / Deal Context
| Requirement | Pre-Phase3 State | Gap | Resolution |
|-------------|-----------------|-----|------------|
| Ownership entity display | ❌ Missing from property detail | Existed only in investor-mode.tsx | Added to property-detail.tsx → Ownership tab |
| Principals breakdown | ❌ Missing | Not available per-asset | Added per-property ownership records |
| Lender information | ❌ Missing | No debt schedule on assets | Added LTV, DSCR, maturity per property |
| Covenant warnings | ❌ Missing | No covenant logic existed | Added DSCR < 1.0 and maturity < 6mo alerts |
| Capital stack visualization | ❌ Missing | No debt context on detail pages | Added to Ownership tab |

### Step 5: Diligence / Reporting
| Requirement | Pre-Phase3 State | Gap | Resolution |
|-------------|-----------------|-----|------------|
| Per-asset diligence checklist | ❌ Missing | No diligence tracking existed | Added "Diligence" tab on property detail |
| Diligence item status + assignee | ❌ Missing | — | Added per-item status, assignee, due date |
| Flagged item highlighting | ❌ Missing | — | Added with tab badge count |
| Executive summary view | ⚠️ Partial | executive-overview.tsx existed but was generic platform-level, not Terra-specific | Added Terra-specific executive summary in Lender Report |
| Lender reporting pack | ❌ Missing | ir-module.tsx had LP table but no debt schedule, covenants, or exec summary | Built full `/lender-report` page with 5 tabs |
| LP investor reporting | ⚠️ Partial | ir-module.tsx had basic LP table | Expanded with IRR, MOIC, distribution history, covenant compliance |

### Step 6: Action Routing (Issue → Owner)
| Requirement | Pre-Phase3 State | Gap | Resolution |
|-------------|-----------------|-----|------------|
| Assign issues to named owners | ❌ Missing | Alerts existed but were display-only | Added "Action Routing" tab with owner + role |
| Recommended action per issue | ❌ Missing | — | Added per-issue action text |
| Due dates on action items | ❌ Missing | — | Added due dates on all action items |
| Issue severity classification | ⚠️ Partial | Alert severity existed | Unified with action-routing severity model |
| Status tracking (open/in-progress/resolved) | ❌ Missing | — | Added status per action item |

---

## Data Model Gaps

| Gap | Pre-Phase3 | Resolution |
|-----|------------|------------|
| Per-property ownership records | Not present | Added `OWNERSHIP_RECORDS` with entity, principals, lender, LTV, DSCR |
| Per-property diligence checklists | Not present | Added `DILIGENCE_CHECKLISTS` for critical/watch assets |
| Per-property action items | Not present | Added `ACTION_ITEMS` with owner routing |
| Source provenance per-data-point | Not present | Added `SOURCE_LABELS` for all 8 properties |
| LP investor IRR/MOIC | Not present | Added in LP_INVESTORS data |
| Distribution history | Not present | Added 5-quarter distribution history |
| Covenant compliance status | Not present | Added `COVENANT_STATUS` table |
| Debt schedule (all lenders) | Not present | Added `LENDERS` table with full debt schedule |

---

## Navigation Gaps

| Gap | Resolution |
|-----|------------|
| No route for lender/LP reporting | Added `/lender-report` route |
| No nav item for reporting | Added "Lender & LP Report" in sidebar Reporting section |
| No link from property detail to reporting pack | Added "Reporting Pack" button on property detail header |

---

## Remaining Gaps (Out of Scope for Phase 3)

| Gap | Reason |
|-----|--------|
| Live MLS/county records integration | By design — out of scope per task spec |
| Terra mobile app depth | Mobile follows web proof — Phase 4 |
| Automated diligence population from documents | Requires AI document parsing — future phase |
| Lender portal (external access) | Separate product surface — future phase |
| Covenant breach workflow (automated alerts) | Queue integration — Phase 4 operational wiring |
