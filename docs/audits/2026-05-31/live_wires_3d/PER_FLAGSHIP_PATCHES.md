# PER_FLAGSHIP_PATCHES — Live 3D Wires (one section per flagship)

Signed: **Yachay** · 2026-06-01 · ADDITIVE only · founder-token HfApi

Each flagship received **two** additive changes:
1. **Code registration** — `import szl_live_wires; szl_live_wires.register(app, ns=...)` placed
   BEFORE any SPA/Gradio catch-all so `/live-wires` + `/api/{ns}/v1/wires/*` win route matching.
2. **Dockerfile COPY** — explicit per-file `COPY szl_live_wires.py live_wires.html live_wires_3d.js`
   (every flagship Dockerfile uses per-file COPY, never `COPY . .`). Without this the import
   raises `ModuleNotFoundError` and the page falls to the SPA shell.

---

## a11oy — gate / orchestrator (`serve.py`)

**Cortex geometry:** golden icosahedral wireframe sphere.
**Architecture note:** FastAPI front + spawns a Node backend (`:8081`) it proxies to via an
`/api/a11oy/{path:path}` catch-all + a `/{full_path:path}` SPA fallback. Registration must
win over BOTH.

Registration (constructed immediately after `app = FastAPI(...)`, lines ~62–76):
```python
app = FastAPI(title="a11oy — Brand Orchestration Layer", version="2.0.0")
# ── Live 3D Wires (PURIQ / Doctrine v12) — ADDITIVE, re-pinned FIRST ──
try:
    import szl_live_wires as _live_wires
    _live_wires.register(app, ns="a11oy")
    import sys as _sys_lw
    print("[a11oy] Live 3D Wires registered FIRST: /live-wires + /api/a11oy/v1/wires/{stream,boe,inject}", file=_sys_lw.stderr)
except Exception as _lw_e:
    import sys as _sys_lw, traceback as _tb_lw
    print(f"[a11oy] Live 3D Wires NOT registered: {_lw_e}", file=_sys_lw.stderr)
    _tb_lw.print_exc()
```
Dockerfile COPY (dest `./`, before `ENV PORT=7860`):
```dockerfile
COPY szl_live_wires.py ./szl_live_wires.py
COPY live_wires.html ./live_wires.html
COPY live_wires_3d.js ./live_wires_3d.js
```
**Extra fix unique to a11oy:** the 3DWPP SSE generator originally used a blocking `time.sleep(0.5)`
inside an `async def` generator. a11oy's busy event loop (Node proxy + many routes) starved it
so the StreamingResponse never flushed. Changed to **`await asyncio.sleep(0.5)`** (commits
`97381383ca` → `ea294bda31`). After fix, a11oy SSE flushes heartbeats and injected H-pulses.

---

## amaru — cortex / brain (`serve.py`, lines ~52–54)

**Cortex geometry:** blue brain blob + TorusKnot orbital ring.
```python
try:
    import szl_live_wires as _live_wires
    _live_wires.register(app, ns="amaru")
```
Dockerfile COPY dest `/app/`. Commit `912dad28d6`. **Live Wire D pulses confirmed** (distinct
receipt_hashes, rising throughput_eps). amaru also mounts an anatomy view (`_anatomy.register`).

---

## sentra — immune (`serve.py`, lines ~368–369)

**Cortex geometry:** red immune polyhedron / shield.
```python
try:
    import szl_live_wires as _live_wires
    _live_wires.register(app, ns="sentra")
```
Dockerfile COPY dest `./`. Commit `ff667080f4`. **Live Wire D pulses confirmed.**

---

## killinchu — drone-intel (NEW Space since 500_ doc) (`serve.py`, lines ~64–65)

**Cortex geometry:** teal hexagonal cortex + sweep ring.
```python
try:
    import szl_live_wires as _live_wires
    _live_wires.register(app, ns="killinchu")
```
Dockerfile COPY dest `./`. Commit `c3f184694b`.
**Honest idle:** killinchu LACKS `szl_wire.py` / `szl_jack.py`, so its wire buffers are empty.
The stream returns HTTP/2 200 `text/event-stream` and emits a **heartbeat with all wires at
`0.0`** (verified). The 3D cortex still renders fully. This is the honest RED state — no fake pulses.

---

## rosie — nervous / all (Gradio app, `app.py`)

**Cortex geometry:** green particle nervous-field + animated traveling pulses.
**Architecture note:** rosie is Gradio mounted with a catch-all: `app = gr.mount_gradio_app(_rosie_api, demo, path="/")`.
Live-wires MUST be registered on the inner FastAPI `_rosie_api` **before** the deferred
namespaced mounts and the Gradio catch-all.

Registration (on `_rosie_api`, before `# ── Deferred namespaced contract mounts`):
```python
try:
    import szl_live_wires as _live_wires
    _live_wires.register(_rosie_api, ns="rosie")
    import sys as _syslw
    print("[rosie] Live 3D Wires registered: /live-wires + /api/rosie/v1/wires/{stream,boe,inject}", file=_syslw.stderr)
except Exception as _lwe:
    import sys as _syslw
    print(f"[rosie] Live 3D Wires NOT registered: {_lwe}", file=_syslw.stderr)
```
Dockerfile COPY (dest `./`, `--chown=user` style):
```dockerfile
COPY --chown=user szl_live_wires.py live_wires.html live_wires_3d.js ./
```
**Extra fixes unique to rosie:** started in `RUNTIME_ERROR` — fixed a `szl_provenance`
`ModuleNotFoundError` (missing COPY) and a `sys` `NameError` in an except block (commit
`656d439d4e`). The app.py registration was reverted once by a concurrent commit and
re-applied (`e93dd15802`). Final COPY `2b6e535f38`. **Live Wire D pulses confirmed**
(throughput_eps up to 1.0).

---

*All patches additive. IP-HOLD PRs untouched. Doctrine v11 LOCKED numbers preserved. — Yachay*
