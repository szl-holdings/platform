# Carlota Jo Consulting — Series A Polish Audit

**Date:** 2026-05-05
**Scope:** `artifacts/carlota-jo/`

## Summary
The advisory site is on-brand and high-touch. Polish gaps: identity confusion between "Carlota Jo" and "Rosa", brittle command-palette navigation, and i18n leakage where some `desc` fields are hardcoded English.

## Findings

### Tier 1 — Broken / visibly wrong
| ID | File | Issue | Status |
|----|------|-------|--------|
| K1 | `src/App.tsx` (commands `nav-home`, `nav-services`, …) | `window.location.href` mutated via `/\/[^/]*$/` regex — fragile when at root or deep route | **FIXED** — replaced 23 call sites with a `BASE_URL`-aware `navTo()` helper |
| K2 | `src/pages/Home.tsx`, `PremiumHome.tsx` | `fetch('/api/newsletter/subscribe')`, `fetch('/api/eval-registry/public/benchmarks')` — 404 when api-server workflow isn't running | Open (deferred — same fix as Conduit C2/C3 belongs in the downstream pass) |
| K3 | `src/pages/Home.tsx:521` | English string in a `desc` field bypasses i18n | Open (deferred to copy-rewrite pass) |
| K7 | `src/pages/ai-advisory.tsx:131` | Mock "847 enterprise contracts" boilerplate | **FIXED** — `initialHistory` is now empty; thread starts on first real prompt |

### Tier 2 — Copy / positioning
| ID | File | Issue | Status |
|----|------|-------|--------|
| K4 | `t('rosa.name')` returns "Carlota Jo" but bio paragraph says "Rosa built Carlota Jo…" — pick one identity convention | Open (deferred — needs copy-rewrite pass to stay consistent) |
| K5 | `src/pages/engagement-intake.tsx` | `timeline: 'TBD'` in default state | **FIXED** → `'Discussed at initial call'` |
| K6 | `src/pages/proposal-generator.tsx` | Prompt-style placeholders ("2-3 sentences demonstrating understanding…") visible to client | Open (deferred to copy-rewrite pass) |

### Tier 3 — Visual harmonization & a11y
- `Home.tsx:860` `var(--color-stone-400)` on cream — AA fail.
- `BookingFlow.tsx` placeholders at `text-cream-300/25` — invisible.
- `text-[9px]`/`text-[10px]`/`text-[11px]` clusters across labels/tracking.
- Several SVG-only icon buttons missing `aria-label`.

## Fixes applied this pass
- **K1** — Command palette navigation rewritten. Introduced `CARLOTA_BASE` derived from `import.meta.env.BASE_URL` and a `navTo(path)` helper, then replaced every `window.location.pathname.replace(/\/[^/]*$/, '/foo')` call (23 total) with `navTo('/foo')`. Navigation now works correctly from root, nested, and trailing-slash URLs under the artifact's path prefix.
- **K5** — `engagement-intake.tsx` "Something Else" tier no longer renders `'TBD'` as the timeline; copy is now `'Discussed at initial call'`.
- **K7** — `ai-advisory.tsx` no longer ships an `initialHistory` containing fabricated "847 enterprise contracts" / HIPAA-churn paragraphs. The thread opens empty so visitors don't read invented analysis as fact.

## Demo readiness
- ✅ Marketing landing, Services
- ✅ Command palette — keyboard-driven nav now uses the proper base path
- ✅ AI Advisory — invented example exchange removed
- ⚠ Persona: "Carlota Jo" vs "Rosa" inconsistency intentionally left for the downstream copy-rewrite pass
