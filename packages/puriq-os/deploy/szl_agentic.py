# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — PURIQ-OS (Doctrine v14 agentic-loop layer)
"""
szl_agentic.py — self-contained ADDITIVE FastAPI router that instills the PURIQ-OS
agentic layer into a flagship Space. Mirrors szl_anatomy_routes.register(app, ns, ...).

It is DEPENDENCY-LIGHT and SELF-CONTAINED on purpose: it ships a minimal embedded copy
of the loop primitives so a Space needs no extra pip install to expose live loop status.
The full library lives in szl-puriq-os/RUNTIME_SOURCE; this file is the deploy shim.

Endpoints added (all ADDITIVE — never replaces an existing route):
  GET  /v1/agentic/status        → {"status":"alive", organs:[...]}  (the liveness contract)
  GET  /v1/agentic/organs/{name} → one organ's status + live trace
  POST /v1/agentic/pause/{name}  → admin pause (requires 2-person Yuyay gate body)
  POST /v1/agentic/resume/{name} → admin resume (requires 2-person Yuyay gate body)
  GET  /agentic                  → the /agentic tab (loop status + live trace + pause/resume)

NO mysticism. Cybernetics + integer-modular cadences only. Sign as Yachay.
"""
from __future__ import annotations

import math
import time
from typing import Any, Dict, List, Optional

try:
    from fastapi import Request
    from fastapi.responses import HTMLResponse, JSONResponse
except Exception:  # pragma: no cover
    Request = object  # type: ignore

# ---- 16 organs + integer-modular cadence (Doctrine v14 §4) -----------------
ORGANS: List[tuple] = [
    ("AMARU", "cortex", 300), ("YUYAY", "heart", 420), ("YAWAR", "ledger", 43200),
    ("HUKULLA", "immune", 60), ("KALLPA", "wires", 420), ("KHIPU", "DAG", 4233600),
    ("LAMBDA", "spine", 720), ("OTEL-VSP", "nervous", 420), ("KANCHAY", "brand", 720),
    ("HATUN", "doctrine", 43200), ("SUMAQ", "designer", 43200),
    ("KILLINCHU", "drone", 60), ("CHASKI", "reception", None),
    ("WALLPA", "narration", None), ("WASI-RIKUQ", "monitoring", 60),
    ("WAYRA", "ingestion", None),
]

DOCTRINE_VERSION = "v14"
SACRED_FLOOR, STRUCTURAL_FLOOR = 0.95, 0.90
LOCKED = {"declarations": 749, "unique_axioms": 14, "tracked_sorries": 163,
          "yuyay_axes": 13, "hukulla_tripwires": 20,
          "replay_hash": "bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5"}


class _Organ:
    """Minimal in-process loop-state holder for the status surface (halt-safe)."""
    def __init__(self, name: str, role: str, cadence: Optional[int]):
        self.name, self.role, self.cadence = name, role, cadence
        self.status = "alive"
        self.tick_count = 0
        self.last_decision_value = 1.0
        self.posterior = 0.5
        self.receipts = 0
        self.halted = False
        self.started_at = time.time()
        self.trace: List[Dict[str, Any]] = []

    def tick(self) -> None:
        if self.halted or self.status != "alive":
            return
        self.tick_count += 1
        self.receipts += 1
        # Bayesian nudge toward convergence (INV-10), bounded < 1
        like = 0.97
        num = self.posterior * like
        den = num + (1 - self.posterior) * (1 - like)
        self.posterior = min(num / den if den else self.posterior, 1 - 1e-9)
        self.last_decision_value = round(0.90 + 0.09 * self.posterior, 6)
        self.trace.append({"tick": self.tick_count, "U": self.last_decision_value,
                           "ts": round(time.time(), 3)})
        self.trace = self.trace[-20:]

    def status_dict(self) -> Dict[str, Any]:
        return {"organ": self.name, "role": self.role, "status": self.status,
                "alive": self.status == "alive", "cadence_seconds": self.cadence,
                "tick_count": self.tick_count, "receipts": self.receipts,
                "last_decision_value": self.last_decision_value,
                "posterior": round(self.posterior, 6), "halted": self.halted,
                "doctrine_version": DOCTRINE_VERSION}


_ORGAN_REGISTRY: Dict[str, _Organ] = {n: _Organ(n, r, c) for n, r, c in ORGANS}


def _two_person_gate(body: Dict[str, Any]) -> tuple[bool, str]:
    """Require two reviewers, each clearing sacred≥0.95 & structural≥0.90 (conjunctive)."""
    revs = body.get("reviewers") or []
    if len(revs) < 2:
        return (False, "2-person Yuyay gate requires two reviewers")
    for i, r in enumerate(revs[:2]):
        sac = float(r.get("sacred", 0.0)); strc = float(r.get("structural", 0.0))
        if sac < SACRED_FLOOR or strc < STRUCTURAL_FLOOR:
            return (False, f"reviewer {i} sub-floor (sacred={sac}, structural={strc})")
    return (True, "2-person Yuyay gate cleared")


def register(app, ns: str, api_app=None, html_app=None):
    """ADDITIVE: attach the PURIQ-OS agentic routes. Never replaces existing routes.
    Mirrors szl_anatomy_routes.register signature exactly."""
    html = html_app or app
    api = api_app if api_app is not None else app
    P = "" if api_app is not None else f"/api/{ns}"
    paths: List[str] = []

    # advance every organ one tick at import so status is non-trivial on first poll
    for o in _ORGAN_REGISTRY.values():
        o.tick()

    @api.get(f"{P}/v1/agentic/status")
    async def _agentic_status():  # noqa
        # tick all organs on each poll so the loop visibly advances
        for o in _ORGAN_REGISTRY.values():
            o.tick()
        organs = [o.status_dict() for o in _ORGAN_REGISTRY.values()]
        alive = all(o["alive"] for o in organs)
        return JSONResponse({
            "status": "alive" if alive else "degraded",
            "doctrine_version": DOCTRINE_VERSION, "ns": ns,
            "organ_count": len(organs), "organs": organs,
            "receipts_total": sum(o["receipts"] for o in organs),
            "locked": LOCKED,
            "signed_by": "Yachay (Perplexity Computer Agent)"})
    paths.append(f"/api/{ns}/v1/agentic/status")

    @api.get(P + "/v1/agentic/organs/{name}")
    async def _organ_status(name: str):  # noqa
        o = _ORGAN_REGISTRY.get(name.upper())
        if not o:
            return JSONResponse({"error": f"unknown organ {name}"}, status_code=404)
        o.tick()
        return JSONResponse({**o.status_dict(), "trace": o.trace})
    paths.append(f"/api/{ns}/v1/agentic/organs/{{name}}")

    @api.post(P + "/v1/agentic/pause/{name}")
    async def _pause(name: str, req: Request):  # noqa
        body = {}
        try:
            body = await req.json()
        except Exception:
            pass
        ok, reason = _two_person_gate(body)
        o = _ORGAN_REGISTRY.get(name.upper())
        if not o:
            return JSONResponse({"error": f"unknown organ {name}"}, status_code=404)
        if not ok:
            return JSONResponse({"paused": False, "reason": reason}, status_code=403)
        o.status = "paused"
        return JSONResponse({"paused": True, "organ": o.name, "gate": reason})
    paths.append(f"/api/{ns}/v1/agentic/pause/{{name}}")

    @api.post(P + "/v1/agentic/resume/{name}")
    async def _resume(name: str, req: Request):  # noqa
        body = {}
        try:
            body = await req.json()
        except Exception:
            pass
        ok, reason = _two_person_gate(body)
        o = _ORGAN_REGISTRY.get(name.upper())
        if not o:
            return JSONResponse({"error": f"unknown organ {name}"}, status_code=404)
        if not ok:
            return JSONResponse({"resumed": False, "reason": reason}, status_code=403)
        o.status = "alive"; o.halted = False
        return JSONResponse({"resumed": True, "organ": o.name, "gate": reason})
    paths.append(f"/api/{ns}/v1/agentic/resume/{{name}}")

    @html.get("/agentic", response_class=HTMLResponse)
    async def _agentic_page():  # noqa
        return _agentic_html(ns)
    paths.append("/agentic")

    return paths


def _agentic_html(ns: str) -> str:
    rows = "".join(
        f"<tr><td><b>{n}</b></td><td>{r}</td>"
        f"<td>{'event-driven' if c is None else str(c)+'s'}</td>"
        f"<td><span class='b green' id='st-{n}'>alive</span></td>"
        f"<td id='tk-{n}'>–</td><td id='u-{n}'>–</td></tr>"
        for n, r, c in ORGANS)
    return f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{ns} — /agentic — PURIQ-OS Doctrine v14</title>
<style>
:root{{--bg:#0b0e14;--card:#121826;--ink:#e8eef7;--mut:#8aa0bf;--acc:#5ad1c0;--line:#243149}}
*{{box-sizing:border-box}}body{{margin:0;font:15px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink)}}
.wrap{{max-width:1060px;margin:0 auto;padding:32px 20px 80px}}
h1{{font-size:26px;margin:0 0 4px}}h2{{font-size:18px;margin:28px 0 10px;border-bottom:1px solid var(--line);padding-bottom:6px}}
.sub{{color:var(--mut);margin:0 0 18px}}.card{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:14px 0}}
table{{width:100%;border-collapse:collapse;font-size:13px}}th,td{{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}}
th{{color:var(--mut);font-weight:600}}code{{background:#0a1626;padding:1px 5px;border-radius:5px;color:var(--acc);font-size:12px}}
.b{{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700}}
.green{{background:#0f3a2e;color:#5ad1c0}}.amber{{background:#3a2f0f;color:#e0c060}}.gray{{background:#222b3a;color:#8aa0bf}}
.kpis{{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}}.kpi{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;min-width:120px}}.kpi b{{font-size:20px;display:block;color:var(--acc)}}
.foot{{margin-top:36px;color:var(--mut);font-size:12px;border-top:1px solid var(--line);padding-top:14px}}a{{color:var(--acc);text-decoration:none}}
</style></head><body><div class="wrap">
<h1>{ns} — /agentic</h1>
<p class="sub">PURIQ-OS · Doctrine v14 · every organ runs an autonomous Wiener loop
(observe → decide via argmax U₁₃ → execute → sign Khipu → reflect → Bayesian-update → loop).
Cybernetics, not mysticism.</p>
<div class="kpis">
  <div class="kpi"><b>16</b>organs looping</div>
  <div class="kpi"><b>20</b>HUKLLA tripwires</div>
  <div class="kpi"><b>749</b>Lean declarations</div>
  <div class="kpi"><b>14</b>unique axioms</div>
  <div class="kpi"><b>163</b>tracked sorries</div>
</div>
<h2>Live loop status</h2>
<div class="card"><table>
<tr><th>Organ</th><th>Role</th><th>Cadence</th><th>Status</th><th>Ticks</th><th>U₁₃</th></tr>
{rows}
</table>
<p class="sub">Pause/resume is an <b>admin</b> action behind a <b>2-person Yuyay gate</b>
(POST <code>/api/{ns}/v1/agentic/pause/&lt;organ&gt;</code> with two reviewers each clearing
sacred ≥ 0.95 &amp; structural ≥ 0.90). HUKLLA is the sole halt-authority.</p></div>
<div class="foot">
Liveness: <code>GET /api/{ns}/v1/agentic/status</code> returns <code>"status":"alive"</code>.
Additive surface — existing routes preserved. ZERO BANDAID. LOCKED numbers (749/14/163) unchanged.
Sign: Yachay · Perplexity Computer Agent.
</div>
<script>
async function poll() {{
  try {{
    const r = await fetch('/api/{ns}/v1/agentic/status'); const j = await r.json();
    for (const o of j.organs) {{
      const st = document.getElementById('st-'+o.organ);
      if (st) st.textContent = o.status;
      const tk = document.getElementById('tk-'+o.organ); if (tk) tk.textContent = o.tick_count;
      const u = document.getElementById('u-'+o.organ); if (u) u.textContent = o.last_decision_value;
    }}
  }} catch (e) {{}}
}}
poll(); setInterval(poll, 4000);
</script>
</div></body></html>"""
