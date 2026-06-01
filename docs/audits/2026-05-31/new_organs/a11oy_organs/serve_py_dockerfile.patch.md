# a11oy `serve.py` + `Dockerfile` patch — three new organs (ADDITIVE)

Sign: **Yachay** · git trailer: Perplexity Computer Agent · 2026-06-01
Target: `spaces/SZLHOLDINGS/a11oy` (`efb1f44d`) via **HfApi direct write** (NEVER GitHub Actions).
**ZERO regression**: every existing GREEN route stays. These three modules register EARLY
(before the `/api/a11oy/{path}` Node proxy and the SPA catch-all), exactly like `szl_rag`
and `szl_receipt_substrate`, so `/api/a11oy/chaski/*`, `/api/a11oy/wallpa/*`,
`/api/a11oy/wasi-rikuq/*` resolve LOCALLY and are never hijacked. LOCKED 749/14/163 preserved.

Files written to the Space root: `szl_khipu.py`, `szl_chaski.py`, `szl_wallpa.py`,
`szl_wasi_rikuq.py`; tab pages into `pages/`: `chaski.html`, `wallpa.html`, `wasi-rikuq.html`.

---

## 1. `serve.py` — register the three organs EARLY

Insert this block immediately AFTER the `szl_receipt_substrate` registration block
(after the `_SUBSTRATE_OK` try/except, ~line 108), and BEFORE
`_wire.install_traceparent_middleware(app, "a11oy")`:

```python
# ---------------------------------------------------------------------------
# Doctrine v13 EDGE ORGANS (ADDITIVE, 2026-06-01, Yachay). Three new organs:
#   CHASKI      — reception / welcome / onboarding   (/api/a11oy/chaski/*)
#   WALLPA      — governed voice / TTS narration      (/api/a11oy/wallpa/*)
#   WASI-RIKUQ  — advisory observability / chaos       (/api/a11oy/wasi-rikuq/*)
# Each emits a Khipu receipt (shared szl_khipu SHA3-256 hash-chain, DSSE PLACEHOLDER).
# Registered EARLY so they take precedence over the /api/a11oy/{path} proxy and the
# SPA catch-all. ZERO BANDAID — real FastAPI routers, locally verified (test_organs.py GREEN).
# v13 sub-formulas: Chaski/Wallpa/Wasi factors ∈ [0,1] (PuriqLean §9), so they only gate.
# LOCKED preserved: 749/14/163, 13-axis yuyay_v3, replay bacf5443…631fc5, SLSA L1.
# ---------------------------------------------------------------------------
try:
    import szl_chaski as _chaski
    _chaski.register(app, ns="a11oy")
    print("[a11oy] szl_chaski routes registered (organ=reception)", file=sys.stderr)
except Exception as _e:
    print(f"[a11oy] szl_chaski not registered: {_e}", file=sys.stderr)

try:
    import szl_wallpa as _wallpa
    _wallpa.register(app, ns="a11oy")
    print("[a11oy] szl_wallpa routes registered (organ=voice, OSS TTS, synthetic timbres)", file=sys.stderr)
except Exception as _e:
    print(f"[a11oy] szl_wallpa not registered: {_e}", file=sys.stderr)

try:
    import szl_wasi_rikuq as _wasi
    _wasi.register(app, ns="a11oy")
    print("[a11oy] szl_wasi_rikuq routes registered (organ=house-watch, advisory; HUKLLA sole halt)", file=sys.stderr)
except Exception as _e:
    print(f"[a11oy] szl_wasi_rikuq not registered: {_e}", file=sys.stderr)
```

> Note: `szl_chaski` / `szl_wallpa` / `szl_wasi_rikuq` each `import szl_khipu`, so `szl_khipu.py`
> must also be present at the Space root (see Dockerfile COPY below). No serve.py import of
> `szl_khipu` is required — the organ modules import it transitively.

## 2. `serve.py` — three page routes (mirroring `/brain`, `/mesh`, `/brain-jack`)

Insert immediately AFTER the `brain_jack_page()` route (~line 1085) and BEFORE the
`# SPA — Brand Orchestration Layer at root.` comment block. The SPA catch-all
(`@app.get("/{full_path:path}")`) MUST remain LAST so these explicit routes win:

```python
@app.get("/chaski")
async def chaski_page() -> Response:
    """CHASKI — reception organ: 3D welcome scene + onboarding relay."""
    f = PAGES_DIR / "chaski.html"
    if f.is_file():
        return FileResponse(f, media_type="text/html")
    return JSONResponse({"error": "chaski page not found"}, status_code=404)


@app.get("/wallpa")
async def wallpa_page() -> Response:
    """WALLPA — expression organ: governed voice / doctrine narration."""
    f = PAGES_DIR / "wallpa.html"
    if f.is_file():
        return FileResponse(f, media_type="text/html")
    return JSONResponse({"error": "wallpa page not found"}, status_code=404)


@app.get("/wasi-rikuq")
async def wasi_rikuq_page() -> Response:
    """WASI-RIKUQ — house-watcher: empire health dashboard + 3D watcher."""
    f = PAGES_DIR / "wasi-rikuq.html"
    if f.is_file():
        return FileResponse(f, media_type="text/html")
    return JSONResponse({"error": "wasi-rikuq page not found"}, status_code=404)
```

## 3. `Dockerfile` — COPY the four modules (pages copied by existing `COPY pages/`)

Insert these COPY lines alongside the other `szl_*.py` COPY lines (after
`COPY szl_receipt_substrate.py ./szl_receipt_substrate.py`, ~line 79).
**`szl_khipu.py` MUST come first** (the three organ modules import it at module load):

```dockerfile
# Doctrine v13 EDGE ORGANS (ADDITIVE, Yachay). szl_khipu first (imported by the 3 organs).
COPY szl_khipu.py ./szl_khipu.py
COPY szl_chaski.py ./szl_chaski.py
COPY szl_wallpa.py ./szl_wallpa.py
COPY szl_wasi_rikuq.py ./szl_wasi_rikuq.py
```

The three tab pages (`chaski.html`, `wallpa.html`, `wasi-rikuq.html`) require NO new
Dockerfile line — they are picked up by the existing `COPY pages/ ./pages/` (line 87),
provided they are placed inside the Space's `pages/` directory before build.

## 4. Verification after wiring (local, already GREEN)

```
GET  /api/a11oy/chaski/welcome              → 200   (Khipu receipt emitted)
GET  /api/a11oy/chaski/heatmap              → 200
GET  /api/a11oy/wallpa/voices               → 200   (6 synthetic timbres)
POST /api/a11oy/wallpa/speak                → 200   (real 16 kHz WAV)
POST /api/a11oy/wallpa/narrate-doctrine     → 200   (~67.9 s)
GET  /api/a11oy/wasi-rikuq/dashboard        → 200   (5/5 up, health 1.000)
GET  /api/a11oy/wasi-rikuq/incidents        → 200
GET  /api/a11oy/wasi-rikuq/runbook          → 200
POST /api/a11oy/wasi-rikuq/chaos            → 200   (2-person Yuyay gate enforced)
GET  /api/a11oy/wasi-rikuq/health-of-the-empire → 200
GET  /chaski  /wallpa  /wasi-rikuq          → 200   (tab pages)
```
See `test_organs_results.json` (verdict GREEN, 0 failures) and the three screenshots.
