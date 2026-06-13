"""
SZL Body Self-Model — honest proprioception endpoint (Doctrine v11).

GET /body/self returns ONE honest self-model of the agentic body: for each organ
{name, system, live, maturity, sovereign, measured_or_sample, source, detail}.

Honesty rules (never inflate a label):
- live=True ONLY when a real backing signal is real — a 200 from the organ's
  endpoint, or a real in-process signal. PLANNED/undeployed organs are declared
  dark (live=False), never faked.
- sovereign mirrors each organ's OWN report. This self-model NEVER invents it.
  The metabolism (wasted-energy harvest) organ is sovereign:false BY DOCTRINE,
  always — this signal never flips sovereign:true.
- maturity uses the proven taxonomy: LOCKED (one of locked-8
  {F1,F4,F7,F11,F12,F18,F19,F22}), EXPERIMENTAL, CONJECTURE (Lambda=Conjecture 1,
  BFT=Conjecture 2), SAMPLE, PLANNED, DARK.
- measured_or_sample: 'measured' only where a real meter/feed exists; energy
  joules stay 'sample' until an on-box NVML meter.

Composes existing proven pieces; declares nothing it cannot back with a live
probe. Additive: imported by the energy-harvest service, no serve.py edit.
"""
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone

import engine

_TIMEOUT = 3.0


def _probe_json(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "szl-body-self"})
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as r:
            status = getattr(r, "status", 200)
            if status != 200:
                return None, status
            return json.loads(r.read().decode("utf-8", "replace")), 200
    except urllib.error.HTTPError as e:
        return None, e.code
    except Exception:
        return None, None


def _organ(name, system, live, maturity, sovereign, mos, source, detail=None):
    return {
        "name": name,
        "system": system,
        "live": bool(live),
        "maturity": maturity,
        "sovereign": bool(sovereign),
        "measured_or_sample": mos,
        "source": source,
        "detail": detail or {},
    }


def body_self():
    organs = []

    # --- METABOLISM: wasted-energy harvest (in-process, REAL grid feeds) ---
    meta_live = False
    meta_detail = {}
    feeds_live = 0
    feeds_total = 0
    try:
        p = engine.posture_summary(allow_network=True)
        feeds_live = int(p.get("feeds_live") or 0)
        feeds_total = int(p.get("feeds_total") or 0)
        meta_live = (p.get("status") == "live") and feeds_live > 0
        meta_detail = {
            "wasted_energy_available": bool(p.get("wasted_energy_available")),
            "grid_price_posture": p.get("grid_price_posture"),
            "feeds_live": feeds_live,
            "feeds_total": feeds_total,
            "joules_label": p.get("joules_label"),
        }
    except Exception:
        pass
    organs.append(_organ(
        "metabolism", "wasted-energy harvest", meta_live,
        "F19 LOCKED + Landauer EXPERIMENTAL", False, "sample",
        "/api/a11oy/v1/harvest/posture", meta_detail))

    # --- SENSES: live external grid/space feeds (the metabolism feed set) ---
    organs.append(_organ(
        "senses", "global resource feeds", feeds_live > 0,
        "resource-map (live external feeds)", False, "measured",
        "/api/a11oy/v1/harvest/harvest",
        {"feeds_live": feeds_live, "feeds_total": feeds_total}))

    # --- ENDOCRINE: energy-posture scheduler (hormone gating) ---
    # The live soak gate is real; the proactive batch scheduler is NOT yet wired.
    try:
        soak_now = engine.should_soak_wasted_energy(allow_network=True)
    except Exception:
        soak_now = None
    organs.append(_organ(
        "endocrine", "energy-posture scheduler", False,
        "PLANNED (soak gate live; scheduler not wired)", False, "sample",
        "/api/a11oy/v1/harvest/soak", {"soak_gate_now": soak_now}))

    # --- RESPIRATORY: soak-breath batch admission (Ouroboros-bounded) ---
    organs.append(_organ(
        "respiratory", "soak-breath batch admission", False,
        "PLANNED", False, "sample", None, {}))

    # --- BRAIN: code orchestrator (sovereign GPU) ---
    code, st = _probe_json("http://127.0.0.1:7861/api/a11oy/code/healthz")
    if code is None:
        code, st = _probe_json("https://a11oy.net/api/a11oy/code/healthz")
    code = code or {}
    brain_live = code.get("mode") == "live"
    brain_sov = code.get("sovereign") is True
    brain_mos = "measured" if code.get("inference") == "self-hosted-gpu" else "sample"
    organs.append(_organ(
        "brain", "code orchestrator", brain_live,
        "EXPERIMENTAL (generative, honest)", brain_sov, brain_mos,
        "/api/a11oy/code/healthz",
        {"inference": code.get("inference"), "gpu": code.get("gpu"),
         "http_status": st}))

    # --- IMMUNE: security layer (anti-SSRF allowlist + secret-leak + consent) ---
    organs.append(_organ(
        "immune", "security layer (deny-by-default)", False,
        "PLANNED", False, "n/a", None,
        {"note": "anti-SSRF allowlist + secret-leak + consent gate; "
                 "not yet deployed as an organ endpoint"}))

    # --- MEMORY: episodic receipts exist; consolidated recall organ planned ---
    organs.append(_organ(
        "memory", "episodic receipts + consolidated recall", False,
        "PLANNED (episodic YAWAR receipts exist; no consolidated recall organ)",
        False, "n/a", None, {}))

    # --- WILL: bounded Ouroboros goal loop ---
    organs.append(_organ(
        "will", "bounded goal loop", False, "PLANNED", False, "n/a", None, {}))

    # --- SELF-MODEL: proprioception (this endpoint itself) ---
    organs.append(_organ(
        "self_model", "proprioception", True,
        "EXPERIMENTAL (this endpoint)", False, "measured",
        "/api/a11oy/v1/body/self", {}))

    live_n = sum(1 for o in organs if o["live"])
    sov_n = sum(1 for o in organs if o["sovereign"])
    return {
        "status": "live",
        "ns": "a11oy",
        "doctrine": "v11",
        "kind": "body-self-model",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "organ_count": len(organs),
        "organs_live": live_n,
        "organs_sovereign": sov_n,
        "organs": organs,
        "honesty": (
            "Honest proprioception: live=True ONLY on a real 200 / real in-process "
            "signal; sovereign mirrors each organ's OWN report (metabolism is "
            "sovereign:false by doctrine, always); maturity uses the proven taxonomy "
            "(locked-8 fixed, Lambda=Conjecture 1); joules are SAMPLE until an on-box "
            "NVML meter. No label is inflated; PLANNED organs are declared dark, not faked."
        ),
    }
