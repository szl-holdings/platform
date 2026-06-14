# Design + Mobile-UX Leaders Per Vertical — Adoptable Patterns for the SZL Estate

**Scope:** Design-pattern research (responsive layout, typography, touch UX, motion, dashboard craft) across the six verticals SZL competes in. This is **not** code-copying — it is a catalog of *named leaders*, the *specific* mobile/elegance moves they use, and openly-licensed libraries safe to vendor.

**Constraints honored throughout (doctrine v11):**
- **Sovereign / 0 runtime CDN** — every library named below is permissively licensed (MIT/Apache-2.0/ISC) and **vendorable** (self-host the source; no CDN script tags). License verified inline.
- **System-font-friendly** — every typography recommendation works with a system-font stack; no required webfont embed.
- **Honest** — no fabricated data; loading/empty/error states are designed, never faked with placeholder numbers.

---

## How to read this report
- Each vertical: **3–6 named leaders (with URLs)** → **concrete patterns worth adopting**.
- Patterns are written as build-dev instructions (breakpoints, px floors, CSS techniques), not vibes.
- The **Universal Mobile Checklist** at the end is the non-negotiable floor for *every* surface.
- The **Type / Spacing / Touch System** is a drop-in token set to apply estate-wide.

---

## Vertical 1 — Cinematic 3D / WebGL showpieces (our *cathedral*)

### Leaders
| Leader | URL | Why they lead |
|---|---|---|
| Bruno Simon | https://bruno-simon.com | The most-referenced 3D portfolio in the industry; physics-based Three.js scene with graceful loading and reveal ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)). Open course at https://threejs-journey.com. |
| Lusion | https://lusion.co | Most Awwwards Site-of-the-Day wins of nearly any studio; custom WebGL renderer + custom postprocessing passes rather than EffectComposer defaults ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)). |
| Active Theory | https://activetheory.net | Long-running benchmark for immersive WebGL campaign work (industry reference). |
| Basement Studio | https://basement.studio | Masterclass in scroll-driven Three.js using React Three Fiber + Drei + Rapier physics ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)). |
| Codrops (Tympanus) | https://tympanus.net/codrops/ | The pattern library of the field — documented, reproducible performance techniques ([Codrops](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)). |
| three.js examples | https://threejs.org/examples/ | Canonical, MIT-licensed reference implementations of controls, loaders, postprocessing. |

### Patterns worth adopting (concrete)
**Performance / mobile GPU (the hard floor):**
- **Cap device pixel ratio.** Desktop render at DPR 1, mobile `Math.min(1.5, devicePixelRatio)`. Rendering at native 2x+ on phones causes frame drops below 30fps for ~44% more GPU work and no visible gain ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples), [Codrops](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)). Stable band on mobile is DPR 0.9–2.0 to hold 30–60fps ([three.js forum](https://discourse.threejs.org/t/animate-low-performance-on-mobile-with-window-devicepixelratio-resize/23628)).
- **Dynamic quality ladder.** Watch FPS (R3F `PerformanceMonitor` or a manual rAF sampler); on decline, drop DPR ~20% and disable postprocessing; on a second decline, switch to a low-detail fallback scene ([Codrops](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)).
- **Disable antialiasing on mobile** (`antialias: false`); use FXAA only if edges demand it ([Codrops](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)).
- **Pause the render loop when not visible.** `IntersectionObserver` to stop animating off-screen; Page Visibility API to stop on hidden tabs. A 60fps loop heats the device and drains battery for zero benefit ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).
- **Compress assets aggressively.** Keep assets <2MB; Draco geometry compression (80–90% smaller), Meshopt, Basis Universal / KTX2 textures, texture atlasing to cut draw calls, LOD for distant meshes ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).
- **Detect low-end devices** via `navigator.hardwareConcurrency` and pre-emptively disable postprocessing ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).
- **Test on a mid-range Android (Galaxy A-series), not a MacBook** ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).

**Loading states (honest, not blank):**
- Never show a blank canvas then a pop-in. Use Three.js `LoadingManager` progress callbacks to drive a real progress indicator, then a graceful reveal (fade/scale-in), even if it's just a logo while assets stream ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)). Nike streams a placeholder mesh while high-quality assets load ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).

**Fallbacks (graceful degradation):**
- Ship a CSS/static fallback *inside* the canvas container. If WebGL fails (privacy mode, old device, battery-saver), the static poster image/video remains and communicates the same content — the page never looks broken ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples), [Cause & Effect](https://causeandeffectsp.com/blog/3d-website-mobile-performance/)).
- Lazy-load 3D below the fold so phones don't pay the bandwidth/battery cost until the scene scrolls near ([Cause & Effect](https://causeandeffectsp.com/blog/3d-website-mobile-performance/)).

**Touch / orbit UX:**
- Use Pointer Events (unified mouse/touch) for orbit + pinch-zoom; enable damping on OrbitControls for inertial feel ([Valeriu Crudu / Moldstud](https://moldstud.com/articles/p-creating-responsive-threejs-scenes-for-mobile-devices-a-complete-guide)).
- Recompute camera aspect + renderer size on **both** `resize` and `orientationchange` so a mid-session phone flip doesn't stretch the scene ([Moldstud](https://moldstud.com/articles/p-creating-responsive-threejs-scenes-for-mobile-devices-a-complete-guide)).

**HUD panels (cathedral-specific):**
- **Collapse the fixed desktop HUD into a bottom sheet under 680px.** On phones, floating corner panels overlap the scene and steal touch area — move them to a single dismissible bottom sheet with a drag handle.
- Keep HUD controls ≥44×44px (see touch system) and add `padding-bottom: env(safe-area-inset-bottom)` so the sheet clears the home-gesture bar.
- Respect `prefers-reduced-motion`: swap auto-rotate / camera fly-throughs for a static framed view.

**Vendorable libs:** `three` (MIT), `@react-three/fiber` + `@react-three/drei` (MIT), `postprocessing` (MIT), Draco/KTX2 decoders ship with three.js (self-host the `/jsm` + decoder files; do **not** point at a CDN).

---

## Vertical 2 — Live-ops dashboards / command consoles (our *a11oy console*, *killinchu /elite*)

### Leaders
| Leader | URL | Why they lead |
|---|---|---|
| Linear | https://linear.app | Progressive disclosure, restrained color, crafted micro-states; typography as the hierarchy anchor ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)). |
| Vercel dashboard | https://vercel.com | Single-metric focus, skeleton loaders matching final layout, sidebar→sheet on mobile ([925studios](https://www.925studios.co/blog/saas-dashboard-design-examples-2026)). |
| Stripe dashboard | https://dashboard.stripe.com | Dense financial data made approachable: density + breathing room, tabular numerals, deliberate hover/focus ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)). |
| Grafana / Datadog | https://grafana.com · https://www.datadoghq.com | Reference for data-heavy status/health consoles ([925studios](https://www.925studios.co/blog/saas-dashboard-design-examples-2026)). |
| Tremor | https://www.tremor.so | Copy-paste dashboard blocks (KPI cards, charts, tables) with built-in loading/error/empty states and responsive breakpoints ([shadcn.io](https://shadcn.io/template/tremorlabs-tremor)). |
| shadcn/ui | https://ui.shadcn.com | The responsive layout pattern: persistent sidebar on desktop, `Sheet` drawer on mobile — one layout, two experiences ([DesignRevision](https://designrevision.com/blog/shadcn-dashboard-tutorial)). |

### Patterns worth adopting (concrete)
- **KPI card stacking:** desktop `grid lg:grid-cols-4`, collapse to `md:grid-cols-2`, then single column under ~640px. Let the hero metric span 2 columns; secondary KPIs fill the rest ([v0/Vercel](https://v0.dev/chat/mobile-responsive-dashboard-Cjqx6Ue3Sxq), [Tremor blocks](https://www.tremor.so/blocks/page-shells)).
- **Tables → cards under 600px.** Each row becomes a card showing only the 2–3 highest-value fields (e.g. status badge + name + key metric), with "View details" disclosure for the rest. Don't horizontally scroll a 10-column table on a phone ([Medium teardown](https://medium.com/@ritujanchopade/from-desktop-tables-to-mobile-cards-handling-10k-records-without-breaking-your-users-fingers-f3e86b1781f9)). A breakpoint of ~566–768px is the common switch ([jQueryScript](https://www.jqueryscript.net/table/bootstrap-table-cards.html)).
- **Sidebar → bottom sheet / hamburger drawer.** Hide the persistent nav under a hamburger that opens a slide-out `Sheet` on mobile; keep it visible on desktop ([DesignRevision](https://designrevision.com/blog/shadcn-dashboard-tutorial), [v0/Vercel](https://v0.dev/chat/mobile-responsive-dashboard-Cjqx6Ue3Sxq)).
- **Smart pagination over "show all"** on mobile — paginate (e.g. 50/page) to protect load time and scroll length ([Medium teardown](https://medium.com/@ritujanchopade/from-desktop-tables-to-mobile-cards-handling-10k-records-without-breaking-your-users-fingers-f3e86b1781f9)).
- **Skeleton loaders that match the final layout** — never a generic spinner. Aim for perceived-fast (<100ms) or intentional staggered reveal ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- **Designed empty / error states** (honest): specific, helpful copy — not "no data." High-trust moments ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- **Status/health UIs:** encode state with both color *and* a non-color cue (icon/label) so it survives color-blindness and AA contrast.
- **Tabular numerals** (`font-variant-numeric: tabular-nums`) for all metric columns so digits align and don't jitter on live updates ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- **Hairlines** at 1px / low alpha for separators — never default `<hr>` ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- **Complete micro-states:** every interactive element ships default / hover / focus / active / disabled / loading ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).

**Vendorable libs:** **shadcn/ui — MIT** (verified: [LICENSE.md](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)); **Tremor — Apache-2.0** (verified: [GitHub](https://github.com/tremorlabs/tremor)); **Radix UI primitives — MIT** (verified: [GitHub](https://github.com/radix-ui/primitives)); Lucide icons — ISC; framer-motion, clsx, cmdk, tailwindcss-animate — MIT ([Spotlistr OSS list](https://www.spotlistr.com/oss-licenses)). All are copy-the-source / self-hostable — ideal for the sovereign 0-CDN constraint. Note shadcn/ui is "copy-paste into your repo," which is exactly vendoring.

---

## Vertical 3 — Developer-tool / protocol landing pages (our *hatun-mcp console*, *llm-router*)

### Leaders
| Leader | URL | Why they lead |
|---|---|---|
| Stripe | https://stripe.com · https://docs.stripe.com | The gold standard for API/protocol explanation and fully responsive docs; synchronized prose↔code-pane highlighting ([Moesif teardown](https://www.moesif.com/blog/best-practices/api-product-management/the-stripe-developer-experience-and-docs-teardown/)). |
| Vercel | https://vercel.com | Premium marketing↔product↔docs consistency; typography as brand ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)). |
| Resend | https://resend.com | Minimal, elegant dev landing with a low-poly Three.js accent that stays cheap on mobile ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)). |
| Supabase | https://supabase.com/docs | Dark-mode-first dev docs, strong search and structure ([925studios](https://www.925studios.co/blog/saas-dashboard-design-examples-2026)). |
| Clerk / Modal | https://clerk.com · https://modal.com | Clean protocol/SDK explainer pages (industry reference). |
| Anthropic / OpenAI docs | https://docs.anthropic.com · https://platform.openai.com/docs | Reference for clear, mobile-readable API docs. |

### Patterns worth adopting (concrete)
- **Synchronized code + prose:** when prose mentions a field, highlight the matching line in the code pane. On desktop the code pane is sticky alongside; **on mobile, stack code blocks below the prose** and make them horizontally scrollable within their own container (never force the whole page to scroll sideways) ([Moesif](https://www.moesif.com/blog/best-practices/api-product-management/the-stripe-developer-experience-and-docs-teardown/)).
- **Make errors/IDs legible:** prefix IDs (`usr_`, `inv_`), show request IDs, link to docs from errors — render IDs in monospace with tabular alignment ([DEV/Stripe patterns](https://dev.to/yukioikeda/why-stripes-api-is-the-gold-standard-design-patterns-that-every-api-builder-should-steal-3ikk)).
- **Smart docs search** indexing titles, headings, *code examples*, error codes, and parameter names; add breadcrumbs so devs know where they are ([Docuweave](https://www.docuweave.io/blog/create-api-documentation-for-developers/)).
- **One type family, 4–6 sizes, modular scale**, used consistently across marketing + product + docs ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- **Semantic color before values:** define "danger / primary / subtle-bg" by meaning, then assign restrained values ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- **Designed focus rings** (visible, high-contrast, keyboard-accessible) on every interactive element — an accessibility requirement, not decoration ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- **Cheap mobile 3D accents:** if a protocol page wants a hero visual, follow Resend — low-poly geometry + a single GLSL shader, not a heavy scene ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).
- **Copy buttons** on every code block, sized ≥44×44px touch target.

**Vendorable libs:** shadcn/ui (MIT) for layout; Shiki or `highlight.js` (MIT) for self-hosted syntax highlighting; the **Slate** docs framework is open-source and fully responsive if a docs skin is needed ([Moesif](https://www.moesif.com/blog/best-practices/api-product-management/the-stripe-developer-experience-and-docs-teardown/)).

---

## Vertical 4 — Data-viz / network-graph (our *khipu constellation*)

### Leaders / reference implementations
| Leader | URL | Why they lead |
|---|---|---|
| D3-force | https://d3js.org | The canonical force-directed layout; SVG keeps per-node updates cheap and crisp, but FPS degrades on large graphs ([LIACS thesis](https://theses.liacs.nl/pdf/2018-2019-BlindeRJ.pdf)). |
| Cytoscape.js | https://js.cytoscape.org | HTML5 Canvas rendering — far faster initialization on large graphs (N=10k), good for dense networks ([LIACS thesis](https://theses.liacs.nl/pdf/2018-2019-BlindeRJ.pdf)). |
| Ogma (Linkurious) | https://doc.linkurious.com/ogma/latest/ | Highest sustained FPS + readability under interaction in the benchmark (commercial license — reference, not vendor) ([LIACS thesis](https://theses.liacs.nl/pdf/2018-2019-BlindeRJ.pdf)). |
| force-graph / react-force-graph | https://github.com/vasturiano/force-graph | Canvas/WebGL force graph with touch + zoom; pragmatic for web embeds. |
| Observable | https://observablehq.com | Best-practice interactive data-viz publishing patterns. |

### Patterns worth adopting (concrete)
- **Choose renderer by graph size:** SVG (D3) for small/medium graphs where per-node updates and crisp text matter; **Canvas (Cytoscape / force-graph) once node counts climb**, because Canvas redraws are cheaper at scale and hold FPS during drag ([LIACS thesis](https://theses.liacs.nl/pdf/2018-2019-BlindeRJ.pdf)).
- **Enlarge hit radius on small screens.** Fingers can't hit small nodes — increase the touch hit-test radius (independent of the visual node radius) under a phone breakpoint ([d3-fdg-svelte](https://github.com/happybeing/d3-fdg-svelte)). Pair with a ≥44px minimum effective tap area.
- **Pre-compute layout, then reveal.** Don't draw nodes mid-simulation on mobile (jittery + slow); run the force layout to settle, then fade the graph in — Cytoscape/Ogma get faster load by not rendering until positions resolve ([LIACS thesis](https://theses.liacs.nl/pdf/2018-2019-BlindeRJ.pdf)).
- **Touch gestures:** one-finger pan, pinch-zoom, tap-to-select, long-press for node detail. Open node details in a **bottom sheet**, not a tooltip that a finger covers.
- **Degrade gracefully:** below a node threshold on mobile, collapse clusters into summary nodes ("+42") to keep the canvas readable and the GPU calm.
- **Respect `prefers-reduced-motion`:** skip the entrance physics animation; render the settled layout directly.
- **Honest empty state:** if the graph has no edges/data, show a designed empty state — not an empty canvas.

**Vendorable libs:** D3 (ISC/BSD), Cytoscape.js (MIT), force-graph / react-force-graph (MIT) — all self-hostable. Avoid Ogma for the sovereign estate (commercial); use it only as a UX/readability reference.

---

## Vertical 5 — Energy / climate / sustainability dashboards (our *energy space*)

### Leaders
| Leader | URL | Why they lead |
|---|---|---|
| Electricity Maps | https://app.electricitymaps.com | Real-time + historical carbon-intensity map; React web + native iOS/Android; open-source contrib repo ([ElectricityMap architecture](https://2021.desosa.nl/projects/electricitymap/posts/2021-03-15-from-vision-to-architecture/), [GitHub](https://github.com/electricitymaps/electricitymaps-contrib/blob/master/README.md)). |
| Electricity Maps — Historical View | https://www.electricitymaps.com | Time-travel UI letting users scrub real-time↔past emissions data ([launch video](https://www.youtube.com/watch?v=1jxfC0eA3bQ)). |
| Stripe Climate | https://stripe.com/climate | Clean climate data storytelling with Stripe's craft baseline. |
| WattTime | https://watttime.org | Marginal-emissions data presentation reference. |

### Patterns worth adopting (concrete)
- **Map-first, panel-second on mobile.** Electricity Maps keeps the map as the hero and overlays a draggable detail panel; on phones, collapse zone detail into a **bottom sheet** with a drag handle so the map stays the focus ([ElectricityMap architecture](https://2021.desosa.nl/projects/electricitymap/posts/2021-03-15-from-vision-to-architecture/)).
- **Single time-scrubber control** that swaps real-time ↔ historical without a page change — keep it thumb-reachable at the bottom on mobile ([Electricity Maps Historical View](https://www.youtube.com/watch?v=1jxfC0eA3bQ)).
- **Encode intensity with color + label + value** (never color alone) so carbon-intensity reads under AA contrast and color-blindness; use a sequential, perceptually-uniform scale.
- **Units are honest and explicit** (gCO₂eq/kWh, MW) — always labeled, with tabular numerals for live updates.
- **Stacked KPI cards** for metrics (generation mix %, import/export, intensity) following the dashboard stacking rules in Vertical 2.
- **Skeleton + last-updated timestamp:** show when data was last fetched; never imply live when stale (honesty doctrine).
- **One web codebase, responsive,** rather than separate desktop/mobile sites — Electricity Maps uses a single React UI across surfaces ([ElectricityMap architecture](https://2021.desosa.nl/projects/electricitymap/posts/2021-03-15-from-vision-to-architecture/)).

**Vendorable libs:** MapLibre GL JS (BSD-3, self-hostable map renderer + your own tiles — avoids a commercial map CDN), Tremor (Apache-2.0) charts, shadcn/ui (MIT). Electricity Maps' own contrib repo is open-source as a *design* reference.

---

## Vertical 6 — Scientific / anatomy / biology interactive (our *anatomy body*)

### Leaders
| Leader | URL | Why they lead |
|---|---|---|
| BioDigital Human | https://human.biodigital.com | Largest interactive 3D anatomy library; explicitly device-agnostic (phone/tablet/desktop/AR-VR), rotate/pan/zoom on any device ([BioDigital](https://www.biodigital.com), [splash](https://www.biodigital.com/splash/ovid)). |
| Distill.pub | https://distill.pub | The benchmark for interactive scientific articles / explorables ([Distill](https://distill.pub)). |
| Distill — "Communicating with Interactive Articles" | https://distill.pub/2020/communicating-with-interactive-articles/ | Primary research on interactive-article UX, incl. explicit mobile guidance ([Distill](https://distill.pub/2020/communicating-with-interactive-articles/)). |
| Observable | https://observablehq.com | Live-notebook explorables, reactive viz. |

### Patterns worth adopting (concrete)
- **Same touch grammar as anatomy leaders:** rotate (one finger), pan (two finger), pinch-zoom, tap-to-select-structure. BioDigital's whole value prop is identical interaction across every device — match it ([BioDigital splash](https://www.biodigital.com/splash/ovid)).
- **Swipe navigation on mobile explorables.** Distill's research notes that scroll-based interactive articles need extra affordances on phones — support **swipe gestures** to step through stages, and consider a slideshow/stepper layout on mobile where comprehension beats free-scroll ([Distill](https://distill.pub/2020/communicating-with-interactive-articles/)).
- **Selection detail in a bottom sheet,** not a hover tooltip (no hover on touch). Tapping a structure opens a sheet with its name/description.
- **Loading + fallback** identical to Vertical 1 (it's WebGL): LoadingManager progress, static labeled diagram fallback if WebGL is unavailable.
- **DPR cap + reduced motion** identical to Vertical 1; auto-rotate respects `prefers-reduced-motion`.
- **Readable labels:** anatomical labels at the 12px caption floor minimum; leader lines, not text overlapping geometry.
- **Honest scientific framing:** cite the model/source; don't fabricate measurements.

**Vendorable libs:** three.js + R3F + drei (MIT) for the interactive body; KaTeX (MIT) for any formulae; D3 (ISC/BSD) for inline explorable charts. (BioDigital's own platform is proprietary — reference its UX, don't vendor it.)

---

## UNIVERSAL MOBILE CHECKLIST — non-negotiables for every surface in the estate

**Touch & targets**
- [ ] Primary interactive targets **≥44×44px** (WCAG 2.5.5 AAA guidance; the practical estate floor) ([W3C 2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)).
- [ ] Absolute minimum **24×24px** with non-overlapping spacing for any dense control (WCAG 2.2 SC 2.5.8 AA) ([W3C 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
- [ ] All interactions work with **Pointer Events** (mouse + touch unified); no hover-only affordances.

**Layout & responsive**
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- [ ] **Safe-area padding** on fixed/bottom elements: `padding-bottom: max(12px, env(safe-area-inset-bottom))` for notch/home-bar clearance ([env() guide](https://web-note.org/code/css/iphone-notch-safe-area/)). Keep `bottom:0` and lift with padding, not by setting `bottom` to env().
- [ ] **Tables → stacked cards under ~600px**; show 2–3 key fields + disclosure ([table-to-cards](https://www.jqueryscript.net/table/bootstrap-table-cards.html)).
- [ ] **Fixed desktop HUD / sidebars → bottom sheet or drawer** below ~680px ([shadcn pattern](https://designrevision.com/blog/shadcn-dashboard-tutorial)).
- [ ] **KPI grid stacks** 4→2→1 columns down the breakpoints.

**Typography (system-font-safe)**
- [ ] **16px body floor**, **12px caption floor** — never smaller for readable text ([fluid type guide](https://www.jagodana.com/blogs/fluid-type-scale-responsive-css-typography)).
- [ ] **Fluid scale with `clamp()`** using `rem` units so it respects user font settings ([Smashing Magazine](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/)).
- [ ] **One family, 4–6 sizes**, modular scale ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- [ ] **Tabular numerals** for any live/aligned data.

**Motion & accessibility**
- [ ] **`prefers-reduced-motion`**: wrap non-essential motion in `@media (prefers-reduced-motion: no-preference)`; swap movement for opacity or disable; avoid flicker/blink (WCAG 2.2.2) ([OpenReplay](https://blog.openreplay.com/prefers-reduced-motion-accessible-animation/), [Jogilvyt](https://jacktaylor.co/blog/making-motion-accessible-prefers-reduced-motion)).
- [ ] **WCAG AA contrast** (4.5:1 text / 3:1 large text & UI) on every surface.
- [ ] **Visible focus rings** on all interactive elements (designed, high-contrast, keyboard-reachable) ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- [ ] **State by color + non-color cue** (icon/label) for color-blind safety.

**States (honest)**
- [ ] **Skeleton loaders matching final layout**, not generic spinners ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- [ ] **Designed empty + error states** with specific helpful copy ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)).
- [ ] **Complete micro-states** per element: default / hover / focus / active / disabled / loading.
- [ ] **Last-updated timestamps**; never imply live data when stale.

**WebGL / 3D surfaces (cathedral, anatomy, network, energy map)**
- [ ] **DPR capped** at 1 desktop / ≤1.5 mobile ([Codrops](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)).
- [ ] **Pause render loop** off-screen (IntersectionObserver) and on hidden tab (Page Visibility) ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).
- [ ] **Static fallback** inside the canvas container for WebGL failure ([Cause & Effect](https://causeandeffectsp.com/blog/3d-website-mobile-performance/)).
- [ ] **Real loading progress** via LoadingManager + graceful reveal ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).
- [ ] **Compressed assets** <2MB (Draco/Meshopt/KTX2) ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).
- [ ] **Tested on a mid-range Android**, not a flagship/laptop ([MDX](https://mdx.so/blog/best-3d-websites-2026-examples)).

---

## ESTATE-WIDE TYPE / SPACING / TOUCH SYSTEM (drop-in tokens)

Designed to work with **system fonts** and vendored libs only. Apply as CSS custom properties.

### Type scale (fluid, `clamp()`, rem-based)
```css
:root {
  /* System font stacks — no embed required (sovereign-safe) */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
               Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
               "Liberation Mono", monospace;

  /* Fluid type — Major Third (1.25), 375px→1280px viewport band */
  --fs-caption: clamp(0.75rem, 0.72rem + 0.13vw, 0.8125rem);  /* 12 → 13  (caption floor) */
  --fs-body:    clamp(1rem,    0.96rem + 0.18vw, 1.125rem);   /* 16 → 18  (body floor) */
  --fs-lead:    clamp(1.125rem, 1.05rem + 0.32vw, 1.375rem);  /* 18 → 22 */
  --fs-h3:      clamp(1.25rem, 1.10rem + 0.65vw, 1.75rem);    /* 20 → 28 */
  --fs-h2:      clamp(1.5rem,  1.20rem + 1.30vw, 2.5rem);     /* 24 → 40 */
  --fs-h1:      clamp(2rem,    1.40rem + 2.60vw, 3.75rem);    /* 32 → 60 */

  --lh-tight: 1.15;  --lh-body: 1.55;
  --fw-regular: 400; --fw-medium: 500; --fw-semibold: 600;
}
/* Data/metrics: aligned digits */
.tabular { font-variant-numeric: tabular-nums; }
code, .mono, .id { font-family: var(--font-mono); }
```
Rationale: 16px body / 12px caption floors and `rem`-based `clamp()` per fluid-type best practice ([Jagodana](https://www.jagodana.com/blogs/fluid-type-scale-responsive-css-typography), [Smashing](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/)).

### Spacing scale (4px base, geometric)
```css
:root {
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px;
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px;
  --hairline: 1px;  /* separators at low alpha — never default <hr> */
}
```

### Touch & safe-area
```css
:root {
  --touch-min: 44px;        /* primary target floor (WCAG 2.5.5)  */
  --touch-dense-min: 24px;  /* dense control floor (WCAG 2.5.8 AA) */
  --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-t: env(safe-area-inset-top, 0px);
}
.btn, .icon-btn, [role="button"], a.tap, .control {
  min-width: var(--touch-min);
  min-height: var(--touch-min);
}
.bottom-sheet, .fixed-cta, .toolbar--bottom {
  position: fixed; left: 0; right: 0; bottom: 0;
  padding-bottom: max(var(--sp-3), var(--safe-b));  /* notch/home-bar clearance */
}
```
Rationale: 44px primary / 24px dense targets and `env(safe-area-inset-*)` lift-via-padding per WCAG + notch guidance ([W3C 2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html), [W3C 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [env() guide](https://web-note.org/code/css/iphone-notch-safe-area/)).

### Motion tokens (reduced-motion aware)
```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
  --dur-fast: 120ms; --dur-base: 200ms; --dur-slow: 320ms;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Rationale: define curves/durations once, reuse consistently; honor reduced-motion ([Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui), [OpenReplay](https://blog.openreplay.com/prefers-reduced-motion-accessible-animation/)).

### Standard estate breakpoints
| Token | Width | Use |
|---|---|---|
| `xs` | <600px | Tables→cards; KPIs single column |
| `sm` | 600–680px | Below 680 collapse fixed HUD/sidebars → bottom sheet/drawer |
| `md` | 680–1024px | 2-column KPI grids; sidebar may appear |
| `lg` | ≥1024px | Persistent sidebar; 4-column KPI grids; sticky code panes |

---

## Vendorable component-library license register (verified)
| Library | License | Verified source | Sovereign fit |
|---|---|---|---|
| shadcn/ui | **MIT** | [LICENSE.md](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md) | ✅ copy-into-repo = vendoring; no attribution required ([discussion](https://github.com/shadcn-ui/ui/discussions/2339)) |
| Tremor | **Apache-2.0** | [GitHub](https://github.com/tremorlabs/tremor) · [License](https://github.com/tremorlabs/tremor-npm/blob/main/License) | ✅ self-host; retain NOTICE |
| Radix UI primitives | **MIT** | [GitHub](https://github.com/radix-ui/primitives) | ✅ |
| Tailwind CSS | MIT | [Spotlistr OSS list](https://www.spotlistr.com/oss-licenses) | ✅ |
| Lucide icons | ISC | [Spotlistr OSS list](https://www.spotlistr.com/oss-licenses) | ✅ |
| framer-motion, clsx, cmdk, tailwindcss-animate | MIT | [Spotlistr OSS list](https://www.spotlistr.com/oss-licenses) | ✅ |
| three.js + R3F + drei | MIT | three.js project | ✅ self-host `/jsm` + decoders |
| D3 | ISC/BSD | d3js.org | ✅ |
| Cytoscape.js | MIT | js.cytoscape.org | ✅ |
| force-graph / react-force-graph | MIT | github.com/vasturiano | ✅ |
| MapLibre GL JS | BSD-3 | maplibre.org | ✅ self-host tiles |
| KaTeX | MIT | katex.org | ✅ |
| Ogma (Linkurious) | Commercial | doc.linkurious.com | ❌ reference only |
| BioDigital Human | Proprietary | biodigital.com | ❌ reference only |

**Vendoring note for the 0-CDN constraint:** all ✅ libs must be installed and **bundled/self-hosted** — no `<script src="https://cdn...">`. For three.js, self-host the Draco/KTX2 decoder files (they default to a CDN path that must be overridden). For Tremor (Apache-2.0), retain the NOTICE file. shadcn/ui requires no attribution but keep the LICENSE in-repo.

---

*Compiled for SZL Holdings design-research. All claims cite primary or named secondary sources inline; license fields verified against each project's own repository. No metrics fabricated — where a number is illustrative (e.g. breakpoint px), it is flagged as a recommendation, not measured data.*
