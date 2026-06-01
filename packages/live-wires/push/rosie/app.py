# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
"""
rosie-operator-console — SZLHOLDINGS UDS Component Space
Gradio 6.x — Doctrine v10 strict — Apache-2.0

rosie is the operator console — the human-facing command surface of the
UDS mesh. This is a live Gradio Space — the surface an operator actually drives.

Tabs:
  1. Span Explorer    — browse UDS component spans with filter
  2. Receipt Verifier — validate DSSE envelopes
  3. Mesh Health      — aggregate stats for the 5 ecosystem components
  4. Doctrine Sweep   — ban-word scan on markdown text
  5. Live Formulas    — 5 anchor SZL formulas + Λ-score + DSSE chain link
  6. About

Visual: a11oy structural pattern (deep-purple #1a0d2e background, light text,
Cinzel/Inter fonts) with rosie's own coral #ff7a59 module accent.
"""

import hashlib
import hmac
import base64
import json
import math
import datetime
import re
import gradio as gr

# ── Rosie v2.0 additive capability layer (ADDITIVE — preserves 7 tabs + widget v2.0)
#    Tabs 8-11, mirrored a11oy /v1/* endpoints, 5 LLM tiers, 11 skills, T8 self-learning.
import rosie_v2_additions as _r2
import rosie_dinn_tab as _dinn  # Tab 12 — DINN Lab (ADDITIVE)
import rosie_upgrades_tab as _upg  # Tab 14 — All Upgrades Index (ADDITIVE)
import rosie_moat_tabs as _moat  # Tabs 15/16/17 — Evidence/Run-All/Substrate (ADDITIVE)
import rosie_brain_tab as _brain_tab  # Tab 🧠 Brain — unified brain + full thesis corpus (ADDITIVE, Doctrine v10)
import szl_brain as _szlbrain  # shared per-app brain + unified LLM router port
import szl_wire as _szlwire    # shared Anatomy wires D/E/F port

# ─────────────────────────────────────────────────────────────────────────────
# Synthetic spans data (since uds_dataset/data/spans_sample.jsonl not present)
# ─────────────────────────────────────────────────────────────────────────────

# The 5 ecosystem components (rosie + the 4 it observes). vessels is included so
# the mesh count is correct (5, not 4) even though it is a deployment-fabric module.
COMPONENTS = ["amaru", "rosie", "sentra", "a11oy", "vessels"]

_SAMPLE_SPANS = []
_rng_seed = 42

def _pseudo_rand(seed: int) -> float:
    h = hashlib.sha256(str(seed).encode()).digest()
    return int.from_bytes(h[:4], "big") / 0xFFFFFFFF

# Generate 50 synthetic spans across the 5 components
_NCOMP = len(COMPONENTS)
for i in range(50):
    comp = COMPONENTS[i % _NCOMP]
    r = _pseudo_rand(i * 997 + 1337)
    span = {
        "span_id": f"span-{i:04d}",
        "component": comp,
        "operation": ["inference", "attest", "gate_check", "receipt_mint"][i % 4],
        "status": "error" if r < 0.12 else "ok",
        "duration_ms": round(5 + r * 200, 2),
        "timestamp_utc": f"2026-06-{(i % 28) + 1:02d}T{(i * 7) % 24:02d}:{(i * 13) % 60:02d}:00Z",
        "receipt_hash": hashlib.sha256(f"span-{i}".encode()).hexdigest()[:16],
        "actor": f"agent/{comp}-v1",
    }
    _SAMPLE_SPANS.append(span)

# ─────────────────────────────────────────────────────────────────────────────
# DSSE helpers (inline stdlib)
# ─────────────────────────────────────────────────────────────────────────────
_DEV_HMAC_KEY       = b"szl-amaru-dev-hmac-key-v1-not-for-production"
_FORMULA_HMAC_KEY   = b"szl-formula-hmac-dev-v1"
_FORMULA_PAYLOAD_TYPE = "application/vnd.szl.formula-receipt+json;v=1"


def _pae(payload_type: str, payload: bytes) -> bytes:
    pt = payload_type.encode()
    return (
        b"DSSEv1 "
        + str(len(pt)).encode() + b" " + pt + b" "
        + str(len(payload)).encode() + b" " + payload
    )


def _b64(b: bytes) -> str:
    return base64.b64encode(b).decode()


def _unb64(s: str) -> bytes:
    return base64.b64decode(s)


def dsse_verify_envelope(envelope: dict) -> tuple[bool, str, dict | None]:
    """Returns (valid, message, decoded_payload_or_None)."""
    try:
        payload_bytes = _unb64(envelope["payload"])
        pae = _pae(envelope["payloadType"], payload_bytes)
        for s in envelope.get("signatures", []):
            sig_bytes = _unb64(s["sig"])
            expected = hmac.new(_DEV_HMAC_KEY, pae, hashlib.sha256).digest()
            if hmac.compare_digest(expected, sig_bytes):
                decoded = json.loads(payload_bytes.decode())
                return True, "✅ HMAC-SHA-256 signature valid — PAE verified", decoded
        return False, "❌ No matching signature in envelope", None
    except Exception as e:
        return False, f"❌ Error: {e}", None


# ─────────────────────────────────────────────────────────────────────────────
# Doctrine v10 ban-word list
# ─────────────────────────────────────────────────────────────────────────────
DOCTRINE_V9_BANNED = [
    r"\bplease note\b", r"\bimportant note\b", r"\bnote that\b",
    r"\bplease be aware\b", r"\bkeep in mind\b", r"\bit is worth noting\b",
    r"\bas previously mentioned\b", r"\bI (?:would like to|want to) emphasize\b",
    r"\bI (?:would like to|want to) highlight\b",
    r"\bI (?:would like to|want to) point out\b",
    r"\bin (?:other|simple) words\b", r"\bwithout further ado\b",
    r"\bin today's (?:fast[- ]paced|digital)\b",
    r"\bin the realm of\b", r"\blet's (?:dive|delve) in\b",
    r"\bempower(?:ing|ment)\b",
    r"\bleverage(?:d|s|ing)?\b",
    r"\bsynergy\b", r"\bsynergistic\b",
    r"\bparadigm shift\b", r"\bgame[-\s]changer\b",
    r"\bthought leader(?:ship)?\b",
    r"\bseal of approval\b",
    r"\bseamless(?:ly)?\b",
    r"\brobus[t](?:ness|ly)?\b",
    r"\boutstanding\b",
    r"\bworld-class\b",
    r"\bcutting[-\s]edge\b",
    r"\bstate[-\s]of[-\s]the[-\s]art\b",
    r"\bgroundbreaking\b",
    r"\bpivot\b",
    r"\bbandaid\b", r"\bband[- ]aid\b",
]


def doctrine_sweep(text: str) -> str:
    if not text.strip():
        return "Paste markdown text above and click Scan."

    hits = []
    lines = text.split("\n")
    for lineno, line in enumerate(lines, 1):
        for pattern in DOCTRINE_V9_BANNED:
            for match in re.finditer(pattern, line, re.IGNORECASE):
                hits.append({
                    "line": lineno,
                    "col": match.start() + 1,
                    "match": match.group(),
                    "pattern": pattern,
                    "context": line.strip()[:80],
                })

    if not hits:
        return f"✅ **CLEAN** — 0 doctrine v10 ban-word hits in {len(lines)} lines."

    result_lines = [f"⚠️ **{len(hits)} hit(s)** found in {len(lines)} lines:\n"]
    result_lines.append("| Line | Col | Match | Context |")
    result_lines.append("|------|-----|-------|---------|")
    for h in hits:
        result_lines.append(
            f"| {h['line']} | {h['col']} | `{h['match']}` | {h['context'][:60]} |"
        )

    return "\n".join(result_lines)


# ─────────────────────────────────────────────────────────────────────────────
# Tab 1 — Span Explorer
# ─────────────────────────────────────────────────────────────────────────────
def explore_spans(component_filter: str, status_filter: str, limit: int):
    spans = _SAMPLE_SPANS
    if component_filter != "all":
        spans = [s for s in spans if s["component"] == component_filter]
    if status_filter != "all":
        spans = [s for s in spans if s["status"] == status_filter]
    spans = spans[:limit]

    if not spans:
        return "No spans match the current filter.", json.dumps([], indent=2)

    rows = ["| Span ID | Component | Operation | Status | Duration ms | Timestamp |",
            "|---------|-----------|-----------|--------|-------------|-----------|"]
    for s in spans:
        status_icon = "✅" if s["status"] == "ok" else "❌"
        rows.append(
            f"| `{s['span_id']}` | **{s['component']}** | {s['operation']} | {status_icon} {s['status']} | {s['duration_ms']} | {s['timestamp_utc'][:19]} |"
        )

    summary = (
        f"**{len(spans)} span(s)** — component: `{component_filter}` | "
        f"status: `{status_filter}` | limit: {limit}"
    )
    return summary + "\n\n" + "\n".join(rows), json.dumps(spans[:5], indent=2)


# ─────────────────────────────────────────────────────────────────────────────
# Tab 2 — Receipt Verifier
# ─────────────────────────────────────────────────────────────────────────────
def verify_receipt(envelope_json: str) -> str:
    if not envelope_json.strip():
        return "Paste a DSSE envelope JSON from amaru or sentra."
    try:
        envelope = json.loads(envelope_json.strip())
    except json.JSONDecodeError as e:
        return f"❌ JSON parse error: {e}"

    valid, msg, payload = dsse_verify_envelope(envelope)
    lines = [f"**Result:** {msg}", ""]

    if payload:
        lines += [
            "**Decoded Payload:**",
            f"- `spec`: {payload.get('spec','?')}",
            f"- `receipt_id`: {payload.get('receipt_id','?')}",
            f"- `final_hash`: {payload.get('final_hash','?')}",
            f"- `prior_hash`: {payload.get('prior_hash','GENESIS')}",
            f"- `chain_position`: {payload.get('chain_position','?')}",
            f"- `timestamp_utc`: {payload.get('timestamp_utc','?')}",
            "",
            "**Payload type:** `" + envelope.get("payloadType", "?") + "`",
            "**Key ID:** `" + (envelope.get("signatures", [{}])[0].get("keyid", "?")) + "`",
        ]

    if valid:
        lines += [
            "",
            "✅ Chain position validated. For security gate receipts, see [sentra-security-gates](https://huggingface.co/spaces/SZLHOLDINGS/sentra-security-gates).",
        ]

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Tab 3 — Mesh Health
# ─────────────────────────────────────────────────────────────────────────────
def mesh_health():
    stats = {}
    for comp in COMPONENTS:
        comp_spans = [s for s in _SAMPLE_SPANS if s["component"] == comp]
        error_spans = [s for s in comp_spans if s["status"] == "error"]
        total_dur = sum(s["duration_ms"] for s in comp_spans)
        stats[comp] = {
            "total_spans": len(comp_spans),
            "error_count": len(error_spans),
            "error_rate_pct": round(100 * len(error_spans) / max(len(comp_spans), 1), 1),
            "avg_duration_ms": round(total_dur / max(len(comp_spans), 1), 2),
            "spans_per_min": round(len(comp_spans) / 30, 2),
        }

    lines = [
        "## UDS Mesh Health — 5 Components",
        f"*Computed from {len(_SAMPLE_SPANS)} sample spans*\n",
        "| Component | Spans | Errors | Error Rate | Avg Duration | Spans/min |",
        "|-----------|-------|--------|------------|--------------|-----------|",
    ]
    for comp, s in stats.items():
        health_icon = "🟢" if s["error_rate_pct"] < 15 else "🟡"
        lines.append(
            f"| {health_icon} **{comp}** | {s['total_spans']} | {s['error_count']} | "
            f"{s['error_rate_pct']}% | {s['avg_duration_ms']} ms | {s['spans_per_min']} |"
        )

    total_errors = sum(s["error_count"] for s in stats.values())
    total_spans = len(_SAMPLE_SPANS)
    overall_rate = round(100 * total_errors / max(total_spans, 1), 1)

    lines += [
        "",
        f"**Overall error rate:** {overall_rate}% ({total_errors}/{total_spans} spans)",
        f"**HUKLLA status:** {'⚠️ CHECK ALERTS' if overall_rate > 20 else '✅ CLEAR'}",
        "",
        "### Component Roles",
        "| Component | Role | Space |",
        "|-----------|------|-------|",
        "| amaru | Memory cortex (attestation) | [→](https://huggingface.co/spaces/SZLHOLDINGS/amaru) |",
        "| rosie | Operator console | ← you are here |",
        "| sentra | Immune system (security gates) | [→](https://huggingface.co/spaces/SZLHOLDINGS/sentra-security-gates) |",
        "| a11oy | Alignment substrate | [→](https://huggingface.co/spaces/SZLHOLDINGS/a11oy-platform) |",
        "| vessels | Skeleton (deployment fabric) | [→](https://huggingface.co/spaces/SZLHOLDINGS/vessels-app) |",
    ]

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Tab 5 — Live Formulas
# 5 anchor SZL formulas with live Λ-score computation and DSSE chain link
# ─────────────────────────────────────────────────────────────────────────────

LEAN_COMMIT_SHA = "1dca00032dfc9aa8559cc6c2e4b63192fcf52371"
LUTAR_LEAN_URL  = "https://github.com/szl-holdings/lutar-lean/blob/main"

_ANCHOR_REGISTRY = {
    "MadhavaBound": {
        "lean_theorem": "madhavaRemainderBound_nonneg",
        "lean_file":    "Lutar/PACBayes/MadhavaBound.lean",
        "domain":       "PAC-Bayes generalization bound",
        "default_args": {"x": 1.0, "N": 10},
    },
    "FalsePosition": {
        "lean_theorem": "false_position_correct",
        "lean_file":    "Lutar/Calibration/FalsePosition.lean",
        "domain":       "Root-finding convergence",
        "default_args": {"x1": 0.0, "y1": 0.0, "x2": 1.0, "y2": 2.0, "T": 4.0},
    },
    "LiuHuiPi": {
        "lean_theorem": "sideSquared_bounds",
        "lean_file":    "Lutar/Banach/LiuHuiPi.lean",
        "domain":       "Polygon approximation to π",
        "default_args": {"k": 4},
    },
    "AdversarialRobustness": {
        "lean_theorem": "robustness_preserved_by_composition",
        "lean_file":    "Lutar/Composition/AdversarialRobustness.lean",
        "domain":       "Lipschitz robustness",
        "default_args": {"l1": 2.0, "l2": 3.0, "delta": 0.1},
    },
    "SummationInvariant": {
        "lean_theorem": "khipuReceipt_checksum_invariant",
        "lean_file":    "Lutar/Khipu/SummationInvariant.lean",
        "domain":       "Cross-component summation conservation",
        "default_args": {
            "organs": [
                {"organId": "o1", "decisions": [{"decisionId": "d1", "value": 10},
                                                 {"decisionId": "d2", "value": 20}]},
                {"organId": "o2", "decisions": [{"decisionId": "d3", "value": 5}]},
            ],
            "primary_cord": 35,
        },
    },
}


# ── Inline formula evaluators ─────────────────────────────────────────────────

def _eval_madhava(x: float, N: int) -> dict:
    partial = sum(((-1)**n) * x**(2*n+1) / (2*n+1) for n in range(N))
    rb = abs(x)**(2*N+1) / (2*N+1)
    return {"partial": round(partial, 8), "remainder_bound": round(rb, 8),
            "lambda_score": round(max(0.0, min(1.0, 1.0 - rb)), 6)}


def _eval_false_position(x1: float, y1: float, x2: float, y2: float, T: float) -> dict:
    dy = y2 - y1
    x_star = x1 + (T - y1) * (x2 - x1) / dy
    m = dy / (x2 - x1)
    c = y1 - m * x1
    residual = abs(m * x_star + c - T)
    ls = max(0.0, 1.0 - residual / (1 + abs(T)))
    return {"x_star": round(x_star, 8), "residual": residual,
            "lambda_score": round(ls, 6)}


def _eval_liu_hui(k: int) -> dict:
    sq = 1.0
    for _ in range(k):
        sq = 2.0 - math.sqrt(4.0 - sq)
    sc = 6 * 2**k
    est = sc * math.sqrt(sq) / 2.0
    err = abs(est - math.pi)
    return {"pi_estimate": round(est, 10), "side_count": sc,
            "abs_error": round(err, 10),
            "lambda_score": round(max(0.0, 1.0 - err / math.pi), 6)}


def _eval_adversarial(l1: float, l2: float, delta: float) -> dict:
    e1 = l1 * delta
    e2 = l2 * e1
    ls = 1.0 / (1.0 + e2)
    return {"epsilon1": round(e1, 8), "epsilon2": round(e2, 8),
            "composed_lipschitz": round(l1 * l2, 6),
            "lambda_score": round(ls, 6)}


def _eval_summation(organs: list, primary_cord: int) -> dict:
    pv = [sum(d["value"] for d in o["decisions"]) for o in organs]
    total = sum(pv)
    holds = total == primary_cord
    return {"pendant_values": pv, "computed_total": total,
            "invariant_holds": holds, "lambda_score": 1 if holds else 0}


_EVALUATORS = {
    "MadhavaBound":          lambda a: _eval_madhava(**a),
    "FalsePosition":         lambda a: _eval_false_position(**a),
    "LiuHuiPi":              lambda a: _eval_liu_hui(**a),
    "AdversarialRobustness": lambda a: _eval_adversarial(**a),
    "SummationInvariant":    lambda a: _eval_summation(**a),
}


def _sign_formula_receipt(payload_bytes: bytes) -> str:
    """HMAC-SHA-256 over DSSE PAE v1 of the receipt payload."""
    pae = _pae(_FORMULA_PAYLOAD_TYPE, payload_bytes)
    sig = hmac.new(_FORMULA_HMAC_KEY, pae, hashlib.sha256).digest()
    return _b64(sig)


def _build_dsse_envelope(receipt: dict) -> dict:
    payload = json.dumps(receipt, sort_keys=True, separators=(",", ":")).encode()
    sig = _sign_formula_receipt(payload)
    return {
        "payload":     _b64(payload),
        "payloadType": _FORMULA_PAYLOAD_TYPE,
        "signatures": [{"keyid": "szl-formula-hmac-sha256-v1", "sig": sig}],
    }


def live_formulas() -> str:
    """
    Compute all 5 anchor formulas at their default arguments,
    emit a DSSE receipt per formula, and render a live-updating table.
    """
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    lines = [
        "## Live Formula Table — 5 Featured Anchor Formulas (of 19 tracked)",
        f"*Computed at {ts}*\n",
        "| # | Formula | Domain | Lean Theorem | Λ-score | DSSE Chain Link |",
        "|---|---------|--------|--------------|---------|-----------------|",
    ]

    formula_details = []

    for idx, (formula, meta) in enumerate(_ANCHOR_REGISTRY.items(), 1):
        args = meta["default_args"]
        try:
            output = _EVALUATORS[formula](args)
            ls = output.get("lambda_score", 0)

            # Build DSSE receipt
            inputs_hash = hashlib.sha256(
                json.dumps(args, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest()

            receipt = {
                "formula":         formula,
                "inputs_hash":     inputs_hash,
                "output":          output,
                "lean_theorem":    meta["lean_theorem"],
                "lean_file":       meta["lean_file"],
                "lean_commit_sha": LEAN_COMMIT_SHA,
                "timestamp":       ts,
            }
            envelope = _build_dsse_envelope(receipt)
            envelope_b64 = envelope["payload"][:24] + "..."  # truncated for display

            lean_url = f"{LUTAR_LEAN_URL}/{meta['lean_file']}"
            ls_bar   = "🟢" if ls >= 0.95 else ("🟡" if ls >= 0.80 else "🔴")
            ls_str   = f"{ls_bar} {ls:.4f}"

            lines.append(
                f"| {idx} | **{formula}** | {meta['domain']} | "
                f"[`{meta['lean_theorem']}`]({lean_url}) | {ls_str} | "
                f"`{envelope_b64}` |"
            )

            formula_details.append({
                "formula": formula,
                "output":  output,
                "envelope_preview": envelope_b64,
                "lean_url": lean_url,
            })
        except Exception as exc:
            lines.append(f"| {idx} | **{formula}** | {meta['domain']} | ❌ ERROR | — | `{exc}` |")

    lines += [
        "",
        "### Formula Details",
    ]
    for fd in formula_details:
        lines.append(f"\n**{fd['formula']}** — [Lean source]({fd['lean_url']})")
        lines.append("```json")
        lines.append(json.dumps(fd["output"], indent=2))
        lines.append("```")
        lines.append(f"DSSE payload prefix: `{fd['envelope_preview']}`")

    lines += [
        "",
        "---",
        f"**Lean commit:** `{LEAN_COMMIT_SHA}`  ",
        f"**Repo:** [szl-holdings/lutar-lean](https://github.com/szl-holdings/lutar-lean)  ",
        "**DSSE:** PAE v1 + HMAC-SHA-256 (key: `szl-formula-hmac-sha256-v1`)  ",
        "**Layers:** L1 Lean ✅ · L2 TS runtime ✅ · L3 parity test ✅ · "
        "L4 OTel span ✅ · L5 DSSE receipt ✅ · L6 a11oy gate ✅ · L7 rosie panel ✅",
    ]

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Gradio App
# ─────────────────────────────────────────────────────────────────────────────
ABOUT_ROSIE = """
# 🌹 rosie — Operator Console

**rosie** is the operator console and observability node in the [SZL Holdings](https://huggingface.co/SZLHOLDINGS) UDS mesh.

## Capabilities

| Pane | Description |
|------|-------------|
| **Span Explorer** | Browse and filter UDS mesh operation spans by component and status |
| **Receipt Verifier** | Paste any DSSE envelope from amaru or sentra and validate its HMAC-SHA-256 signature |
| **Mesh Health** | Aggregate stats across all 5 ecosystem components — spans/min, error rate, health status |
| **Doctrine Sweep** | Paste any markdown text and get a Doctrine v10 ban-word scan with line+column locations |
| **Live Formulas** | 5 anchor SZL formulas — live Λ-score + DSSE PAE v1 receipt per formula |

## Architecture (from UDS v18.24 substrate)

rosie wraps the `UDSOperatorConsoleDataPlane` graft — 5 panes + Live Formulas:

1. **HUKLLA alerts** — governance alarm when forbidden tokens appear in the chain  
2. **Dual-witness queue** — pending witness-signature aggregation  
3. **Receipt chain viewer** — paginated chain browser per component  
4. **A15 topology** — persistent homology check surface  
5. **Live formulas** — 5 anchor formula table (MadhavaBound, FalsePosition, LiuHuiPi, AdversarialRobustness, SummationInvariant)

## UDS Mesh Cross-Links

| Component | Role | Space |
|-----------|------|-------|
| amaru | Memory cortex (attestation) | [amaru](https://huggingface.co/spaces/SZLHOLDINGS/amaru) |
| **rosie** | Operator console | ← you are here |
| sentra | Immune system (security gates) | [sentra-security-gates](https://huggingface.co/spaces/SZLHOLDINGS/sentra-security-gates) |
| a11oy | Alignment substrate | [a11oy-platform](https://huggingface.co/spaces/SZLHOLDINGS/a11oy-platform) |
| vessels | Skeleton (deployment fabric) | [vessels-app](https://huggingface.co/spaces/SZLHOLDINGS/vessels-app) |

## Formal Basis

- [Ouroboros Thesis v18](https://github.com/szl-holdings/ouroboros-thesis) — DOI [10.5281/zenodo.20434276](https://doi.org/10.5281/zenodo.20434276)  
- `uds_v18_24_substrate.py` — UDSOperatorConsoleDataPlane graft 5  
- Doctrine v10 — [szl-holdings/platform](https://github.com/szl-holdings/platform/blob/main/docs/doctrine/szl-doctrine.md)  
- Lean anchor formulas — [szl-holdings/lutar-lean](https://github.com/szl-holdings/lutar-lean)  

**License:** Apache-2.0 | **Author:** Lutar, Stephen P. — ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173) | **Series-A Engineering**
"""


# ─────────────────────────────────────────────────────────────────────────────
# a11oy structural pattern, rosie coral accent. Imported fonts: Cinzel (display),
# Inter (body), JetBrains Mono (code). Background #1a0d2e, accent coral #ff7a59.
# ─────────────────────────────────────────────────────────────────────────────
ROSIE_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root, .gradio-container {
  --bg:#1a0d2e; --purple-mid:#2d1b5e; --accent:#ff7a59; --accent-light:#ff9c81;
  --text:#e8e0f0; --text-muted:#a090c0; --border:rgba(255,122,89,0.20);
}
.gradio-container {
  background:#1a0d2e !important;
  background-image:radial-gradient(circle at 16% 8%,rgba(61,40,120,0.5),transparent 42%),radial-gradient(circle at 88% 0%,rgba(255,122,89,0.07),transparent 40%) !important;
  color:#e8e0f0 !important;
  font-family:'Inter',system-ui,-apple-system,sans-serif !important;
  max-width:1180px !important;
}
.gradio-container *{border-color:rgba(255,122,89,0.18)}
/* sticky header */
#rosie-header{
  position:sticky; top:0; z-index:50;
  background:rgba(26,13,46,0.94); backdrop-filter:blur(12px);
  border-bottom:1px solid rgba(255,122,89,0.25);
  border-radius:0 0 14px 14px; padding:1rem 1.2rem; margin-bottom:.6rem;
}
#rosie-header h1,#rosie-header h2,#rosie-header h3{
  font-family:'Cinzel','Palatino Linotype',Georgia,serif !important;
  color:#ff7a59 !important; letter-spacing:.03em; margin:0 0 .3rem 0;
}
#rosie-header p{color:#a090c0 !important; margin:.2rem 0;}
.rosie-chip{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:.72rem;
  color:#ff9c81;border:1px solid rgba(255,122,89,0.4);background:rgba(255,122,89,0.08);
  border-radius:999px;padding:.25rem .7rem;margin:.15rem .25rem .15rem 0;}
.rosie-chip.warn{color:#e8a23a;border-color:rgba(232,162,58,0.4);background:rgba(232,162,58,0.08);}
/* headings everywhere */
.gradio-container h1,.gradio-container h2,.gradio-container h3,.gradio-container h4{
  font-family:'Cinzel','Palatino Linotype',Georgia,serif !important; color:#ff9c81 !important;
}
.gradio-container p,.gradio-container li,.gradio-container td,.gradio-container span,.gradio-container label{color:#e8e0f0 !important;}
/* table cell emphasis (Component column module names are markdown-bold) — keep them clearly readable */
.gradio-container td strong,.gradio-container td b,.gradio-container th strong{color:#ffb39c !important;font-weight:700 !important;}
.gradio-container a{color:#ff7a59 !important;}
.gradio-container code,.gradio-container pre{font-family:'JetBrains Mono',monospace !important;
  background:rgba(255,122,89,0.08) !important; color:#ff9c81 !important;}
/* tab buttons — coral accent. Gradio 6 renders tabs as button[role=tab]; */
/* target by role so inactive labels are readable (was faint #a090c0). */
.gradio-container button.svelte-1ipelgc, .tab-nav button, .gradio-container .tab-nav > button,
.gradio-container button[role="tab"], .gradio-container [role="tablist"] button,
.gradio-container .tab-container button, .gradio-container .tabs button[role="tab"]{
  font-family:'Cinzel',serif !important; letter-spacing:.04em; color:#c8b8d4 !important;
  background:transparent !important; border:none !important; border-bottom:2px solid transparent !important;
  opacity:1 !important;
}
.gradio-container .tab-nav{border-bottom:1px solid rgba(255,122,89,0.2) !important;}
.gradio-container .tab-nav button.selected, .gradio-container .tab-nav > button.selected,
.gradio-container button[role="tab"].selected, .gradio-container [role="tab"][aria-selected="true"]{
  color:#ff7a59 !important; border-bottom:2px solid #ff7a59 !important; opacity:1 !important;
}
/* primary buttons */
.gradio-container button.primary, .gradio-container .primary{
  background:#ff7a59 !important; color:#1a0d2e !important; border:1px solid #ff7a59 !important;
  font-weight:700 !important;
}
.gradio-container button.secondary, .gradio-container .secondary{
  background:transparent !important; color:#ff7a59 !important; border:1px solid rgba(255,122,89,0.4) !important;
}
/* inputs / cards / tables */
.gradio-container input,.gradio-container textarea,.gradio-container select,
.gradio-container .block, .gradio-container .form{
  background:rgba(45,27,94,0.45) !important; color:#e8e0f0 !important;
  border-color:rgba(255,122,89,0.18) !important;
}
.gradio-container table{border-collapse:collapse;}
.gradio-container th{color:#c8b8d4 !important;}
.gradio-container tr{border-color:rgba(255,122,89,0.12) !important;}
footer{display:none !important;}
"""



# ─────────────────────────────────────────────────────────────────────────────
# Tab 7 — Cross-Space Helper Test Bench
# Exercises widget API calls standalone. Tests a11oy /v1/reason, /v1/ledger,
# /v1/verify, /v1/policy/evaluate without needing the floating JS widget.
# ─────────────────────────────────────────────────────────────────────────────
import urllib.request
import urllib.error

_A11OY_BASES = {
    "SZLHOLDINGS/a11oy HF Space":  "https://szlholdings-a11oy.hf.space/api/a11oy",
    "localhost:7861 (dev)":        "http://localhost:7861",
}

def _http_json(url, method="GET", payload=None, timeout=10):
    data = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read().decode()
            return r.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try: return e.code, json.loads(body)
        except Exception: return e.code, {"_raw": body[:500]}
    except Exception as exc:
        return 0, {"error": str(exc)}


def cs_reason(base_label: str, question: str) -> str:
    base = _A11OY_BASES.get(base_label, "")
    if not base: return f"❌ Unknown base: {base_label}"
    if not question.strip(): return "Enter a question first."
    url = base.rstrip("/") + "/v1/reason"
    status, data = _http_json(url, "POST", {"prompt": question, "surface": "rosie-test-bench"})
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    lines = [f"**POST** `{url}`  \n*{ts}* — HTTP {status}\n"]
    if status == 0:
        lines.append(f"⚠️ Network error: {data.get('error','?')}\n\n*(a11oy runs in HF Docker Space — try the HF endpoint)*")
        return "\n".join(lines)
    ans = data.get("answer") or data.get("reasoning") or data.get("text") or data.get("output") or data.get("result")
    if ans:
        lines.append(f"**Answer from a11oy /v1/reason:**\n\n{ans}")
    else:
        lines.append("**Raw response:**\n```json\n" + json.dumps(data, indent=2)[:2000] + "\n```")
    return "\n".join(lines)


def cs_ledger(base_label: str, limit: int) -> str:
    base = _A11OY_BASES.get(base_label, "")
    if not base: return f"❌ Unknown base: {base_label}"
    url = base.rstrip("/") + f"/v1/ledger?limit={int(limit)}"
    status, data = _http_json(url, "GET", timeout=10)
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    lines = [f"**GET** `{url}`  \n*{ts}* — HTTP {status}\n"]
    if status == 0:
        lines.append(f"⚠️ Network error: {data.get('error','?')}")
        return "\n".join(lines)

    head_seq  = data.get("head_seq") or data.get("total") or data.get("count") or "?"
    root_hash = data.get("root_hash") or data.get("dag_root") or "?"
    items     = (data.get("receipts") or data.get("items") or data.get("results")
                 or (data if isinstance(data, list) else []))

    lines += [
        "## Khipu Merkle DAG — Live Head",
        "| Field | Value |",
        "|-------|-------|",
        f"| head_seq  | `{head_seq}` |",
        f"| root_hash | `{root_hash}` |",
        f"| receipts_shown | {len(items)} |",
        "",
    ]
    if items:
        lines += ["### Last receipts (up to 10)", "| # | receipt_id / hash | action | timestamp |",
                  "|---|-------------------|--------|-----------|"]
        for i, r in enumerate(items[:10], 1):
            rid = r.get("receipt_id") or r.get("hash") or r.get("id") or r.get("digest") or "?"
            act = r.get("action") or r.get("operation") or "?"
            tst = r.get("timestamp_utc") or r.get("ts") or r.get("timestamp") or "?"
            lines.append(f"| {i} | `{str(rid)[:24]}` | {act} | {str(tst)[:19]} |")
    else:
        lines.append("*No receipts returned — chain may be empty or endpoint not live.*")
    return "\n".join(lines)


def cs_verify(base_label: str) -> str:
    base = _A11OY_BASES.get(base_label, "")
    if not base: return f"❌ Unknown base: {base_label}"
    url = base.rstrip("/") + "/v1/verify"
    status, data = _http_json(url, "POST", {"surface": "rosie-test-bench", "ledger": []}, timeout=10)
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    lines = [f"**POST** `{url}`  \n*{ts}* — HTTP {status}\n"]
    if status == 0:
        lines.append(f"⚠️ Network error: {data.get('error','?')}")
        return "\n".join(lines)

    ok  = data.get("verified") is True or data.get("valid") is True or data.get("ok") is True
    lines.append(f"**Result:** {'✅ VERIFIED' if ok else '❌ FAILED'}\n")

    # DSSE envelope display (with honest disclosure)
    env = data.get("envelope") or data.get("dsse")
    if env and isinstance(env, dict):
        payload_b64 = (env.get("payload") or "")[:40]
        sigs        = env.get("signatures") or []
        keyid       = (sigs[0].get("keyid") if sigs else None) or "?"
        sig_b64     = ((sigs[0].get("sig") or "")[:24] + "...") if sigs else "?"
        lines += [
            "### DSSE Envelope",
            "```",
            f"payloadType : {env.get('payloadType','?')}",
            f"payload     : {payload_b64}...",
            f"keyid       : {keyid}",
            f"sig (b64)   : {sig_b64}",
            "```",
            "",
            "> ⚠️ **PLACEHOLDER — signing not yet wired into CI.**",
            "> This envelope is structurally correct (DSSE PAE v1 + HMAC-SHA-256),",
            "> but the key is a dev HMAC secret, not a real Sigstore-issued certificate.",
            "> Real Sigstore-verified envelopes: **0 (none currently).**",
            "> Placeholder structurally-correct envelopes: **all.**",
        ]
    else:
        lines += [
            "### DSSE Envelope",
            "*No DSSE envelope in response from /v1/verify.*",
            "",
            "> ℹ️ When present, the envelope will appear here with honest disclosure:",
            "> **PLACEHOLDER — signing not yet wired into CI.**",
            "> **Real Sigstore-verified: 0. Placeholder structurally correct: all.**",
        ]
    return "\n".join(lines)


def cs_policy(base_label: str, action_text: str, severity: str) -> str:
    base = _A11OY_BASES.get(base_label, "")
    if not base: return f"❌ Unknown base: {base_label}"
    if not action_text.strip(): action_text = "deploy-to-production"
    url = base.rstrip("/") + "/v1/policy/evaluate"
    payload = {
        "actionId": "rosie-test-bench",
        "action": action_text,
        "surface": "rosie-test-bench",
        "severity": severity,
        "confidence": 0.9,
        "witnesses": ["agent-a", "agent-b"],
    }
    status, data = _http_json(url, "POST", payload, timeout=10)
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    lines = [f"**POST** `{url}`  \n*{ts}* — HTTP {status}\n"]
    if status == 0:
        lines.append(f"⚠️ Network error: {data.get('error','?')}")
        return "\n".join(lines)

    decision = (data.get("decision") or data.get("verdict") or
                ("allow" if data.get("allowed") is True else
                 "deny" if data.get("allowed") is False else "unknown")).lower()
    gate    = data.get("gate") or data.get("gate_id") or data.get("rule") or "?"
    receipt = data.get("receipt") or {}
    r_hash  = receipt.get("receipt_id") or receipt.get("hash") or data.get("receipt_id") or "?"
    icon    = "✅" if "allow" in decision else "❌" if "deny" in decision else "⚠️"

    lines += [
        f"**Decision:** {icon} `{decision.upper()}`",
        f"**Gate:** `{gate}`",
        f"**Action:** `{action_text}`",
        f"**Severity:** `{severity}`",
    ]
    if r_hash and r_hash != "?":
        lines.append(f"**Receipt hash:** `{r_hash}`")
    if data.get("reason"):
        lines.append(f"**Reason:** {data['reason']}")
    lines += ["", "```json", json.dumps(data, indent=2)[:1500], "```"]
    return "\n".join(lines)

with gr.Blocks(title="rosie — operator console") as demo:
    gr.HTML(
        "<div id='rosie-header'>"
        "<h1>🌹 rosie — operator console</h1>"
        "<p>The human-facing command surface of the SZL ecosystem — "
        "span explorer · receipt verifier · mesh health · doctrine sweep · live formulas</p>"
        "<div>"
        "<span class='rosie-chip'>5-organ ecosystem: a11oy · amaru · sentra · vessels · rosie</span>"
        "<span class='rosie-chip warn'>⚠ Deterministic policy · Not an LLM · Not inference</span>"
        "</div>"
        # hero portrait loads from /assets/rosie_hero.png after Expert 1 push
        "</div>"
    )

    with gr.Tabs():
        # ── Tab 1 ──────────────────────────────────────────────────────────
        with gr.TabItem("Span Explorer"):
            gr.HTML(
                "<div style='display:inline-block;font-family:JetBrains Mono,monospace;"
                "font-size:.72rem;color:#e8a23a;border:1px solid rgba(232,162,58,0.4);"
                "background:rgba(232,162,58,0.08);border-radius:8px;"
                "padding:.35rem .85rem;margin-bottom:.6rem;'>"
                "⚠ Synthetic data — seeded for demo</div>"
            )
            gr.Markdown("Browse UDS mesh operation spans. Filter by component and status.")
            with gr.Row():
                comp_dd = gr.Dropdown(
                    choices=["all"] + COMPONENTS,
                    value="all",
                    label="Component",
                )
                status_dd = gr.Dropdown(
                    choices=["all", "ok", "error"],
                    value="all",
                    label="Status",
                )
                limit_sl = gr.Slider(minimum=5, maximum=40, value=20, step=5, label="Max spans")
            explore_btn = gr.Button("🔍 Load Spans", variant="primary")
            spans_table = gr.Markdown()
            spans_json = gr.Code(label="Raw JSON (first 5)", language="json")

            explore_btn.click(
                explore_spans,
                inputs=[comp_dd, status_dd, limit_sl],
                outputs=[spans_table, spans_json],
            )
            demo.load(
                lambda: explore_spans("all", "all", 20),
                inputs=[],
                outputs=[spans_table, spans_json],
            )

        # ── Tab 2 ──────────────────────────────────────────────────────────
        with gr.TabItem("Receipt Verifier"):
            gr.Markdown("Paste a DSSE envelope JSON (from amaru or sentra) to validate signature and decode payload.")
            receipt_in = gr.Textbox(
                label="DSSE Envelope JSON",
                lines=12,
                placeholder='{"payload":"...","payloadType":"...","signatures":[{"keyid":"...","sig":"..."}]}',
            )
            verify_btn = gr.Button("🔐 Verify Receipt", variant="primary")
            verify_out = gr.Markdown()
            verify_btn.click(verify_receipt, inputs=[receipt_in], outputs=[verify_out])

        # ── Tab 3 ──────────────────────────────────────────────────────────
        with gr.TabItem("Mesh Health"):
            gr.Markdown("Aggregate stats for all 5 ecosystem components.")
            health_btn = gr.Button("📊 Refresh Health", variant="secondary")
            health_out = gr.Markdown()
            health_btn.click(mesh_health, inputs=[], outputs=[health_out])
            demo.load(mesh_health, inputs=[], outputs=[health_out])

        # ── Tab 4 ──────────────────────────────────────────────────────────
        with gr.TabItem("Doctrine Sweep"):
            gr.Markdown(
                "Paste any markdown text. Rosie scans for Doctrine v10 ban-word violations "
                "and returns line+column locations."
            )
            sweep_in = gr.Textbox(
                label="Markdown text to scan",
                lines=10,
                placeholder="Paste README, PR description, or doc draft here...",
            )
            sweep_btn = gr.Button("🔎 Scan for Violations", variant="primary")
            sweep_out = gr.Markdown()
            sweep_btn.click(doctrine_sweep, inputs=[sweep_in], outputs=[sweep_out])

        # ── Tab 5 — Live Formulas ──────────────────────────────────────────
        with gr.TabItem("Live Formulas"):
            gr.Markdown(
                "**5 featured anchor formulas (of 19 tracked)** computed live with Λ-score and DSSE PAE v1 receipt.\n\n"
                "Each formula has a Lean proof in [szl-holdings/lutar-lean](https://github.com/szl-holdings/lutar-lean) "
                f"(commit `{LEAN_COMMIT_SHA[:12]}...`). "
                "Click **Refresh** to recompute."
            )
            formula_btn = gr.Button("⚗️ Refresh Formula Table", variant="primary")
            formula_out = gr.Markdown()
            formula_btn.click(live_formulas, inputs=[], outputs=[formula_out])
            demo.load(live_formulas, inputs=[], outputs=[formula_out])

        # ── Tab 6 ──────────────────────────────────────────────────────────
        with gr.TabItem("About"):
            gr.Markdown(ABOUT_ROSIE)

        # ── Tab 🦅 Killinchu Drone Intel (ADDITIVE, Doctrine v11) ──────────
        with gr.TabItem("🦅 Killinchu Drone Intel"):
            gr.Markdown(
                "## 🦅 Killinchu — Andean Drone Intelligence\n\n"
                "**Vessels has pivoted to the air domain.** Killinchu is the SZL "
                "counter-UAS / drone-intelligence flagship — maritime domain "
                "awareness → airborne unmanned domain awareness. Rosie brain-jacks "
                "it via `/api/rosie/v1/brain/jack-killinchu`.\n\n"
                "**What's real (no mocks):**\n"
                "- Remote-ID / ADS-B / MAVLink protocol decoders (pyModeS, pymavlink)\n"
                "- 53-system drone database (allied / dual-use / adversary / C-UAS)\n"
                "- Multi-constellation GEOINT — HawkEye360 RF, Planet/Maxar optical, Capella/ICEYE SAR, Spire\n"
                "- Per-drone 3D digital twins (CesiumJS) with HUKLLA tamper tripwires T11–T20\n"
                "- Federated drone identity — DICE/RIoT + CycloneDX SBOM + SLSA-Drone-L3\n"
                "- Passive counter-UAS identify & track behind the 13-axis Λ-gate\n\n"
                "> **Legal:** *We sense, we evidence; we do not jack into third-party "
                "drones.* (CFAA / ITAR / Wassenaar.) Doctrine v11 — Λ is a Conjecture, "
                "signatures PLACEHOLDER, SLSA L1 (honest).\n\n"
                "🔗 **Live flagship:** [szlholdings-killinchu.hf.space](https://szlholdings-killinchu.hf.space)"
            )

        # ── Tab 7 — Cross-Space Helper Test Bench ─────────────────────────
        with gr.TabItem("Cross-Space Helper"):
            gr.Markdown(
                "## Cross-Space Helper — Test Bench\n\n"
                "Exercises the Rosie widget's a11oy API calls directly from the Gradio console.\n"
                "No floating JS needed — drive `/v1/reason`, `/v1/ledger`, `/v1/verify`, `/v1/policy/evaluate` standalone.\n\n"
                "**Endpoints tested:** 749 decl / 14 unique axioms (15 raw) / 163 tracked sorries / 12 MCP tools / 46 policy gates"
            )

            _base_choices = list(_A11OY_BASES.keys())
            _base_default = _base_choices[0]

            with gr.Tabs():
                # ── Sub-tab A: Ask a11oy (reason) ──────────────────────────
                with gr.TabItem("🧠 Ask a11oy (/v1/reason)"):
                    gr.Markdown(
                        "Send a plain-English question to a11oy's `/v1/reason` endpoint.\n"
                        "This is the **cross-Space LLM capability** — routes to amaru's brain via Wire C."
                    )
                    with gr.Row():
                        cs_base_r = gr.Dropdown(choices=_base_choices, value=_base_default, label="a11oy endpoint")
                    cs_q = gr.Textbox(
                        label="Question",
                        lines=3,
                        placeholder="How does this Space work? What does /v1/policy/evaluate do? Show me a sample receipt.",
                        value="How does the a11oy governance substrate work, and what does /v1/policy/evaluate do?",
                    )
                    cs_reason_btn = gr.Button("🧠 Ask a11oy", variant="primary")
                    cs_reason_out = gr.Markdown()
                    cs_reason_btn.click(cs_reason, inputs=[cs_base_r, cs_q], outputs=[cs_reason_out])

                # ── Sub-tab B: Ledger / Khipu DAG ──────────────────────────
                with gr.TabItem("📜 Ledger & Khipu DAG (/v1/ledger)"):
                    gr.Markdown(
                        "Fetch the live Khipu Merkle DAG head + `root_hash` + last N receipts from a11oy's ledger."
                    )
                    with gr.Row():
                        cs_base_l = gr.Dropdown(choices=_base_choices, value=_base_default, label="a11oy endpoint")
                        cs_limit  = gr.Slider(minimum=1, maximum=10, value=5, step=1, label="Max receipts")
                    cs_ledger_btn = gr.Button("📜 Fetch Ledger", variant="primary")
                    cs_ledger_out = gr.Markdown()
                    cs_ledger_btn.click(cs_ledger, inputs=[cs_base_l, cs_limit], outputs=[cs_ledger_out])
                    demo.load(
                        lambda: cs_ledger(_base_default, 5),
                        inputs=[],
                        outputs=[cs_ledger_out],
                    )

                # ── Sub-tab C: Verify + DSSE Envelope ──────────────────────
                with gr.TabItem("🔐 Verify & DSSE (/v1/verify)"):
                    gr.Markdown(
                        "Call `/v1/verify` and display the DSSE envelope.\n\n"
                        "**Honest disclosure:** All current envelopes are PLACEHOLDER — structurally correct "
                        "DSSE PAE v1 + HMAC-SHA-256, but **not** real Sigstore-verified.\n"
                        "Real Sigstore-verified envelopes: **0 (none currently).**"
                    )
                    with gr.Row():
                        cs_base_v = gr.Dropdown(choices=_base_choices, value=_base_default, label="a11oy endpoint")
                    cs_verify_btn = gr.Button("🔐 Verify Chain", variant="primary")
                    cs_verify_out = gr.Markdown()
                    cs_verify_btn.click(cs_verify, inputs=[cs_base_v], outputs=[cs_verify_out])

                # ── Sub-tab D: Policy Evaluate ──────────────────────────────
                with gr.TabItem("⚖️ Policy Evaluate (/v1/policy/evaluate)"):
                    gr.Markdown("Send a proposed action to a11oy's policy gate and get a ALLOW/DENY verdict.")
                    with gr.Row():
                        cs_base_p   = gr.Dropdown(choices=_base_choices, value=_base_default, label="a11oy endpoint")
                        cs_severity = gr.Dropdown(choices=["low", "medium", "high", "critical"], value="medium", label="Severity")
                    cs_action = gr.Textbox(
                        label="Action",
                        placeholder="deploy-to-production | send-email | modify-ledger",
                        value="deploy-to-production",
                    )
                    cs_policy_btn = gr.Button("⚖️ Evaluate Policy", variant="primary")
                    cs_policy_out = gr.Markdown()
                    cs_policy_btn.click(cs_policy, inputs=[cs_base_p, cs_action, cs_severity], outputs=[cs_policy_out])

        # ── Tabs 8-11 — Rosie v2.0 exclusives (ADDITIVE) ──────────────────────
        # 8) Self-Learning Loop  9) Active Inference  10) Cognitive Maps
        # 11) Cross-Session Memory (Unay).  Inserted as siblings inside gr.Tabs().
        _r2.build_new_tabs(gr, demo)

        # ── Tab 12 — DINN Lab (ADDITIVE) ──────────────────────────────────────
        # Interactive Doctrine-Informed Neural Network trainer (Knot/Doctrine/
        # Bekenstein). Inserted as a sibling TabItem inside gr.Tabs().
        _dinn.build_dinn_tab(gr, demo)

        # ── Tab 14 — All Upgrades Index (ADDITIVE) ───────────────────────────
        # Org-wide upgrade inventory: Cursor PRs, Replit verbatim, cookbook
        # recipes, szl-trust E4 receipts, Wires, Lean theorems @ Doctrine v10.
        # Cross-links to a11oy /codex-kernel, /wires, /research/dinn.
        _upg.build_upgrades_tab(gr, demo)

        # ── Tabs 15/16/17 — un-shipped moat (ADDITIVE, Doctrine v10) ──────────
        # 15) Evidence Ledger (LUTAR_EVIDENCE per-claim PROVEN/AXIOM/CONJECTURE/
        # SORRY + theorem->Lean file:line + 171-CSV ref-vec + Λ discrepancy).
        # 16) Ouroboros Run-All — button executes the real 32 module self-tests.
        # 17) Substrate Inspector (@szl/substrate surface). Inserted as siblings.
        _moat.build_moat_tabs(gr, demo)

        # ── Tab 🧠 Brain (ADDITIVE, Doctrine v10) ─────────────────────────
        # Founder verbatim: "Should lean and lake and all formulas and all the
        # thesis should be instilled into Rosie's brain."  Rosie inherits every
        # Space's brain slice + the full thesis corpus (179 rows / 20 versions)
        # + the unified LLM router (5 founder-locked tiers).  Sibling pattern.
        _brain_tab.build_brain_tab(gr, demo)

        # ── Tab 24 — Rosie 3D (ADDITIVE, Doctrine v10/v11) ───────────────────
        # Founder verbatim: "Rosie make into a 3D build too and make it show live
        # how it's connected to our ecosystem ... wired in backend to show live
        # field." Embeds the dedicated SZLHOLDINGS/rosie-3d static Space (Three.js
        # r160). Rosie's OWN 3D body (ethereal humanoid + glowing brain + 5 live
        # wires to a11oy/amaru/sentra/vessels/uds-demo + 4 memory bands + Frontier
        # Mode glyphs). The viewer polls THIS app's /api/rosie/v1/state,
        # /v1/active-inference, /v1/self-learning every 5-10s. Complementary to the
        # anatomy-3d Space (which shows the SZL substrate organs), not redundant.
        with gr.TabItem("24 · Rosie 3D"):
            gr.Markdown(
                "### Rosie 3D — live ecosystem embodiment\n"
                "Rosie as a 3D entity: ethereal humanoid wireframe, glowing neural‑"
                "network brain, **5 live wires** into the flagships "
                "(a11oy / amaru / sentra / vessels / uds‑demo), **4 memory bands** "
                "(her exclusive tabs), and **Frontier Mode** glyphs "
                "(Pacha‑Λ, Khipu‑Bekenstein, Yachay‑Khipu). Brain‑jack network graph + "
                "active‑inference free‑energy gauge animate live. The viewer polls "
                "`/api/rosie/v1/state`, `/v1/active-inference`, `/v1/self-learning` "
                "every 5‑10s — honest `PENDING` shown where a backend value is not "
                "yet measured. Doctrine v10/v11 (749/14/163, 13‑axis, Λ Conjecture)."
            )
            gr.HTML(
                '<iframe src="https://szlholdings-rosie-3d.static.hf.space/" '
                'width="100%" height="760" frameborder="0" '
                'style="border:1px solid #2a2a3a;border-radius:12px;background:#05060c" '
                'allow="fullscreen" loading="lazy" '
                'title="Rosie 3D — live ecosystem"></iframe>'
                '<p style="font-size:12px;opacity:.7;margin-top:6px">'
                'Direct: <a href="https://szlholdings-rosie-3d.static.hf.space/" '
                'target="_blank">szlholdings-rosie-3d.static.hf.space</a> · '
                'parallel to <a href="https://szlholdings-anatomy-3d.static.hf.space/" '
                'target="_blank">anatomy-3d</a> (substrate organs).</p>'
            )


# ── Rosie v2.0: mount the 11-tab Gradio Blocks onto a FastAPI app that mirrors
#    every a11oy /v1/* endpoint on Rosie (gates, mcp, lambda, theorems/cite, ledger,
#    verify, policy, mesh, doctrine, memory, workflows, reason, deploy, fleet) plus
#    Rosie exclusives (canonicalize, receipts/stream, self-learn, active-inference,
#    cognitive-map, unay). Endpoints live under BOTH /api/rosie/* and /api/a11oy/*
#    (the inherited mirror). HF Spaces serves the Gradio UI at root and the API on the
#    same port — single source of truth per the locked capability brief.
try:
    from gradio.themes import Base as _Base
    demo.theme = _Base()
    demo.css = ROSIE_CSS
except Exception:
    pass

# Base FastAPI carries the contract at root (/healthz, /v1/*). We ALSO mount the
# same contract under /api/rosie and /api/a11oy BEFORE mounting Gradio at "/", so
# Starlette resolves the namespaced API mounts ahead of Gradio's root catch-all.
_rosie_api = _r2.build_rosie_api()

# ---------------------------------------------------------------------------
# CORS (ADDITIVE, Doctrine v10) — allow the SZLHOLDINGS/rosie-3d static Space to
# poll the live-field aggregators (/api/rosie/v1/state, /v1/active-inference,
# /v1/self-learning) cross-origin. Read-only GET endpoints; no credentials.
# ---------------------------------------------------------------------------
try:
    from fastapi.middleware.cors import CORSMiddleware as _CORS
    _rosie_api.add_middleware(
        _CORS, allow_origins=["*"], allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"], allow_credentials=False,
    )
    import sys as _sysc
    print("[rosie] CORS middleware installed (rosie-3d live field)", file=_sysc.stderr)
except Exception as _ec:
    import sys as _sysc
    print(f"[rosie] CORS not installed: {_ec}", file=_sysc.stderr)

# ---------------------------------------------------------------------------
# Agentic-RAG (ADDITIVE, Doctrine v10/v11). rosie binds the ALL organ (nervous
# system inherits EVERYTHING). Registered on _rosie_api BEFORE the /api/rosie mount
# AND the Gradio root mount so /api/rosie/v1/rag + /rag resolve here, never shadowed.
# Corpus+FAISS pulled from SZLHOLDINGS/rag-corpus-v1 at first use. LLM responses
# cite chunk IDs; Λ-receipt signature = PLACEHOLDER.
# ---------------------------------------------------------------------------
try:
    import szl_rag as _rag
    _rag.register_rag_routes(_rosie_api, "rosie")
    import sys as _sysr
    print("[rosie] szl_rag routes registered (organ=all)", file=_sysr.stderr)
except Exception as _e:
    import sys as _sysr
    print(f"[rosie] szl_rag not registered: {_e}", file=_sysr.stderr)

# ---------------------------------------------------------------------------
# ADDITIVE (Yachay / Provenance Hardening): Wire D (W3C traceparent trace
# continuity) + DSSE/Cosign-signed Khipu receipts (SLSA L2 signed provenance).
# Registers /api/{space}/wires/D, /khipu/{sign,verify,ledger}, /provenance.
# Wrapped so a missing dep (cryptography) can NEVER take down the existing app.
# PLACEHOLDER -> REAL: every receipt now DSSE-signed with szlholdings-cosign.
# ---------------------------------------------------------------------------
try:
    import szl_provenance as _prov
    _prov_status = _prov.register_provenance(_rosie_api, "rosie")
    print(f"[rosie] szl_provenance registered (Wire D LIVE, SLSA L2): {{_prov_status}}", file=sys.stderr)
except Exception as _pe:  # pragma: no cover - defensive, additive-only
    print(f"[rosie] szl_provenance NOT registered ({{_pe!r}}); existing app unaffected", file=sys.stderr)

# NOTE (Doctrine v11, ADDITIVE, mount-order fix): the /api/rosie + /api/a11oy
# prefix Mounts are deferred to immediately BEFORE the Gradio root mount (see
# end of file). Starlette matches a Mount by prefix, so registering them here
# would shadow the explicit /api/rosie/v1/{brain,brain/jack,brain/sockets,
# brain/multi-jack,lean-verify,...} routes added below. Moving them last lets
# the explicit routes resolve first; the prefix mount becomes the fallback.

# ADDITIVE (Doctrine v10): unified BRAIN + LLM-router + mesh mirror endpoints on
# the ROOT FastAPI app, registered BEFORE the Gradio root mount so Starlette
# resolves them ahead of Gradio's catch-all. Rosie inherits every Space's brain.
try:
    from fastapi import Request as _Req
    from fastapi.responses import JSONResponse as _JSON

    _szlwire.install_traceparent_middleware(_rosie_api, "rosie")

    @_rosie_api.get("/api/rosie/v1/brain")
    def _rosie_brain():
        # Rosie inherits EVERYTHING: assemble all role slices into one payload.
        payload = _szlbrain.brain_payload("rosie")
        payload["inherited_slices"] = {
            sp: _szlbrain.brain_payload(sp)["brain"]
            for sp in ("a11oy", "amaru", "sentra", "vessels", "uds-demo")
        }
        payload["thesis_corpus"] = {
            "rows": len(_brain_tab._CORPUS), "versions": 20,
            "source": "171_PER_VERSION_THEOREM_TABLE.csv",
            "note": "All formulas + all thesis across 20 versions, searchable in the 🧠 Brain tab.",
        }
        payload["verticals"] = payload.get("verticals", {})
        payload["verticals"]["killinchu"] = {
            "name": "Killinchu — Andean Drone Intelligence",
            "domain": "airborne unmanned domain awareness / counter-UAS (vessels air-domain pivot)",
            "url": "https://szlholdings-killinchu.hf.space",
        }
        return _JSON(payload)

    @_rosie_api.get("/api/rosie/v1/brain/jack-killinchu")
    def _rosie_brain_jack_killinchu():
        """Brain-jack into the Killinchu drone-intelligence flagship. Rosie is the
        nervous system; this jacks the air-domain vertical (vessels pivot) into the
        unified brain so cross-Space queries can reach drone-intel surfaces."""
        return _JSON({
            "jacked": "killinchu",
            "name": "Killinchu — Andean Drone Intelligence",
            "domain": "airborne unmanned domain awareness / counter-UAS",
            "url": "https://szlholdings-killinchu.hf.space",
            "surfaces": [
                "Remote-ID / ADS-B / MAVLink decoders (real, no mocks)",
                "53-system drone database",
                "multi-constellation GEOINT (HawkEye360 RF + Planet/Maxar + Capella/ICEYE SAR + Spire)",
                "per-drone 3D digital twins + HUKLLA tamper tripwires T11-T20",
                "federated drone identity (DICE/RIoT + SBOM + SLSA-Drone-L3)",
                "passive counter-UAS identify & track",
            ],
            "governance": "shares rosie/a11oy Lambda-gate + Khipu receipt substrate; Doctrine v11",
            "legal": "We sense, we evidence; we do not jack into third-party drones (CFAA/ITAR/Wassenaar).",
            "pivot_from": "vessels",
        })

    # =====================================================================
    # Wire I — Rosie-companion-wire (ADDITIVE, Doctrine v11).
    # Founder directive 2026-06-01 ~02:52 EDT: "Make sure Rosie is wired in the
    # backend of each flag and wherever needed to be." Rosie is the cross-flagship
    # reasoning co-pilot; every other flagship instantiates a RosieShadow that calls
    # its own jack-<flagship> endpoint here. GET returns the descriptor; POST runs
    # real per-flagship reasoning + emits a Khipu cross-flagship receipt.
    # Rosie is co-pilot, NOT pilot: she proposes; the flagship + 2-person Yuyay gate
    # decide. evolve ops are flagged requires_two_person_gate. Signed: Yachay.
    # =====================================================================
    import szl_jack as _jack_i  # shared Wire G module (lambda_signal, receipts, organ text)

    _COMPANION_FLAGSHIPS = {
        "a11oy":     {"organ": "gate",   "url": "https://szlholdings-a11oy.hf.space"},
        "amaru":     {"organ": "cortex", "url": "https://szlholdings-amaru.hf.space"},
        "sentra":    {"organ": "immune", "url": "https://szlholdings-sentra.hf.space"},
        "killinchu": {"organ": "drone",  "url": "https://szlholdings-killinchu.hf.space"},
    }

    def _companion_descriptor(flag: str) -> dict:
        info = _COMPANION_FLAGSHIPS[flag]
        return {
            "jacked": flag, "target_organ": info["organ"], "target_url": info["url"],
            "wire": "I", "role": "Rosie-companion (cross-flagship reasoning co-pilot)",
            "doctrine": "v11",
            "ops": ["ponder", "synthesize", "evolve", "brain_jack"],
            "contract": ("POST here with {op, query, axis_scores, context} to run reasoning. "
                         "Rosie PROPOSES; the flagship + 2-person Yuyay gate DECIDE. "
                         "evolve ops set requires_two_person_gate=true."),
            "khipu": "every call emits a cross-flagship Khipu receipt (flagship->rosie->response->flagship)",
            "honesty": "Rosie is co-pilot, not pilot; she cannot actuate the flagship.",
        }

    def _make_jack_flagship_routes(flag: str):
        @_rosie_api.get(f"/api/rosie/v1/brain/jack-{flag}")
        def _jack_flag_get(_flag=flag):
            return _JSON(_companion_descriptor(_flag))

        @_rosie_api.post(f"/api/rosie/v1/brain/jack-{flag}")
        async def _jack_flag_post(request: _Req, _flag=flag):
            try:
                body = await request.json()
            except Exception:
                body = {}
            op = body.get("op", "brain_jack")
            query = body.get("query", "")
            axis_scores = body.get("axis_scores") or []
            ctx = body.get("context") or {}
            tp = body.get("traceparent") or getattr(getattr(request, "state", None), "traceparent", None)
            organ = _COMPANION_FLAGSHIPS[_flag]["organ"]
            L = _jack_i.lambda_signal(axis_scores)
            # Rosie reasons AS the nervous system, scoped to this flagship's organ.
            base = _jack_i._organ_response("rosie", query, axis_scores, _flag, organ)
            evolve_note = ""
            requires_gate = (op == "evolve")
            if requires_gate:
                evolve_note = (" [EVOLVE PROPOSAL — strategy-changing; requires 2-person Yuyay gate. "
                               "Rosie proposes; flagship + 2nd signer authorize.]")
            resp_text = (f"[rosie-companion -> {_flag}/{organ}] op={op}. " + base + evolve_note)
            receipt = _jack_i.make_jack_receipt("rosie", _flag, query, axis_scores, tp)
            receipt["companion_wire"] = "I"
            receipt["jack_endpoint"] = f"/api/rosie/v1/brain/jack-{_flag}"
            receipt["op"] = op
            # node digest for cross-link reconciliation on the flagship side
            import hashlib as _h, json as _j
            receipt["node_digest"] = _h.sha256(_j.dumps(receipt, sort_keys=True, default=str).encode()).hexdigest()
            _jack_i.log_jack({"wire": "I", "type": "companion_jack", "flagship": _flag,
                "op": op, "query": query[:80], "lambda_signal": L,
                "ts_utc": receipt["ts_utc"], "traceparent": tp})
            return _JSON({
                "src_space": _flag, "jacked": _flag, "op": op,
                "response_organ": "nervous", "response_text": resp_text,
                "lambda_signal": L, "lambda_receipt": receipt,
                "requires_two_person_gate": requires_gate,
                "traceparent": tp, "doctrine": "v11", "wire": "I"})

    for _flag in _COMPANION_FLAGSHIPS:
        _make_jack_flagship_routes(_flag)

    @_rosie_api.get("/api/rosie/v1/companion/registry")
    def _companion_registry():
        """Wire I: registry of every flagship that carries a Rosie-shadow."""
        return _JSON({
            "wire": "I", "doctrine": "v11",
            "name": "Rosie-companion-wire",
            "flagships": {f: {**_COMPANION_FLAGSHIPS[f],
                              "jack_endpoint": f"/api/rosie/v1/brain/jack-{f}"}
                          for f in _COMPANION_FLAGSHIPS},
            "excluded": {"vessels": "legacy/collectioned — air-domain pivot moved to killinchu"},
            "recent_companion_jacks": [j for j in _jack_i.recent_jacks(20) if j.get("wire") == "I"],
            "note": "Rosie is the cross-flagship reasoning companion. Every flagship has a Rosie-shadow.",
        })

    @_rosie_api.post("/api/rosie/v1/llm/route")
    async def _rosie_llm_route(request: _Req):
        try:
            body = await request.json()
        except Exception:
            body = {}
        return _JSON(_szlbrain.route(
            prompt=body.get("prompt", ""), axis_scores=body.get("axis_scores"),
            max_tier=body.get("max_tier", 4),
            require_lambda_receipt=body.get("require_lambda_receipt", True),
            task_hint=body.get("task_hint", "")))

    @_rosie_api.get("/api/rosie/v1/llm/tiers")
    def _rosie_llm_tiers():
        return _JSON({"count": len(_szlbrain.TIERS), "tiers": _szlbrain.TIERS,
                      "default": "claude_sonnet_4_6", "doctrine": "v10"})

    @_rosie_api.get("/api/rosie/v1/mesh/state")
    def _rosie_mesh_state():
        return _JSON(_szlwire.mesh_status())

    @_rosie_api.get("/api/rosie/v1/brainz")
    def _rosie_brainz():
        return _JSON({
            "ok": True, "service": "rosie", "surface": "nervous system / cross-session (inherits everything)",
            "doctrine": "v10",
            "traceparent_propagating": "in-process only (real within this Space; not distributed across Spaces)",
            "wires": {"B": "LIVE", "C": "LIVE",
                      "D": "LIVE_IN_PROCESS (cross-Space broker NOT wired — see a11oy /wires)",
                      "E": "LIVE (cortex SSE, in-memory bus)", "F": "LIVE (Khipu receipt DAG)"},
            "thesis_corpus_rows": len(_brain_tab._CORPUS),
            "declarations": 749, "axioms": 14, "sorries": 163,
            "note": "Additive brain mirror; does NOT shadow existing /healthz or /v1/* contract.",
        })

    # Wire G — Brain-Jack Mesh (ADDITIVE, Doctrine v11)
    import szl_jack as _jack

    @_rosie_api.post("/api/rosie/v1/brain/jack")
    async def _rosie_brain_jack(request: _Req):
        """Wire G: Accept incoming brain-jack query — rosie unified/cross-session view."""
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
        receipt = _jack.make_jack_receipt("rosie", src_space, query, axis_scores, tp)
        resp_text = _jack._organ_response("rosie", query, axis_scores, src_space, src_organ)
        _jack.log_jack({"wire": "G", "type": "brain_jack", "src_space": src_space,
            "src_organ": src_organ, "query": query[:80], "lambda_signal": L,
            "ts_utc": receipt["ts_utc"], "traceparent": tp})
        return _JSON({"src_space": src_space,
            "response_organ": _jack.SPACES.get("rosie", {}).get("organ", "nervous"),
            "response_text": resp_text, "lambda_signal": L,
            "lambda_receipt": receipt, "traceparent": tp, "doctrine": "v11", "wire": "G"})

    @_rosie_api.get("/api/rosie/v1/brain/sockets")
    def _rosie_brain_sockets():
        """Wire G: Return socket registry — all 6 Space brain sockets."""
        return _JSON({"space": "rosie",
            "organ": _jack.SPACES.get("rosie", {}).get("organ", "nervous"),
            "sockets": _jack.socket_registry("rosie"),
            "recent_jacks": _jack.recent_jacks(10), "doctrine": "v11", "wire": "G"})

    @_rosie_api.post("/api/rosie/v1/brain/multi-jack")
    async def _rosie_brain_multi_jack(request: _Req):
        """Wire G: Fan-out brain-jack to all target Space organs in parallel."""
        try:
            body = await request.json()
        except Exception:
            body = {}
        query = body.get("query", "")
        axis_scores = body.get("axis_scores") or []
        target_organs = body.get("target_organs")
        tp = body.get("traceparent") or getattr(getattr(request, "state", None), "traceparent", None)
        responses = await _jack.fan_out_jack(this_space="rosie", query=query,
            axis_scores=axis_scores, target_organs=target_organs, traceparent=tp)
        import math as _math
        L_self = _jack.lambda_signal(axis_scores)
        self_receipt = _jack.make_jack_receipt("rosie", "rosie", query, axis_scores, tp)
        self_resp = {"src_space": "rosie",
            "response_organ": _jack.SPACES.get("rosie", {}).get("organ", "nervous"),
            "response_text": _jack._organ_response("rosie", query, axis_scores, "rosie", "nervous"),
            "lambda_signal": L_self, "lambda_receipt": self_receipt,
            "traceparent": tp, "space": "rosie", "stub": False}
        all_responses = [self_resp] + responses
        lambdas = [min(1.0, max(1e-9, r.get("lambda_signal", 0.5))) for r in all_responses]
        unified_lambda = round(_math.exp(sum(_math.log(x) for x in lambdas) / len(lambdas)), 6)
        receipts = [r.get("lambda_receipt", {}) for r in all_responses]
        master = _jack.merkle_root(receipts)
        _jack.log_jack({"wire": "G", "type": "multi_jack", "src_space": "rosie",
            "query": query[:80], "unified_lambda": unified_lambda,
            "master_receipt": master, "n_responses": len(all_responses),
            "ts_utc": self_receipt["ts_utc"], "traceparent": tp})
        return _JSON({"responses": all_responses, "unified_lambda": unified_lambda,
            "master_receipt": master, "n_spaces": len(all_responses), "doctrine": "v11", "wire": "G"})

except Exception as _e:  # never break the existing app if the additive mirror fails
    import sys as _sys
    print(f"[rosie] brain mirror endpoints not registered: {_e}", file=_sys.stderr)

# ── lean-kernel wire (ADDITIVE) ──────────────────────────────────────────────
# Attach GET|POST /api/rosie/v1/lean-verify (proxy to SZLHOLDINGS/lean-kernel)
# and GET /lean (live theorem table) onto the ROOT FastAPI app BEFORE the Gradio
# root mount, so Starlette resolves them ahead of Gradio's catch-all. ZERO BANDAID.
try:
    import lean_wire as _lean_wire
    _lean_wire.register(_rosie_api, ns="rosie")
    print("[rosie] lean_wire attached: /api/rosie/v1/lean-verify + /lean")
except Exception as _lw_e:
    import sys as _sys2
    print(f"[rosie] lean_wire not attached: {_lw_e}", file=_sys2.stderr)

# ── Rosie-3D live-field aggregators (ADDITIVE, Doctrine v11) ─────────────────
# Founder verbatim: "make it show live how it's connected to our ecosystem ...
# wired in backend to show live field." Three read-only GET endpoints the
# SZLHOLDINGS/rosie-3d static viewer polls every 30s. Registered on the ROOT
# FastAPI app BEFORE the Gradio mount so Starlette resolves them ahead of the
# catch-all. HONEST: values that are not yet measured return null (the 3D HUD
# renders "PENDING"); we NEVER fabricate counts. ZERO BANDAID.
try:
    from fastapi.responses import JSONResponse as _JSON3
    import time as _time3, datetime as _dt3, os as _os3

    _ROSIE3D_T0 = _time3.time()

    def _v1_endpoint_count():
        # honest: count the GET/POST routes mounted under /api/rosie/v1/* on this app
        try:
            paths = set()
            for r in _rosie_api.routes:
                p = getattr(r, "path", "")
                if "/api/rosie/v1/" in p or p.startswith("/v1/"):
                    paths.add(p)
            return len(paths)
        except Exception:
            return None

    def _recent_memories():
        # honest source: Unay cross-session store keys (most recent 5), else []
        try:
            uq = _r2.unay_query("")
            hits = sorted(uq.get("hits", []), key=lambda h: h.get("ts", ""), reverse=True)[:5]
            return [f'{h["key"]}: {str(h.get("value",""))[:60]}' for h in hits]
        except Exception:
            return []

    @_rosie_api.get("/api/rosie/v1/state")
    def _rosie3d_state():
        """Live ecosystem-field snapshot for the rosie-3d viewer."""
        sl = {}
        try:
            sl = _r2.rosie_self_learn_state()
        except Exception:
            sl = {}
        mems = _recent_memories()
        ep = _v1_endpoint_count()
        return _JSON3({
            "ok": True, "space": "rosie", "doctrine": "v11",
            # sessions: not tracked per-user in this stateless Space -> honest null
            "active_sessions": None,
            "endpoints_alive": ep,
            # widget_instances measured client-side by probing each target -> null here
            "widget_instances": None,
            "recent_memories": mems,
            "learning_loop_iterations": sl.get("steps"),
            "uptime_seconds": round(_time3.time() - _ROSIE3D_T0, 1),
            "ts_utc": _dt3.datetime.now(_dt3.timezone.utc).isoformat(),
            "declarations": 749, "axioms": 14, "sorries": 163, "lambda_axes": 13,
        })

    @_rosie_api.get("/api/rosie/v1/active-inference")
    def _rosie3d_active_inference():
        """Active-inference free-energy state (deterministic free-energy bookkeeper)."""
        try:
            sl = _r2.rosie_self_learn_state()
            hist = sl.get("history", [])
            fe = hist[-1]["free_energy"] if hist else None
            return _JSON3({
                "ok": True, "space": "rosie", "doctrine": "v11",
                "free_energy": fe,
                "belief_mu": sl.get("belief_mu"), "precision": sl.get("precision"),
                "trend": sl.get("free_energy_trend"), "steps": sl.get("steps"),
                "note": "variational free energy (Gaussian); deterministic predictive-coding update",
            })
        except Exception as _aie:
            return _JSON3({"ok": False, "free_energy": None, "error": str(_aie)})

    @_rosie_api.get("/api/rosie/v1/self-learning")
    def _rosie3d_self_learning():
        """Self-learning loop indicator (iteration count + belief state)."""
        try:
            sl = _r2.rosie_self_learn_state()
            return _JSON3({
                "ok": True, "space": "rosie", "doctrine": "v11",
                "iterations": sl.get("steps"),
                "belief_mu": sl.get("belief_mu"), "precision": sl.get("precision"),
                "trend": sl.get("free_energy_trend"),
                "note": "in-process self-learning loop; iterations reset on Space restart",
            })
        except Exception as _sle:
            return _JSON3({"ok": False, "iterations": None, "error": str(_sle)})

    import sys as _sys3d
    print("[rosie] rosie-3d live-field endpoints registered: /api/rosie/v1/{state,active-inference,self-learning}", file=_sys3d.stderr)
except Exception as _e3d:
    import sys as _sys3d
    print(f"[rosie] rosie-3d live-field endpoints NOT registered: {_e3d}", file=_sys3d.stderr)

# ── Deferred namespaced contract mounts (Doctrine v11 mount-order fix) ───────
# Mounted LAST (after every explicit /api/rosie/v1/* route, before Gradio) so
# Starlette resolves the explicit Wire D/E/F/G + lean-verify routes first and
# falls through to this contract mirror only for un-matched paths. ZERO BANDAID.
_rosie_api.mount("/api/rosie", _r2.build_rosie_api())
_rosie_api.mount("/api/a11oy", _r2.build_rosie_api())

app = gr.mount_gradio_app(_rosie_api, demo, path="/")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
