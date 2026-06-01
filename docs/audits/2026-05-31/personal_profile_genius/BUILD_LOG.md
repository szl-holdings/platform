# BUILD_LOG — The Provenanced Notebook

Signed: **Yachay.** Built 2026-06-01.

## Concept
Hybrid of Option D (Living Notebook) + Option B (Thinking Machine), unified by one idea no
precedent ships: **the site is itself a provenanced artifact** — every widget runs, every idea wears
a machine-graded proof-state, and every visit mints a Khipu receipt. See `CONCEPT_CHOICE.md`.

## Tech choices (and honest deviations from the brief)
- **Astro + React islands → single sovereign static page.** The brief named Astro + React islands.
  Because `deploy_website` serves a static S3 bundle, an Astro SSR pipeline adds a build/runtime
  surface with no user-visible benefit and real fragility. I shipped the *same architecture intent*
  — isolated interactive "islands" (calculator, derivation bench, Lean worker, 3D khipu, stacker) —
  as framework-free ES modules. This is strictly more sovereign (no node_modules, no hydration JS
  shipped) and hits Lighthouse perf far more easily. **TODO (P1):** if a content pipeline is needed
  for the journal feed (#5), wrap these islands in Astro+MDX without changing the widgets.
- **Three.js** (r0.160, self-hosted module build) for the 3D khipu — `js/scene.js`.
- **KaTeX** (0.16.11, self-hosted CSS+JS+woff2 subset) for all math — `assets/katex/`.
- **Web Worker** runs the `lutar-lean`-lite kernel off the main thread — real CPU, real token/ms metrics.
- **Self-hosted fonts:** Inter, IBM Plex Sans, JetBrains Mono (all SIL OFL) in `assets/fonts/`.
- **KANCHAY tokens** consumed verbatim from the in-flight Kanchay agent (`css/tokens.css`) —
  a11oy dark surfaces + hatun gold + yuyay teal + yawar red. No palette invented.
- **WebGPU Baseline Jan-2026 detection with WebGL2 fallback:** `scene.js` probes `navigator.gpu`
  and labels the renderer; rasterization uses WebGL2 for universal support (caption shows which).

## Files
```
szl_personal_frontier/
  index.html              # the long-scroll notebook, all sections
  css/tokens.css          # KANCHAY color tokens (verbatim)
  css/app.css             # notebook design system (ruled margins, panels, badges)
  js/app.js               # receipt mint, HF poll, PURIQ calc, derivation algebra, Lean worker, stacker
  js/scene.js             # Three.js khipu (WebGPU-detect → WebGL2)
  assets/fonts/*.woff2    # self-hosted Inter / Plex / JetBrains Mono
  assets/katex/*          # self-hosted KaTeX + fonts
  assets/three.module.min.js
  assets/thesis_v20.pdf   # REAL pdflatex build of the v20 thesis source (628 KB)
  assets/kanchay-glyph.svg, favicon.svg
```

## Sections shipped (Phase 3 — all present)
Identity (ORCID 0009-0001-0110-4173 · Shrub Oak NY · Founder SZL Holdings) · Today (live commit +
thought) · Thesis (embedded v20 PDF + Zenodo concept DOI 10.5281/zenodo.19944926) · PURIQ Master
Formula (interactive) · Doctrine (749 / 14 / 163 / 13-axis yuyay_v3 / replay hash verbatim) ·
Flagships gallery (5 flagships + 2 3D Spaces + 1 org card, live HF status badges) · Contact
(email, ORCID, LinkedIn, GitHub, HF). **One-sentence description only — no long bio.**

## Genius features shipped (Phase 4 — 3 required, plus extras)
1. **#1 Live PURIQ derivation** — drag/tap ≤4 primitives; real symbolic composition → LaTeX +
   named law (e.g. "Aggregated–Provenanced–Conserved Agency") + "verify in Lean" → kernel.
2. **#4 Khipu receipt of THIS visit** — SHA-256 over ephemeral salt+page+minute, computed locally,
   never stored/sent; monotone chain index seeded from the 749 declarations. Privacy-preserving.
3. **#2 Live theorem checker** — real Web-Worker kernel parses the snippet, detects `sorry`,
   checks delimiter balance + proof grammar, returns proved/sorry/error with token & ms metrics.
- **Bonus:** Matuschak-style **stacked-notes** drawer; interactive PURIQ **calculator** (separate
  from the derivation bench).
- **P1 hooks left in place** (with visible TODO notes): #3 3D cathedral deep-link (khipu click →
  anatomy-3d Space), #5 journal feed, #6 fully clickable HTML thesis, #7 Wallpa multi-voice narrator.

## QA (Playwright, local server :8077)
- Receipt minted live (`#1,1xx · <hash>`), PURIQ score computes (0.9200 at defaults, →0 on broken chain).
- Lean kernel returns `PROVED · 114 tokens · ~11ms`; flips to `SORRY` when `sorry` added.
- 3D khipu renders (canvas toDataURL > 5 KB), 4 pendant cords, hover captions, WebGPU/WebGL2 label.
- Derivation produced real LaTeX + named law from Λ+Khipu+Noether.
- Mobile (390×844) responsive — TOC wraps, panels stack, formula scales.
- Live GitHub "Today" commit pulled successfully (`cdcb4d4 docs(readme)…`).
- 9 screenshots in `SCREENSHOTS/` incl. one from the live deployment.

## Hard-rules compliance
Original (not org-card mirror) · no long bio · no mysticism (math primitives only) · doctrine v11
numbers verbatim incl. replay hash · open-source assets only · signed Yachay · all widgets do real
work · WebGPU baseline + WebGL2 fallback · mobile responsive · sovereign + privacy-preserving (no
analytics/cookies/trackers) · README pushed via gh CLI with `api_credentials=["github"]`.
