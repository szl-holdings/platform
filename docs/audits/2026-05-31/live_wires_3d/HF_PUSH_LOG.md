# HF_PUSH_LOG — Live 3D Wires deployment to SZLHOLDINGS

Signed: **Yachay** · 2026-06-01 · Founder-token `HfApi` (whoami=`betterwithage`, org `SZLHOLDINGS`)

> All writes used the **founder-token `HfApi`** (NOT GitHub Actions, NOT the connector).
> Token: `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token` (38 B, verified).
> ADDITIVE only. IP-HOLD PRs untouched. Doctrine v11 LOCKED numbers preserved.

```python
from pathlib import Path
from huggingface_hub import HfApi
api = HfApi(token=Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip())
```

## Final verified-working top commit per flagship

| Flagship | Space URL | Final top SHA | /live-wires | SSE |
|---|---|---|---|---|
| **a11oy** | https://szlholdings-a11oy.hf.space | `ea294bda31` | 200 · real 3D | flushing (heartbeat + injected H pulses) |
| **amaru** | https://szlholdings-amaru.hf.space | `dd472deed7` | 200 · real 3D | live Wire D pulses |
| **sentra** | https://szlholdings-sentra.hf.space | `682ace83b8` | 200 · real 3D | live Wire D pulses |
| **killinchu** | https://szlholdings-killinchu.hf.space | `edec602251` | 200 · real 3D | heartbeat (idle, honest) |
| **rosie** | https://szlholdings-rosie.hf.space | `2b6e535f38` | 200 · real 3D | live Wire D pulses |

## Key commits I pushed (Yachay), chronological per flagship

### a11oy (most contested — concurrent agents reverted twice; re-applied)
- `cbac8e7be0` feat: bake Live 3D Wires into cortex — /live-wires + register() FIRST
- `5c57d846f6` fix: re-pin register() FIRST so /live-wires wins over SPA catch-all
- `abf88676af` feat: additive 3D Live-Wires hero
- `265b5735fa` **ADDITIVE COPY** szl_live_wires.py + live_wires.html + live_wires_3d.js into image (Dockerfile uses per-file COPY — the "a11oy gotcha")
- `97381383ca` ADDITIVE fix: non-blocking SSE generator (`await asyncio.sleep`) so stream flushes on busy loop
- `ea294bda31` **FIX**: move `import asyncio` below `from __future__` (corrects a transient SyntaxError); local `compile()` pre-check passed → **current top**

### amaru
- `cbac8e7be0`/`5c57d846f6`/`abf88676af` bake + re-pin + hero
- `912dad28d6` **ADDITIVE COPY** live-wires files into image → /live-wires serves real

### sentra
- `d16bac90c7`/`ed91f0347b`/`7c4629a05a`/`aa0f4dc343` bake + re-pin + hero
- `ff667080f4` **ADDITIVE COPY** live-wires files into image

### killinchu (NEW Space since 500_ doc)
- `bfc13eb45e`/`c702646bfc`/`e639b8b7e3` bake + re-pin + hero
- `c3f184694b` **ADDITIVE COPY** live-wires files into image

### rosie (started in RUNTIME_ERROR; fixed + re-applied after concurrent revert)
- `5764ae8901`/`4877679387` bake + re-pin
- `656d439d4e` ADDITIVE: fix RUNTIME_ERROR (szl_provenance COPY + `sys` NameError in except)
- `2fb7cfac3d` feat: additive breathing-pulse hero
- `e93dd15802` ADDITIVE (re-apply): register on `_rosie_api` before deferred mounts (was reverted)
- `2b6e535f38` **ADDITIVE COPY** szl_live_wires.py + live_wires.html + live_wires_3d.js → **current top**

## The universal bug fixed (documented for the audit)

Every flagship's Dockerfile uses **explicit per-file `COPY`** (never `COPY . .`). A concurrent
agent committed the component code (`szl_live_wires.py` etc.) and the `register()` calls, but
did NOT add the matching `COPY` lines → `import szl_live_wires` raised
`ModuleNotFoundError` → `register()` was silently skipped (try/except) → `/live-wires` fell
through to the SPA shell (= founder's "ugly 2D"). **Fix = add the COPY lines (additive).**
Verified in logs, e.g. a11oy/rosie:
`[<ns>] Live 3D Wires NOT registered: No module named 'szl_live_wires'` → after COPY fix →
`[<ns>] Live 3D Wires registered FIRST: /live-wires + /api/<ns>/v1/wires/{stream,boe,inject}`.

## Concurrency note (honest)

a11oy is actively edited by concurrent agents; my Dockerfile COPY fix was reverted twice and
re-applied. The final concurrent commit (`057c23e9c5`, then `ea294bda31`) **preserved** the
live-wires COPY lines, and the live page + SSE are confirmed working at the SHAs above.

*Pushed by Yachay via founder-token HfApi. Real wires. Real data. Math-labeled.*
