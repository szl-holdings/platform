# INSPIRATION — Live 3D Wires Across Cortex Mesh

**Date:** 2026-06-01 ~02:40 EDT · **Author:** Yachay · Agent: Perplexity Computer Agent
**Founder directive (2026-06-01 ~02:25 EDT):** *"Show how they can be connected — 3D — show the wires that are baked into their cortex. Use our math, make it real and operational, no bandaids, full Series A."*

Phase 0 research (15-min cap). Goal: pick a proven, court-defensible, performant pattern for animating live wire-pulse events in 3D inside each flagship's cortex. NO mystical words, math only, honest ceilings.

---

## 1. Reference patterns surveyed

| Source | Pattern | What we take |
|---|---|---|
| **three.js `CatmullRomCurve3` + `getPointAt(t)`** ([The Front Dev — particle along a curve](https://www.thefrontdev.co.uk/creating-amazing-particle-effect-along-a-curve-in-react-three-fiber/)) | Define control points → `CatmullRomCurve3` → in `useFrame`, advance a per-particle progress `t∈[0,1]`, sample `curve.getPointAt(t)`, write into a `Float32Array` position buffer; reset `t→0` at 1.0. | **This is our recipe #2 (YAWAR blood-flow), already proven live in anatomy-3d.** Each wire = one CatmullRomCurve3; each 3DWPP event spawns a pulse particle that rides the curve. CPU-side update is fine for ≤ few-hundred particles. |
| **Maxime Heckel — Particles w/ R3F + shaders** ([blog.maximeheckel.com](https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/)) | `<points>` + `bufferGeometry` + `shaderMaterial`; `useMemo` the buffers; animate via uniforms in `useFrame`. additiveBlending + alphaMap circle texture → glow. depthWrite:false to avoid occlusion squares. | Glow look for pulses (additive blending, soft circle sprite), `useMemo` buffers, color-as-attribute so Yuyay-score colour rides per-particle. |
| **R3F `useFrame` + ref pattern** ([YouTube — Animating Particles in R3F](https://www.youtube.com/watch?v=j5OyA3ijhUQ)) | `useRef` on mesh, mutate in `useFrame(({clock},delta)*velocity)` — delta-scaled for frame-rate independence. onClick handler reads ref → opens detail. | Delta-scaled motion (latency→speed mapping is frame-rate-independent); `onClick` on a pulse → open BoE modal. |
| **Datadog APM Flame Graph / Honeycomb 3D traces / OpenTelemetry trace viewers** | Span = bar/edge; colour = service/error; width = duration; click span → full attributes + linked logs; live tail. | **Click pulse → modal with full receipt + Yuyay axes + HUKLLA log** mirrors "click span → attributes + logs". Edge thickness = throughput (rolling EMA) mirrors APM "width = duration/volume". Live-tail = our SSE/WS stream. |
| **Cesium time-dynamic / event-based real-time flow viz** ([ETH research-collection](https://www.research-collection.ethz.ch/server/api/core/bitstreams/26062ad8-7820-4d85-b21c-0ba1400b0b6e/content), [arXiv 2312.14973](https://arxiv.org/html/2312.14973v1)) | Lagrangian particle tracks with real-time visual feedback; time-dynamic property bag drives colour/position. | Time-dynamic property model: each pulse carries `{timestamp, yuyay_score, lambda_value, latency}` → drives colour/speed at render time. Real-time feedback loop = our 100 receipts/sec target. |

## 2. Court-admissibility research (BoE drill-down)

Australian/UK evidence law (relevant because SZL targets ATO submission) frames electronic-record admissibility around three pillars ([Federal Court of Australia — Admissibility of common forms of evidence](https://www.fedcourt.gov.au/__data/assets/pdf_file/0005/117464/Paper-on-admissibility-of-common-forms-of-evidence.pdf), [QLRC — Receipt of Evidence by Qld Courts](https://www.qlrc.qld.gov.au/__data/assets/pdf_file/0003/372945/wp52.pdf)):

1. **Relevance** — evidence must bear on a fact in issue. → our BoE pins the exact decision (`action_id`, gate, Λ at gate, master-formula evaluation with factors numerically substituted).
2. **Provenance** — where the record comes from. → Khipu Merkle **proof of inclusion** (chain to `khipu_root`) + source flagship + `traceparent` (Wire D).
3. **Authenticity** — the record is what it purports to be. → COSE_Sign1 / DSSE signature **(honestly labelled PLACEHOLDER until Sigstore CI wired — per 500_ ceiling #3)**; the "business records" exception ([Evidence Act 1995 (Cth) s 69], cited by Murphy J for screenshots) is the doctrinal home for auto-generated receipts.

Court screenshots themselves are admissible as business records ([FCA paper, Murphy J]), which is exactly what our per-pulse modal + "Export BoE PDF" produces: a self-describing, signed (or honestly-PLACEHOLDER) bundle with provenance chain.

## 3. Decisions taken into the build

- **Wire geometry:** one `THREE.CatmullRomCurve3` per wire letter (B,C,D,E,F,G[,H]); `TubeGeometry` for the edge, thickness driven by 10-second EMA throughput. (Matches anatomy-3d `makeWireTube()`.)
- **Pulse particle:** `<points>` with additive-blended soft sprite; colour by Yuyay score band (red <0.5 / amber 0.5–0.85 / green >0.85); progress advanced in `useFrame` delta-scaled by latency (faster particle = lower latency). Reset/despawn at t≥1.
- **Event transport:** SSE (`text/event-stream`) primary — works through HF Space nginx with no WS upgrade needed; WebSocket-style API name `/api/wires/stream` kept per spec but implemented as SSE for HF-container reliability (documented honest choice, not a bandaid — SSE is the correct primitive for server→client fan-out and is what Wire E already uses).
- **Data source = REAL:** the stream reads the live in-process wire buffers already shipped in `szl_wire.py` — `cortex_events()` (Wire E), `khipu_nodes()` (Wire F), `recent_traces()` (Wire D) — plus `szl_jack.py` brain-jack receipts (Wire G). No mocks. When a buffer is empty the scene shows the wire as **idle (dim, no pulse)** — never a fake pulse.
- **Renderer:** WebGPURenderer (Baseline Jan-2026) with automatic WebGL2 fallback (`WebGPU.isAvailable()`), matching the anatomy-3d V2 stack.
- **Honesty:** Sigstore sig = PLACEHOLDER label; cross-Space broker = the a11oy hub fan-out (Phase 4) — until a pulse actually crosses, sister-flagship wires render idle, never faked.

## 4. Three views (toggle)
- **Anatomy view** — this flagship's organ centre, wires radiating (reuse anatomy-3d aesthetic).
- **Wire view (NEW)** — wires centre-stage, sister flagships as labelled nodes around the rim.
- **Khipu Constellation view** — iframe to `frontier_viz/khipu-constellation` (cross-link to sibling `three_frontier_3d_visualizations`), graceful "not yet available" panel if absent.
