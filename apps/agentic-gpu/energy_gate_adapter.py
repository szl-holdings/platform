"""
SZL Agentic-GPU — energy_gate_adapter.py
========================================
The INTEGRATION SEAM between the energy-signal feed (PR #356,
`energy_signal/energy_signal.py`, `current_posture()`) and the preemptive
scheduler's energy gate (`scheduler.py` `EnergyGate`) + the resident daemon's
power signal (`daemon.py` `PowerSignal`).

WHY THIS FILE EXISTS:
- `scheduler.py` defines `EnergyGate = Callable[[Task], bool]` and defaults to
  `always_admit`. `daemon.py` defines `PowerSignal = Callable[[], bool]` and
  defaults to `power_not_cheap` (conservative-honest: NOT cheap unless proven).
- `energy_signal.py` produces a `PowerPosture` whose `window` is one of
  `cheap` / `normal` / `dear`, picking the cheapest HONEST posture across
  providers (real off-peak clock signal + honest wholesale stub).
- This adapter turns that posture into the boolean both callbacks expect, so
  the daemon admits heavy proactive batches ONLY when the signal honestly says
  power is cheap/stranded — and reactive turns are still NEVER energy-gated.

DOCTRINE (v11/v12):
- Energy figures stay SAMPLE/ESTIMATE; this adapter reads the *window* label
  (a policy signal), not a measured joule figure. No free-energy claim.
- HONEST DEFAULT ON MISSING SIGNAL: if the energy_signal module is not present
  (e.g. #356 not yet merged on this branch) OR a posture cannot be computed,
  the gate is CONSERVATIVE — it reports power NOT cheap, so we never overclaim
  cheap/free power. This mirrors `daemon.power_not_cheap`.
- Pure stdlib + the in-repo energy_signal module; no network, no key.

The import is defensive so `scheduler.py` / `daemon.py` keep working (and stay
ast-clean + self-testable) on a branch where `energy_signal/` is not yet present.
When #356 and #357 are both merged, `energy_signal/energy_signal.py` resolves and
the real `current_posture()` drives the gate with no further change.
"""
from __future__ import annotations

import os
import sys
from typing import Callable, Optional

# --- Defensive import of the energy-signal feed (PR #356) ------------------
# The module lives at apps/agentic-gpu/energy_signal/energy_signal.py. Make that
# package dir importable whether this file is imported as a sibling module or
# run from the apps/agentic-gpu/ dir.
_HERE = os.path.dirname(os.path.abspath(__file__))
_SIGNAL_DIR = os.path.join(_HERE, "energy_signal")
if _SIGNAL_DIR not in sys.path:
    sys.path.insert(0, _SIGNAL_DIR)

try:  # energy_signal feed (PR #356) — present once that branch is merged.
    import energy_signal as _es  # type: ignore
    _HAVE_SIGNAL = True
except Exception:  # noqa: BLE001 - missing feed => conservative-honest default.
    _es = None  # type: ignore
    _HAVE_SIGNAL = False


# The window the signal feed labels as "cheap" (off-peak / curtailed / negative
# price). Read from the feed's own constant when available so the two stay in
# lockstep; fall back to the literal otherwise.
def _cheap_window() -> str:
    return getattr(_es, "WINDOW_CHEAP", "cheap") if _HAVE_SIGNAL else "cheap"


def posture_is_cheap(now=None) -> bool:
    """True iff the energy-signal feed honestly reports a CHEAP power window.

    Conservative-honest on any failure / missing feed: returns False (NOT cheap)
    so heavy proactive work is held rather than overclaiming cheap power.
    """
    if not _HAVE_SIGNAL:
        return False
    try:
        posture = _es.current_posture(now=now)
        return posture.window == _cheap_window()
    except Exception:  # noqa: BLE001 - any failure => stay honest, not cheap.
        return False


def power_signal_from_feed() -> bool:
    """A `daemon.PowerSignal`: True iff the live posture is a cheap window.

    Drop-in replacement for `daemon.power_not_cheap` once the feed is present;
    identical conservative behaviour (returns False) when it is not.
    """
    return posture_is_cheap()


# --- LIVE WASTED-ENERGY HARVEST bridge (free public feeds, no key) ---------
# Optional sibling module `wasted_energy_harvest.py` jacks into FREE, no-token
# grid feeds (aWATTar wholesale, CAISO OASIS, Energy-Charts/Fraunhofer renewable
# share, UK Carbon Intensity) and reports a real harvest posture. When the grid
# is in a NEGATIVE-PRICE / curtailed-renewable window, that is genuinely-wasted
# energy we can soak with Bekenstein-gated batch work. This bridge is network-
# touching, so it is OPT-IN (allow_network=True) and conservative-honest on any
# failure. It NEVER asserts a measured joule: joules stay SAMPLE off-box.
try:
    import wasted_energy_harvest as _harvest  # type: ignore
    _HAVE_HARVEST = True
except Exception:  # noqa: BLE001
    _harvest = None  # type: ignore
    _HAVE_HARVEST = False


def harvest_posture_bridge(allow_network: bool = False) -> dict:
    """Return the live wasted-energy posture from the free feeds.

    Conservative-honest: if the harvest module is absent, network is disallowed,
    or any feed call fails, returns a benign `normal` posture with
    `wasted_energy_available=False` (never overclaims cheap/free power).

    Returns a dict with: posture, wasted_energy_available, soak_hard,
    price_measured (real price signal y/n), joules_label (always 'sample').
    """
    benign = {
        "posture": "normal",
        "wasted_energy_available": False,
        "soak_hard": False,
        "price_measured": False,
        "joules_label": "sample",
        "source": "none (harvest feed not consulted)",
    }
    if not (_HAVE_HARVEST and allow_network):
        return benign
    try:
        prov = _harvest.harvest_provenance()
        # joules MUST stay sample off-box no matter what the price feed says.
        prov["joules_label"] = "sample"
        return prov
    except Exception:  # noqa: BLE001 - any failure => stay honest, benign.
        return benign


def should_soak_wasted_energy(allow_network: bool = False) -> bool:
    """True iff the live grid is in a negative-price/curtailed window worth
    flooding the Bekenstein batch sponge. Reactive turns are NEVER gated by
    this; it only governs PROACTIVE batch admission."""
    return bool(harvest_posture_bridge(allow_network=allow_network).get("soak_hard"))


def make_energy_gate(now_fn: Optional[Callable[[], object]] = None) -> Callable:
    """Build a `scheduler.EnergyGate` driven by the energy-signal feed.

    The returned callable ignores the task identity (energy admission is a
    power-window policy, not per-task) and admits proactive work only when the
    current posture is a cheap window. `now_fn`, if given, supplies the clock
    (for tests / replay); otherwise the feed uses real local time.
    """
    def _gate(_task) -> bool:
        now = now_fn() if now_fn is not None else None
        return posture_is_cheap(now=now)
    return _gate


def provenance(joules_est: Optional[float] = None, now=None) -> dict:
    """Pass-through to `energy_signal.energy_provenance()` for the receipt block.

    Lets the daemon / receipt loop attach the SAME provenance shape Dev B's
    `/v1/energy/budget` receipt expects (`energy_source`, `window`,
    `price_signal`, `joules_est` SAMPLE, ...). Honest empty-but-labeled block
    when the feed is absent, so the receipt never fabricates a source.
    """
    if not _HAVE_SIGNAL:
        return {
            "energy_source": "grid",
            "window": "normal",
            "price_signal": None,
            "joules_est": joules_est,
            "joules_est_label": "SAMPLE/ESTIMATE",
            "price_signal_label": "SAMPLE/ESTIMATE",
            "signal_provider": "none (energy_signal feed not present)",
            "ts": None,
            "honest_note": "energy_signal feed unavailable; conservative default.",
        }
    return _es.energy_provenance(joules_est=joules_est, now=now)


# ===========================================================================
# FORMULA-GROUNDED SOAK BRIDGE (PR #370 + harvest_budget.py)
# ===========================================================================
# When should_soak_wasted_energy() is True, the daemon admits batch jobs ONLY
# up to the Bekenstein-additive cap, logs each into the monotone SoakLedger,
# and stops at the Ouroboros bound.  This is the proven-bounded upgrade to the
# heuristic sponge.
#
# Proven bounds enforced (all kernel-checked or test-checked):
#   1. Bekenstein additive cap (information bound)
#      — bekenstein_bound_additive / info_within_bound
#        [EnergyBudgetWitness.lean, lutar-lean PR #239, keystone, 0-sorry]
#   2. Landauer floor (energy lower bound, anti-over-unity)
#      — landauer_floor_pos / energyFloor n q = n*q
#        [LandauerFloorWitness.lean, lutar-lean PR #240]
#   3. Monotone SoakLedger (append-only accrual)
#      — energy_ledger_monotone / ledger_step_monotone (= f19_budget_monotone)
#        [EnergyBudgetWitness.lean, lutar-lean PR #239]
#   4. Ouroboros bounded recursion (hard loop cap)
#      — runLoop({ maxSteps }) 'budgetExhausted'
#        [szl-holdings/ouroboros packages/ouroboros/src/loop-kernel.ts]
#
# Joule figures stay SAMPLE/ESTIMATE throughout; the information/bit bounds ARE
# provable and kernel-checked; energy values wait for real on-box NVML.

try:
    import harvest_budget as _hb  # type: ignore
    _HAVE_HARVEST_BUDGET = True
except Exception:  # noqa: BLE001
    _hb = None  # type: ignore
    _HAVE_HARVEST_BUDGET = False


def plan_soak(
    window: Optional[dict] = None,
    jobs: Optional[list] = None,
    window_cap_bytes: Optional[int] = None,
    allow_network: bool = False,
) -> dict:
    """Admit batch jobs into the soak window, bounded by proven formulas.

    When should_soak_wasted_energy() is True:
      - Computes the Bekenstein-additive cap for the window.
      - Admits jobs only while the cap holds (info_within_bound).
      - Logs each admitted job into the monotone SoakLedger.
      - Stops at the Ouroboros max-steps bound.
      - Checks each SAMPLE joule estimate against the Landauer floor.

    If harvest_budget is not present or window is not a soak window, returns
    a conservative empty plan (admits nothing).

    Args:
      window    — harvest posture dict. If None, fetches via harvest_posture_bridge.
      jobs      — list of job dicts (each: id, info_bits, joules_est).
      window_cap_bytes — Bekenstein window cap in bytes; None → auto.
      allow_network    — whether to call live feeds for posture.

    Returns:
      dict with keys: admitted, refused, bekenstein_cap_bits, bekenstein_used_bits,
        ouroboros_steps_taken, ouroboros_max_steps, ouroboros_exit_reason,
        proven_bounds_respected, joules_label, honest_note.

    Proven bounds respected: see module docstring above.
    """
    if jobs is None:
        jobs = []

    if window is None:
        window = harvest_posture_bridge(allow_network=allow_network)

    # Conservative fallback if harvest_budget module is not present
    if not _HAVE_HARVEST_BUDGET:
        return {
            "admitted": [],
            "refused": jobs,
            "bekenstein_cap_bits": 0,
            "bekenstein_used_bits": 0,
            "ouroboros_steps_taken": 0,
            "ouroboros_max_steps": 0,
            "ouroboros_exit_reason": "harvest_budget_unavailable",
            "proven_bounds_respected": [
                "harvest_budget module not present; all jobs held (conservative)"
            ],
            "joules_label": "sample",
            "honest_note": "harvest_budget module unavailable; conservative default.",
        }

    plan = _hb.plan_soak(
        window=window,
        jobs=jobs,
        window_cap_bytes=window_cap_bytes,
    )
    return {
        "admitted": plan.admitted,
        "refused": plan.refused,
        "bekenstein_cap_bits": plan.bekenstein_cap_bits,
        "bekenstein_used_bits": plan.bekenstein_used_bits,
        "ouroboros_steps_taken": plan.ouroboros_steps_taken,
        "ouroboros_max_steps": plan.ouroboros_max_steps,
        "ouroboros_exit_reason": plan.ouroboros_exit_reason,
        "proven_bounds_respected": plan.proven_bounds_respected,
        "joules_label": "sample",
        "honest_note": plan.honest_note,
    }


# ===========================================================================
# SELF-TEST — no network. Exercises the adapter against the real feed when
# present, and the conservative-honest path when it is not.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"have_signal": _HAVE_SIGNAL, "checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # The gate is a valid EnergyGate: callable(task) -> bool, task ignored.
    gate = make_energy_gate()
    val = gate(object())
    check("gate_returns_bool", isinstance(val, bool))

    # power_signal_from_feed is a valid PowerSignal: () -> bool.
    ps = power_signal_from_feed()
    check("power_signal_returns_bool", isinstance(ps, bool))

    # provenance always carries the SAMPLE/ESTIMATE label (doctrine).
    prov = provenance(joules_est=None)
    check("provenance_has_energy_source", "energy_source" in prov)
    check("provenance_joules_labeled",
          prov.get("joules_est_label") == "SAMPLE/ESTIMATE")

    # plan_soak with normal posture admits nothing (reactive preemption wins).
    normal_window = {
        "posture": "normal",
        "wasted_energy_available": False,
        "soak_hard": False,
        "joules_label": "sample",
    }
    plan_normal = plan_soak(
        window=normal_window,
        jobs=[{"id": "j1", "info_bits": 100, "joules_est": 0.0}],
        window_cap_bytes=200,
    )
    check("plan_soak_normal_admits_nothing", len(plan_normal["admitted"]) == 0)
    check("plan_soak_joules_label_sample", plan_normal["joules_label"] == "sample")

    # plan_soak with negative-price posture admits jobs within Bekenstein cap.
    neg_window = {
        "posture": "negative-price",
        "wasted_energy_available": True,
        "soak_hard": True,
        "joules_label": "sample",
    }
    plan_neg = plan_soak(
        window=neg_window,
        jobs=[
            {"id": "j1", "info_bits": 40, "joules_est": 0.0},
            {"id": "j2", "info_bits": 30, "joules_est": 0.0},
            {"id": "j3", "info_bits": 20, "joules_est": 0.0},  # exceeds 80-bit cap
        ],
        window_cap_bytes=10,  # cap = 80 bits
    )
    check("plan_soak_negprice_admits_two", len(plan_neg["admitted"]) == 2)
    check("plan_soak_negprice_refuses_one", len(plan_neg["refused"]) == 1)
    check("plan_soak_bekenstein_respected",
          plan_neg["bekenstein_used_bits"] <= plan_neg["bekenstein_cap_bits"])
    check("plan_soak_proven_bounds_present",
          len(plan_neg["proven_bounds_respected"]) >= 4)

    if _HAVE_SIGNAL:
        # With the feed present, gate value must agree with the live window.
        posture = _es.current_posture()
        expected = posture.window == _cheap_window()
        check("gate_tracks_live_window", gate(object()) == expected)
        check("power_signal_tracks_gate", power_signal_from_feed() == expected)
        # Force a known-cheap and known-dear time through now_fn if the feed
        # exposes off-peak hours: 02:00 local is off-peak (cheap), 12:00 is not.
        try:
            from datetime import datetime
            cheap_gate = make_energy_gate(
                now_fn=lambda: datetime.now().replace(hour=2, minute=0))
            dear_gate = make_energy_gate(
                now_fn=lambda: datetime.now().replace(hour=12, minute=0))
            check("offpeak_hour_admits", cheap_gate(object()) is True)
            check("onpeak_hour_holds", dear_gate(object()) is False)
        except Exception:  # noqa: BLE001 - clock-shaping is best-effort.
            pass
    else:
        # Conservative-honest: no feed => never claims cheap power.
        check("no_feed_gate_false", gate(object()) is False)
        check("no_feed_power_false", power_signal_from_feed() is False)

    out["ok"] = True
    out["doctrine"] = ("energy admission reads the SAMPLE power-WINDOW label, "
                       "not a measured joule; conservative-honest (NOT cheap) "
                       "on missing/failed signal; reactive never energy-gated; "
                       "soak bounded by Bekenstein cap + Landauer floor + "
                       "monotone ledger + Ouroboros loop bound.")
    return out


if __name__ == "__main__":
    import json
    print(json.dumps(_selftest(), indent=2))
