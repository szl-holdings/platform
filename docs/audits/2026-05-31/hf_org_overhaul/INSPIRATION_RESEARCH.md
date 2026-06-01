# INSPIRATION_RESEARCH — Frontier Org-Card 3D Overhaul

**Author:** Yachay · 2026-06-01 · Perplexity Computer Agent
**Goal:** Make the SZL Holdings HF org card "look like a genius runs it" — a frontier-grade, real-time 3D experience replacing the 5 painterly hero avatars.

---

## 1. How HF org cards actually render (the technical constraint)

Per the official Hugging Face docs, an organization card "take[s] the form of a `README.md` static file, inside a Space repo named `README`" ([HF — Using Spaces for Organization Cards](https://huggingface.co/docs/hub/spaces-organization-cards)). The org page at `huggingface.co/SZLHOLDINGS` renders **`SZLHOLDINGS/README/README.md`** as GitHub-Flavored Markdown with embedded raw HTML. The static Space page at `huggingface.co/spaces/SZLHOLDINGS/README` separately serves `index.html`.

**Embedding a Space:** HF officially documents the IFrame embed pattern — `<iframe src="https://<space-subdomain>.hf.space" frameborder="0" width=... height=...>` ([HF — Embed your Space in another website](https://huggingface.co/docs/hub/spaces-embed)). The constellation Space will be reachable at `https://szlholdings-szl-constellation.hf.space`.

**Decision:** We update BOTH surfaces — the org-card `README.md` (the genius-signal front door) gets the live `<iframe>` at the top in place of the 5 painterly avatar `<img>` links; the static Space `index.html` swaps its painterly hero portrait row for the same iframe. Banner + animated emojis (the Mission Room WebP band + the fixed ambient-emoji layer) are preserved verbatim per the founder lock.

---

## 2. Best HF org cards in 2026 — leaders & patterns

The most-followed HF organizations (per community roundups) are NVIDIA, OpenAI, Mistral AI, Meta (facebook), Stability AI, BigCode, allenai (Ai2), Qwen, DeepSeek, and Microsoft ([HF community — best orgs to follow, clem](https://huggingface.co/posts/clem/219492053181381); [LinkedIn — AI Powerhouses roundup](https://www.linkedin.com/posts/ashishpatel2604_best-organizations-to-follow-on-hugging-face-activity-7298586001965215745-9O53)). Industry framing in 2026 places NVIDIA as the hardware/dev-infra leader, OpenAI/Anthropic on proprietary frontier models, Mistral as the European open-weight leader, and Hugging Face as the open-source distribution layer ([Northflank — Top AI companies in 2026](https://northflank.com/blog/top-ai-companies)).

**Patterns the leaders use on their org cards (synthesized):**
- A wide hero **banner** at the very top (brand identity in one glance) — SZL already has this; we preserve it.
- A tight **flagship grid** — the org's most important Spaces surfaced first, everything else demoted. SZL's reorder enforces exactly this (7-canonical front, rest into Collections).
- **Live signal** — leaders increasingly surface activity (trending models, live demos via embedded Gradio Spaces). SZL goes further: a *real-time-polled* 3D constellation.
- **Restraint** — clear visual hierarchy, scannable, mobile-friendly (the same best-practices that govern GitHub org READMEs below).

## 3. Best GitHub org cards in 2026 — leaders & patterns

The community reference is `fabrecostudio/awesome-github-organization-profile-readme`, which catalogs GitHub (the platform itself), OpenTelemetry/CNCF, Ant Design, Microsoft, Node.js, Laravel, and Webstudio as exemplars across Minimalist / Styled / Objective / Detailed tiers ([awesome-github-organization-profile-readme](https://github.com/fabrecostudio/awesome-github-organization-profile-readme)). Best-practice rules that transfer 1:1 to the HF org card:
- **Lead with clarity** — purpose in the first 1–2 sentences.
- **Visual hierarchy** — headers + sparse emoji; scannable.
- **Showcase active projects; make the important ones obvious** — directly motivates the Collections demotion.
- **Keep it current**, **optimize for mobile**, **state the stack**.

For implementation polish, the 2026 reference set is the `awesome-design-md` collection capturing Stripe / Vercel / Notion / Linear / Apple design systems as plain-markdown specs ([VoltAgent awesome-design-md, via LinkedIn](https://www.linkedin.com/posts/plabanjr_31-design-systems-stripe-vercel-notion-activity-7450785146158415873-QkqF)). The SZL constellation borrows the Linear/Vercel restraint: deep background, one accent family, generous negative space, motion that is purposeful not decorative.

## 4. Interactive-3D-in-readme innovation precedents

- **React Three Fiber** (`pmndrs/react-three-fiber`) is the canonical React renderer for Three.js and the declarative substrate the anatomy-3d V2 stack already targets ([pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber)). Responsive 3D in R3F is handled by reading the `viewport` inside the canvas tree ([R3F discussion #647 — responsive 3D](https://github.com/pmndrs/react-three-fiber/discussions/647)). Drei supplies the helper layer (controls, bloom, html overlays) ([basedhound/3d-animations_threejs](https://github.com/basedhound/3d-animations_three-fiber/)).
- **asciinema** is the precedent for "architecture diagram alive in a readme" — terminal/architecture casts embedded as replayable `.cast` recordings rather than static GIFs ([asciinema.github.io README](https://github.com/asciinema/asciinema.github.io/blob/main/README.md); [asciinema org repos](https://github.com/orgs/asciinema/repositories)). Our constellation generalizes this idea to a live, polled 3D scene instead of a recorded cast — strictly more alive.

## 5. WebGPU baseline (Jan-2026) + WebGL2 fallback — confirmed viable

WebGPU reached **full cross-browser support in January 2026**: Firefox 147 shipped it Jan 13, Safari enabled it by default in iOS 26 / macOS Tahoe 26, joining Chrome and Edge ([byteiota — WebGPU 2026](https://byteiota.com/webgpu-2026-70-browser-support-15x-performance-gains/)). Three.js made WebGPU production-ready from **r171 (September 2025)** with `WebGPURenderer` importable with zero config and **automatic WebGL 2 fallback** for older browsers ([Utsubo — What's New in Three.js 2026](https://www.utsubo.com/blog/threejs-2026-what-changed); [Utsubo — WebGPU Three.js migration guide](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)). This validates the task's "WebGPU Baseline Jan-2026 with WebGL2 fallback" requirement: we target r171's renderer with graceful fallback so the scene runs on every visitor's browser.

## 6. Design verdict for SZL Constellation

Synthesizing all of the above, the constellation must be:
1. **Banner-respecting** — sits below/at the hero, never competing with the painterly banner the founder locked.
2. **Flagship-first** — the 5 flagships (a11oy, amaru, sentra, killinchu, rosie) + 2 3D Spaces (anatomy-3d, rosie-3d) are the bright primary nodes; the 12 organs are the living substrate around them.
3. **Genuinely live** — every node polls its Space `/api/health` (+ hit counter) every 5 s; glow intensity ∝ activity. No fake data — DOWN renders honestly (red/dim) per the Zero-Bandaid Law.
4. **Frontier stack** — Three.js r171 + R3F-equivalent scene graph + Drei-style controls + EffectComposer UnrealBloom (matches anatomy-3d V2), WebGPU-capable with WebGL2 fallback.
5. **Instant-loading** — lazy iframe that activates only on viewport entry; mobile responsive.
6. **Explorable** — click a node → opens its Space; hover → tooltip (name + Quechua etymology + live latency + last Khipu hash); zoom in → PURIQ formula symbols float; zoom out → full constellation.
