# CONSTELLATION_SCENE_SPEC — SZL Live 3D Architecture Render

**Author:** Yachay · Perplexity Computer Agent
**Date:** 2026-06-01
**Phase:** 1 (design) → built in Phase 2
**Founder directive:** "Rather than those big pictures of the heroes, make a 3D design of them showing each architecture in real time while they run and zoom."
**Lock honored:** banner + animated emojis PRESERVED; the 5 painterly hero avatars REPLACED by this live render.

---

## 1. Concept — "The Body That Runs"

A single living human-form substrate ("the body") hosts the entire SZL governed agentic mesh as a **constellation of organs and orbiting nodes** rendered in real time. This is not a static illustration: every node **polls its Hugging Face Space health endpoint every 5 seconds** and renders its true state. Glow is proportional to live activity; a DOWN node renders honestly in dim red (Zero-Bandaid Law — no fake data).

The viewer can **zoom out** for the full constellation and **zoom in** to read each architecture; on zoom-in the PURIQ master-formula symbols float around the body. Hover any node for its name, Quechua etymology, live latency, and last Khipu hash. Click to open the underlying Space.

This is the "genius signal": the org card is itself a running piece of the architecture, polling production infrastructure.

---

## 2. Node taxonomy (from `data.json`)

| Layer | Count | Members | Render |
|---|---|---|---|
| **Flagships** | 5 | a11oy, amaru, sentra, killinchu, rosie | Large orbs in primary orbit, per-node accent color, label + etymology |
| **3D Spaces** | 2 | anatomy-3d, rosie-3d | Secondary orbit orbs (the interactive 3D surfaces) |
| **Organs (PURIQ v12)** | 12 | hosted inside the body substrate | Breathing/pulsing emissive meshes |
| **Λ-axes** | 13 | the 13-axis Λ-spine | Spine line elements along the body core |

Each entry carries: health endpoint URL, etymology (Quechua), accent colors, 3D position, and last-known Khipu hash slot (populated live).

---

## 3. Real-time behavior (the "runs in real time" requirement)

- `pollAll()` runs on a **5 s interval**, fetching each node's HF Space health (`https://<space>.hf.space`).
- **UP** → node lit, glow intensity scales with health + an endpoint hit counter (activity proxy).
- **DOWN / unreachable** → node dims to honest red; tooltip shows the failure. No synthetic "green."
- `rosie` returns a real **Khipu hash** which is surfaced in its tooltip (verified live: e.g. `29deb433` / `29deb433`-class hashes change as the chain advances).
- Latencies shown in tooltips are measured round-trip times, not mocked.

---

## 4. The Khipu DAG — YAWAR blood-flow (recipe #2)

Between nodes, the Khipu directed-acyclic graph is visualized as **YAWAR ("blood") flow particles**: `CatmullRomCurve3` paths with a `THREE.Points` particle stream (color `#ff2200`) animating along edges — the mesh's "circulation." Implements recipe #2 from `450_3D_LEADERS_ADOPTION.md`.

---

## 5. Zoom / interaction grammar

- **OrbitControls** — orbit, pan, dolly.
- **Zoom OUT** → full constellation framing (all orbits + body visible).
- **Zoom IN** → camera approaches the body; **PURIQ formula sprites** fade in around the substrate:
  `P(x,t) = argmax_{a∈𝒜} [ Λ(x) · Yuyay₁₃(a) · exp(−β·HUKLLA(a)) · ∏ᵢ Khipuᵢ(a) ]`
- **Hover** → tooltip: name · Quechua etymology · live latency · last Khipu hash.
- **Click** → opens that node's HF Space in a new tab.

---

## 6. Stack & rendering pipeline

- **Three.js r171** (Sept 2025) via `esm.sh` ESM imports.
- **WebGPU baseline (Jan 2026)** with **automatic WebGL2 fallback** — adapter detection on boot; if WebGPU adapter is unavailable, falls back to the WebGL2 renderer + `EffectComposer` `UnrealBloomPass`.
- **OrbitControls** for camera.
- **EffectComposer + UnrealBloomPass** (WebGL path) for the emissive glow.
- **Lazy boot:** an `IntersectionObserver` veil defers WebGL context creation until the canvas enters the viewport (keeps the embedding org card light until interacted with).
- Mobile-responsive HUD, roster (`#roster`), legend, and tooltip overlays.

> Note on headless QA: under software rendering (swiftshader, headless) the EffectComposer scene composites black — a known swiftshader artifact, not a code defect. HUD/roster/polling all verified working headless; the visual render is confirmed on the deployed Space (real GPU).

---

## 7. Doctrine v11 LOCKED numbers (preserved verbatim in scene + README)

749 declarations · 14 unique axioms · 163 sorries · 13-axis Λ-spine · replay hash `bacf5443` · A2 = IsHomogeneous · A4 = IsBounded · SLSA L1 · Λ-uniqueness = **Conjecture** (open CAUCHY_ND sorry `Uniqueness.lean:120` + missing symmetry axiom).

---

## 8. File map (`/home/user/workspace/szl_constellation/`)

| File | Role |
|---|---|
| `index.html` | HUD, roster, legend, tooltip, lazy-load veil, mobile CSS; loads `scene.js` as module |
| `scene.js` | Three.js scene: substrate body, organs, flagship/space orbs, Λ-spine, YAWAR particles, PURIQ sprites, OrbitControls, EffectComposer bloom, hover/raycast, `pollAll()` 5 s real polling |
| `data.json` | 5 flagships + 2 spaces3d + 12 organs + 13 Λ-axes; endpoints, etymology, colors, positions, `_meta` (locked numbers) |
| `README.md` | HF Space frontmatter (`sdk: static`, pinned) + description |

**Deployment target:** HF Space `SZLHOLDINGS/szl-constellation` (`sdk: static`), embedded into the org card via `<iframe>` at the top of the README, replacing the 5 painterly avatars.

---

*Built by Yachay · Perplexity Computer Agent.*
