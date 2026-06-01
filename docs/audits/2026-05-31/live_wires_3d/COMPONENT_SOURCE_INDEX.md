# COMPONENT_SOURCE_INDEX — Live 3D Wires

Signed: **Yachay** · 2026-06-01 · Doctrine v12 (PURIQ)

Master source copies live in `/home/user/workspace/szl_live_wires/`. The same three
artifacts are baked into **all 5 flagship** Spaces (a11oy, amaru, sentra, killinchu, rosie).

| File | Size | Role |
|---|---|---|
| `szl_live_wires.py` | 18,863 B / 389 ln | ADDITIVE FastAPI module. `register(app, ns)` mounts `/live-wires`, `/live_wires_3d.js`, SSE `/api/{ns}/v1/wires/stream` (+ front-door alias), BoE `/api/{ns}/v1/wires/boe/{hash}`, and `POST /api/{ns}/v1/wires/inject`. Converts REAL in-process wire buffers → 3DWPP pulses. |
| `live_wires.html` | 12,145 B / 183 ln | Host page. Header chips (Doctrine v11 LOCKED numbers), wire→formula legend, KaTeX (auto-render), click-modal scaffold for Khipu receipt + Yuyay score + HUKLLA log, tab bar (Anatomy / Wire / Khipu Constellation). |
| `live_wires_3d.js` | 17,715 B / 260 ln | Framework-agnostic Three.js (r160) scene core. CatmullRom wires + animated pulses + organ-specific cortex builders + raycaster click → BoE modal + EventSource SSE consumption. |
| `szl_wire.py` | 9,804 B / 229 ln | (Reference) the pre-existing live wire substrate — `recent_traces` (Wire D), `cortex_events` (C/E), `khipu_nodes`/`khipu_root` (F/B). The pulse source of truth. |

## Renderer feature map (`live_wires_3d.js` — verified line refs)

- **YAWAR recipe #2 (blood-flow) wires** — `CatmullRomCurve3` per wire letter from each
  sister organ into the cortex, rendered as `TubeGeometry` (line 97–109).
- **Animated pulses** — sprite points ride the curve via `curve.getPointAt(t)` each frame
  (line 188), so live SSE events visibly travel the wire (the white/gold pulses in screenshots).
- **Yuyay 13-axis color banding** — `YUYAY_BAND = s => s==null?white : s<0.5?red(0xef4444) : s<=0.85?amber(0xf59e0b) : green(0x22c55e)` (line 41). Matches 3DWPP §5.
- **HUKLLA tripwire visual** — fired tripwire → red damping ring `exp(-β·HUKLLA)` (line 125).
- **EMA throughput → wire thickness/opacity** — live load thickens the tube (lines 137–141).
- **KaTeX formula labels float on each wire** — `floatMath(... WIRES[L].factor ...)` at the
  curve midpoint (line 111); factors per 3DWPP §4.
- **Raycaster click → BoE modal** — `THREE.Raycaster` picks a pulse, fetches `boe_ref`
  (Khipu receipt + Yuyay + HUKLLA log) (line 147+).
- **Real SSE consumption** — `new EventSource(streamUrl)` (line 200–201); no polling mock.
- **Organ-specific cortex builders** (each flagship renders a DISTINCT cortex, confirmed in
  screenshots):
  - `buildCortex` amaru = brain + `TorusKnotGeometry` serpent/orbital ring (line 225–228) → **blue brain blob**.
  - killinchu = teal hexagonal cortex + sweep `RingGeometry` (line 239) → **teal hex + ring**.
  - rosie = nervous-field of 600 particle points + emissive core (line 245–248) → **green particle field**.
  - sentra = immune polyhedron → **red shield**.
  - a11oy = orchestrator icosahedron → **golden wireframe sphere**.

## Integration point (single line per flagship)

```python
import szl_live_wires
szl_live_wires.register(app, ns="<flagship>")   # additive; never overrides existing routes
```

Registered **FIRST / EARLY** (before any SPA catch-all or Gradio mount) so `/live-wires`
and the `/api/{ns}/v1/wires/*` routes win over the catch-all. See `PER_FLAGSHIP_PATCHES.md`.

## Honest provenance

Pulses are derived ONLY from real in-process buffers. Empty buffer ⇒ idle wire (heartbeat
`0.0`), never a fabricated pulse. DSSE/COSE signatures in the BoE are honestly labeled
`PLACEHOLDER — Sigstore CI signing not yet wired (keyid:PENDING)`.

*Real wires. Real data. Math-labeled. — Yachay*
