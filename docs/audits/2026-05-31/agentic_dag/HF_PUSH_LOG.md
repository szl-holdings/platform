# HF_PUSH_LOG.md — Hugging Face Space push log (founder-token HfApi)

**Signed: Yachay. Co-authored-by: Perplexity Computer Agent.**

- **Space:** [`SZLHOLDINGS/a11oy`](https://huggingface.co/spaces/SZLHOLDINGS/a11oy) (`repo_type="space"`)
- **Live URL:** https://szlholdings-a11oy.hf.space
- **Auth path:** founder-token `HfApi` (NOT the betterwithage connector). Token whoami =
  user `betterwithage`, org `SZLHOLDINGS`, role `write` (admin write token = authorized path).

```python
from pathlib import Path
from huggingface_hub import HfApi
token = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=token)
```

## Commit 1 — initial KHIPU-OS push (Phase 2)

- **SHA:** `b7e2a7a9de6f6b0c7fcb99dc0d561c9570d06962`
- **SHA before:** `a7ecaec95e0502adb51518b711d103f2b4660451`
- **Title:** `KHIPU-OS: agentic Khipu DAG endpoints (ADDITIVE)`
- **Files (3):**
  - `szl_khipu_os_routes.py` (NEW route module)
  - `serve.py` (MODIFIED — added `szl_khipu_os_routes` to the edge-organ registration loop)
  - `Dockerfile` (MODIFIED — explicit `COPY szl_khipu_os_routes.py` per the per-file-COPY pattern)
- **Confirmed:** present in `list_repo_commits` (history of 92 commits at confirmation time).

## Commit 2 — concurrent-edit recovery re-push (Phase 4)

**Honest record of a real problem and its fix.** Between Commit 1 and Phase-4
verification, **other agents pushed competing versions of `serve.py` and `Dockerfile`**
that did NOT include the KHIPU-OS registration (a known multi-agent hazard — another
agent's commit `c4bb25ed` shows the same "reverted by concurrent commit" pattern for the
live-wires organ). As a result the `/api/a11oy/v1/khipu-os/*` paths fell through to the
generic Node proxy and returned **503** ("Node serve on :8081 is not running").

The route module file `szl_khipu_os_routes.py` itself was still present in the repo
(unchanged). I re-applied the two registration edits to the *current* `serve.py` and
`Dockerfile` (verified additive via `diff`; both pass `python3 -m py_compile`) and
re-pushed:

- **SHA:** `8ea4c3a215b356afff89ed92aa009fc29e0825e0`
- **SHA before:** `53cfdf92f0cbe17b99d4882cbb59482b82346444`
- **Title:** `KHIPU-OS: re-register agentic DAG router (ADDITIVE; concurrent-edit recovery)`
- **Files (2):** `serve.py`, `Dockerfile`
- **serve.py change:** added `("szl_khipu_os_routes", "khipu-os/agentic-dag")` to the
  EDGE-ORGAN `__import__` loop, which runs BEFORE the generic
  `/api/a11oy/{path:path}` Node proxy, so the khipu-os paths resolve LOCALLY.
- **Dockerfile change:** re-added `COPY szl_khipu_os_routes.py ./szl_khipu_os_routes.py`
  (this Dockerfile uses explicit per-file COPY, not `COPY . .`).

### `list_repo_commits` confirmation (top 3 after re-push)

```
8ea4c3a215b356afff89ed92aa009fc29e0825e0 | KHIPU-OS: re-register agentic DAG router (ADDITIVE; concurrent-edit recovery)
53cfdf92f0cbe17b99d4882cbb59482b82346444 | ADDITIVE: Throne Room boot-overlay ...
c4bb25ed1621e3573befa3b248994b1a00f84f45 | ADDITIVE (re-apply): COPY live-wires files ...
```

`api.list_repo_commits("SZLHOLDINGS/a11oy", repo_type="space")` returns `8ea4c3a2…` as
HEAD; the original `b7e2a7a9…` remains in history.

## Build & live status (after Commit 2)

- Space runtime transitioned `RUNNING_BUILDING → RUNNING` with HEAD = `8ea4c3a2…`
  (polled via `api.space_info(...).runtime.stage`).
- All four KHIPU-OS endpoints returned **HTTP 200** post-build (see VERIFY_REPORT.md and
  `EVIDENCE_live_endpoint_responses.json`).

## Caveat for the founder (honest)

Because multiple agents are pushing to this Space concurrently, a later push could again
overwrite `serve.py`/`Dockerfile` and remove the registration. The fix is mechanical and
repeatable (re-add the one tuple entry + the one COPY line). A durable solution is to land
the registration in a file no other agent edits, or to coordinate serve.py ownership.
