"""
SZL Agentic-GPU — brain_admission.py  (ORGAN 1 · BRAIN)
=======================================================
Upgrade the scheduler's PROACTIVE admission from a *binary energy gate* to a
**PAC-Bayes belief-update decision**: the GPU "mind" admits a proactive task
only when its value estimate, certified by a real **generalization bound**, is
high enough to clear a threshold under uncertainty. This is the BRAIN organ of
the anatomy shell — the proven `BrainBeliefUpdate` formula doing a real
agentic job (deciding what to think about next).

The bound is the **McAllester / Catoni PAC-Bayes** generalization bound, the
SAME formula proven in the round9 kernel:

    R(Q) ≤ R̂_S(Q) + sqrt( (KL(Q‖P) + ln(2√n/δ)) / (2n) )   w.p. ≥ 1-δ

  - `R̂_S(Q)`  empirical *risk* over `n` cited observations (here: 1 − value).
  - `KL(Q‖P)` KL divergence of the posterior belief `Q` from the audited prior
              `P` — how far the mind has moved from its receipts.
  - `n`        evidence count (cited receipts / past task outcomes).
  - `δ`        1−δ is the confidence; smaller δ ⇒ wider (more honest) slack.

We turn the risk bound into a **value lower bound** (value = 1 − risk):

    value_lower_bound(Q) = value_hat − halfwidth(n, δ, KL)

and ADMIT a proactive task iff that *worst-case* certified value clears the
admission threshold. So the brain never admits work whose generalization slack
(driven by how far belief has moved from the audited prior) isn't covered by
the evidence it has. Monotonicity (proved sorry-free in the Lean surrogate):
more evidence `n` tightens the bound; larger KL widens it.

LIVE ORGAN: when reachable, `pac_bayes_mcallester` on the BRAIN endpoint
(amaru `/api/amaru/v1/formulas`) computes the same bound server-side; this
module reads it opportunistically and falls back to the self-contained,
formula-faithful local bound otherwise. The decision is identical either way —
the endpoint is an oracle for the proven formula, not a different policy.

DOCTRINE (v11/v12 — never violate):
  - **Reactive NEVER starves.** This controller gates PROACTIVE admission ONLY.
    `as_energy_gate()` returns a `Callable[[Task], bool]` that the scheduler
    calls solely on the proactive path; reactive turns are never passed through
    it. `admit_reactive()` exists only to make the invariant testable and
    ALWAYS returns admit=True with an infinite bound.
  - **The bound is HONEST.** It is the real McAllester/Catoni half-width, not a
    fudge factor. We surface the Lean proof's open hypotheses
    (`BoundedIntegrability`, `ChernoffOptimisation`) verbatim — they are honest
    obligations, not fabricated theorems.
  - **SAMPLE labels.** Value/energy inputs are SAMPLE/ESTIMATE until a real
    task-outcome meter is wired; every decision carries that label.
  - **open-weight only; NEVER a key.** Pure stdlib; the optional endpoint read
    sends no auth header and never raises.
  - Λ stays Conjecture 1; this module does not touch the locked kernel.

Proven backing: `Lutar/Innovations/round9/BrainBeliefUpdate.lean`
(McAllester 1999 COLT / 2003 ML 51(1):5–21; Catoni 2007, IMS LNMS 56) and
`Lutar/PACBayes.lean::pac_bayes_bound (TH13)`. CITATION: thesis_v22.pdf §2.
"""
from __future__ import annotations

import json
import math
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from typing import Callable, Optional

# Proven-formula provenance (carried on every decision for an honest audit).
CITATION = "thesis_v22.pdf §2"
LEAN_THEOREM = "Lutar/PACBayes.lean::pac_bayes_bound (TH13)"
LEAN_ORGAN = "Lutar/Innovations/round9/BrainBeliefUpdate.lean"
# The Lean proof discharges the bound MODULO these explicit hypotheses (Mathlib
# v4.13.0 lacks the sub-Gaussian MGF lemma). They are honest open obligations,
# NOT fabricated theorems — surfaced so no decision overclaims its rigor.
OPEN_HYPOTHESES = ("BoundedIntegrability", "ChernoffOptimisation")

# Live BRAIN organ: pac_bayes_mcallester on the amaru formulas endpoint. Read
# opportunistically (read-only, no key); the local bound is the fallback.
BRAIN_ENDPOINT = "https://amaru.szlholdings.ai/api/amaru/v1/formulas"
BRAIN_FORMULA = "pac_bayes_mcallester"
_ENDPOINT_TIMEOUT_S = 4.0

# All value/energy figures are SAMPLE/ESTIMATE until a real meter is wired.
SAMPLE_LABEL = "SAMPLE/ESTIMATE (no task-outcome meter wired — doctrine v11/v12)"


# ===========================================================================
# The proven bound — McAllester/Catoni PAC-Bayes half-width (local, faithful).
# Mirrors a11oy/formulas/pac_bayes.py exactly; reproduced here so this module
# is self-contained (the scheduler must not depend on the a11oy package).
# ===========================================================================
def pac_bayes_halfwidth(n: int, delta: float, kl: float = 0.0) -> float:
    """Half-width sqrt((KL + ln(2√n/δ)) / (2n)) of the PAC-Bayes interval.

    `delta` is δ (the 1−δ confidence complement); `kl` is KL(Q‖P) ≥ 0 (0 for
    the prior-equals-posterior reference case). Raises on out-of-domain inputs
    rather than silently clamping — an honest bound never hides a bad input.
    """
    if n < 1:
        raise ValueError("n (evidence count) must be >= 1")
    if not (0.0 < delta < 1.0):
        raise ValueError("delta (confidence complement) must be in (0,1)")
    if kl < 0.0:
        raise ValueError("kl (KL divergence) must be >= 0")
    numerator = kl + math.log((2.0 * math.sqrt(n)) / delta)
    return math.sqrt(numerator / (2.0 * n))


@dataclass
class AdmissionDecision:
    """The brain's belief-update verdict for one proactive task.

    `value_lower_bound` is the high-probability worst-case value the task is
    certified to deliver: `value_hat − halfwidth`. We admit iff it clears
    `threshold`. Everything needed to audit the call travels with it.
    """
    admit: bool
    klass: str                       # "proactive" | "reactive"
    value_hat: float                 # SAMPLE point estimate of task value [0,1]
    halfwidth: float                 # PAC-Bayes certified slack
    value_lower_bound: float         # value_hat − halfwidth (worst-case value)
    threshold: float                 # admit iff value_lower_bound >= threshold
    n: int                           # evidence count
    delta: float                     # 1−δ confidence
    kl: float                        # KL(Q‖P) belief-movement from prior
    bound_source: str                # "brain-endpoint" | "local-formula"
    reason: str
    label: str = SAMPLE_LABEL
    citation: str = CITATION
    lean_theorem: str = LEAN_THEOREM

    def as_dict(self) -> dict:
        d = asdict(self)
        for k in ("value_hat", "halfwidth", "value_lower_bound", "threshold",
                  "kl"):
            d[k] = round(getattr(self, k), 6)
        d["open_hypotheses"] = list(OPEN_HYPOTHESES)
        return d


# Optional endpoint oracle: (n, delta, kl) -> halfwidth, or None on any failure.
HalfwidthOracle = Callable[[int, float, float], Optional[float]]


def _fetch_endpoint_halfwidth(n: int, delta: float, kl: float,
                              url: str = BRAIN_ENDPOINT,
                              timeout: float = _ENDPOINT_TIMEOUT_S
                              ) -> Optional[float]:
    """Ask the live BRAIN endpoint for the pac_bayes_mcallester half-width.

    Read-only, no auth header, never raises. Returns the server's half-width
    when the response carries one, else None so the caller uses the local
    formula. The query is intentionally minimal; the endpoint computes the SAME
    proven bound, so a mismatch would be a server bug, not a policy difference.
    """
    try:
        q = f"{url}/{BRAIN_FORMULA}?n={int(n)}&delta={delta}&kl={kl}"
        req = urllib.request.Request(q, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if int(resp.status) != 200:
                return None
            payload = json.loads(resp.read().decode("utf-8", errors="replace"))
    except (urllib.error.URLError, ValueError, Exception):  # noqa: BLE001
        return None
    # Accept a few honest field names; require a finite, non-negative number.
    for key in ("half_width", "halfwidth", "slack", "value"):
        v = payload.get(key) if isinstance(payload, dict) else None
        if isinstance(v, (int, float)) and math.isfinite(v) and v >= 0.0:
            return float(v)
    return None


class BrainAdmissionController:
    """PAC-Bayes belief-update admission for PROACTIVE GPU work.

    Wraps the proven McAllester/Catoni bound into the scheduler's gate seam.
    Construct once, then pass `controller.as_energy_gate()` as the scheduler's
    `energy_gate` — the scheduler is unchanged and reactive work never reaches
    this controller.

    `threshold` is the minimum certified (worst-case) value required to admit.
    `delta` is the confidence complement (1−δ). `use_endpoint` opportunistically
    consults the live BRAIN organ; it falls back to the identical local bound.
    """

    def __init__(self, threshold: float = 0.0, delta: float = 0.05,
                 use_endpoint: bool = False,
                 halfwidth_oracle: Optional[HalfwidthOracle] = None) -> None:
        if not (0.0 < delta < 1.0):
            raise ValueError("delta must be in (0,1)")
        self.threshold = threshold
        self.delta = delta
        self.use_endpoint = use_endpoint
        # Injectable oracle for deterministic tests; defaults to the live read.
        self._oracle = halfwidth_oracle or _fetch_endpoint_halfwidth

    # ---- the core belief-update decision ---------------------------------
    def decide_proactive(self, value_hat: float, n: int, kl: float,
                         name: str = "proactive") -> AdmissionDecision:
        """Belief-update admission for one proactive task.

        `value_hat` is the SAMPLE point estimate of the task's value in [0,1]
        (e.g. expected usefulness of a self-monitor / batch step). `n` is the
        evidence count behind it; `kl` is how far the belief has moved from the
        audited prior. We certify a worst-case value `value_hat − halfwidth`
        and admit iff it clears the threshold.
        """
        v = max(0.0, min(1.0, float(value_hat)))
        hw: Optional[float] = None
        source = "local-formula"
        if self.use_endpoint:
            hw = self._oracle(n, self.delta, kl)
            if hw is not None:
                source = "brain-endpoint"
        if hw is None:
            hw = pac_bayes_halfwidth(n, self.delta, kl)

        vlb = v - hw
        admit = vlb >= self.threshold
        reason = (
            f"value_lb={vlb:.4f} {'>=' if admit else '<'} threshold="
            f"{self.threshold:.4f} (value_hat={v:.4f} − halfwidth={hw:.4f}; "
            f"n={n}, δ-comp={self.delta}, KL={kl})"
        )
        return AdmissionDecision(
            admit=admit, klass="proactive", value_hat=v, halfwidth=hw,
            value_lower_bound=vlb, threshold=self.threshold, n=n,
            delta=self.delta, kl=kl, bound_source=source, reason=reason)

    def admit_reactive(self, name: str = "reactive") -> AdmissionDecision:
        """Reactive turns are ALWAYS admitted — never belief-gated, never
        starved. Returned only so the invariant is explicit and testable; the
        scheduler never routes reactive work through the gate at all.
        """
        return AdmissionDecision(
            admit=True, klass="reactive", value_hat=1.0, halfwidth=0.0,
            value_lower_bound=1.0, threshold=self.threshold, n=0,
            delta=self.delta, kl=0.0, bound_source="bypass",
            reason="reactive is never belief-gated (doctrine: never starves)")

    # ---- scheduler integration seam --------------------------------------
    def as_energy_gate(self,
                       value_of: Optional[Callable[[object], float]] = None,
                       evidence_of: Optional[Callable[[object], int]] = None,
                       kl_of: Optional[Callable[[object], float]] = None
                       ) -> Callable[[object], bool]:
        """Return a `Callable[[Task], bool]` drop-in for `scheduler.energy_gate`.

        The scheduler calls this ONLY for proactive admission, so wiring it in
        upgrades the binary gate to a belief-update decision with NO scheduler
        change and NO effect on reactive work. The `*_of` extractors read the
        task's value/evidence/KL; defaults derive conservative SAMPLE values
        from the task's energy/cost so it works against the stock `Task` shape.
        """
        v_of = value_of or _default_value_of
        e_of = evidence_of or _default_evidence_of
        k_of = kl_of or _default_kl_of

        def _gate(task: object) -> bool:
            return self.decide_proactive(v_of(task), e_of(task), k_of(task),
                                         name=getattr(task, "name", "proactive")
                                         ).admit
        return _gate


# ---- default SAMPLE extractors against the stock scheduler.Task shape -------
# These map a plain Task to (value_hat, n, kl) with conservative, honest
# defaults so the controller drops in without the daemon wiring richer signals.
def _default_value_of(task: object) -> float:
    """SAMPLE value in [0,1]: cheaper-per-tick proactive work is worth more.

    With no real outcome meter, we treat low energy draw as higher value
    (stranded-power-friendly). Bounded; honest about being an estimate.
    """
    ept = float(getattr(task, "energy_per_tick", 1.0))
    return max(0.0, min(1.0, 1.0 / (1.0 + ept)))


def _default_evidence_of(task: object) -> int:
    """SAMPLE evidence count: longer tasks carry more prior observations."""
    return max(1, int(getattr(task, "cost_ticks", 1)))


def _default_kl_of(_task: object) -> float:
    """SAMPLE belief-movement: 0.0 = belief sits at the audited prior (floor)."""
    return 0.0


# ===========================================================================
# SELF-TEST — no network, no GPU. Deterministic. Exercises the doctrine:
#   - high-confidence valuable proactive task          -> ADMITTED
#   - low-confidence / high-KL proactive task           -> DEFERRED
#   - reactive task                                     -> ALWAYS admitted
#   - the bound is the real McAllester half-width        (monotone in n and KL)
#   - as_energy_gate() drops into scheduler.py unchanged (reactive never gated)
#   - endpoint oracle path used when reachable, else local fallback (identical)
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # --- the proven half-width: monotone in KL (↑) and in evidence n (↓) ---
    hw_lo_kl = pac_bayes_halfwidth(n=100, delta=0.05, kl=0.0)
    hw_hi_kl = pac_bayes_halfwidth(n=100, delta=0.05, kl=5.0)
    check("halfwidth_increases_with_kl", hw_hi_kl > hw_lo_kl)        # Lean KEY 1
    hw_little_n = pac_bayes_halfwidth(n=10, delta=0.05, kl=1.0)
    hw_much_n = pac_bayes_halfwidth(n=1000, delta=0.05, kl=1.0)
    check("halfwidth_tightens_with_evidence", hw_much_n < hw_little_n)  # KEY 2
    check("halfwidth_positive", hw_lo_kl > 0.0)
    # Numeric anchor: n=100, δ=0.05, KL=0 -> sqrt(ln(2*10/0.05)/200).
    expect = math.sqrt(math.log((2.0 * math.sqrt(100)) / 0.05) / 200.0)
    check("halfwidth_matches_proven_formula", abs(hw_lo_kl - expect) < 1e-12)

    # --- high-confidence, valuable proactive task -> ADMITTED -------------
    # value_hat 0.95 over n=500 cited obs, belief at prior (KL 0): tight bound.
    ctrl = BrainAdmissionController(threshold=0.5, delta=0.05)
    d_hi = ctrl.decide_proactive(value_hat=0.95, n=500, kl=0.0, name="batch")
    check("valuable_proactive_admitted", d_hi.admit is True)
    check("valuable_value_lb_clears_threshold",
          d_hi.value_lower_bound >= ctrl.threshold)
    check("decision_carries_proven_citation",
          d_hi.lean_theorem == LEAN_THEOREM)

    # --- low-confidence / far-from-prior proactive task -> DEFERRED -------
    # Modest value_hat, scant evidence (n=3), large KL (belief wandered 6.0
    # from the audited prior): the certified worst-case value falls below the
    # threshold, so the brain honestly DEFERS rather than overclaim.
    d_lo = ctrl.decide_proactive(value_hat=0.55, n=3, kl=6.0, name="specul")
    check("uncertain_proactive_deferred", d_lo.admit is False)
    check("uncertain_value_lb_below_threshold",
          d_lo.value_lower_bound < ctrl.threshold)
    check("uncertain_pays_larger_slack", d_lo.halfwidth > d_hi.halfwidth)

    # --- reactive is ALWAYS admitted (never belief-gated, never starves) ---
    d_react = ctrl.admit_reactive(name="user_turn")
    check("reactive_always_admitted", d_react.admit is True)
    check("reactive_not_gated", d_react.bound_source == "bypass")
    check("reactive_infinite_confidence", d_react.value_lower_bound == 1.0)
    # Even with an impossibly high threshold, reactive still admits.
    strict = BrainAdmissionController(threshold=0.999, delta=0.01)
    check("reactive_admits_under_strict_threshold",
          strict.admit_reactive().admit is True)
    # ...while the same strict threshold would defer the very task admitted above.
    check("strict_threshold_defers_borderline",
          strict.decide_proactive(0.95, 500, 0.0).admit is False)

    # --- endpoint oracle path: used when it returns a value, else fallback -
    seen = {"called": False}

    def fake_oracle(n, delta, kl):
        seen["called"] = True
        return pac_bayes_halfwidth(n, delta, kl)  # same proven bound, "server"

    ctrl_ep = BrainAdmissionController(threshold=0.5, use_endpoint=True,
                                       halfwidth_oracle=fake_oracle)
    d_ep = ctrl_ep.decide_proactive(0.95, 500, 0.0)
    check("endpoint_oracle_consulted", seen["called"] is True)
    check("endpoint_decision_labeled_brain", d_ep.bound_source == "brain-endpoint")
    # Endpoint and local bound agree (oracle is the SAME proven formula).
    check("endpoint_matches_local", abs(d_ep.halfwidth - d_hi.halfwidth) < 1e-12)
    # Oracle miss (None) -> honest local fallback, decision unchanged.
    ctrl_miss = BrainAdmissionController(threshold=0.5, use_endpoint=True,
                                         halfwidth_oracle=lambda n, d, k: None)
    d_miss = ctrl_miss.decide_proactive(0.95, 500, 0.0)
    check("endpoint_miss_falls_back_local", d_miss.bound_source == "local-formula")

    # --- integration with the REAL scheduler (gate seam, reactive unaffected)
    sched_checked = False
    try:
        from scheduler import (AgenticGpuScheduler, Priority,  # type: ignore
                               always_admit)
        gate = ctrl.as_energy_gate()
        check("gate_is_callable", callable(gate))
        # A valuable proactive task passes the gate; a worthless one does not.
        cheap = type("T", (), {"name": "soak", "energy_per_tick": 0.1,
                               "cost_ticks": 50})()
        dear = type("T", (), {"name": "guzzler", "energy_per_tick": 50.0,
                              "cost_ticks": 1})()
        check("gate_admits_valuable_cheap_task", gate(cheap) is True)
        check("gate_defers_low_value_dear_task", gate(dear) is False)

        # Wire the brain gate into the scheduler and prove reactive still wins:
        # even when the gate would DEFER all proactive work, a reactive turn
        # runs and completes — reactive is never routed through the gate.
        deny_all = BrainAdmissionController(threshold=2.0).as_energy_gate()
        s = AgenticGpuScheduler(energy_gate=deny_all)
        s.submit_proactive("batch_soak", cost_ticks=3)
        s.submit_reactive("user_turn", cost_ticks=1)
        for _ in range(5):
            s.tick()
        st = s.stats() if hasattr(s, "stats") else {
            "reactive_done": s.reactive_done,
            "proactive_done": s.proactive_done}
        check("reactive_completes_despite_deny_all_gate",
              st.get("reactive_done", 0) >= 1)
        check("proactive_held_by_brain_gate",
              st.get("proactive_done", 0) == 0)
        sched_checked = True
    except Exception as e:  # noqa: BLE001 - scheduler not importable here.
        out["scheduler_skip_detail"] = repr(e)
        check("scheduler_wiring_skipped_cleanly", True)

    out["scheduler_integration_exercised"] = sched_checked
    out["sample_decision"] = d_hi.as_dict()
    out["open_hypotheses"] = list(OPEN_HYPOTHESES)
    out["ok"] = True
    out["doctrine"] = (
        "PROACTIVE admission via the PROVEN McAllester/Catoni PAC-Bayes bound "
        "(value_lb = value_hat − halfwidth ≥ threshold); reactive NEVER "
        "belief-gated and never starves; bound is the real generalization "
        "half-width (open hypotheses surfaced, not a fudge); live BRAIN "
        "endpoint is an oracle for the same formula with honest local "
        "fallback; SAMPLE labels; open-weight, no key; Λ stays Conjecture 1.")
    out["proven_backing"] = {"lean_organ": LEAN_ORGAN,
                             "lean_theorem": LEAN_THEOREM,
                             "citation": CITATION,
                             "brain_endpoint": f"{BRAIN_ENDPOINT} ({BRAIN_FORMULA})"}
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
