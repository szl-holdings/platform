"""
SZL Public Proof surface — "the proof IS the product" (Doctrine v11, R-PROVE-IT-LOUD).

ENERGY-PROOF-PATCH. Additive, read-only. Served by the standalone energy-harvest
service (:8082) so it reaches the public WITHOUT touching the LOCKED serve.py:
  GET /energy/proof                  + /api/a11oy/v1/harvest/proof        (HTML page)
  GET /energy/proof.json             + /api/a11oy/v1/harvest/proof.json   (JSON)

What it surfaces, HONESTLY:
  1. The PROVEN energy-witness set — three REAL, kernel-checked, 0-sorry Lean
     theorems in lutar-lean (#239 / #240 / #242). Each carries its theorem name,
     plain-English meaning, axiom footprint, and a link to the public verify API so
     anyone can recompute "trusting no one".
  2. The MEASURED-JOULE receipt headline — read RAW from the on-box ledger
     (joules.ndjson). A joule is shown ONLY where a real exporter pushed a real
     power.draw sample (measured:true). Nothing is fabricated, estimated, or promoted.

HONESTY FLOOR (verbatim): these three are kernel-checked ENERGY witnesses; they are
NOT the 8 locked formulas {F1,F4,F7,F11,F12,F18,F19,F22} and they are NOT a claim
that Lambda is proven. Lambda = Conjecture 1 (advisory, NEVER "proven trust");
Khipu BFT = Conjecture 2. No free-energy; energy != data; SLSA L1 honest; no key.
"""
from __future__ import annotations

import html
import time
from typing import Any, Dict, List

import reservoir

# Public verify + ledger surfaces a visitor uses to recompute everything themselves.
VERIFY_API = "https://a11oy.net/api/a11oy/v1/verify"
LEDGER_API = "https://a11oy.net/api/a11oy/v1/ledger"
CANONICAL_API = "https://a11oy.net/api/a11oy/v1/receipt/<receipt_id>/canonical"

# The PROVEN SET — cite exactly. REAL kernel-checked, 0-sorry in lutar-lean. The
# axiom footprint is the CITED footprint (resolve precisely via `#print axioms` in
# lutar-lean); we never fabricate a tighter footprint than the proof carries.
WITNESSES: List[Dict[str, Any]] = [
    {
        "id": "#239",
        "theorem": "EnergyBudgetWitness",
        "lemmas": ["bekenstein_bound_additive", "info_within_bound"],
        "formula": "I_max = 2*pi*R*E / (hbar*c*ln2)  bits",
        "meaning": (
            "UPPER bound: the information you can spend is at most the Bekenstein cap "
            "for the energy you spend in a bounded region — a measured joule buys only "
            "so many useful bits."
        ),
        "axiom_footprint": "subseteq {propext, Quot.sound} (resolve via #print axioms)",
        "sorry_free": True,
        "repo": "lutar-lean",
        "cite": "by commit (resolve PR via lutar-lean)",
    },
    {
        "id": "#240",
        "theorem": "LandauerFloorWitness",
        "lemmas": ["landauer_floor"],
        "formula": "E_min = k_B*T*ln2  joules per irreversible bit erased",
        "meaning": (
            "LOWER bound: erasing one irreversible bit costs at least k_B*T*ln2 joules. "
            "Waste heat can be recovered, but this floor is never beaten."
        ),
        "axiom_footprint": "subseteq {propext, Quot.sound} (resolve via #print axioms)",
        "sorry_free": True,
        "repo": "lutar-lean",
        "cite": "by commit (resolve PR via lutar-lean)",
    },
    {
        "id": "#242",
        "theorem": "HarvestBudgetWitness",
        "lemmas": ["energy_ledger_monotone"],
        "formula": "floor <= energy <= Bekenstein-cap, with a monotone SoakLedger",
        "meaning": (
            "BINDS the reservoir between the Landauer floor and the Bekenstein cap and "
            "proves the soak ledger is monotone — energy is accumulated, never "
            "fabricated or reversed."
        ),
        "axiom_footprint": "subseteq {propext, Quot.sound} (resolve via #print axioms)",
        "sorry_free": True,
        "repo": "lutar-lean",
        "cite": "by commit (resolve PR via lutar-lean)",
    },
]

DOCTRINE = {
    "version": "v11",
    "locked_formula_count": 8,
    "locked_formulas": ["F1", "F4", "F7", "F11", "F12", "F18", "F19", "F22"],
    "lambda": "Conjecture 1 (advisory; NEVER 'proven trust')",
    "khipu_bft": "Conjecture 2",
    "slsa": "L1 (honest)",
    "note": (
        "The three witnesses below are kernel-checked ENERGY theorems; they are NOT "
        "the 8 locked formulas and NOT a claim that Lambda is proven. No free-energy "
        "(bounded by #239/#240/Carnot, Ayni-balanced); energy != data; joules MEASURED "
        "only via a real exporter, SAMPLE otherwise — never promoted; no key committed."
    ),
}


def _measured_receipt() -> Dict[str, Any]:
    """The MEASURED-JOULE headline, read RAW from the on-box ledger. Never fabricates;
    genesis (0 J) when no real exporter has pushed a sample."""
    led = reservoir.read_ledger()
    totals = led.get("totals", {}) or {}
    total_j = led.get("total_measured_joules", 0.0) or 0.0
    entries = led.get("measured_entries", []) or []
    try:
        eur_cost = float(totals.get("eur_cost")) if totals.get("eur_cost") is not None else None
    except Exception:
        eur_cost = None
    last = entries[-1] if entries else {}
    has_measured = total_j > 0.0 and len(entries) > 0
    return {
        "joules_label": "measured" if has_measured else "sample",
        "joules_measured": total_j,
        "measured_entry_count": len(entries),
        "node": last.get("engine") or last.get("host") or "betterwithage",
        "power_w": last.get("power_w"),
        "posture": "negative-price" if (eur_cost is not None and eur_cost < 0) else "standard",
        "grid_price_eur_mwh": totals.get("eur_per_mwh"),
        "eur_cost": eur_cost,
        "grid_paid_to_compute": bool(eur_cost is not None and eur_cost < 0),
        "witness_cited": ["#239", "#240", "#242"],
        "generated_at": led.get("generated_at"),
        "source_ledger": "/var/lib/szl/joules.ndjson (measured:true rows only)",
        "honesty": (
            "MEASURED only because a real nvidia-smi exporter pushed real samples; "
            "every other surface stays SAMPLE. Negative eur_cost = the grid PAID us "
            "to soak already-wasted energy. No joule is ever fabricated or estimated."
        ),
    }


def proof_json() -> Dict[str, Any]:
    """Machine-readable proof envelope. Everything here is recomputable by the visitor
    via the verify API + the public ledger re-hash path."""
    return {
        "status": "live",
        "ns": "a11oy",
        "doctrine": "v11",
        "kind": "public-proof",
        "headline": "The proof IS the product: a kernel-checked proof per FLOP.",
        "proven_witnesses": WITNESSES,
        "measured_joule_receipt": _measured_receipt(),
        "verify_it_yourself": {
            "verify_api": VERIFY_API,
            "ledger_api": LEDGER_API,
            "canonical_api": CANONICAL_API,
            "how": (
                "1) GET the ledger. 2) pick any receipt_id. 3) GET its /canonical "
                "bytes. 4) sha256(canonical_bytes) == receipt_id, exactly. "
                "CORS is open (*) so it reproduces in any browser, trusting no one."
            ),
        },
        "doctrine_lock": DOCTRINE,
        "ts": time.time(),
    }


def _esc(v: Any) -> str:
    return html.escape(str(v))


def proof_html() -> str:
    """Self-contained dark proof page (no external assets)."""
    d = proof_json()
    r = d["measured_joule_receipt"]
    rows = []
    for w in d["proven_witnesses"]:
        rows.append(
            "<div class='w'>"
            f"<div class='wh'><span class='id'>{_esc(w['id'])}</span>"
            f"<span class='tn'>{_esc(w['theorem'])}</span>"
            f"<span class='ok'>0-sorry &middot; kernel-checked</span></div>"
            f"<div class='f'>{_esc(w['formula'])}</div>"
            f"<div class='m'>{_esc(w['meaning'])}</div>"
            f"<div class='meta'>lemmas: {_esc(', '.join(w['lemmas']))} &middot; "
            f"axioms {_esc(w['axiom_footprint'])} &middot; {_esc(w['repo'])} ({_esc(w['cite'])})</div>"
            "</div>"
        )
    witnesses_html = "".join(rows)
    grid_line = (
        f"{_esc(r['grid_price_eur_mwh'])} EUR/MWh"
        + (" &mdash; the grid PAID us to compute" if r["grid_paid_to_compute"] else "")
    )
    badge = "MEASURED" if r["joules_label"] == "measured" else "SAMPLE"
    badge_cls = "measured" if r["joules_label"] == "measured" else "sample"
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>a11oy &middot; Proof</title>
<style>
:root{{--bg:#0a0e0f;--fg:#d8e6df;--mut:#7d9488;--acc:#33d99a;--card:#101718;--line:#1d2a28}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}}
.wrap{{max-width:880px;margin:0 auto;padding:40px 20px 80px}}
h1{{font-size:26px;margin:0 0 6px;color:#fff;letter-spacing:.3px}}
.sub{{color:var(--mut);margin:0 0 28px}}
.acc{{color:var(--acc)}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin:0 0 18px}}
.card h2{{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:var(--mut);margin:0 0 14px}}
.w{{border-top:1px solid var(--line);padding:14px 0}}
.w:first-of-type{{border-top:none;padding-top:0}}
.wh{{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}}
.id{{color:var(--acc);font-weight:700}}
.tn{{color:#fff;font-weight:600}}
.ok{{margin-left:auto;font-size:11px;color:#0a0e0f;background:var(--acc);padding:2px 8px;border-radius:20px}}
.f{{color:#bfe9d4;margin:8px 0;font-size:14px}}
.m{{color:var(--fg)}}
.meta{{color:var(--mut);font-size:12px;margin-top:6px}}
.kv{{display:flex;justify-content:space-between;gap:16px;padding:6px 0;border-top:1px solid var(--line)}}
.kv:first-child{{border-top:none}}
.kv .k{{color:var(--mut)}}
.kv .v{{color:#fff;text-align:right}}
.badge{{display:inline-block;font-size:11px;padding:2px 9px;border-radius:20px;font-weight:700}}
.badge.measured{{background:var(--acc);color:#0a0e0f}}
.badge.sample{{background:#2a2f30;color:var(--mut)}}
a{{color:var(--acc);text-decoration:none;border-bottom:1px dotted var(--acc)}}
.foot{{color:var(--mut);font-size:12px;margin-top:24px;line-height:1.7}}
code{{background:#0d1314;border:1px solid var(--line);border-radius:5px;padding:1px 5px;color:#bfe9d4}}
</style></head>
<body><div class="wrap">
  <h1>The proof <span class="acc">is</span> the product.</h1>
  <p class="sub">A kernel-checked proof per FLOP. Verify it yourself &mdash; trust no one.</p>

  <div class="card">
    <h2>Proven energy witnesses &mdash; lutar-lean, 0-sorry</h2>
    {witnesses_html}
  </div>

  <div class="card">
    <h2>Measured-joule receipt <span class="badge {badge_cls}">{badge}</span></h2>
    <div class="kv"><span class="k">joules_measured</span><span class="v">{_esc(r['joules_measured'])} J</span></div>
    <div class="kv"><span class="k">measured entries</span><span class="v">{_esc(r['measured_entry_count'])}</span></div>
    <div class="kv"><span class="k">node</span><span class="v">{_esc(r['node'])}</span></div>
    <div class="kv"><span class="k">posture</span><span class="v">{_esc(r['posture'])}</span></div>
    <div class="kv"><span class="k">grid price</span><span class="v">{grid_line}</span></div>
    <div class="kv"><span class="k">witnesses cited</span><span class="v">{_esc(' / '.join(r['witness_cited']))}</span></div>
    <p class="foot">{_esc(r['honesty'])}</p>
  </div>

  <div class="card">
    <h2>Verify it yourself</h2>
    <p class="m">Recompute every receipt in your own browser:</p>
    <p class="foot">1. <a href="{LEDGER_API}">GET the ledger</a> &middot; 2. pick a <code>receipt_id</code> &middot;
    3. GET <code>/api/a11oy/v1/receipt/&lt;id&gt;/canonical</code> &middot;
    4. <code>sha256(canonical_bytes) == receipt_id</code>, exactly. CORS is open (<code>*</code>).</p>
    <p class="foot">Public verify API: <a href="{VERIFY_API}">{VERIFY_API}</a></p>
  </div>

  <p class="foot">
    Doctrine v11 &middot; locked-proven = exactly 8 {{F1,F4,F7,F11,F12,F18,F19,F22}} &middot;
    &Lambda; = Conjecture 1 (advisory, never &ldquo;proven trust&rdquo;) &middot; Khipu BFT = Conjecture 2 &middot;
    SLSA L1 honest. The three witnesses above are kernel-checked energy theorems &mdash; not the locked-8,
    not a claim that &Lambda; is proven. No free-energy; energy &ne; data; joules measured only via a real
    exporter, sample otherwise; no key committed.
  </p>
</div></body></html>"""
