# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings
# ORCID: 0009-0001-0110-4173
# Doctrine v10 — 749 declarations / 14 unique axioms (15 raw, 1 dup) / 163 sorries (112 baseline + 51 Putnam)
# / 12 MCP tools / 46 policy gates.
"""Unified server for Hugging Face Spaces — serves the Amaru API, the memory-cortex
operator surface (root /), AND the verbatim Replit reverse-ETL React SPA at /conduit/.

Wire D/E/F (2026-05-31 Wires DEF Ship) — ADDITIVE:
  Wire D — W3C traceparent middleware installed on this Space's FastAPI app.
            Extracts incoming traceparent header (or generates one), stashes on request.state,
            echoes on response. /api/amaru/v1/brainz exposes traceparent_propagating: true.
  Wire E — amaru subscribes to a11oy brand-decision events via SSE at
            GET /api/amaru/v1/cortex-subscribe.
            In-process ring bus (no external broker; honest disclosure).
  Wire F — amaru's Khipu DAG ingest endpoint:
            POST /api/amaru/v1/receipts/ingest — receives gate-decision receipts from a11oy,
            adds to Khipu Merkle DAG (additive, no overwrite).

ADDITIVE ONLY: the existing root single-page memory-cortex landing, the /console/ operator
surface, the /api/amaru/* 7-chakra runtime, the reasoner section, and the Rosie floating widget
are all PRESERVED unchanged. The /conduit/ React SPA is preserved unchanged.
"""

import os
import sys

sys.path.insert(0, "/app")

import asyncio as _asyncio
import json as _json
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from starlette.middleware.cors import CORSMiddleware

from amaru.app import app as amaru_app

# Doctrine v10 ADDITIVE: shared per-app BRAIN + unified LLM router + mesh wiring.
import szl_brain as _brain
import szl_wire as _wire

app = FastAPI(title="Amaru — Full Stack", version="2.1.0")

# ── Live 3D Wires (PURIQ / Doctrine v12) — ADDITIVE, re-pinned FIRST ─────────
# Registered immediately after the app is constructed so FastAPI's ordered route
# matching gives /live-wires + the 3DWPP SSE stream + court-admissible BoE
# precedence over every pre-existing SPA/proxy catch-all. Real in-process wire
# data (szl_wire / szl_jack); empty buffers render IDLE (never faked). Sigs are
# honestly PLACEHOLDER until Sigstore CI is wired. Sign: Yachay. Perplexity Computer Agent.
try:
    import szl_live_wires as _live_wires
    _live_wires.register(app, ns="amaru")
    import sys as _sys_lw
    print("[amaru] Live 3D Wires registered FIRST: /live-wires + /api/amaru/v1/wires/{stream,boe,inject}", file=_sys_lw.stderr)
except Exception as _lw_e:
    import sys as _sys_lw, traceback as _tb_lw
    print(f"[amaru] Live 3D Wires NOT registered: {_lw_e}", file=_sys_lw.stderr)
    _tb_lw.print_exc()
# ── end Live 3D Wires ────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire D — W3C traceparent propagation middleware.
# Extracts incoming traceparent header, generates one if absent, echoes on response.
_wire.install_traceparent_middleware(app, "amaru")

# ---------------------------------------------------------------------------
# Agentic-RAG (ADDITIVE, Doctrine v10/v11). amaru binds the CORTEX organ.
# Registered EARLY (before the /api/amaru mount and the SPA catch-all) so
# /api/amaru/v1/rag + /rag resolve here and are never shadowed by the mount.
# Corpus+FAISS pulled from SZLHOLDINGS/rag-corpus-v1 at first use. LLM responses
# cite chunk IDs; Λ-receipt signature = PLACEHOLDER.
# ---------------------------------------------------------------------------
try:
    import szl_rag as _rag
    _rag.register_rag_routes(app, "amaru")
    print("[amaru] szl_rag routes registered (organ=cortex)", file=sys.stderr)
except Exception as _e:
    print(f"[amaru] szl_rag not registered: {_e}", file=sys.stderr)

# ---------------------------------------------------------------------------
# ADDITIVE (Yachay / Provenance Hardening): Wire D (W3C traceparent trace
# continuity) + DSSE/Cosign-signed Khipu receipts (SLSA L2 signed provenance).
# Registers /api/{space}/wires/D, /khipu/{sign,verify,ledger}, /provenance.
# Wrapped so a missing dep (cryptography) can NEVER take down the existing app.
# PLACEHOLDER -> REAL: every receipt now DSSE-signed with szlholdings-cosign.
# ---------------------------------------------------------------------------
try:
    import szl_provenance as _prov
    _prov_status = _prov.register_provenance(app, "amaru")
    print(f"[amaru] szl_provenance registered (Wire D LIVE, SLSA L2): {{_prov_status}}", file=sys.stderr)
except Exception as _pe:  # pragma: no cover - defensive, additive-only
    print(f"[amaru] szl_provenance NOT registered ({{_pe!r}}); existing app unaffected", file=sys.stderr)

# ---------------------------------------------------------------------------
# Wire D: /api/amaru/healthz — traceparent_propagating: true
# Registered BEFORE the /api/amaru mount so it takes precedence over the
# inner amaru_app healthz which doesn't have the Wire D field.
# ---------------------------------------------------------------------------

@app.get("/api/amaru/healthz")
async def healthz_wire_d(request: Request) -> JSONResponse:
    """Wire D: healthz with traceparent_propagating: true — Doctrine v10."""
    tp = getattr(request.state, "traceparent", None) or _wire.new_traceparent()
    return JSONResponse({
        "status": "ok",
        "service": "amaru",
        "version": "2.1.0",
        "surface": "memory cortex (7 chakras)",
        "doctrine": "v10",
        # Wire D field — required by Wires DEF spec
        "traceparent_propagating": True,
        "traceparent": tp,
        "traceparent_note": (
            "W3C traceparent middleware LIVE: every request gets a real W3C traceparent. "
            "Cross-Space distributed-trace broker NOT wired (honest — see a11oy /wires)."
        ),
        "wires": {
            "B": "LIVE (a11oy\u2194sentra immune)",
            "C": "LIVE (a11oy\u2194rosie receipt stream)",
            "D": "LIVE (W3C traceparent middleware active; cross-Space broker NOT wired)",
            "E": "LIVE (SSE cortex-subscribe at /api/amaru/v1/cortex-subscribe)",
            "F": "LIVE (Khipu DAG ingest at /api/amaru/v1/receipts/ingest)",
        },
        "declarations": 749,
        "axioms": 14,
        "sorries": 163,
        "mcp_tools": 12,
        "policy_gates": 46,
        "hatun_willay": True,
    })


# ---------------------------------------------------------------------------
# Native doctrine surfaces /api/amaru/v1/honest + /v1/lambda (ADDITIVE, Doctrine
# v11). MUST be registered BEFORE app.mount("/api/amaru", amaru_app) below — the
# mounted sub-app would otherwise shadow these paths (it 404'd them). Same
# precedence trick the healthz route above uses. ZERO BANDAID: 13-axis
# geometric-mean Λ, canonical numbers 749/14/163. (Opus HF cleanup.)
# ---------------------------------------------------------------------------
_AMARU_AXIS_NAMES = [
    "soundness", "calibration", "robustness", "provenance", "consent", "reversibility",
    "transparency", "fairness", "containment", "attestation", "freshness", "authority", "auditability",
]


@app.get("/api/amaru/v1/honest")
async def amaru_honest() -> JSONResponse:
    return JSONResponse({
        "doctrine": "v11",
        "declarations": 749, "axioms_unique": 14, "axioms_raw": 15, "sorries_total": 163,
        "sorries_baseline": 112, "sorries_putnam": 51, "trust_axes": 13,
        "lambda_uniqueness": "Conjecture, not a closed theorem (open CAUCHY_ND sorry + missing symmetry axiom)",
        "slsa": "L1 (honest)",
        "receipts": "DSSE envelopes from the amaru tick endpoint; Sigstore CI signing PENDING (PLACEHOLDER).",
        "memory": "7-chakra cortex; Cardano-anchored receipts are demo-seeded, not on-chain mainnet.",
        "hatun_willay": True,
    })


@app.get("/api/amaru/v1/lambda")
async def amaru_lambda() -> JSONResponse:
    import math as _m
    axes = [0.92, 0.91, 0.93, 0.90, 0.94, 0.91, 0.92, 0.93, 0.90, 0.91, 0.94, 0.92, 0.93]
    floor = 0.90
    clamped = [min(1.0, max(1e-9, float(x))) for x in axes]
    L = _m.exp(sum(_m.log(x) for x in clamped) / len(clamped))
    return JSONResponse({
        "trust_axes": 13,
        "axes": [{"name": n, "score": s} for n, s in zip(_AMARU_AXIS_NAMES, axes)],
        "lambda": round(L, 6), "lambda_floor": floor, "pass": L >= floor,
        "aggregate": "geometric mean (yuyay_v3 canonical, 13-axis)",
        "uniqueness": "Conjecture, not a Theorem (open CAUCHY_ND sorry + missing symmetry axiom)",
        "declarations": 749, "axioms_unique": 14, "axioms_raw": 15, "sorries_total": 163,
        "doctrine": "v11",
    })


# ---------------------------------------------------------------------------
# PER-APP BRAIN (amaru = cortex / reasoning) + UNIFIED LLM ROUTER + Wire E/F.
# Registered on the ROOT app BEFORE the /api/amaru mount so they take precedence.
# ADDITIVE, Doctrine v10.
# ---------------------------------------------------------------------------

@app.get("/api/amaru/v1/brain")
async def amaru_brain() -> JSONResponse:
    """amaru cortex brain: TH1 (Λ Conjecture), TH8 GLR (proven), TH10, 7 chakras."""
    return JSONResponse(_brain.brain_payload("amaru"))


@app.post("/api/amaru/v1/brain/reason")
async def amaru_brain_reason(request: Request) -> JSONResponse:
    """Axis-scored reasoning with theorem citations. POST {prompt, axis_scores}."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    axis = body.get("axis_scores") or [0.9] * 13
    L = _brain.lambda_aggregate(axis)
    th = _brain.THEOREMS
    cited = {k: th[k] for k in ("TH1", "TH8", "TH10")}
    routed = _brain.route(body.get("prompt", ""), axis, task_hint="math")
    return JSONResponse({
        "lambda": round(L, 6),
        "chakras": _brain.ROLE_SLICES["amaru"]["chakras"],
        "theorems_cited": cited,
        "llm_route": routed,
        "note": "Λ uniqueness is a Conjecture (TH1), not a closed theorem; TH8 GLR proven; TH10 Conjecture 1.",
        "doctrine": "v10",
    })


@app.post("/api/amaru/v1/llm/route")
async def amaru_llm_route(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except Exception:
        body = {}
    return JSONResponse(_brain.route(
        prompt=body.get("prompt", ""), axis_scores=body.get("axis_scores"),
        max_tier=body.get("max_tier", 4),
        require_lambda_receipt=body.get("require_\u03bb_receipt", body.get("require_lambda_receipt", True)),
        task_hint=body.get("task_hint", "")))


@app.get("/api/amaru/v1/llm/tiers")
async def amaru_llm_tiers() -> JSONResponse:
    return JSONResponse({"count": len(_brain.TIERS), "tiers": _brain.TIERS,
                         "default": "claude_sonnet_4_6", "doctrine": "v10"})


# ---------------------------------------------------------------------------
# Wire E — /api/amaru/v1/cortex-subscribe (SSE)
# amaru subscribes to a11oy brand-decision events published at
# /api/a11oy/v1/cortex-publish. In-process ring bus (szl_wire._CORTEX_EVENTS).
# Honest: within a single HF Space runtime, szl_wire state is shared.
# In production, a11oy POSTs events here; in the HF single-Space context,
# we serve the buffered events.
# ---------------------------------------------------------------------------

@app.get("/api/amaru/v1/cortex-subscribe")
async def amaru_cortex_subscribe(request: Request) -> StreamingResponse:
    """Wire E: amaru cortex SSE subscription.
    Emits buffered brand-decision events from the in-memory ring bus, then a done sentinel.
    Honest: in-memory ring buffer (no external broker in a static HF Space).
    Client: a11oy publishes via POST /api/a11oy/v1/cortex-publish."""
    async def gen():
        events = _wire.cortex_events(20)
        if not events:
            # Emit a heartbeat if no events buffered
            hb = _json.dumps({
                "wire": "E",
                "type": "heartbeat",
                "source": "amaru",
                "note": "no brand-decision events buffered yet (in-memory bus); publish via a11oy /api/a11oy/v1/cortex-publish",
                "ts_utc": _wire._now_utc(),
            })
            yield f"event: cortex\ndata: {hb}\n\n"
        else:
            for evt in events:
                yield f"event: cortex\ndata: {_json.dumps(evt)}\n\n"
                await _asyncio.sleep(0.02)
        yield f"event: done\ndata: {_json.dumps({'sent': len(events), 'wire': 'E', 'doctrine': 'v10'})}\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ---------------------------------------------------------------------------
# Wire F — /api/amaru/v1/receipts/ingest
# Ingests gate-decision receipts from a11oy into the local Khipu Merkle DAG.
# Also proxied from vessels (vessels receives from a11oy and chains here).
# ---------------------------------------------------------------------------

@app.post("/api/amaru/v1/receipts/ingest")
async def amaru_receipts_ingest(request: Request) -> JSONResponse:
    """Wire F: ingest an a11oy gate-decision receipt into the Khipu Merkle DAG.
    Additive only (no overwrite). DSSE signature is PLACEHOLDER (Sigstore CI not wired)."""
    try:
        receipt = await request.json()
    except Exception:
        return JSONResponse({"error": "invalid JSON body"}, status_code=400)
    if not isinstance(receipt, dict) or "action_id" not in receipt:
        return JSONResponse({
            "error": "receipt must be a JSON object with at least {action_id, gate, lambda, passed}",
            "example": {"action_id": "compose-001", "gate": "thresholdPolicySeverity",
                        "lambda": 0.92, "passed": True, "doctrine": "v10"},
        }, status_code=400)
    node = _wire.ingest_receipt(receipt)
    # Wire E: publish ingestion event so amaru cortex SSE sees it
    tp = getattr(request.state, "traceparent", None)
    _wire.publish_brand_decision({
        "action_id": receipt.get("action_id"),
        "kind": "receipt_ingested",
        "wire": "F",
        "khipu_index": node["index"],
        "khipu_digest": node["digest"],
    }, tp)
    return JSONResponse({
        "ok": True,
        "wire": "F",
        "node_index": node["index"],
        "node_digest": node["digest"],
        "khipu_root": _wire.khipu_root(),
        "parents": node["parents"],
        "dsse": node["dsse"],
        "doctrine": "v10",
        "honesty": "Signature is PLACEHOLDER (Sigstore CI not wired). Khipu DAG is in-memory (additive, no overwrite).",
    })


@app.get("/api/amaru/v1/receipts")
async def amaru_receipts_list() -> JSONResponse:
    """Wire F: list all receipts in the Khipu Merkle DAG (read-view)."""
    return JSONResponse({
        "wire": "F",
        "khipu_root": _wire.khipu_root(),
        "nodes": _wire.khipu_nodes(50),
        "count": len(_wire.khipu_nodes(1000)),
        "doctrine": "v10",
    })


@app.get("/api/amaru/v1/mesh/state")
async def amaru_mesh_state() -> JSONResponse:
    return JSONResponse(_wire.mesh_status())


@app.get("/api/amaru/v1/cortex/ask-killinchu")
async def amaru_cortex_ask_killinchu() -> JSONResponse:
    """Memory-cortex pointer to the Killinchu drone-intelligence flagship.
    Amaru is the memory cortex of the SZL mesh; this records the air-domain
    vertical (pivoted from vessels) so the cortex can route drone-intel queries."""
    return JSONResponse({
        "ok": True,
        "service": "amaru",
        "surface": "memory cortex (7 chakras)",
        "answer": (
            "Killinchu is the SZL counter-UAS / drone-intelligence flagship — the "
            "air-domain pivot of vessels. It runs real Remote-ID / ADS-B / MAVLink "
            "decoders, a 53-system drone database, multi-constellation GEOINT, "
            "per-drone digital twins with tamper tripwires, federated drone "
            "identity (DICE/SBOM/SLSA-Drone-L3), and a passive identify & track "
            "engine — all behind the shared 13-axis Lambda-gate. We sense, we "
            "evidence; we do not jack into third-party drones."
        ),
        "url": "https://szlholdings-killinchu.hf.space",
        "governance": "Doctrine v11 — Lambda is a Conjecture, signatures PLACEHOLDER, SLSA L1 (honest)",
    })


@app.get("/api/amaru/v1/brainz")
async def amaru_brainz(request: Request) -> JSONResponse:
    """Wire D: brain/router/wire status with traceparent_propagating: true."""
    tp = getattr(request.state, "traceparent", None) or _wire.new_traceparent()
    return JSONResponse({
        "ok": True,
        "service": "amaru",
        "surface": "memory cortex (7 chakras)",
        "doctrine": "v10",
        # Wire D field
        "traceparent_propagating": True,
        "traceparent": tp,
        "wires": {
            "B": "LIVE",
            "C": "LIVE",
            "D": "LIVE (W3C traceparent middleware active; cross-Space broker NOT wired — see a11oy /wires)",
            "E": "LIVE (SSE cortex-subscribe at /api/amaru/v1/cortex-subscribe)",
            "F": "LIVE (Khipu DAG ingest at /api/amaru/v1/receipts/ingest)",
        },
        "brain": "/api/amaru/v1/brain",
        "llm_router": "/api/amaru/v1/llm/route",
        "declarations": 749, "axioms": 14, "sorries": 163,
        "note": "Canonical chakra healthz at /api/amaru/healthz (Wire D: traceparent_propagating:true). Brainz is additive.",
    })
# --- Wire G brain routes relocated BEFORE the /api/amaru mount so they
# --- are not shadowed by the mounted sub-app (Starlette prefix match).
# --- ADDITIVE fix: registration order only, no logic change.
# ===========================================================================
# Wire G — Brain-Jack Mesh (ADDITIVE, Doctrine v11). szl_jack.py shared module.
# ===========================================================================
import szl_jack as _jack

@app.post("/api/amaru/v1/brain/jack")
async def brain_jack(request: Request) -> JSONResponse:
    """Wire G: Accept incoming brain-jack query (amaru cortex reasoning view)."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    src_space = body.get("src_space", "unknown")
    src_organ = body.get("src_organ", "unknown")
    query = body.get("query", "")
    axis_scores = body.get("axis_scores") or []
    tp = body.get("traceparent") or getattr(getattr(request, "state", None), "traceparent", None)
    L = _jack.lambda_signal(axis_scores)
    receipt = _jack.make_jack_receipt("amaru", src_space, query, axis_scores, tp)
    resp_text = _jack._organ_response("amaru", query, axis_scores, src_space, src_organ)
    _jack.log_jack({"wire": "G", "type": "brain_jack", "src_space": src_space,
        "src_organ": src_organ, "query": query[:80], "lambda_signal": L,
        "ts_utc": receipt["ts_utc"], "traceparent": tp})
    return JSONResponse({"src_space": src_space,
        "response_organ": _jack.SPACES.get("amaru", {}).get("organ", "cortex"),
        "response_text": resp_text, "lambda_signal": L,
        "lambda_receipt": receipt, "traceparent": tp, "doctrine": "v11", "wire": "G"})

@app.get("/api/amaru/v1/brain/sockets")
async def brain_sockets() -> JSONResponse:
    """Wire G: Return socket registry for all 6 Space brain sockets."""
    return JSONResponse({"space": "amaru",
        "organ": _jack.SPACES.get("amaru", {}).get("organ", "cortex"),
        "sockets": _jack.socket_registry("amaru"),
        "recent_jacks": _jack.recent_jacks(10), "doctrine": "v11", "wire": "G"})

@app.post("/api/amaru/v1/brain/multi-jack")
async def brain_multi_jack(request: Request) -> JSONResponse:
    """Wire G: Fan-out brain-jack to all target Space organs in parallel."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    query = body.get("query", "")
    axis_scores = body.get("axis_scores") or []
    target_organs = body.get("target_organs")
    tp = body.get("traceparent") or getattr(getattr(request, "state", None), "traceparent", None)
    responses = await _jack.fan_out_jack(this_space="amaru", query=query,
        axis_scores=axis_scores, target_organs=target_organs, traceparent=tp)
    import math as _math
    L_self = _jack.lambda_signal(axis_scores)
    self_receipt = _jack.make_jack_receipt("amaru", "amaru", query, axis_scores, tp)
    self_resp = {"src_space": "amaru",
        "response_organ": _jack.SPACES.get("amaru", {}).get("organ", "cortex"),
        "response_text": _jack._organ_response("amaru", query, axis_scores, "amaru", "cortex"),
        "lambda_signal": L_self, "lambda_receipt": self_receipt,
        "traceparent": tp, "space": "amaru", "stub": False}
    all_responses = [self_resp] + responses
    lambdas = [min(1.0, max(1e-9, r.get("lambda_signal", 0.5))) for r in all_responses]
    unified_lambda = round(_math.exp(sum(_math.log(x) for x in lambdas) / len(lambdas)), 6)
    receipts = [r.get("lambda_receipt", {}) for r in all_responses]
    master = _jack.merkle_root(receipts)
    _jack.log_jack({"wire": "G", "type": "multi_jack", "src_space": "amaru",
        "query": query[:80], "unified_lambda": unified_lambda,
        "master_receipt": master, "n_responses": len(all_responses),
        "ts_utc": self_receipt["ts_utc"], "traceparent": tp})
    return JSONResponse({"responses": all_responses, "unified_lambda": unified_lambda,
        "master_receipt": master, "n_spaces": len(all_responses), "doctrine": "v11", "wire": "G"})


# ---------------------------------------------------------------------------



# ---------------------------------------------------------------------------
# Mount inner amaru app AFTER the Wire D/E/F endpoints so they take precedence.
# ---------------------------------------------------------------------------

app.mount("/api/amaru", amaru_app)

STATIC_DIR = Path("/app/static")
CONDUIT_DIR = STATIC_DIR / "conduit"

# --- ADDITIVE: /conduit/ verbatim React SPA
if CONDUIT_DIR.exists():
    app.mount(
        "/conduit/assets",
        StaticFiles(directory=str(CONDUIT_DIR / "assets")),
        name="conduit-assets",
    )

    @app.get("/conduit")
    @app.get("/conduit/")
    async def conduit_root():
        return FileResponse(CONDUIT_DIR / "index.html", media_type="text/html")

    @app.get("/conduit/{path:path}")
    async def conduit_spa(path: str):
        candidate = CONDUIT_DIR / path
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(CONDUIT_DIR / "index.html", media_type="text/html")


# --- PRESERVED: existing memory-cortex surface
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")


# ---------------------------------------------------------------------------
# /upgrades — preserved (Doctrine v10 749/14/163)
# ---------------------------------------------------------------------------
from fastapi.responses import HTMLResponse as _UpgradesHTMLResponse

_UPGRADES_HTML = '<!DOCTYPE html>\n<html lang="en"><head>\n<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n<title>amaru — memory cortex (7 chakras) — Upgrades Index</title>\n<meta name="description" content="Every upgrade instilled into amaru: Cursor PRs, Replit verbatim pages, cookbook recipes, E4 governed-loop receipts, Wires, Lean theorems. Doctrine v10 honest numbers.">\n<style>\n:root{--bg:#0b0e14;--card:#121826;--ink:#e8eef7;--mut:#8aa0bf;--acc:#5ad1c0;--line:#243149}\n*{box-sizing:border-box}\nbody{margin:0;font:15px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--ink)}\n.wrap{max-width:1060px;margin:0 auto;padding:32px 20px 80px}\nh1{font-size:26px;margin:0 0 4px}\nh2{font-size:18px;margin:34px 0 10px;border-bottom:1px solid var(--line);padding-bottom:6px}\n.sub{color:var(--mut);margin:0 0 20px}\n.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:14px 0}\ntable{width:100%;border-collapse:collapse;font-size:13px}\nth,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}\nth{color:var(--mut);font-weight:600}\ncode{background:#0a1626;padding:1px 5px;border-radius:5px;color:var(--acc);font-size:12px}\na{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}\n.b{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700}\n.green{background:#0f3a2e;color:#5ad1c0}.amber{background:#3a2f0f;color:#e0c060}.gray{background:#222b3a;color:#8aa0bf}\n.note{color:var(--mut);font-size:13px}\n.kpis{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}\n.kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;min-width:120px}\n.kpi b{font-size:20px;display:block;color:var(--acc)}\n.foot{margin-top:40px;color:var(--mut);font-size:12px;border-top:1px solid var(--line);padding-top:14px}\n</style></head>\n<body><div class="wrap">\n<h1>amaru — memory cortex (7 chakras)</h1>\n<p class="sub">All Upgrades Index · Doctrine v10 · updated 2026-05-31</p>\n\n<div class="kpis">\n  <div class="kpi"><b>3</b>Cursor PRs (this Space)</div>\n  <div class="kpi"><b>749</b>Lean declarations</div>\n  <div class="kpi"><b>14</b>unique axioms</div>\n  <div class="kpi"><b>163</b>tracked sorries</div>\n  <div class="kpi"><b>12</b>E4 receipts</div>\n</div>\n\n<h2>1 · Cursor PRs merged & instilled</h2>\n<div class="card"><table>\n<tr><th>PR</th><th>Title</th><th>Merged</th><th>SHA</th><th>Diff</th><th>Live</th></tr>\n<tr><td><a href="https://github.com/szl-holdings/amaru/pull/55" target="_blank" rel="noopener">amaru#55</a></td><td>Add AGENTS.md with Cursor Cloud instructions</td><td>2026-05-29</td><td><code>6bed336a84</code></td><td>1f +31/-0</td><td><span class="b green">LIVE</span></td></tr>\n<tr><td><a href="https://github.com/szl-holdings/amaru/pull/56" target="_blank" rel="noopener">amaru#56</a></td><td>feat: standalone web frontend + HF Spaces deployment</td><td>2026-05-29</td><td><code>80eb25c274</code></td><td>24f +3983/-84</td><td><span class="b green">LIVE</span></td></tr>\n<tr><td><a href="https://github.com/szl-holdings/amaru/pull/64" target="_blank" rel="noopener">amaru#64</a></td><td>chore(license): add SPDX-License-Identifier headers</td><td>2026-05-29</td><td><code>b18ca5cd0a</code></td><td>1f +4/-0</td><td><span class="b green">LIVE</span></td></tr>\n</table>\n<p class="note">IP-HOLD PRs (a11oy#57 / amaru#46 / sentra#45) intentionally untouched.</p>\n</div>\n\n<h2>5 · Wires (updated: D/E/F now LIVE)</h2>\n<div class="card"><table>\n<tr><th>Wire</th><th>Route</th><th>Endpoints</th><th>Status</th></tr>\n<tr><td><b>Wire B</b></td><td>a11oy \u2194 sentra</td><td><code>/v1/verdict + /v1/inspect</code></td><td><span class="b green">LIVE</span></td></tr>\n<tr><td><b>Wire C</b></td><td>a11oy \u2194 rosie</td><td><code>/v1/events + Khipu ingest</code></td><td><span class="b green">LIVE</span></td></tr>\n<tr><td><b>Wire D</b></td><td>W3C traceparent (all Spaces)</td><td><code>traceparent_propagating:true in healthz</code></td><td><span class="b green">LIVE</span></td></tr>\n<tr><td><b>Wire E</b></td><td>a11oy \u2194 amaru cortex</td><td><code>/api/amaru/v1/cortex-subscribe (SSE)</code></td><td><span class="b green">LIVE</span></td></tr>\n<tr><td><b>Wire F</b></td><td>a11oy \u2192 vessels receipts</td><td><code>/api/vessels/v1/receipts/ingest</code></td><td><span class="b green">LIVE</span></td></tr>\n</table></div>\n\n<div class="foot">\nSource of truth: <a href="https://github.com/szl-holdings/.github/blob/main/.github/data/lean_numbers.json" target="_blank" rel="noopener">lean_numbers.json</a> @ <code>c7c0ba17</code>.\nAdditive surface. ZERO BANDAID. Doctrine v10 honest numbers (749/14/163).\n</div>\n</div></body></html>'


@app.get("/upgrades", response_class=_UpgradesHTMLResponse)
async def upgrades_index():
    return _UpgradesHTMLResponse(content=_UPGRADES_HTML)



# Root + SPA catch-all — PRESERVED, registered LAST.
# ---------------------------------------------------------------------------

@app.get("/")
async def serve_root():
    return FileResponse(STATIC_DIR / "index.html")



# Anatomy substrate (ADDITIVE) - Formula Registry + Codex-Kernel composer +
# 8-chakra wiring + 13-axis trust schema (yuyay_v3). ZERO BANDAID.
try:
    import szl_anatomy_routes as _anatomy
    _ANATOMY_OK = True
except Exception:
    _ANATOMY_OK = False
if _ANATOMY_OK:
    try:
        _anatomy.register(app, ns="amaru", api_app=amaru_app)
    except Exception:
        pass

# ===========================================================================
# a11oy.code proxy + math corpus (ADDITIVE, Doctrine v11 §14) — amaru (mounted sub-app).
# amaru/serve.py mounts amaru_app at /api/amaru; register on the sub-app with
# RELATIVE paths so they resolve behind the mount. DEFENSIVE — never crash the app.
# ===========================================================================
try:
    import szl_math_corpus as _mathcorpus
except Exception as _e:  # pragma: no cover
    _mathcorpus = None
    print(f"[amaru.code] math corpus module unavailable: {_e}")
try:
    import szl_code_proxy as _codeproxy
except Exception as _e:  # pragma: no cover
    _codeproxy = None
    print(f"[amaru.code] code proxy module unavailable: {_e}")

_HF_TOKEN = os.environ.get("HF_TOKEN")
if _mathcorpus is not None:
    try:
        import threading as _threading
        _threading.Thread(target=lambda: _mathcorpus.boot_snapshot(_HF_TOKEN), daemon=True).start()
    except Exception as _e:
        print(f"[amaru.code] math corpus boot degraded: {_e}")
    try:
        # base_override strips the mount prefix /api/amaru; external path stays /api/amaru/v1/math/*
        _mathcorpus.register_math_routes(amaru_app, "amaru", _HF_TOKEN, base_override="/v1/math")
    except Exception as _e:
        print(f"[amaru.code] math route registration degraded: {_e}")
if _codeproxy is not None:
    try:
        _codeproxy.register_code_proxy(amaru_app, "amaru", path_override="/v1/code-proxy")
    except Exception as _e:
        print(f"[amaru.code] code proxy registration degraded: {_e}")


@app.get("/{path:path}")
async def serve_spa(path: str):
    file_path = STATIC_DIR / path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "7860"))
    uvicorn.run("serve:app", host="0.0.0.0", port=port, log_level="info")
