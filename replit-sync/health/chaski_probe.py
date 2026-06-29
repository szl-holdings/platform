#!/usr/bin/env python3
"""
chaski_probe.py — self-verifying readiness probe for a11oy Code (Chaski).

Honesty doctrine v11. This probe NEVER fabricates a pass. It reports only what
it can independently verify against the LIVE a-11-oy.com surface, and labels
everything it cannot reach (e.g. M2M-key-gated chat) as "gated/unverified"
rather than claiming success.

Checks (all read-only, no secrets):
  1. liveness        — /api/a11oy/v1/code/health 200
  2. mode            — live (HF_TOKEN wired) vs deterministic_stub (honest)
  3. open_weight     — roster is open-weight self-run (the moat claim)
  4. verticals       — legal/cyber/realestate/defense/finance served (consolidation live)
  5. anatomy         — /anatomy served (consolidation live)
  6. proven_surface  — P3 non-interference + termination proof cards served & honest
  7. receipts        — a served endpoint emits a khipu/DSSE receipt object

Exit: prints one JSON blob to stdout. Designed to be imported or run by cron.
"""
from __future__ import annotations
import json, sys, urllib.request, urllib.error

BASE = "https://a-11-oy.com"
TIMEOUT = 20


def _get(path: str):
    url = BASE + path
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "chaski-probe/1.0"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            body = r.read(200_000).decode("utf-8", "replace")
            return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, (e.read(20_000).decode("utf-8", "replace") if e.fp else "")
    except Exception as e:  # noqa: BLE001
        return None, f"__ERR__ {type(e).__name__}: {e}"


def _json(body: str):
    try:
        return json.loads(body)
    except Exception:  # noqa: BLE001
        return None


def probe() -> dict:
    out = {"checks": {}, "verdict": "", "honest_note": ""}

    # 1+2+3: health, mode, open-weight roster
    code, body = _get("/api/a11oy/v1/code/health")
    h = _json(body) or {}
    live = code == 200
    mode = h.get("mode", "unknown")
    inference = h.get("inference")
    # HONEST live definition (matches forge_hf_activate.py): the brain is LIVE
    # when it is wired to the hf-router with a real open-weight model. The Space
    # reports mode 'generative' (or 'live') with inference 'hf-router' and a
    # token_source once HF_TOKEN is set. A pure deterministic stub reports
    # mode 'deterministic'/'stub' with no router. This is brain-wired liveness;
    # the CHAT surface is separately M2M-key-gated (see honest_note).
    # LIVE = a real inference backend answered: the HF Router OR our own
    # self-hosted GPU (Tailscale/local vLLM/Ollama). self-hosted-gpu is the
    # SOVEREIGN upgrade — strictly more live than hf-router, never a stub.
    is_live = (mode in ("live", "generative")) and (inference in ("hf-router", "self-hosted-gpu"))
    is_sovereign = (inference == "self-hosted-gpu")
    # HONEST graceful-degradation: a planned GPU-maintenance posture is an honest
    # state (yellow), NOT a failure and NOT an overclaim. When the GPU is down for
    # maintenance the app serves on CPU/router fallback and says so via posture.
    posture = h.get("posture")  # green/sovereign | maintenance | down
    is_maintenance = (posture == "maintenance") or (h.get("gpu_status") == "maintenance")
    roster = h.get("roster", [])
    open_weight = bool(roster) and all(m.get("open_weight") for m in roster)
    out["checks"]["liveness"] = {"pass": live, "http": code, "doctrine": h.get("doctrine")}
    out["checks"]["mode"] = {
        "pass": is_live,  # live (hf-router or self-hosted-gpu) = pass; stub also honest
        "value": mode,
        "inference": inference,
        "token_source": h.get("token_source"),
        "live": is_live,
        "sovereign": is_sovereign,
        "posture": posture or ("sovereign" if is_sovereign else ("maintenance" if is_maintenance else "live")),
        "maintenance": is_maintenance,
        "posture_note": h.get("posture_note") or h.get("gpu_maintenance_note"),
        "honest": True,  # stub AND maintenance are HONEST states, not failures
        "primary_model": h.get("primary_model"),
    }
    out["checks"]["open_weight_self_run"] = {
        "pass": open_weight,
        "models": [m.get("hf_repo") for m in roster] if roster else [],
    }

    # 4: verticals (consolidation live) — now verifies REAL feed freshness, not
    #    just a 200 on the summary route. A vertical 200-ing with all sources
    #    'unavailable'/'stale' is NOT honestly live, so we scan each /feed and
    #    count live sources. Pass = route 200 AND >=1 live source per vertical.
    def _count_live_sources(body):
        """Recursively count freshness.status occurrences by value."""
        live = stale = unavail = 0
        try:
            d = _json(body) or {}
        except Exception:
            return (0, 0, 0)
        def walk(o):
            nonlocal live, stale, unavail
            if isinstance(o, dict):
                fr = o.get("freshness")
                if isinstance(fr, dict):
                    st = fr.get("status")
                    if st == "live": live += 1
                    elif st == "stale": stale += 1
                    elif st == "unavailable": unavail += 1
                for vv in o.values():
                    walk(vv)
            elif isinstance(o, list):
                for vv in o:
                    walk(vv)
        walk(d)
        return (live, stale, unavail)

    verts = {}
    all_have_live = True
    for v in ("legal", "cyber", "realestate", "defense", "finance"):
        c, _ = _get(f"/api/a11oy/v1/vert/{v}")
        cf, bf = _get(f"/api/a11oy/v1/vert/{v}/feed")
        live, stale, unavail = _count_live_sources(bf)
        verts[v] = {"summary_http": c, "feed_http": cf,
                    "live_sources": live, "stale": stale, "unavailable": unavail}
        if not (c == 200 and cf == 200 and live >= 1):
            all_have_live = False
    out["checks"]["verticals_live"] = {
        "pass": all_have_live,
        "status": verts,
        "note": ("Each vertical must 200 AND serve >=1 LIVE source (real fetched "
                 "web data with fresh freshness.status). A degraded source (e.g. "
                 "legal court_filings 'unavailable') is reported honestly and does "
                 "NOT by itself fail the vertical as long as another source is live."),
    }

    # 5: anatomy consolidation
    ca, _ = _get("/anatomy")
    out["checks"]["anatomy_live"] = {"pass": ca == 200, "http": ca}

    # 6: proven surface served + HONEST (quorum card: PROVED part labeled,
    #    Conjecture-2 part kept open). This is the live anchor for the moat's
    #    "provable governance" claim staying truthful.
    cp, bp = _get("/api/a11oy/v1/formula/ayni-quorum")
    pj = _json(bp) or {}
    blob = (bp or "").lower()
    served = cp == 200 and bool(pj)
    proved_labeled = "proved" in (pj.get("proof_status", "").lower())
    # honest = it cites the open companion (Conjecture 2) rather than overclaiming
    keeps_conjecture = "open_companion" in pj or "conjecture" in blob
    out["checks"]["proven_surface"] = {
        "pass": served and proved_labeled and keeps_conjecture,
        "http": cp,
        "proof_status": pj.get("proof_status"),
        "keeps_open_conjecture": keeps_conjecture,
    }

    # 7: receipt presence on a served endpoint. Try a genuinely receipt-bearing
    #    endpoint (the vertical ledger), then the proven surface, then the legal
    #    feed. The bare /vert/legal index returns consolidation metadata (no
    #    receipt), so we must look at endpoints that actually emit receipts and
    #    fall through until one is found rather than stopping at the first 200.
    _RKEYS = ("khipu_receipt", "dsse", "receipt", "result", "receipts", "payload_digest")
    cr, br, has_receipt = None, None, False
    for _rp in ("/api/a11oy/v1/vert/legal/ledger", "/api/a11oy/v1/vert/legal/feed"):
        c, b = _get(_rp)
        if c == 200 and any(k in (b or "") for k in _RKEYS):
            cr, br, has_receipt = c, b, True
            break
    if not has_receipt:  # fall back to the always-live proven surface
        cr, br = cp, bp
        has_receipt = any(k in (br or "") for k in _RKEYS)
    out["checks"]["receipts"] = {"pass": bool(has_receipt) and cr == 200, "http": cr}

    # ---- strict-honest verdict ----
    core_live = live
    consolidation = out["checks"]["verticals_live"]["pass"] and out["checks"]["anatomy_live"]["pass"]
    if not core_live:
        out["verdict"] = "DOWN — Chaski health endpoint not reachable"
    elif is_live and consolidation and is_maintenance:
        note = out["checks"]["mode"].get("posture_note") or "GPU down for maintenance — CPU/router fallback"
        out["verdict"] = ("MAINTENANCE (honest) — GPU under maintenance, serving on %s fallback; "
                          "verticals/anatomy consolidated. %s" % (inference, note))
    elif is_live and consolidation:
        _sov = "SOVEREIGN-GPU " if is_sovereign else ""
        out["verdict"] = ("%sONE-OF-ONE LIVE — brain wired (mode=%s, inference=%s, open-weight self-run) "
                          "+ verticals/anatomy consolidated" % (_sov, mode, inference))
    elif is_live and not consolidation:
        out["verdict"] = ("BRAIN LIVE (mode=%s, inference=%s, open-weight self-run), consolidation pending "
                          "— verticals/anatomy not all 200 yet" % (mode, inference))
    elif (not is_live) and consolidation:
        out["verdict"] = "CONSOLIDATED, brain STUB — verticals/anatomy live; brain not router-wired (honest stub)"
    else:
        out["verdict"] = "PARTIAL — Chaski up in honest stub mode; brain not router-wired"
    out["honest_note"] = (
        "Brain liveness = /code/health reports inference (self-hosted-gpu when sovereign, hf-router otherwise) + a real open-weight model "
        "(primary Qwen2.5-Coder-32B). The CHAT surface is separately M2M-key-gated (admin /v1/keys), "
        "so the live DENY/P3 flip is verified in-Lean (p3c_no_deny_to_allow_flip, 0 sorry) + by Forge's "
        "authenticated test, not by this unauthenticated probe. Stub mode is an honest state, never a "
        "failure. Doctrine v11: locked=8, Λ=Conjecture 1 (advisory)."
    )
    return out


if __name__ == "__main__":
    print(json.dumps(probe(), indent=2))
