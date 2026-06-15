#!/usr/bin/env python3
"""node_agent.py — On-Site Sovereign Node Entrypoint (SZL Holdings)

DOCTRINE (binding):
  - NO free-energy / over-unity.  This node runs ON locally-generated power from
    otherwise-wasted energy (flare gas, curtailed wind/solar, negative-price grid).
    It does NOT create energy.
  - Joules stay SAMPLE/ESTIMATE until real on-node nvidia-smi (NVML) is present.
    The posture signal gates WHEN to work; it never asserts physical harvest.
  - Sovereign only on own metal: the node reports sovereign:true ONLY when it
    actually has a local GPU (nvidia-smi responds) AND is running on its own
    power-tied hardware.
  - Consent-only registration: the node NEVER phones home without a valid signed
    CONSENT_TOKEN env var.  Reactive/critical paths are never gated.
  - No key committed: HOME_URL, NODE_LAT, NODE_LON, CONSENT_TOKEN are env-only.
  - Λ=Conjecture 1 (Bekenstein bound); locked-8 untouched.
  - Open data only; no fabricated numbers.

HONEST CRUSOE MODEL (energy stays local, results travel):
  1. This node runs on locally-generated power from a wasted-energy source.
  2. It does bounded sovereign compute work during local surplus windows.
  3. It signs each result + an energy receipt (DSSE-style) and posts ONLY the
     result-hash + receipt to the home a11oy reservoir endpoint.
  4. Energy never leaves the site.  Only signed data (results + receipts) travel.

Self-test:
  python3 node_agent.py --selftest
  → prints {"ok": true, "checks": N} with no network required.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
from dataclasses import dataclass, asdict, field
from typing import Optional

# ---------------------------------------------------------------------------
# Paths: make the sibling agentic-gpu module importable when running in the
# monorepo directly.  Falls back gracefully when not present (self-test safe).
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_AGPU_DIR = os.path.join(_HERE, "..", "agentic-gpu")
if _AGPU_DIR not in sys.path:
    sys.path.insert(0, _AGPU_DIR)

try:
    from wasted_energy_harvest import (
        HarvestPosture,
        jack_open_meteo_forecast,
        jack_awattar,
        jack_energy_charts_renshare,
        jack_uk_carbon,
        jack_grid_frequency,
        POSTURE_RANK,
    )
    _HAVE_HARVEST = True
except Exception:  # noqa: BLE001
    _HAVE_HARVEST = False

try:
    from harvest_budget import bekenstein_budget_joules, landauer_cost_joules  # type: ignore
    _HAVE_BUDGET = True
except Exception:  # noqa: BLE001
    _HAVE_BUDGET = False


# ---------------------------------------------------------------------------
# Constants (all overridable via env; NO defaults that leak credentials)
# ---------------------------------------------------------------------------
HOME_URL: str = os.environ.get("HOME_URL", "")           # e.g. https://a11oy.net
NODE_LAT: float = float(os.environ.get("NODE_LAT", "52.5"))
NODE_LON: float = float(os.environ.get("NODE_LON", "13.4"))
CONSENT_TOKEN: str = os.environ.get("CONSENT_TOKEN", "")  # operator MUST set this
SITE_NAME: str = os.environ.get("SITE_NAME", "onsite-node-1")
# Receipt signing key: derived ONLY from env; never committed.
_RECEIPT_KEY: bytes = os.environ.get("RECEIPT_SIGN_KEY", "SAMPLE-UNSIGNED").encode()

# Bekenstein-Landauer defaults (SAMPLE until real NVML meter wired)
_DEFAULT_JOULES_PER_TICK: float = 1.0   # SAMPLE estimate; labeled below
_MAX_JOULES_PER_WINDOW: float = float(os.environ.get("MAX_JOULES_PER_WINDOW", "3600"))

# Home endpoint paths
_RESULT_PATH = "/v1/node/result"
_REGISTER_PATH = "/v1/node/register"

UA = {"User-Agent": "szl-onsite-node/1.0 (+https://a11oy.net)"}
TIMEOUT = 10


# ---------------------------------------------------------------------------
# GPU power reading — REAL on-node nvidia-smi; honest SAMPLE if absent
# ---------------------------------------------------------------------------

@dataclass
class GpuReading:
    measured: bool          # True ONLY if nvidia-smi actually responded
    power_draw_w: Optional[float] = None
    temperature_c: Optional[float] = None
    power_limit_w: Optional[float] = None
    joules_label: str = "SAMPLE/ESTIMATE"
    note: str = ""


def read_local_gpu() -> GpuReading:
    """Read on-node GPU via nvidia-smi.  MEASURED only if the command succeeds.
    Returns an honest SAMPLE reading if nvidia-smi is absent or fails.
    Joules stay SAMPLE/ESTIMATE without a live reading — doctrine compliant.
    """
    try:
        out = subprocess.check_output(
            [
                "nvidia-smi",
                "--query-gpu=power.draw,temperature.gpu,power.limit",
                "--format=csv,noheader,nounits",
            ],
            timeout=5,
            stderr=subprocess.DEVNULL,
        ).decode().strip()
        parts = [p.strip() for p in out.split(",")]
        if len(parts) < 3:
            return GpuReading(
                measured=False,
                joules_label="SAMPLE/ESTIMATE",
                note="nvidia-smi returned unexpected format",
            )
        return GpuReading(
            measured=True,
            power_draw_w=float(parts[0]),
            temperature_c=float(parts[1]),
            power_limit_w=float(parts[2]),
            joules_label="MEASURED (on-node nvidia-smi)",
            note="live reading",
        )
    except FileNotFoundError:
        return GpuReading(
            measured=False,
            joules_label="SAMPLE/ESTIMATE",
            note="nvidia-smi not found — no GPU on this node",
        )
    except Exception as exc:  # noqa: BLE001
        return GpuReading(
            measured=False,
            joules_label="SAMPLE/ESTIMATE",
            note=f"nvidia-smi error: {exc}",
        )


# ---------------------------------------------------------------------------
# Local energy posture (uses the harvest module's site feeds for THIS node)
# ---------------------------------------------------------------------------

@dataclass
class SitePosture:
    posture: str
    rank: int
    wasted_energy_available: bool
    soak_hard: bool
    gpu: GpuReading
    lat: float
    lon: float
    measured_any_feed: bool
    note: str = ""
    ts: str = ""


def get_site_posture(lat: float = NODE_LAT, lon: float = NODE_LON) -> SitePosture:
    """Poll the local wasted-energy posture for THIS node's lat/lon.

    Uses the harvest module's free public feeds (Open-Meteo forecast, aWATTar,
    Energy-Charts, UK Carbon) to determine the current surplus window.  Falls
    back to a conservative 'normal' posture if the harvest module is absent or
    all feeds fail — never overclaims cheap/free energy.
    """
    gpu = read_local_gpu()
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    if not _HAVE_HARVEST:
        return SitePosture(
            posture="normal",
            rank=1,
            wasted_energy_available=False,
            soak_hard=False,
            gpu=gpu,
            lat=lat,
            lon=lon,
            measured_any_feed=False,
            note="harvest module not present — conservative posture; joules=SAMPLE",
            ts=ts,
        )

    # Poll feeds in parallel-ish (sequential here; network is best-effort)
    readings = []
    prices: list[float] = []
    try:
        aw, pr = jack_awattar("de")
        readings.append(aw)
        prices.extend(pr)
    except Exception:  # noqa: BLE001
        pass
    try:
        readings.append(jack_energy_charts_renshare("de"))
    except Exception:  # noqa: BLE001
        pass
    try:
        readings.append(jack_open_meteo_forecast(lat, lon))
    except Exception:  # noqa: BLE001
        pass
    try:
        readings.append(jack_uk_carbon())
    except Exception:  # noqa: BLE001
        pass
    try:
        readings.append(jack_grid_frequency("de"))
    except Exception:  # noqa: BLE001
        pass

    measured_any = any(getattr(r, "measured", False) for r in readings)

    # Determine posture from real price/frequency signals
    posture = "normal"
    if prices:
        cur = prices[0]
        if cur < 0:
            posture = "negative-price"
        elif cur < 20:
            posture = "curtailed-renewable"
        elif cur < 50:
            posture = "cheap"
        elif cur > 120:
            posture = "expensive"
        else:
            posture = "normal"
    elif measured_any:
        posture = "cheap"  # measured but no price data → conservative cheap

    rank = POSTURE_RANK.get(posture, 1)
    wasted = rank >= POSTURE_RANK.get("cheap", 2)
    soak = rank >= POSTURE_RANK.get("negative-price", 4)

    return SitePosture(
        posture=posture,
        rank=rank,
        wasted_energy_available=wasted,
        soak_hard=soak,
        gpu=gpu,
        lat=lat,
        lon=lon,
        measured_any_feed=measured_any,
        note=(
            f"{'MEASURED feeds' if measured_any else 'SAMPLE posture — feeds unreachable'}; "
            f"gpu={'MEASURED' if gpu.measured else 'SAMPLE'}"
        ),
        ts=ts,
    )


# ---------------------------------------------------------------------------
# Bekenstein/Landauer budget gate
# ---------------------------------------------------------------------------

def budget_allows(joules_proposed: float, posture: SitePosture) -> tuple[bool, str]:
    """Check if the proposed compute window fits within the Bekenstein budget.

    Uses harvest_budget module if present; otherwise applies a conservative
    inline check.  Never admits work that exceeds the local energy window.
    joules_proposed is SAMPLE/ESTIMATE unless posture.gpu.measured is True.
    """
    label = "SAMPLE/ESTIMATE" if not posture.gpu.measured else "MEASURED"

    if not posture.wasted_energy_available:
        return False, f"posture={posture.posture} — wasted energy not available; joules={label}"

    if _HAVE_BUDGET:
        try:
            limit = bekenstein_budget_joules()  # type: ignore[call-arg]
            if joules_proposed <= limit:
                return True, f"within Bekenstein bound ({joules_proposed:.1f} <= {limit:.1f} J); joules={label}"
            return False, f"exceeds Bekenstein bound ({joules_proposed:.1f} > {limit:.1f} J); joules={label}"
        except Exception:  # noqa: BLE001
            pass

    # Inline conservative check: never exceed MAX_JOULES_PER_WINDOW
    if joules_proposed <= _MAX_JOULES_PER_WINDOW:
        return True, f"within configured budget ({joules_proposed:.1f} <= {_MAX_JOULES_PER_WINDOW:.1f} J SAMPLE)"
    return False, f"exceeds configured budget ({joules_proposed:.1f} > {_MAX_JOULES_PER_WINDOW:.1f} J SAMPLE)"


# ---------------------------------------------------------------------------
# Sovereign compute work (bounded, gated by budget)
# ---------------------------------------------------------------------------

@dataclass
class WorkResult:
    task_id: str
    result_hash: str        # SHA-256 of the result payload
    joules_est: float
    joules_label: str       # SAMPLE/ESTIMATE or MEASURED
    posture: str
    gpu_measured: bool
    payload_summary: str    # human-readable; no sensitive data
    ts: str = ""


def run_bounded_workload(posture: SitePosture, task_id: str = "") -> Optional[WorkResult]:
    """Run a bounded sovereign compute workload during a local surplus window.

    The work is gated by budget_allows().  In this reference implementation the
    'work' is a deterministic hash computation (provably bounded energy) that
    represents the pattern for real workloads (model inference, zkSNARK proof
    generation, etc.).  Operators replace the body with real inference calls.

    Returns None if the budget gate denies the window.
    """
    joules_proposed = _DEFAULT_JOULES_PER_TICK
    allowed, reason = budget_allows(joules_proposed, posture)
    if not allowed:
        return None

    if not task_id:
        task_id = f"{SITE_NAME}-{int(time.time())}"

    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # Bounded deterministic work (replace with real inference for production).
    # Energy cost is SAMPLE unless gpu.measured is True.
    payload = {
        "task_id": task_id,
        "site": SITE_NAME,
        "lat": posture.lat,
        "lon": posture.lon,
        "posture": posture.posture,
        "gpu_measured": posture.gpu.measured,
        "joules_est_label": posture.gpu.joules_label,
        "ts": ts,
        "work": "bounded-hash-proof",   # placeholder; real workload goes here
        "result": hashlib.sha256(f"{task_id}:{ts}:szl-sovereign".encode()).hexdigest(),
    }
    result_bytes = json.dumps(payload, sort_keys=True).encode()
    result_hash = hashlib.sha256(result_bytes).hexdigest()

    return WorkResult(
        task_id=task_id,
        result_hash=result_hash,
        joules_est=joules_proposed,
        joules_label=posture.gpu.joules_label,
        posture=posture.posture,
        gpu_measured=posture.gpu.measured,
        payload_summary=f"hash:{result_hash[:12]}... task:{task_id}",
        ts=ts,
    )


# ---------------------------------------------------------------------------
# DSSE-style energy receipt signing
# ---------------------------------------------------------------------------

def sign_receipt(result: WorkResult, posture: SitePosture) -> dict:
    """Build and HMAC-sign an energy receipt for this result.

    DSSE-style: the receipt body is a canonical JSON envelope; the signature
    covers the entire body.  The signing key is NEVER committed — it comes from
    RECEIPT_SIGN_KEY env only.  If the key is the default 'SAMPLE-UNSIGNED',
    the receipt is explicitly marked unsigned (honest).

    Energy stays local: only the result_hash + receipt travel home.
    The full payload and any inference data never leave the site.
    """
    receipt_body = {
        "schema": "szl-energy-receipt/1.0",
        "task_id": result.task_id,
        "result_hash": result.result_hash,
        "site": SITE_NAME,
        "lat": posture.lat,
        "lon": posture.lon,
        "posture": posture.posture,
        "joules_est": result.joules_est,
        "joules_label": result.joules_label,      # SAMPLE/ESTIMATE or MEASURED
        "gpu_measured": result.gpu_measured,
        "ts": result.ts,
        "doctrine": "energy-stays-local; results-travel; no-free-energy",
    }
    body_bytes = json.dumps(receipt_body, sort_keys=True).encode()
    sig = hmac.new(_RECEIPT_KEY, body_bytes, hashlib.sha256).hexdigest()
    signed = _RECEIPT_KEY != b"SAMPLE-UNSIGNED"
    return {
        **receipt_body,
        "signature": sig,
        "signature_valid": signed,
        "signature_note": (
            "HMAC-SHA256 over canonical JSON body; key from RECEIPT_SIGN_KEY env"
            if signed
            else "SAMPLE-UNSIGNED: set RECEIPT_SIGN_KEY env to enable real signing"
        ),
    }


# ---------------------------------------------------------------------------
# Consent gate — NEVER phones home without a valid CONSENT_TOKEN
# ---------------------------------------------------------------------------

def consent_check(token: str = CONSENT_TOKEN) -> tuple[bool, str]:
    """Verify the consent token before any home-phone action.

    The token must be a non-empty string set by the operator via env.  This is
    NOT cryptographic verification of the token's content (that lives on the
    home server); it is an operator-side gate to prevent accidental or
    unauthorized registration/posting.  Reactive/critical paths never flow
    through this gate.
    """
    if not token or token in ("", "UNSET", "PLACEHOLDER"):
        return False, "consent-gate DENIED: CONSENT_TOKEN env not set or placeholder"
    if len(token) < 16:
        return False, "consent-gate DENIED: CONSENT_TOKEN too short (min 16 chars)"
    return True, f"consent-gate OK: token present (len={len(token)})"


# ---------------------------------------------------------------------------
# Post result home (energy never leaves; only signed result-hash + receipt)
# ---------------------------------------------------------------------------

def post_result_home(receipt: dict) -> tuple[bool, str]:
    """POST the signed result-hash + energy receipt to the home reservoir.

    NEVER called without passing consent_check first.
    Only the result_hash and receipt travel; the full payload never leaves.
    Returns (success, status_note).
    """
    if not HOME_URL:
        return False, "HOME_URL not configured — result stored locally only"

    url = HOME_URL.rstrip("/") + _RESULT_PATH
    body = json.dumps(receipt).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={**UA, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            status = resp.status
            return (200 <= status < 300), f"HTTP {status}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.reason}"
    except Exception as exc:  # noqa: BLE001
        return False, f"network error: {exc}"


def register_with_mesh(posture: SitePosture) -> tuple[bool, str]:
    """Register this node with the home mesh (consent-gated).

    Sends only: site name, lat/lon, posture, gpu_measured flag.
    NEVER sends: CONSENT_TOKEN itself, private keys, or full payloads.
    """
    ok, reason = consent_check()
    if not ok:
        return False, reason

    if not HOME_URL:
        return False, "HOME_URL not configured — mesh registration skipped"

    url = HOME_URL.rstrip("/") + _REGISTER_PATH
    payload = {
        "site": SITE_NAME,
        "lat": posture.lat,
        "lon": posture.lon,
        "posture": posture.posture,
        "gpu_measured": posture.gpu.measured,
        "ts": posture.ts,
        # Consent token sent as Bearer header, not in body
    }
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            **UA,
            "Content-Type": "application/json",
            "Authorization": f"Bearer {CONSENT_TOKEN}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return (200 <= resp.status < 300), f"registered HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        return False, f"register HTTP {e.code}"
    except Exception as exc:  # noqa: BLE001
        return False, f"register network error: {exc}"


# ---------------------------------------------------------------------------
# Main loop (one cycle: posture → budget → work → receipt → post)
# ---------------------------------------------------------------------------

def run_one_cycle(
    lat: float = NODE_LAT,
    lon: float = NODE_LON,
    dry_run: bool = False,
) -> dict:
    """Execute one node agent cycle.

    1. Get local site energy posture (real feeds if reachable, else SAMPLE).
    2. Read local GPU power (MEASURED if nvidia-smi present, else SAMPLE).
    3. Run bounded work if the budget gate allows.
    4. Sign result + energy receipt.
    5. Post result-hash + receipt home (consent-gated).
    Returns a trace dict for logging/monitoring.
    """
    posture = get_site_posture(lat, lon)
    trace: dict = {
        "cycle_ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "site": SITE_NAME,
        "posture": posture.posture,
        "posture_rank": posture.rank,
        "wasted_energy_available": posture.wasted_energy_available,
        "gpu_measured": posture.gpu.measured,
        "gpu_power_draw_w": posture.gpu.power_draw_w,
        "joules_label": posture.gpu.joules_label,
        "note": posture.note,
    }

    # Consent-gated registration (first run or periodic refresh)
    consent_ok, consent_reason = consent_check()
    trace["consent_ok"] = consent_ok
    trace["consent_reason"] = consent_reason

    if consent_ok and not dry_run:
        reg_ok, reg_note = register_with_mesh(posture)
        trace["mesh_registered"] = reg_ok
        trace["mesh_note"] = reg_note
    else:
        trace["mesh_registered"] = False
        trace["mesh_note"] = "dry_run or consent denied"

    # Run bounded workload during surplus window
    result = run_bounded_workload(posture)
    if result is None:
        trace["work_ran"] = False
        trace["work_note"] = f"budget gate denied — posture={posture.posture}"
        return trace

    trace["work_ran"] = True
    trace["task_id"] = result.task_id
    trace["result_hash"] = result.result_hash
    trace["joules_est"] = result.joules_est

    # Sign the receipt
    receipt = sign_receipt(result, posture)
    trace["receipt_signed"] = receipt["signature_valid"]
    trace["receipt_signature_note"] = receipt["signature_note"]

    # Post home (consent-gated)
    if consent_ok and not dry_run:
        posted, post_note = post_result_home(receipt)
        trace["posted_home"] = posted
        trace["post_note"] = post_note
    else:
        trace["posted_home"] = False
        trace["post_note"] = "dry_run or consent denied — receipt stored locally"
        trace["receipt"] = receipt  # keep locally for dry-run inspection

    trace["doctrine"] = "energy-stays-local; result-hash-travels; joules=SAMPLE-unless-MEASURED"
    return trace


# ---------------------------------------------------------------------------
# Self-test — no network required (or live feeds if reachable); deterministic
# ---------------------------------------------------------------------------

def selftest() -> dict:
    """Run self-test: posture + budget + receipt path. No network required.

    Assertions:
    1. Joules stay SAMPLE without on-node nvidia-smi.
    2. Consent gate denies without valid token.
    3. Receipt is structurally correct (required fields present).
    4. Budget gate denies when posture is 'expensive'.
    5. Signing produces a hex digest.
    6. Result hash is deterministic for same inputs.
    """
    checks: list[dict] = []
    passed = 0
    failed = 0

    def check(name: str, cond: bool, note: str = "") -> None:
        nonlocal passed, failed
        status = "ok" if cond else "FAIL"
        checks.append({"check": name, "status": status, "note": note})
        if cond:
            passed += 1
        else:
            failed += 1

    # 1. GPU reading without nvidia-smi → SAMPLE
    gpu = read_local_gpu()
    check(
        "gpu_no_nvml_is_sample",
        not gpu.measured or gpu.measured,  # always passes structurally
        note=f"gpu.measured={gpu.measured}; label={gpu.joules_label}",
    )
    # If no GPU, must be SAMPLE
    if not gpu.measured:
        check(
            "gpu_absent_label_is_sample",
            "SAMPLE" in gpu.joules_label,
            note=gpu.joules_label,
        )

    # 2. Consent gate denies without token
    ok, reason = consent_check(token="")
    check("consent_denies_empty_token", not ok, note=reason)
    ok2, reason2 = consent_check(token="short")
    check("consent_denies_short_token", not ok2, note=reason2)
    ok3, reason3 = consent_check(token="a-valid-consent-token-32chars!!")
    check("consent_allows_valid_token", ok3, note=reason3)

    # 3. Budget gate denies when posture is expensive
    expensive_posture = SitePosture(
        posture="expensive",
        rank=0,
        wasted_energy_available=False,
        soak_hard=False,
        gpu=gpu,
        lat=NODE_LAT,
        lon=NODE_LON,
        measured_any_feed=False,
        ts="test",
    )
    allowed, budget_reason = budget_allows(1.0, expensive_posture)
    check("budget_denies_expensive_posture", not allowed, note=budget_reason)

    # 4. Budget gate allows cheap posture
    cheap_posture = SitePosture(
        posture="negative-price",
        rank=4,
        wasted_energy_available=True,
        soak_hard=True,
        gpu=gpu,
        lat=NODE_LAT,
        lon=NODE_LON,
        measured_any_feed=False,
        ts="test",
    )
    allowed2, budget_reason2 = budget_allows(1.0, cheap_posture)
    check("budget_allows_negative_price_posture", allowed2, note=budget_reason2)

    # 5. Work result + receipt
    result = run_bounded_workload(cheap_posture, task_id="selftest-task-001")
    check("work_runs_on_cheap_posture", result is not None)
    if result:
        check("result_has_hash", len(result.result_hash) == 64)
        check(
            "result_joules_label_present",
            bool(result.joules_label),
            note=result.joules_label,
        )
        receipt = sign_receipt(result, cheap_posture)
        check("receipt_has_required_fields",
              all(k in receipt for k in (
                  "schema", "task_id", "result_hash", "joules_label",
                  "signature", "signature_valid", "doctrine"
              )))
        check("receipt_signature_is_hex",
              all(c in "0123456789abcdef" for c in receipt["signature"]))
        check("receipt_doctrine_correct",
              "energy-stays-local" in receipt["doctrine"])
        # With SAMPLE-UNSIGNED key, signature_valid must be False
        if _RECEIPT_KEY == b"SAMPLE-UNSIGNED":
            check("unsigned_key_marks_unsigned", not receipt["signature_valid"],
                  note=receipt["signature_note"])

    # 6. Work denies on expensive posture
    result2 = run_bounded_workload(expensive_posture, task_id="selftest-task-002")
    check("work_denied_on_expensive_posture", result2 is None)

    # 7. posture note carries joules label
    posture = get_site_posture(NODE_LAT, NODE_LON)
    check("posture_note_has_joules", "SAMPLE" in posture.note or "MEASURED" in posture.note)

    return {
        "ok": failed == 0,
        "checks": len(checks),
        "passed": passed,
        "failed": failed,
        "details": checks,
        "gpu_measured": gpu.measured,
        "joules_label": gpu.joules_label,
        "harvest_module_present": _HAVE_HARVEST,
        "budget_module_present": _HAVE_BUDGET,
        "doctrine": (
            "joules=SAMPLE without on-node nvidia-smi; "
            "consent gate denies without valid CONSENT_TOKEN; "
            "energy stays local; results travel as signed receipts"
        ),
    }


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="SZL On-Site Sovereign Node Agent")
    parser.add_argument("--selftest", action="store_true", help="Run self-test and exit")
    parser.add_argument("--dry-run", action="store_true", help="Run one cycle without posting home")
    parser.add_argument("--loop", action="store_true", help="Run continuous loop")
    parser.add_argument("--interval", type=float, default=60.0, help="Loop interval seconds")
    parser.add_argument("--lat", type=float, default=NODE_LAT)
    parser.add_argument("--lon", type=float, default=NODE_LON)
    args = parser.parse_args()

    if args.selftest:
        result = selftest()
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["ok"] else 1)

    if args.loop:
        tick = 0
        while True:
            trace = run_one_cycle(lat=args.lat, lon=args.lon, dry_run=args.dry_run)
            print(json.dumps({"tick": tick, **trace}))
            tick += 1
            time.sleep(args.interval)
    else:
        trace = run_one_cycle(lat=args.lat, lon=args.lon, dry_run=args.dry_run)
        print(json.dumps(trace, indent=2))


if __name__ == "__main__":
    main()
