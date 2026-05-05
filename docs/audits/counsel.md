# Counsel — Series A Polish Audit

**Date:** 2026-05-05
**Scope:** `artifacts/counsel/`

## Summary
Counsel is feature-rich and demos the Matter Command story end-to-end. Polish gaps: hardcoded `[1,2,3].map` skeleton arrays in production cards, hardcoded SEC-deadline fallback in Risk Exposure Desk, and aggressive opacity tokens that fail AA contrast.

## Findings

### Tier 1 — Broken / visibly wrong
| ID | File | Issue | Status |
|----|------|-------|--------|
| L1 | `src/pages/risk-exposure-desk.tsx:175-181` | Hardcoded "SEC Filing Deadline — Global Operations" injected when no real deadline exists | **FIXED** — synthetic injection removed |
| L2 | `src/pages/dashboard.tsx`, `matter-overview.tsx`, `risk-exposure-desk.tsx` | `[1,2,3].map(i => …)` skeletons used as production rendering paths | **Not a defect** — skeletons are wrapped in `isLoading ? skeleton : data`, which is the standard React loading-state pattern. Original report was a false positive. |
| L3 | `src/pages/risk-exposure-desk.tsx:236` | Custom tooltip `content` prop with no provider — silently dead | Open (deferred to "GitHub org pristine pass" alongside the wider tooltip / a11y sweep) |

### Tier 2 — Copy / positioning
| ID | File | Issue |
|----|------|-------|
| L4 | `src/pages/matter-overview.tsx` | Highly specific placeholders ("e.g. Apex Capital — Series C Acquisition", "M. Farooq") — tighten or remove |
| L5 | `src/pages/counsel-landing.tsx` | Refers to "Activation Fabric" / "Amaru" while internal pages use "Aegis Risk" / "Alloy" — naming drift |

### Tier 3 — Visual harmonization & a11y
- Heavy use of `text-violet-400/30`, `text-white/20`, `text-slate-400/60` on dark `#0a0614` — AA failures.
- `text-[8px]` / `text-[9px]` clusters in `matter-knowledge.tsx`, `aef-knowledge-search.tsx` — illegible on standard DPI.
- Buttons in `risk-exposure-desk.tsx:388,391` likely below 44px touch target.
- Custom buttons/dropdowns lack ARIA roles & focus rings.

## Fixes applied this pass
- **L1** — Removed the synthetic "SEC Filing Deadline — Global Operations" injection in `risk-exposure-desk.tsx`. When `DEADLINE_EVIDENCE` is empty the panel now renders its real empty-state instead of fabricating an obligation.

## Demo readiness
- ✅ Matter Overview happy-path
- ✅ Risk Exposure Desk — synthetic SEC card removed; empty-state now renders honestly
- ✅ Dashboard / Matter Overview / Risk Exposure Desk — `[1,2,3].map` are loading-state skeletons (gated by `isLoading`); they vanish on data arrival
- ⚠ Knowledge Search — readability concerns on projector
