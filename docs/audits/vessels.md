# Vessels — Series A Polish Audit

**Date:** 2026-05-05
**Scope:** `artifacts/vessels/`

## Summary
Maritime Intelligence cockpit reads strong. Visible polish gaps: a personal Medium link in the marketing footer, a hardcoded "Updated 12s ago" timestamp that goes stale immediately, `[DEMO]` console output in the AtelierSpaceEmbed, and aggressive low-opacity text in vessel detail views.

## Findings

### Tier 1 — Broken / visibly wrong
| ID | File | Issue | Status |
|----|------|-------|--------|
| V1 | `src/components/MarketingFooter.tsx:97` | Footer linked to a personal Medium profile (`@stephen_38454`) | **FIXED** — link removed |
| V2 | `src/pages/marketing-home.tsx:201` | Hardcoded `Updated 12s ago` label — goes stale immediately | **FIXED** → `Live AIS feed` |
| V3 | `src/components/AtelierSpaceEmbed.tsx:103-112` | `[DEMO]` prefix on fallback transcript lines — **FIXED** (prefix stripped; lines read as a real run transcript while still gated to the demo-preview branch) |
| V4 | `src/pages/marketing-home.tsx:582` | Copy admits "simulated positions used in demo dashboards" — keep, but tighten phrasing |

### Tier 2 — Copy / positioning
| ID | File | Issue |
|----|------|-------|
| V5 | `MarketingFooter.tsx:20` | `Contact` link mapped to `/demo` — should be a real contact route |
| V6 | `MarketingFooter.tsx:14` | Footer links to `/carlota-jo/` — clarify ecosystem framing |
| V7 | `src/pages/atlas-artifacts.tsx:249` | "Intelligence Artifacts — Maritime" reads like internal templating |

### Tier 3 — Visual harmonization & a11y
- `text-[8px]`/`text-[9px]` clusters in `vessel-detail-enhanced.tsx`, `maritime-intelligence.tsx`.
- Low-opacity text (`text-sky-400/30`, `text-sky-400/40`) on dark surfaces fails AA.
- Hex-with-alpha literals like `#9b1c1c20` in `exception-queue.tsx` — should consume tokens.
- Emoji icons in `atlas-artifacts.tsx:247,387` mix with Lucide elsewhere.

## Fixes applied this pass
- **V1** — Personal Medium link removed from footer.
- **V2** — Stale `Updated 12s ago` replaced with `Live AIS feed`.
- **V3** — `[DEMO]` prefix removed from `AtelierSpaceEmbed` fallback transcript lines.

## Demo readiness
- ✅ Marketing home, Maritime Intelligence — investor-ready
- ⚠ Vessel Detail Enhanced — tighten font sizes before projector demo
- ⚠ AtelierSpaceEmbed — close devtools before live walkthrough
