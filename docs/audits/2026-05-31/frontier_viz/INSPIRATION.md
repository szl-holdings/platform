# INSPIRATION — Three Frontier 3D Visualizations

**Author:** Yachay (CTO) — 2026-06-01
**Stack target:** React Three Fiber (R3F) + Three.js **r171** + **WebGPURenderer** (baseline) with **WebGL2 fallback**, Kanchay design tokens.
**Hard rule:** No mysticism. Pillars / windows / tiles / stars are **architectural and data-cartographic** metaphors, not religious. Locked Doctrine v11 numbers (749 / 14 / 163) shown verbatim.

---

## Why these three, and what "frontier-grade" means here

Frontier 3D in 2026 is not "spinning cube on a gradient." It is:

1. **WebGPU-first rendering** with a graceful WebGL2 fallback so the scene runs everywhere but uses compute/instancing where available. Three.js r171 ships a stable `WebGPURenderer` and TSL (three shading language) node materials. (`three` r171 — https://github.com/mrdoob/three.js/releases)
2. **GPU instancing** for thousands of primitives (stars, tiles) in one draw call (`THREE.InstancedMesh`).
3. **Real data binding** — geometry is a deterministic function of real records (receipt hashes, sorry line numbers, router tier stats), not random noise. Re-runs are reproducible.
4. **Postprocessing** — selective bloom for "active/glowing" elements (unreal-bloom style) so signal pops against a dark Kanchay surface.
5. **Honest live/demo state** — poll the real endpoint; if unreachable, switch to a clearly-labelled DEMO MODE with deterministic synthetic data and keep retrying so it self-heals to LIVE.

## Reference touchstones (technique, not theme)

- **Instanced star/point fields & deterministic hash layout** — galaxy/particle generators in the R3F ecosystem (Three.js journey "galaxy generator" pattern; `InstancedMesh` + per-instance color). Used for VIZ 1 Khipu stars.
- **First-person architectural walkthroughs** — `PointerLockControls` (WASD + mouse), used by countless Three.js FPS demos, for VIZ 2 Cathedral. Stone pillars, floor-tile grids, and stained-glass light shafts are a **museum/cathedral-architecture** vocabulary (vaulted halls, clerestory windows) chosen because Doctrine is literally a *structure of declarations* — load-bearing axioms (pillars), a floor of declarations (tiles), gaps where proofs are unfinished (dim spots), and named viewing-axes (windows). Pure architecture.
- **Force-directed / radial ring graphs** — concentric-ring node graphs (organs → tiers → models) with animated edges whose width encodes throughput, lit paths on activity. Inspired by network-topology and service-mesh visualizers. For VIZ 3 Router.
- **Selective bloom** — `EffectComposer` + `UnrealBloomPass` / `SelectiveBloom`, gating glow to "active" objects (a served route, a high-Yuyay receipt, an active model).
- **Color from data** — Kanchay palette: `yuyay` teal = healthy/active/GREEN, `hatun` gold = sacred/elevated, `yawar` red = RED-license / tripwire / violation, neutral grays for dormant. Dark surface `#0a0f1e`.

## Per-viz design intent

### VIZ 1 — Khipu Constellation
A 3D star field where **every Khipu receipt across the six flagships is one star**. Position is `hash(receiptId) → (x,y,z)` on a sphere shell (stable, reproducible). Color = flagship. Brightness = Yuyay score. **Arcs** connect chained receipts (`prev → cur`) like the cords of a real khipu (the Inca knotted-cord recording device — a *data structure*, used here as the literal namesake of the receipt DAG, not a ritual object). Polls the six real `/v1/ledger` endpoints every 5 s. Filters: flagship toggle, time window, Yuyay-score floor.

### VIZ 2 — Doctrine Cathedral
A first-person walkthrough of **Doctrine v11** rendered as a building:
- **749 declarations → 749 floor tiles** (instanced grid).
- **14 axioms → 14 stone pillars** (clickable → Lean type signature).
- **163 sorries → 163 dim spots** (clickable → GitHub line link to `lutar-lean`).
- **13 axes → 13 stained-glass clerestory windows**, each titled with its axis name.
- **Master formula** floats above the altar as a glowing inscription.
WASD + mouse (PointerLockControls). The metaphor is a *gothic hall as dependency graph*: pillars bear load (axioms ground everything), the floor enumerates the corpus, dim spots mark unfinished proofs, windows are the named viewing-axes of the Yuyay gate.

### VIZ 3 — LLM-Router Live
A radial node graph: **organs at the center**, **7 router tiers (T0–T6) as concentric rings**, **30+ open LLMs on the outer ring**, colored by license class (GREEN/AMBER/RED). When the router serves a query, the **organ → tier → model path lights up**; active models **glow** (selective bloom); **edge thickness = throughput**. Polls `a11oy /v1/router/stats` every 1 s. Click a model → license / context / MMLU card. **"Sovereign mode"** toggle greys out every non-GREEN model (mirrors `governanceTier=sovereign` GREEN-only floor from the router contract).

## Sources (real, in-repo and live)

- Router contract & 7-tier registry: `puriq/integration/a11oy_patch/v1_router_contract.md`, `puriq/llms/A11OY_CODE_ROUTER_SPEC.md`, `puriq/llms/OPEN_LLM_LANDSCAPE_2026.md`.
- Khipu ledger endpoints: `puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md` and live `https://szlholdings-<flagship>.hf.space/api/<flagship>/v1/ledger`.
- Doctrine locked numbers (749/14/163, 13-axis yuyay_v3): `PURIQ_CHARTER.md`, `puriq/doctrine/PURIQ_DOCTRINE_v12.md`.
- Real sorries (line-level): `SZLHOLDINGS/doctrine-cathedral/real_sorries.json` → GitHub `github.com/szl-holdings/lutar-lean`.
- Kanchay tokens: `kanchay/tokens/COLOR_TOKENS.json`.

— Yachay
