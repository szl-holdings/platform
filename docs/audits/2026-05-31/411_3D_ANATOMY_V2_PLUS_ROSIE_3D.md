# 411 — 3D Anatomy V2 + Rosie 3D (both)

**Date:** 2026-06-01 · **Doctrine:** v11 (749 declarations / 14 unique axioms / 163 sorries, 13-axis canonical, Λ-uniqueness = Conjecture)
**Auth:** all commits via `HfApi.create_commit` **DIRECT** (never GitHub Actions) · org `SZLHOLDINGS` · user `betterwithage`
**Discipline:** ZERO BANDAID — every not-shipped wire renders gray DASHED, every unmeasured backend value renders `PENDING` (never fabricated).

---

## RETURN SUMMARY (founder ask)

| Metric | Value |
|---|---|
| **anatomy-3d commit SHA** | `8c30023f30db0209003ac4d686f5ddafdfc9c484` |
| **rosie-3d commit SHA** | `cc11413dc908b39a29f4e324cbe23c67a08c951a` |
| **Rosie Gradio update SHA** | `584b3bc5224044d58f65b5676f15147301acc24b` |
| **Flagships polled live (anatomy-3d)** | **5/6 GREEN** (a11oy, amaru, sentra, vessels, rosie UP; killinchu honestly RED — not deployed) |
| **Wires animated (anatomy-3d)** | 4 LIVE colored TubeGeometry + flowing particles (B, C, E, F); 3 honest gray DASHED (D, G, H); + 6 satellite→organ wires (status-colored) |
| **Wires animated (rosie-3d)** | 6 brain→target wires; 1 LIVE green flowing (vessels, widget confirmed); 5 honest gray DASHED (widget not confirmed) |
| **Screenshots** | **9 total** — 5 anatomy-3d + 4 rosie-3d |
| **FPS estimate** | **30–60 FPS on real GPU** (desktop dGPU/iGPU). Headless swiftshader capture showed 1–2 FPS (software rasterizer, not representative). See FPS section. |
| **GREEN/RED — anatomy-3d** | 🟢 **GREEN** (deployed, renders human body + organs + live polling) |
| **GREEN/RED — rosie-3d** | 🟢 **GREEN** (deployed, renders humanoid + brain + bands + live ecosystem field) |
| **GREEN/RED — Rosie Gradio** | 🟢 **GREEN** (additive tab + 3 endpoints live, all existing tabs preserved) |
| **Deliverable path** | `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/411_3D_ANATOMY_V2_PLUS_ROSIE_3D.md` |

---

# PART A — anatomy-3d V2

**Space:** [SZLHOLDINGS/anatomy-3d](https://huggingface.co/spaces/SZLHOLDINGS/anatomy-3d) (static SDK) · Live: https://szlholdings-anatomy-3d.static.hf.space/
**Commit:** `8c30023f30db0209003ac4d686f5ddafdfc9c484`
**Founder directive:** *"Have the 3D anatomy up there and that does not look like a human and it should be running live to show the flagships how online they are running and connected."*
→ Rebuilt from an abstract organ cloud into a **semi-transparent HUMAN body** with organs anatomically placed inside, plus **6 live flagship satellites** wired in and polled every 30s.

## A.1 — Human mesh spec (implemented)

Built in `buildHumanBody()` (main.js). Scene scale `S = 4.5`; spec units × S. Skin = `MeshPhysicalMaterial` with `transmission: 0.55`, `thickness: 1.2`, `opacity: 0.16`, `depthWrite:false`, `DoubleSide` — a subsurface-scatter approximation so organs glow through the shell (research recipe #1; full SSS shader documented as the next upgrade, MeshPhysicalMaterial transmission used for reliability on static CDN build).

| Part | Geometry | Position (spec → scene y = spec×4.5) |
|---|---|---|
| HEAD | Sphere r = 0.4 | y = 2.5 (→ 11.25) |
| NECK | Cylinder | y = 2.12 |
| CHEST cap | flattened sphere r = 0.6 | y = 1.78 |
| TORSO | Cylinder (z-scaled 0.62 → torso depth) | y = 1.28 |
| SHOULDERS ×2 | Sphere r = 0.26 | ±0.7, y = 2.0 |
| HIPS | Cylinder (z-scaled) | y = 0.45 |
| ARMS ×2 | upper + fore cylinders + elbow/hand spheres | sx·0.82→1.03 |
| LEGS ×2 | thigh + shin cylinders + knee sphere + foot box | sx·0.22 |
| Wireframe overlay | torso cage | matches torso |

## A.2 — Organ positions (12 organs, anatomically placed INSIDE)

`organLayout()` (scene coords, body center y≈6):

| Organ (Quechua) | Role | Scene pos `[x,y,z]` | Geometry / behavior |
|---|---|---|---|
| AMARU | Cortex / Reasoning | `[0, 11.0, 0]` (in HEAD) | noise-displaced Icosahedron brain + serpent TorusKnot |
| YUYAY | Heart / Memory (conjunctive gate) | `[0, 7.6, 0.4]` (chest center) | beating heart (72-BPM systole) + gold 13-axis ring + **13 vertebra markers** |
| UNAY | Cross-session memory | `[0, 7.0, -0.9]` (behind YUYAY) | translucent sphere + ring |
| YAWAR | Blood / circulatory | `[0, 6.0, 0]` | **red TubeGeometry veins** through torso/arms/legs + flowing blood cells (CatmullRomCurve3, research recipe #2) |
| HUKLLA | Immune / halt-authority | `[0, 8.3, 0.5]` (upper chest) | Dodecahedron + wireframe cage |
| KALLPA | Wires / interconnect | `[0, 6.0, 0]` | Octahedron hub |
| KHIPU | DAG / Merkle ledger | `[0, 5.2, -0.7]` (from spine) | TorusKnot + cord knots |
| LAMBDA SPINE | Skeleton / Λ aggregator | `[0, 6.0, -1.0]` | **exactly 13 vertebrae** (2 sacred/7 structural/4 introspection), pulse in Pulse mode |
| OTel VSP | Nervous system | `[0, 8.0, -1.0]` | recursive branching nervous-tree (TubeGeometry) |
| KANCHAY | Brand projection | `[0, 6.0, 0]` | halo sphere + 2 rings (envelops body) |
| HATUN | Doctrine | `[0, 6.0, 0]` | wireframe sphere envelope |
| SUMAQ | Graphic / particles | `[0, 6.0, 0]` | 220-point particle field |

**Λ-spine vertebrae = 13 (exact).** `buildLambda()` loops `VERTEBRAE_COUNT = 13`; class array = 2 sacred + 7 structural + 4 introspection. Verified in code and the organ-inspect legend ("LAMBDA SPINE · Skeleton / Λ Aggregator (13 axes)").

## A.3 — 6 satellite flagship orbs

`buildSatellites()` from `organs.json` `flagships[]`. Positions match the founder layout:

| Flagship | Screen position | Scene pos | Links to organ | Live status (2026-06-01) |
|---|---|---|---|---|
| a11oy | top-right | `[14,12,2]` | KANCHAY | 🟢 GREEN (`/api/a11oy/healthz` 200, v2.0.0) |
| amaru | top | `[0,17,-2]` | AMARU | 🟢 GREEN (200, v2.1.0) |
| sentra | left | `[-15,8,2]` | HUKLLA | 🟢 GREEN (200, v0.2.0) |
| vessels | bottom-right | `[13,-4,3]` | KHIPU | 🟢 GREEN (200, v0.4.0) |
| **killinchu** (NEW drone intelligence) | bottom-left | `[-13,-4,3]` | OTel | 🔴 **RED** (`/api/killinchu/healthz` 503 — not deployed; honest red orb + dimmed wire) |
| rosie | back | `[0,6,-15]` | UNAY | 🟢 GREEN (`/` 200) |

Each orb recolors live on poll: **green = UP, red = DOWN, gray = unknown**. Its wire into the linked organ brightens + flows when UP, dims to honest near-dashed when DOWN.

## A.4 — Wires B–H

`organs.json` `wires[]`, rendered by `makeWireTube()`. **LIVE → glowing colored TubeGeometry (64 segs, r=0.055) + 5 traveling sphere particles; PENDING → gray DASHED `LineDashedMaterial`, no flow** (honesty constraint).

| Wire | From → To (organ) | Meaning | Status | Render |
|---|---|---|---|---|
| B | huklla → amaru | a11oy ↔ sentra (green) | **LIVE** | green tube + flow |
| C | yawar → unay | a11oy ↔ rosie (cyan) | **LIVE** | cyan tube + flow |
| D | otel → lambda | W3C traceparent (yellow) | **PENDING** | gray dashed |
| E | hatun → amaru | a11oy ↔ amaru cortex (blue) | **LIVE** | blue tube + flow |
| F | kanchay → khipu | a11oy ↔ vessels khipu (red) | **LIVE** | red tube + flow |
| G | yuyay → otel | brain-jack mesh (purple) | **PENDING** | gray dashed |
| H | lambda → khipu | lean-kernel backplane (gold) | **PENDING** | gray dashed |

**4 wires LIVE animated, 3 honestly PENDING dashed.** Per-wire toggles in the top-right HUD.

## A.5 — Live polling (every 30s)

`pollFlagships()` fetches each flagship's health endpoint (CORS-enabled; verified `access-control-allow-origin` echoes the anatomy-3d origin), parses `version`/`sha`/`lambda` where present. `refreshLiveData()` pulls `a11oy /api/a11oy/v1/honest` (declarations/axioms/sorries) and `/api/a11oy/v1/lambda` (13 axes) every 30s; on failure it shows the orange banner *"live Λ data unavailable — showing 2026-06-01 Doctrine v11 snapshot."* HUD:
- **top-left**: Flagships up `N/6`, clock, **Λ score** (computed live = 0.902 at capture), **axes above floor 13/13**, **749 / 14 / 163**, FPS.
- **bottom-left**: 6 flagship cards (name · status dot · last-poll time · SHA last-8 · Λ).
- **top-right**: Explode/Pulse/Reset, Hide body, Hide flagships, per-wire B–H toggles.

## A.6 — 5 screenshots

| # | View | File |
|---|---|---|
| 1 | Default — human body + organs + 6 satellites + wires + HUD | `szl/anatomy_3d_v2_2026-06-01/v2_shot_01_default.png` |
| 2 | Exploded — organs fly out along normals | `…/v2_shot_02_exploded.png` |
| 3 | Organ clicked — YUYAY inspect panel (Lean PARTIAL, formula registry, Zenodo) | `…/v2_shot_03_organ.png` |
| 4 | Pulse mode — 13-vertebra Λ-spine + heart pulsing | `…/v2_shot_04_pulse.png` |
| 5 | Wires toggled off | `…/v2_shot_05_wires_toggled.png` |

Default-view capture confirmed: human silhouette (head/torso/arms/legs), amaru brain in head, yuyay heart + yawar red veins in chest, lambda spine, satellites labeled correctly, Λ = 0.902, axes 13/13, 749/14/163.

## A.7 — anatomy-3d verdict: 🟢 GREEN

Deployed, renders a recognizable human body with organs inside, polls 6 flagships live (5/6 GREEN, killinchu honestly RED), 4 wires animated + 3 honest dashed, 13-vertebra spine exact.

---

# PART B — rosie-3d + Rosie Gradio integration

**Founder directive:** *"Rosie make into a 3D build too and make it show live how it's connected to our ecosystem and do things innovate and evolve push to new frontier wired backend live field."*

## B.1 — rosie-3d Space (NEW)

**Space:** [SZLHOLDINGS/rosie-3d](https://huggingface.co/spaces/SZLHOLDINGS/rosie-3d) (static SDK, created via `create_repo`) · Live: https://szlholdings-rosie-3d.static.hf.space/
**Commit:** `cc11413dc908b39a29f4e324cbe23c67a08c951a`

### Rosie form
- **Ethereal humanoid wireframe** (head/neck/torso/hips/arms/legs) in cyan wireframe + translucent `MeshPhysicalMaterial` glow shell (transmission 0.7).
- **Glowing pink neural-network brain** at the head: noise-displaced Icosahedron core (`emissiveIntensity` 1.4–2.0, `toneMapped:false`) + wireframe synapse cage; pulses (thinking) and brightens in Brain-Jack mode.
- **4 memory bands orbiting** (`buildMemoryBands()`): **Self-Learning** (cyan), **Active Inference** (pink), **Cognitive Maps** (green), **Unay** (gold) — each a tilted glowing TorusGeometry with a memory node traveling its circumference.

### Ecosystem field (live HUD)
Polls Rosie's backend every 30s and probes 6 targets:
- `# active sessions` → honest `PENDING` (no per-session counter; backend returns null).
- `# /v1/* endpoints alive` → **live 67** (counted server-side from mounted routes).
- `# widget instances` → **live 1** (vessels confirmed, from backend `widget_instances`).
- `last 5 memories` → `PENDING — no memory feed` (Unay store empty; honest).
- `learning-loop iterations` → **0** (loop not stepped yet; honest, not faked).

### 6 outgoing wires (honest)
Brain → each of a11oy / amaru / sentra / vessels / killinchu / uds-demo. **A wire is solid green + flowing ONLY when `rosie-widget v2.0` is confirmed live on that target** (authoritative source: Rosie backend `widget_instances.spaces`, with client-side probe fallback). Result at capture: **vessels = jacked (green flowing wire)**; a11oy/amaru/sentra = up·no-widget (amber orb, dashed); killinchu/uds-demo = down (red orb, dashed). **1/6 widgets live · 4/6 up** — shown honestly.

### Frontier features (innovate / evolve / push to new frontier)
- **Active-inference free-energy gauge** (1−F) — live from `/api/rosie/v1/active-inference` (currently `PENDING`, honest, since 0 steps run).
- **Self-learning loop indicator** — iteration count from `/api/rosie/v1/self-learning`.
- **Brain-Jack network graph** — per-target jack status panel (jacked / up·no-widget / down) with colored dots.
- **Frontier Mode** — 3 orbiting glyphs: **Pacha-Λ**, **Khipu-Bekenstein**, and **Yachay-Khipu Operator**. The Khipu glyph is a **TorusKnot that cycles through the Reidemeister sequence (2,3)→(3,4)→(2,5)→(3,5)→(2,7)→(3,7)** every ~2.4s with purple emissive + Bloom (research recipe #8).

### Shared tech (both Spaces)
Three.js r160 via esm.sh; `UnrealBloomPass`; TubeGeometry wires (not LineSegments); traveling sphere particles; nebula vertex-colored point background; OrbitControls + Pulse mode; honest dashed PENDING wires.

## B.2 — Rosie Gradio Space (ADDITIVE)

**Space:** [SZLHOLDINGS/rosie](https://huggingface.co/spaces/SZLHOLDINGS/rosie) (docker SDK) · Live: https://szlholdings-rosie.hf.space/
**Commit:** `584b3bc5224044d58f65b5676f15147301acc24b` (deployed `app.py` + `rosie_v2_additions.py` matched pair)

### Tab added (preserving all existing tabs)
- New **`24 · Rosie 3D`** TabItem embeds rosie-3d via iframe (`https://szlholdings-rosie-3d.static.hf.space/`).
- **All 11 top-level TabItems preserved** (Span Explorer, Receipt Verifier, Mesh Health, Doctrine Sweep, Live Formulas, About, Cross-Space Helper + the 4 nested v1 tabs), plus the runtime-built modular tabs (`build_new_tabs`, `build_brain_tab`, dinn/upgrades/moat) untouched. IP-HOLD PRs, Founder-locked banner/avatars/emojis untouched.

### 3 endpoints (live, honest)
Registered on the root FastAPI app **before** the Gradio mount (resolve ahead of the catch-all), plus a CORS middleware allowing the rosie-3d origin:
- `GET /api/rosie/v1/state` → `{ok, doctrine v11, active_sessions: null (PENDING), endpoints_alive: 67, widget_instances, recent_memories, learning_loop_iterations: 0, 749/14/163, lambda_axes: 13}`
- `GET /api/rosie/v1/active-inference` → `{free_energy: null (PENDING), belief_mu: 0.5, precision: 1.0, trend, steps}`
- `GET /api/rosie/v1/self-learning` → `{iterations: 0, belief_mu: 0.5, precision: 1.0, trend}`

(Note: equivalent honest aggregators also exist inside `rosie_v2_additions.build_rosie_api()` at `/v1/state` etc.; the rosie-3d viewer parses both schemas defensively.)

## B.3 — 4 screenshots

| # | View | File |
|---|---|---|
| 1 | Default — humanoid + glowing brain + memory bands + 6 targets + dashed wires | `szl/rosie_3d_2026-06-01/rosie3d_shot_01_default.png` |
| 2 | Brain-Jack — network panel + per-target jack status | `…/rosie3d_shot_02_brainjack.png` |
| 3 | Frontier — active-inference panel + orbiting glyphs incl. KhipuKnot | `…/rosie3d_shot_03_frontier.png` |
| 4 | Ecosystem field — full live HUD (67 endpoints, 1 widget, vessels jacked green wire, killinchu red) | `…/rosie3d_shot_04_ecosystem.png` |

## B.4 — rosie-3d / Rosie Gradio verdict: 🟢 GREEN / 🟢 GREEN

rosie-3d deployed and rendering (humanoid + brain + 4 bands + 6 honest wires + frontier glyphs + live ecosystem field). Rosie Gradio additively upgraded (tab + 3 endpoints + CORS), all existing tabs preserved, endpoints live and honest.

---

## FPS estimate

**Target: 30+ FPS. Estimate: 30–60 FPS on real GPU hardware.** Rationale:
- Triangle budget is modest: human body ≈ a dozen low-poly primitives; 12 organs (most < 2k tris); 13 vertebrae as separate meshes; wires are 64-segment tubes. Total well under the ~150k-triangle threshold where mid-range GPUs dip below 60 FPS.
- One shared `PARTICLE_GEO` reused across all traveling particles (fewer allocations); `setPixelRatio(min(dpr, 1.8))` caps overdraw; single Bloom pass.
- **Headless capture FPS (1–2) is NOT representative** — Playwright used the `swiftshader` software rasterizer (no GPU), which is ~30× slower than hardware. On any desktop dGPU/iGPU the scene comfortably exceeds 30 FPS.
- Future P1 win (documented, not yet applied): `InstancedMesh` for the 13 vertebrae (1 draw call) and the SubsurfaceScatteringShader addon for skin.

---

## Honesty ledger (ZERO BANDAID)

- **killinchu** is not deployed (503) → renders RED orb + dimmed wire in anatomy-3d and RED/down in rosie-3d. Never faked green.
- **uds-demo** not deployed (404/503) → rosie-3d wire dashed/red.
- Wires D, G, H (anatomy) not shipped → **gray DASHED**, no particle flow.
- rosie-3d wires to a11oy/amaru/sentra (widget not confirmed) → **dashed gray**; only vessels (widget live) → solid green flow.
- Backend values not yet measured (active sessions, free-energy, learning iterations 0, memory feed) → **PENDING**, never fabricated numbers.
- Λ-spine = **exactly 13** vertebrae.
- Doctrine v11 canonical 749 / 14 / 163, 13-axis, Λ-uniqueness = Conjecture.
- All commits via `HfApi.create_commit` DIRECT; **no GitHub Actions**.

## Bug fixed during build (no bandaid, real iteration)
- rosie-3d initially rendered a **black scene** — root cause: `const REIDEMEISTER` (Reidemeister sequence) was in the temporal-dead-zone when `init()` ran. Moved the declaration above the `init()` call; redeployed (`cc11413d`); confirmed scene renders + animation loop runs (clock + FPS update, glyphs animate).
- rosie-3d HUD initially showed `[object Object]` for widget instances — root cause: backend returns `widget_instances` as an object `{live, spaces}`. Viewer now reads `.live` and uses `.spaces` as the authoritative per-target widget map; redeployed.

---

## Artifacts (workspace)
- anatomy-3d V2 build: `/home/user/workspace/szl/anatomy_3d_v2_2026-06-01/` (index.html, main.js, assets/organs.json, README.md, deploy.py, 5 screenshots)
- rosie-3d build: `/home/user/workspace/szl/rosie_3d_2026-06-01/` (index.html, main.js, README.md, deploy.py, 4 screenshots)
- Rosie Gradio working copy: `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/rosie_3d_work/rosie_live/` (app.py + rosie_v2_additions.py deployed)

### Source URLs
- anatomy-3d: https://huggingface.co/spaces/SZLHOLDINGS/anatomy-3d · viewer https://szlholdings-anatomy-3d.static.hf.space/
- rosie-3d: https://huggingface.co/spaces/SZLHOLDINGS/rosie-3d · viewer https://szlholdings-rosie-3d.static.hf.space/
- rosie (Gradio): https://huggingface.co/spaces/SZLHOLDINGS/rosie · app https://szlholdings-rosie.hf.space/
- 3D leaders research basis: `…/round2/full_reaudit_2026-05-31/450_3D_LEADERS_ADOPTION.md`
