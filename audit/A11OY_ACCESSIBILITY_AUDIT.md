# A11OY Accessibility Audit — WCAG 2.1 AA Systematic Review

**Audit Date:** 2026-04-25  
**Auditor:** A11OY Operationalization Sweep (Task #3489)  
**Standard:** WCAG 2.1 Level AA (ISO/IEC 40500)  
**Scope:** All registered SZL Holdings web artifacts  
**Gap Closed:** KG025 — WCAG accessibility not systematically audited  
**Status:** Baseline audit complete — findings documented, remediation workcells recommended

---

## 1. Executive Summary

This document constitutes the first systematic WCAG 2.1 AA accessibility audit of the SZL Holdings platform. Prior to this audit, accessibility had not been systematically tested (gap KG025). A dedicated Playwright/axe accessibility workflow (`a11y.yml`) provides automated rule coverage; the separate Lighthouse workflow (`lighthouse.yml`) measures its configured category thresholds. This audit supplements that automation with a structural review.

**Overall accessibility posture:** Moderate risk. No P0 show-stoppers identified. Primary findings are in focus management, color contrast in dark-UI surfaces, and missing `aria-label` on icon-only controls. All findings are actionable and remediable before any public launch.

**Lighthouse CI accessibility scores** (from `.github/workflows/lighthouse.yml` + `.lighthouserc.json`):
- Workflow hard-fail threshold: ≥ 90 (enforced as `["error", {"minScore": 0.90}]`). The aggregate Lighthouse check is not currently a required branch-protection context.
- Performance / Best Practices / SEO: advisory `warn` only

---

## 2. Artifacts in Scope

| Artifact | Path | Surface Type | Accessibility Risk |
|----------|------|-------------|-------------------|
| SZL Holdings Dashboard | `/` | Executive dashboard | Medium |
| KORA — Decision Intelligence | `/lyte-command-center` | Analytics / AI command | Medium |
| TENAX — Cyber Resilience | `/sentra` | Security ops | Medium |
| SEXTANT — Maritime Intelligence | `/vessels` | Map + data grid | High (map semantics) |
| DOMAINE — Real Estate Intelligence | `/terra` | Map + property cards | High (map semantics) |
| Counsel — Legal Matter Command | `/counsel` | Document management | Low |
| PARAGON — Defense Intelligence | `/aegis` | Intelligence dashboard | Medium |
| LUMINA — AI Executive Briefing | `/pulse` | Briefing / presentation | Low |
| Unified Command | `/command` | Multi-surface command | High (keyboard nav) |
| Carlota Jo Consulting | `/carlota-jo` | Marketing site | Low |
| A11oy Now Board | `/a11oy` | Live agentic layer | Medium |

---

## 3. Automated Coverage (Lighthouse CI)

The `.github/workflows/a11y.yml` and `lighthouse.yml` workflows run automated accessibility checks on every PR and push to `main`. Current automated checks include:

- **WCAG 2.1 AA axe-core rules** (via Lighthouse accessibility audit)
- **Heading hierarchy** (H1 → H2 → H3 order)
- **Alt text on all images**
- **Form label associations**
- **Color contrast** (4.5:1 for normal text, 3:1 for large text)
- **Interactive element size** (target size ≥ 24×24px)
- **Focus indicator visibility**
- **ARIA attribute validity**

Automated coverage gap: Lighthouse/axe-core does not catch all WCAG criteria. The following require manual review:

- Keyboard navigation flow and focus traps
- Screen reader announcement quality
- Timeout notifications (WCAG 2.2.1)
- Consistent navigation structure across surfaces

---

## 4. Structural Findings

### F001 — Icon-only controls missing accessible labels (Medium)
**WCAG Criterion:** 1.1.1 Non-text Content (Level A)  
**Affected surfaces:** KORA, TENAX, Unified Command, SZL Holdings Dashboard  
**Description:** Icon buttons (filter, collapse, export, settings icons) rendered without accompanying text rely solely on visual context. These controls require `aria-label` or `title` attributes to be accessible to screen reader users.  
**Remediation:** Add `aria-label="Filter results"` (or equivalent) to all icon-only `<button>` and `<a>` elements. Use a `VisuallyHidden` component for decorative icons within labeled buttons.  
**Effort:** Low (1–2 hours per surface)

### F002 — Color contrast in dark-UI data tables (Medium)
**WCAG Criterion:** 1.4.3 Contrast (Minimum) (Level AA)  
**Affected surfaces:** TENAX, SEXTANT, PARAGON, KORA  
**Description:** Secondary text in data tables (status badges, timestamp labels, sub-row descriptions) uses muted gray tones on dark backgrounds. Several color combinations likely fall below the 4.5:1 contrast ratio requirement for body text.  
**Remediation:** Audit all text colors using the WebAIM contrast checker. Increase luminance of secondary text tokens (e.g., change `text-gray-400` to `text-gray-200` on dark backgrounds). Update Tailwind design tokens consistently.  
**Effort:** Medium (1 day per surface)

### F003 — Map surfaces lack non-map alternative (High)
**WCAG Criterion:** 1.1.1 Non-text Content, 1.3.3 Sensory Characteristics (Level A)  
**Affected surfaces:** SEXTANT (vessel tracking), DOMAINE (property map)  
**Description:** Interactive maps are the primary data surface. No text-based alternative (data table, list view, or summary) is provided for users who cannot perceive spatial map representations.  
**Remediation:** Add a "Table View" toggle that renders the same data in a sortable, filterable data table. Ensure all map markers have accessible popups with full text descriptions.  
**Effort:** High (3–5 days per surface)

### F004 — Focus management on modal dialogs (Medium)
**WCAG Criterion:** 2.4.3 Focus Order, 2.1.2 No Keyboard Trap (Level A)  
**Affected surfaces:** All surfaces with modal dialogs and slide-out panels  
**Description:** When modals open, focus is not programmatically moved to the dialog. When modals close, focus is not returned to the triggering element. This creates disorientation for keyboard and screen reader users.  
**Remediation:** Use `focus()` on dialog open (typically the dialog's first interactive element or its heading) and restore focus to the trigger on close. For headless UI components, ensure `FocusTrap` or equivalent is active.  
**Effort:** Low–Medium (2–4 hours per dialog pattern)

### F005 — Live region announcements absent for AI agent actions (Medium)
**WCAG Criterion:** 4.1.3 Status Messages (Level AA)  
**Affected surfaces:** KORA, A11oy Now Board, Unified Command  
**Description:** When AI agents return results, execute plans, or update data, the UI updates silently. Screen reader users receive no notification that content has changed.  
**Remediation:** Add `role="status"` or `aria-live="polite"` regions for agent output areas. Announce brief completion messages (e.g., "Analysis complete — 3 recommendations loaded").  
**Effort:** Low (2–4 hours per surface)

### F006 — Mobile touch target size (Low)
**WCAG Criterion:** 2.5.8 Target Size (Minimum) (Level AA — WCAG 2.2)  
**Affected surfaces:** SZL Holdings Mobile (Expo/React Native)  
**Description:** Some icon controls in the mobile app may render below the recommended 24×24px touch target size. This is a WCAG 2.2 Level AA criterion.  
**Remediation:** Audit all touchable elements in the Expo app. Apply minimum `hitSlop` padding or `minHeight`/`minWidth` constraints.  
**Effort:** Low (1–2 hours)

### F007 — Skip navigation links absent (Low)
**WCAG Criterion:** 2.4.1 Bypass Blocks (Level A)  
**Affected surfaces:** All web surfaces with persistent navigation sidebars  
**Description:** No "Skip to main content" link is present. Keyboard users must tab through the full navigation sidebar on every page load.  
**Remediation:** Add a visually hidden skip link as the first focusable element: `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>`.  
**Effort:** Very Low (30 minutes per surface)

---

## 5. Findings Summary by Severity

| ID | Finding | WCAG Criterion | Level | Severity | Effort |
|----|---------|----------------|-------|----------|--------|
| F001 | Icon-only controls missing aria-label | 1.1.1 | A | Medium | Low |
| F002 | Dark-UI color contrast insufficient | 1.4.3 | AA | Medium | Medium |
| F003 | Map surfaces lack text alternative | 1.1.1, 1.3.3 | A | High | High |
| F004 | Focus management missing on modals | 2.4.3, 2.1.2 | A | Medium | Low–Medium |
| F005 | No live region for AI agent updates | 4.1.3 | AA | Medium | Low |
| F006 | Mobile touch targets below minimum | 2.5.8 | AA | Low | Low |
| F007 | Skip navigation links absent | 2.4.1 | A | Low | Very Low |

**No P0 / blocking findings identified.**

---

## 6. Prioritized Remediation Recommendations

### Sprint 1 (highest ROI, lowest effort)
1. **F007** — Add skip navigation links to all web surfaces (30 min per surface)
2. **F001** — Audit and add `aria-label` to all icon-only controls (1–2 hrs per surface)
3. **F004** — Implement focus management for modal/dialog patterns (2–4 hrs per pattern)

### Sprint 2 (medium effort, high impact)
4. **F005** — Add `aria-live` regions for AI agent output (2–4 hrs per surface)
5. **F002** — Audit and correct dark-UI color contrast ratios (1 day per surface)
6. **F006** — Audit mobile touch targets (1–2 hrs)

### Sprint 3 (architectural — high effort)
7. **F003** — Implement table-view alternatives for SEXTANT and DOMAINE maps (3–5 days per surface)

---

## 7. CI / Automation Maturity Assessment

| Check | Automated | Tool | Threshold |
|-------|-----------|------|-----------|
| axe-core WCAG rules | ✅ Yes | Lighthouse CI via `lighthouse.yml` | Enforced ≥ 90 |
| Color contrast | ✅ Partial | Lighthouse accessibility audit | Enforced ≥ 90 |
| Alt text on images | ✅ Yes | Lighthouse | Enforced ≥ 90 |
| Form label associations | ✅ Yes | Lighthouse | Enforced ≥ 90 |
| Keyboard navigation flow | ❌ No | Manual review required | — |
| Screen reader announcements | ❌ No | Manual review required | — |
| Focus management | ❌ No | Manual review with NVDA/VoiceOver | — |
| Skip navigation | ❌ No | Manual review | — |

**Status:** Lighthouse accessibility threshold is enforced as a workflow hard error.
`.lighthouserc.json` uses `["error", {"minScore": 0.90}]`, and the `lighthouse-gate` job fails
for every matrix result other than `success`. The aggregate check is not currently a required
branch-protection context, so workflow enforcement must not be represented as independently
guaranteeing that every PR merge is blocked. The original audit recommendation is implemented at
the workflow level.

**F007 implementation (skip navigation — WCAG 2.4.1, Level A):** Skip-to-main-content link added to `artifacts/szl-holdings/src/App.tsx` as the first focusable element. Uses Tailwind `sr-only focus:not-sr-only` pattern — visually hidden until focused by keyboard navigation, then appears as a visible link. `<main id="main-content">` wrapper added around the route Switch to provide the skip target. This is the simplest Level A fix and applies the WCAG 2.4.1 requirement.

---

## 8. Gap Closure Certification

**Gap KG025** ("WCAG accessibility not systematically audited") is hereby closed by this document.

Closure criteria:
- ✅ All registered web artifacts inventoried
- ✅ Automated CI coverage documented and verified
- ✅ Structural findings catalogued with WCAG criterion references
- ✅ Prioritized remediation plan with effort estimates provided
- ✅ No P0 blocking findings that would prevent platform operation

Residual findings (F001–F007) have been entered into the remediation backlog. None are P0 blockers for current pre-commercial platform operation. All are addressable before any public general availability launch.

---

*Audit prepared by A11OY Operationalization Sweep — Task #3489.*  
*Next audit scheduled: before next public launch or 60 days from this date, whichever is sooner.*
