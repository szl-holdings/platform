# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
app.py — FastAPI surface for PURIQ-OS. Real handlers, real JSON.

Endpoints:
  GET  /v1/puriq/health                  -> runtime liveness
  GET  /v1/puriq/replay                   -> honest yuyay_v3 replay-hash check
  GET  /v1/puriq/status                   -> all 12 organs: status/cadence/tick/next
  GET  /v1/puriq/{organ}/loop             -> tick that organ once, return the TickResult
  GET  /v1/puriq/{organ}/receipts         -> recent Khipu receipts for that organ
  GET  /agentic                           -> read-only HTML tab (founder can SEE it tick)

The ledger is sqlite-on-disk (persisted, re-readable on restart). Set PURIQ_DB env to
choose the path; defaults to ./puriq_os_ledger.sqlite.
"""
from __future__ import annotations

import dataclasses
import os
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse

from .khipu_emit import KhipuLedger
from .organs import build_all, CANONICAL_ORGANS
from .replay_hash import check_replay_hash, local_gate_hash, LOCKED_REPLAY_HASH

DB_PATH = os.environ.get("PURIQ_DB", "puriq_os_ledger.sqlite")
ARTIFACT_PATH = os.environ.get("PURIQ_YUYAY_ARTIFACT")  # optional real artifact

app = FastAPI(title="PURIQ-OS", version="1.0.0",
              description="Agentic loop runtime (additive over Doctrine v12).")

_LEDGER = KhipuLedger(db_path=DB_PATH)
_ORGANS = build_all(_LEDGER)


def _world() -> Dict[str, Any]:
    """Synthetic world handle. In production this is replaced by live organ telemetry."""
    return {}


@app.get("/v1/puriq/health")
def health():
    return {"status": "alive", "organs": CANONICAL_ORGANS,
            "ledger_db": DB_PATH, "receipts": _LEDGER.count(),
            "chain_verified": _LEDGER.verify_chain()}


@app.get("/v1/puriq/replay")
def replay():
    """Honest replay-hash gate. verified=False + block=True until the real yuyay_v3
    artifact is mounted and its sha256 equals the locked constant."""
    chk = check_replay_hash(ARTIFACT_PATH)
    return {**chk.as_dict(), "local_gate_hash": local_gate_hash(),
            "locked_replay_hash": LOCKED_REPLAY_HASH}


@app.get("/v1/puriq/status")
def status():
    return {"organs": [a.status_dict() for a in _ORGANS.values()],
            "receipts": _LEDGER.count(), "chain_verified": _LEDGER.verify_chain()}


@app.get("/v1/puriq/{organ}/loop")
def loop_once(organ: str):
    agent = _ORGANS.get(organ)
    if agent is None:
        raise HTTPException(404, f"unknown organ '{organ}'; known={CANONICAL_ORGANS}")
    result = agent.tick(_world())
    d = dataclasses.asdict(result)
    # TripwireResult & KhipuReceipt are dataclasses -> already dict via asdict
    return JSONResponse(content=_jsonsafe(d))


@app.get("/v1/puriq/{organ}/receipts")
def receipts(organ: str, limit: int = 5):
    agent = _ORGANS.get(organ)
    if agent is None:
        raise HTTPException(404, f"unknown organ '{organ}'")
    return {"organ": organ, "recent": _LEDGER.recent(organ, limit=limit)}


@app.get("/agentic", response_class=HTMLResponse)
def agentic_tab():
    rows = []
    for a in _ORGANS.values():
        s = a.status_dict()
        rows.append(
            f"<tr><td>{s['organ']}</td><td>{s['status']}</td>"
            f"<td>{s['cadence_seconds']}s</td><td>{s['tick_count']}</td>"
            f"<td>{s['last_tick_ts'] or '—'}</td><td>{s['next_tick_ts'] or '—'}</td>"
            f"<td>{len(s['recent_receipts'])}</td></tr>"
        )
    html = f"""<!doctype html><html><head><meta charset="utf-8">
<title>PURIQ-OS · /agentic</title>
<style>body{{font-family:ui-monospace,monospace;background:#0b0e14;color:#cdd6f4;margin:2rem}}
h1{{color:#89b4fa}} table{{border-collapse:collapse;width:100%}} td,th{{border:1px solid #313244;
padding:.4rem .6rem;text-align:left}} th{{color:#a6e3a1}} .note{{color:#9399b2;font-size:.85rem}}</style>
</head><body>
<h1>PURIQ-OS — /agentic (read-only)</h1>
<p class="note">12 canonical organs. Receipts: {_LEDGER.count()} ·
chain_verified={_LEDGER.verify_chain()} · ledger={DB_PATH}</p>
<table><tr><th>organ</th><th>status</th><th>cadence</th><th>ticks</th>
<th>last_tick</th><th>next_tick</th><th>recent_receipts</th></tr>
{''.join(rows)}
</table>
<p class="note">Additive over Doctrine v12. Cadences chosen via Shannon-Nyquist.
No mystical claims. Signed: Yachay (Perplexity Computer Agent).</p>
</body></html>"""
    return HTMLResponse(content=html)


def _jsonsafe(obj):
    import json
    try:
        json.dumps(obj)
        return obj
    except (TypeError, ValueError):
        if isinstance(obj, dict):
            return {k: _jsonsafe(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_jsonsafe(v) for v in obj]
        return str(obj)
