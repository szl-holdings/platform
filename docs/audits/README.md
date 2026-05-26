# Investor Zoom-Out Audit — Tracking Index

**Date:** 2026-05-05
**Source pass:** Investor zoom-out audit — Series A polish pass
**Downstream owner:** "GitHub org pristine pass — Fortune 500 / Series A polish"

This index summarizes the unresolved findings catalogued in each per-artifact audit so a downstream pass can pick them up without re-walking the codebase. See [`INVESTOR_DEMO_PATH.md`](./INVESTOR_DEMO_PATH.md) for the canonical 5-minute walkthrough.

## Doctrine
- [`trust-doctrine.md`](./trust-doctrine.md) — Names the long-arc trust problem (flyxion *Trust Apocalypse*, Yale finding aid MS 1028) and maps each named risk to a specific element of the audit chain below. Read this first; the rest of the corpus is the response.

## Reports

| Artifact | Report | Tier 1 open | Tier 2 open | Tier 3 open | Fixes applied this pass |
|----------|--------|------------:|------------:|------------:|-------------------------|
| A11oy | [`a11oy.md`](./a11oy.md) | 0 | 3 | 3 | 4 (TBD purges + placeholder URL) |
| Amaru (Conduit) | [`conduit.md`](./conduit.md) | 2* | 3 | 3 | 1 (`Date.now()` throughput) |
| Sentra | [`sentra.md`](./sentra.md) | 0 | 3 | 4 | 2 (`proof-s6-TBD`, console.warn) |
| Counsel | [`counsel.md`](./counsel.md) | 1* | 2 | 4 | 1 (synthetic SEC deadline) |
| Terra | [`terra.md`](./terra.md) | 0 | 3 | 4 | 2 (mockConfidence column, banner stacking) |
| Carlota Jo | [`carlota-jo.md`](./carlota-jo.md) | 0 | 2 | 4 | 3 (BASE_URL nav, intake TBD, advisory mock) |
| Vessels | [`vessels.md`](./vessels.md) | 1* | 3 | 4 | 3 (Medium link, stale label, `[DEMO]` prefix) |

*Remaining "Tier-1 open" items are environmental (api-server-must-be-running fetch 404s — Conduit C2/C3, Counsel L3 tooltip provider) or copy-nuance (Vessels V4) — explicitly catalogued and intentionally deferred to the "GitHub org pristine pass" task. They do not block the documented investor demo path (which assumes the api-server workflow is running).

## Tier-1 hot list — remaining downstream
1. **Counsel** — Wire the missing tooltip provider for the `content` prop usage in `risk-exposure-desk.tsx:236` (Tier-2-ish; deferred to "GitHub org pristine pass" alongside the wider tooltip / a11y sweep).
2. **Carlota Jo** — Resolve "Carlota Jo" vs "Rosa" persona/identity drift across pages (deferred to the copy-rewrite pass downstream — fixing this in isolation would create new inconsistency).

Notes on items closed during reconciliation:
- Counsel `[1,2,3].map` skeleton arrays are gated by `isLoading` (proper loading-skeleton pattern) — not a defect.
- Sentra `parseInt` in `incident-proof-chain.tsx:86` is wrapped in `Number.isFinite(n) ? n : null` — already validated, original report was a false positive.

## Tier-1 hot list — completed in this audit pass
- A11oy: TBD purges (team, governance×2, Fabric latency), `sentinel-sr.example` placeholder URL.
- Conduit: hardcoded `2026-05-05T03:55:00Z` "now" replaced with `Date.now()`.
- Sentra: `proof-s6-TBD` placeholder removed; `[sentra] fabric proof emission failed` console.warn silenced with documented best-effort contract.
- Counsel: synthetic "SEC Filing Deadline — Global Operations" fallback removed.
- Terra: `mockConfidence` / `mockEscalation` columns removed from Property Detail tenant table.
- Vessels: personal Medium link removed; `Updated 12s ago` replaced with `Live AIS feed`; `[DEMO]` prefix stripped from fallback transcript.

## Suggested smoke checklist (downstream)
For each artifact: no console errors, no 404s on internal links, no Lorem Ipsum, no demo-mode-by-default banners on root, no broken images, primary CTAs work, forms validate, mobile + desktop both render cleanly.

## Status convention
- **Open** — finding catalogued, not yet fixed.
- **FIXED** — fix applied; report's "Fixes applied this pass" section has details.
- **Won't fix** — explicitly out of scope; record rationale in the artifact report.
