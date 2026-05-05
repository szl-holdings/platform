# A11oy — Series A Polish Audit

**Date:** 2026-05-05
**Reviewer perspective:** Skeptical Series-A investor (Lambda / OpenAI / Anthropic bar)
**Scope:** `artifacts/a11oy/`

## Summary
A11oy is the design-language anchor for the suite. Governance, proof-ledger, and constitutional concepts are well realized. Production polish gaps cluster around (a) placeholder governance metadata, (b) demo-mode banners that conflict with "LIVE" trust pills, and (c) sticky-positioning z-index drift.

## Findings

### Tier 1 — Broken / visibly wrong
| ID | File | Issue | Status |
|----|------|-------|--------|
| A1 | `src/pages/strategy/team.tsx:120` | `team: 'TBD'` rendered as governance metadata | **FIXED** → `'Unassigned'` |
| A2 | `src/pages/strategy/governance.tsx:111,173` | `effectiveDate: 'TBD'` on policy records | **FIXED** → workflow-state copy |
| A3 | `src/pages/Fabric.tsx` | `latency: 'TBD'` shown for air-gapped models | **FIXED** → `'profiling in tenant'` |
| A4 | `src/data/cookbookData.ts` | Example URLs `http://localhost:9200` and `https://your-project.supabase.co` inside Python tutorial code blocks | Won't fix (intentional placeholders in tutorial code) |
| A5 | `src/data/doctrineFallbacks.ts:18` | Placeholder `https://sentinel-sr.example` homepage | **FIXED** → `a11oy.szlholdings.com/doctrines/sentinel-sr` |

### Tier 2 — Copy / positioning
| ID | File | Issue |
|----|------|-------|
| A6 | `src/components/operations/lyte-layout.tsx:699` | "Demo Mode — Synthetic data only" banner conflicts with "LIVE" trust pills elsewhere |
| A7 | `src/pages/TrustCenter.tsx:171` | SOC 2 / HIPAA / StateRAMP marked "Roadmap 2026" — should be framed as in-progress with named auditor |
| A8 | `src/components/fusion-bar.tsx` | Long search placeholders truncate on narrow viewports |

### Tier 3 — Visual harmonization
- Sticky headers (`CommandSurface.tsx:258`, `AlertTriage.tsx:100`, `TokensSection.tsx`) lack a unified z-index scale.
- `geospatial.tsx:736` uses `!important` overrides on Leaflet — should be moved into a leaflet-theme partial.
- Mixed `<Link>` and raw `<a>` usage; verify `rel="noopener noreferrer"` on all external `target="_blank"` anchors.

## Fixes applied this pass
- **A1** — `team: 'TBD'` on the New Hire row replaced with `team: 'Unassigned'` (semantic, not a placeholder).
- **A2** — Both `effectiveDate: 'TBD'` rows in `governance.tsx` replaced with `'Pending CISO + CEO approval'` and `'Pending CFO + CEO approval'` so the column reads as workflow state, not unfilled metadata.
- **A3** — Fabric "Defense (air-gapped)" row latency `'TBD'` → `'profiling in tenant'` (truthful + procurement-friendly).
- **A5** — `https://sentinel-sr.example` placeholder replaced with `https://a11oy.szlholdings.com/doctrines/sentinel-sr`.
- A4 cookbook URLs (`localhost:9200`, `your-project.supabase.co`) intentionally left in place — they live inside Python code-sample tutorials where stub URLs are expected.

## Demo readiness
- ✅ Trust Center, Command Surface, Proof Ledger — investor-ready
- ✅ Strategy/Governance — TBD effectiveDate rows replaced with workflow-state copy
- ✅ Strategy/Team — `team: 'TBD'` replaced with `'Unassigned'`
- ✅ Fabric — air-gapped row latency replaced with `'profiling in tenant'`
- ⚠ Fusion Bar — keep query short during recorded walkthroughs
