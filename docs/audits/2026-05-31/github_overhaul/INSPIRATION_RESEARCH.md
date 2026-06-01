# INSPIRATION_RESEARCH — Genius-Tier GitHub Surfaces (2026)

Web research first. Every technique below is cited, then mapped to what is *actually renderable* on GitHub vs. what needs a GitHub Pages link. Signed by the Perplexity Computer Agent on behalf of SZL Holdings.

---

## A. Hard platform constraints (decides what "3D in README" can actually mean)

GitHub README markdown is sanitized: **`<script>` and `<style>` tags are stripped, and `<iframe>` does NOT render.** So a literal Three.js scene cannot run inside a README. The genius move is the layered pattern below — every top README must use it:

1. **Static/animated visual lives in the README** (animated SVG with SMIL or CSS-in-`<style>`-inside-the-SVG-file, or GIF/WebP). Animated SVG with embedded `<style>`/`<animate>` *does* play in GitHub READMEs because the SVG is served as an image, not inlined HTML. ([Anthony Lukach — animated terminal SVGs in GitHub READMEs](https://alukach.com/posts/animated-terminal-output/))
2. **The live 3D scene lives on GitHub Pages** (`gh-pages` branch), reachable by clicking the README image. ([Stack Overflow — deploy Three.js to GitHub Pages via `gh-pages -d dist`](https://stackoverflow.com/questions/73016488/how-do-i-deploy-a-three-js-project-to-github-pages); [r/threejs — GitHub Pages is fully compatible with Three.js](https://www.reddit.com/r/threejs/comments/1erfsh1/gh_pages_for_deployment_of_react_and_threejs_is/))
3. **Math renders natively**: GitHub markdown supports LaTeX via `$...$` and `$$...$$` (MathJax) since May 2022, so KaTeX-style formulas work directly without image hacks. ([GitHub Docs / r/math — native LaTeX in Markdown](https://www.reddit.com/r/math/comments/utc1jg/as_of_today_latexstyled_maths_natively_supported/))
4. **Mermaid renders natively** (flowchart, sequenceDiagram, classDiagram, gitGraph) inside fenced ` ```mermaid ` blocks, plus geoJSON, topoJSON, and **ASCII STL for interactive 3D models** directly in markdown. ([GitHub Docs — Creating diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams); [GitHub Blog — Mermaid in Markdown](https://github.blog/developer-skills/github/include-diagrams-markdown-files-mermaid/))

> Net doctrine: **Less text. Lead with an animated SVG architecture diagram + a native Mermaid diagram + a `$$LaTeX$$` formula, then a "▶ Open live 3D" image-link to the Pages scene.** This is the only honest way to deliver "3D in the README."

---

## B. Best-in-class profile & repo READMEs

- **mrdoob/three.js** — minimal, lets a single code block + live examples link carry it; the canonical "the work is the demo" README. ([three.js README](https://github.com/mrdoob/three.js/blob/dev/README.md))
- **supabase/supabase** — hero image, feature grid with icons, architecture Mermaid diagram, badges row; dense visual, light prose. ([supabase README](https://github.com/supabase/supabase/blob/master/README.md))
- **vercel/next.js examples** — terse, task-focused, copy-paste command blocks. ([next.js with-supabase example](https://github.com/vercel/next.js/blob/canary/examples/with-supabase/README.md))
- **abhisheknaiidu/awesome-github-profile-readme** — the canonical gallery of genius-tier profile READMEs to mine for patterns. ([awesome-github-profile-readme](https://github.com/abhisheknaiidu/awesome-github-profile-readme))
- **mermaid-js/mermaid** — diagram-led README, proof that diagrams > paragraphs. ([mermaid](https://github.com/mermaid-js/mermaid))

---

## C. Animated SVG toolkits (drop-in, render in README)

- **readme-SVG toolkit** — dynamic SVG components: typing effects, embedded video preview cards, custom visual components served as SVG you drop into markdown. ([readme-SVG](https://github.com/readme-SVG))
- **Typing-SVG** (profile-readme topic) — dynamically generated typing/deleting text SVG for headers. ([GitHub Topics: profile-readme](https://github.com/topics/profile-readme))
- **nypl-spacetime/interactive-architecture** — clickable SVG architecture diagrams where each component links to its repo (D3-backed). Pattern for our "animated SVG architecture diagram with hot regions." ([interactive-architecture](https://github.com/nypl-spacetime/interactive-architecture))
- Authoring path: **Excalidraw → export SVG → hand-add `<style>` + `<animate>`/CSS keyframes** for flowing edges and pulsing nodes. Self-contained SVG plays in README.

---

## D. Terminal recordings as SVG (asciinema family)

- **MrMarble/termsvg** — record/replay/export terminal sessions to animated SVG; uses asciinema cast format so `.cast` files convert to SVG. `termsvg rec`, `termsvg export -i file.cast -o out.svg`. ([termsvg](https://github.com/MrMarble/termsvg))
- **svg-term-cli / termtosvg** — alternative asciicast→animated-SVG converters; the documented way to embed a playing terminal in a README. ([r/commandline — termtosvg](https://www.reddit.com/r/commandline/comments/13bhdg1/termtosvg_record_terminal_sessions_as_svg/))
- **asciinema** native `.cast` JSON format → render to SVG for README, full player on Pages. ([Anthony Lukach](https://alukach.com/posts/animated-terminal-output/))

> Plan: record Lean/Lake build, a11oy answering, killinchu detecting as `.cast`, export to self-contained animated SVG, embed at top of each repo README.

---

## E. Stats cards & 3D contribution graphs (auto-generated)

- **anuraghazra/github-readme-stats** — dynamic SVG stat cards generated from live account stats via `https://github-readme-stats.vercel.app/api?username=...`; SVG generation via `Card.js` is the model for our **custom metric cards** (theorems, receipts, DOIs, tests). ([github-readme-stats](https://github.com/anuraghazra/github-readme-stats); [how cards work #1934](https://github.com/anuraghazra/github-readme-stats/discussions/1934))
- **yoshi389111/github-profile-3d-contrib** — GitHub Action that renders a **3D contribution calendar SVG** and commits it daily/on-demand. Drop-in for the personal profile. ([github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib); [Marketplace action](https://github.com/marketplace/actions/github-profile-3d-contrib))
- **shields.io endpoint badges** + **Schneegans/dynamic-badges-action** — host a JSON file (committed by an Action to a branch) and render live custom badges (theorem count, sorry count, DOI count) with dynamic color. ([Shields.io](https://shields.io); [Dynamic Badges action](https://github.com/marketplace/actions/dynamic-badges))

> Plan: we **self-host** our own static stat-card SVGs (committed by a GitHub Action that reads repo metrics) rather than depend on a third-party Vercel endpoint — keeps doctrine numbers verbatim and offline-safe.

---

## F. Live 3D / math-visual demos worth emulating on Pages

- **Three.js** examples gallery — the gold standard for a "click → live 3D" experience hosted statically. ([three.js](https://github.com/mrdoob/three.js/blob/dev/README.md))
- **John Tromp's Lambda Calculus & Combinatory Logic Playground** + **Lambster** — interactive in-browser lambda/term visualizers; pattern for a **live theorem/term graph** demo. ([tromp.github.io/cl](https://tromp.github.io/cl/cl.html); [lambster.dev](https://lambster.dev))
- **d3-force / d3 force-directed graph** — physics graph for the **Lean theorem dependency graph** (749 declarations as nodes, imports as edges) and the **LLM-router node graph**. ([d3-force](https://d3js.org/d3-force); [Observable force-directed graph](https://observablehq.com/@d3/force-directed-graph-component))

---

## G. Coordination note — shared infrastructure

The **szl-constellation** Three.js scene is shared with the `hf_org_overhaul` agent (Hugging Face org card). Existing constellation implementations found in the workspace:
- `szl/repos/{sentra,vessels}/web/src/pages/constellation.tsx`
- `a11oy_seriesA/infra_work/vessels/stubs/szl-holdings__shared-ui/constellation-graph.js`

Our GitHub Pages 3D scenes must be **visually + palette compatible** with that constellation (same node/edge style, same dark field, open-source fonts only). The personal-profile "live SZL constellation" link and the org-card link point at the **same** Pages-hosted scene family.

---

## H. Design tokens locked for all surfaces

- **Fonts (open-source only):** Inter (UI/headings), IBM Plex (body/serif accents), JetBrains Mono (code/terminal/metrics). No proprietary fonts.
- **Palette:** dark field (near-black) + a cool accent for edges/nodes, matching the HF constellation. High-contrast for light/dark GitHub themes — prefer `currentColor`-safe or dual-tone SVG.
- **Copy rule:** No mysticism. Math + story only. Sign as **Yachay**. Git trailer: **Perplexity Computer Agent**.
- **Length rule:** every README < 500 lines; details pushed to the docs site (coordinate with `szl_unified_documentation_site`).
