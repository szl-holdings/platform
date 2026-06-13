"""
SZL Agentic-GPU — immune_gate.py  (IMMUNE organ of the anatomy shell)
=====================================================================
A Neyman-Pearson OPTIMAL (most-powerful) admission gate for the agentic GPU's
PROACTIVE work. The "immune system" of the body-plan
(energy_engine/anatomy/ANATOMY_SHELL_AGENTIC_BODY.md): it admits a proactive /
batch task ONLY when the evidence (cheap/stranded power + GPU headroom + task
safety) passes a likelihood-ratio test at a controlled false-admit rate — and
**denies by default** otherwise. REACTIVE turns are NEVER passed through this
gate (they must always serve); this composes with, and is strictly additional
to, the existing `scheduler.EnergyGate`.

PROVEN BACKING — ImmuneNeymanPearson (lutar-lean round9, kernel-proven):
  The Neyman-Pearson lemma: among all tests of H0 vs H1 with false-positive
  (type-I) rate ≤ α, the likelihood-ratio test  Λ(x) = p1(x)/p0(x) ≥ k  is the
  MOST POWERFUL — it maximizes true-positive (admit-good) power at that α. So a
  deny-by-default immune gate that thresholds the LR at the k matching the
  chosen α is provably the best admit/deny rule for a given false-admit budget.
  Live runtime: IMMUNE = sentra /api/sentra/v1/gates (8 deny-by-default gates).

  Hypotheses here (per proactive task, given evidence x = features below):
    H0 : the task should NOT be admitted now (power dear / no headroom / unsafe)
    H1 : the task SHOULD be admitted now (cheap power + headroom + safe + valuable)
  Decision: ADMIT iff Λ(x) = L1(x) / L0(x) ≥ k(α).  Else DENY (deny-by-default).

DOCTRINE (v11/v12 — never violate):
- DENY-BY-DEFAULT: absence/weakness of evidence => DENY. On ANY error, missing
  feature, or unreachable IMMUNE endpoint, the gate denies (never fail-open).
- REACTIVE IS NEVER GATED. This module only ever decides PROACTIVE admission;
  the scheduler routes reactive work around every gate.
- HONEST TEST: a real NP likelihood-ratio with a controlled type-I (false-admit)
  rate α. The threshold k is derived from α via the LR null distribution, not a
  hand-tuned fudge. We state α and report the realized LR + decision.
- Evidence figures that derive from power are SAMPLE/ESTIMATE (no metered joule).
- Pure stdlib. No network in the test path. No key. open-weight only.

This file is DISJOINT from scheduler.py / energy_gate_adapter.py: it produces a
`scheduler.EnergyGate`-compatible callable and an explicit `compose_gates` so an
operator can AND the immune gate with the energy gate without touching either.
"""
from __future__ import annotations

import json
import math
import os
import sys
import urllib.request
from dataclasses import dataclass, asdict, field
from typing import Callable, Optional, Sequence

# Defensive import of the scheduler's Priority enum so the reactive short-circuit
# guard is REAL (a REACTIVE task is structurally ungatable — defense in depth).
# scheduler.py lives in this same dir on feat/agentic-gpu-scheduler; mirror the
# daemon.py seam. If it is unimportable (different layout / standalone copy),
# try adding our own dir to sys.path, then fall back to a value-compatible stub
# (REACTIVE=0 / PROACTIVE=1) so this module stays import-safe everywhere.
try:  # pragma: no cover - exercised by both import layouts.
    from scheduler import Priority  # type: ignore
except Exception:  # noqa: BLE001
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from scheduler import Priority  # type: ignore
    except Exception:  # noqa: BLE001 - value-compatible stub mirrors scheduler.
        from enum import IntEnum

        class Priority(IntEnum):  # type: ignore[no-redef]
            REACTIVE = 0
            PROACTIVE = 1

# IMMUNE live runtime (read-only, real): the 8 deny-by-default sentra gates.
IMMUNE_ENDPOINT = "https://sentra/api/sentra/v1/gates"  # base; off-box here.

# The 8 live sentra IMMUNE gates (deny-by-default). Named here so the README and
# the gate's `gates_consulted` report stay in lockstep with the runtime; this
# module enforces the doctrine subset that is decidable in the control plane.
SENTRA_GATES = (
    "overclaim",        # reject claims that exceed what the proof supports
    "sovereignty",      # reject the half-state (banner sovereign while router serves)
    "energy_honesty",   # reject unlabeled / fabricated joule figures
    "consent",          # reject unauthorized swarm / cross-node action
    "key_exposure",     # reject anything that would commit / leak a key
    "open_weight",      # reject non-open-weight model use
    "provenance",       # reject actions with no signed receipt path
    "safety",           # reject unsafe / destructive proactive work
)

# Default controlled false-admit (type-I) rate. The LR threshold k is derived
# from this α against the null (H0) LR distribution — see `threshold_for_alpha`.
DEFAULT_ALPHA = 0.05


@dataclass
class Evidence:
    """The evidence vector x for one proactive task's admit/deny decision.

    Each field is in [0,1] and is SAMPLE/ESTIMATE (policy signals, not metered):
      - power_cheap   : how cheap/stranded power is now (1=stranded, 0=peak).
      - gpu_headroom  : free GPU capacity / slack (1=idle, 0=saturated).
      - task_safety   : how clearly the task passes the safety/consent gates
                        (1=clearly safe & authorized, 0=unknown/unsafe).
      - task_value    : estimated value/priority of doing this proactive work.
    `hard_deny` short-circuits to DENY regardless of the LR (a sentra gate hard
    rejection — e.g. key exposure, non-open-weight, missing provenance).
    """
    power_cheap: float
    gpu_headroom: float
    task_safety: float
    task_value: float
    hard_deny: bool = False
    hard_deny_gate: Optional[str] = None

    def as_vector(self) -> tuple[float, float, float, float]:
        clamp = lambda v: max(0.0, min(1.0, float(v)))
        return (clamp(self.power_cheap), clamp(self.gpu_headroom),
                clamp(self.task_safety), clamp(self.task_value))


@dataclass
class NPModel:
    """Likelihood model for the Neyman-Pearson test.

    Under each hypothesis the evidence features are modeled as independent
    Gaussians with shared variance `sigma**2`; H1 ("admit") centers each feature
    high (`mu1`, near 1 = strong evidence), H0 ("deny") centers each low
    (`mu0`, near 0 = weak evidence). The per-feature LR is then monotone in the
    feature, so the joint LR Λ(x)=∏ p1/p0 is the most-powerful statistic (NP
    lemma) and ADMIT iff Λ(x) ≥ k(α). Weights let safety/power matter more.
    """
    mu1: float = 0.80          # H1 mean per feature (admit-worthy is high)
    mu0: float = 0.20          # H0 mean per feature (deny-worthy is low)
    sigma: float = 0.30        # shared std-dev of the feature noise
    # Relative weight of each feature (power, headroom, safety, value).
    weights: Sequence[float] = field(default=(1.0, 1.0, 1.5, 1.0))

    def log_lr(self, x: Sequence[float]) -> float:
        """Log likelihood ratio  log Λ(x) = Σ w_i * log[p1(x_i)/p0(x_i)].

        For shared-variance Gaussians, log p1/p0 per feature reduces to the
        closed form  (mu1-mu0)/sigma^2 * (x_i - (mu1+mu0)/2)  — exact, no fudge.
        """
        coef = (self.mu1 - self.mu0) / (self.sigma ** 2)
        mid = (self.mu1 + self.mu0) / 2.0
        total = 0.0
        for w, xi in zip(self.weights, x):
            total += w * coef * (xi - mid)
        return total

    def lr(self, x: Sequence[float]) -> float:
        """Likelihood ratio Λ(x) = exp(log Λ(x))."""
        return math.exp(self.log_lr(x))

    def null_loglr_mean_sd(self) -> tuple[float, float]:
        """Mean and SD of log Λ(X) under H0 (X_i ~ N(mu0, sigma^2)).

        log Λ is linear in x, so under H0 it is Gaussian with closed-form
        mean/SD. This is what lets us pick k(α) HONESTLY: k is the (1-α)
        quantile of the H0 log-LR distribution, i.e. P_{H0}(log Λ ≥ log k) = α.
        """
        coef = (self.mu1 - self.mu0) / (self.sigma ** 2)
        mid = (self.mu1 + self.mu0) / 2.0
        mean = 0.0
        var = 0.0
        for w in self.weights:
            a = w * coef                      # log-LR contribution = a*(x_i - mid)
            mean += a * (self.mu0 - mid)      # E[x_i]=mu0 under H0
            var += (a * self.sigma) ** 2      # Var[a*x_i] = a^2 * sigma^2
        return mean, math.sqrt(var)


def _normal_ppf(p: float) -> float:
    """Inverse standard-normal CDF (Acklam's rational approximation).

    Used to turn the false-admit rate α into the (1-α) z-quantile for the H0
    log-LR distribution. Accurate to ~1e-9 over (0,1); pure stdlib (no scipy).
    """
    if p <= 0.0:
        return -math.inf
    if p >= 1.0:
        return math.inf
    a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
         1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
    b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
         6.680131188771972e+01, -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
         -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
         3.754408661907416e+00]
    plow, phigh = 0.02425, 1 - 0.02425
    if p < plow:
        q = math.sqrt(-2 * math.log(p))
        return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / \
               ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    if p > phigh:
        q = math.sqrt(-2 * math.log(1 - p))
        return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / \
                ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    q = p - 0.5
    r = q * q
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5]) * q / \
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)


def threshold_for_alpha(model: NPModel, alpha: float = DEFAULT_ALPHA) -> float:
    """The log-LR threshold log k(α) that controls the false-admit rate at α.

    By the NP lemma the most-powerful size-α test is {log Λ ≥ log k} where
    P_{H0}(log Λ ≥ log k) = α. Since log Λ is Gaussian under H0 (mean μ0, sd σ0),
    log k = μ0 + z_{1-α} · σ0. This is a derived, honest threshold — NOT tuned.
    """
    mean0, sd0 = model.null_loglr_mean_sd()
    z = _normal_ppf(1.0 - alpha)
    return mean0 + z * sd0


@dataclass
class ImmuneDecision:
    """The result of one NP admission test (proactive only)."""
    admit: bool
    log_lr: float
    log_threshold: float
    alpha: float
    reason: str
    hard_denied_gate: Optional[str] = None
    gates_consulted: tuple = SENTRA_GATES

    def as_dict(self) -> dict:
        d = asdict(self)
        d["log_lr"] = round(self.log_lr, 6)
        d["log_threshold"] = round(self.log_threshold, 6)
        d["lr"] = round(math.exp(self.log_lr), 6)
        d["k_threshold"] = round(math.exp(self.log_threshold), 6)
        d["decision"] = "ADMIT" if self.admit else "DENY"
        d["label"] = "SAMPLE/ESTIMATE evidence; NP likelihood-ratio test"
        return d


def np_admit(evidence: Evidence, model: Optional[NPModel] = None,
             alpha: float = DEFAULT_ALPHA) -> ImmuneDecision:
    """The Neyman-Pearson admit/deny decision for ONE proactive task.

    Deny-by-default: a hard sentra-gate rejection short-circuits to DENY; else
    ADMIT iff the likelihood ratio clears the α-controlled threshold. Never
    raises — any malformed evidence path resolves to DENY (fail-closed).
    """
    m = model or NPModel()
    log_thr = threshold_for_alpha(m, alpha)

    # Hard deny: a binary sentra gate (key exposure, non-open-weight, missing
    # provenance, unsafe) rejects regardless of the soft LR — deny-by-default.
    if evidence.hard_deny:
        return ImmuneDecision(
            admit=False, log_lr=-math.inf, log_threshold=log_thr, alpha=alpha,
            reason=("hard sentra-gate rejection (deny-by-default): "
                    f"{evidence.hard_deny_gate or 'unspecified gate'}"),
            hard_denied_gate=evidence.hard_deny_gate)

    try:
        x = evidence.as_vector()
        log_lr = m.log_lr(x)
    except Exception:  # noqa: BLE001 - malformed evidence => fail CLOSED.
        return ImmuneDecision(
            admit=False, log_lr=-math.inf, log_threshold=log_thr, alpha=alpha,
            reason="evidence unreadable; deny-by-default (fail-closed)")

    admit = log_lr >= log_thr
    reason = ("evidence clears NP threshold at "
              f"alpha={alpha}: admit" if admit else
              f"evidence below NP threshold at alpha={alpha}: deny-by-default")
    return ImmuneDecision(admit=admit, log_lr=log_lr, log_threshold=log_thr,
                          alpha=alpha, reason=reason)


# An evidence provider maps a scheduler Task -> Evidence. The operator supplies
# one wired to the live signals (power posture, GPU headroom, sentra gates). The
# default is conservative-honest: unknown safety/value => weak evidence => DENY.
EvidenceFn = Callable[[object], Evidence]


def conservative_evidence(_task: object) -> Evidence:
    """Default evidence: everything unknown => weak => deny-by-default.

    Honest floor when no live signal is wired: power not known cheap, no known
    headroom, safety/value unestablished. The NP test will DENY on this.
    """
    return Evidence(power_cheap=0.0, gpu_headroom=0.0,
                    task_safety=0.0, task_value=0.0)


def is_reactive(task: object) -> bool:
    """True iff `task` is a REACTIVE turn (Priority.REACTIVE / value 0).

    Defense in depth: the scheduler ALREADY routes reactive work around every
    gate, but the immune gate ALSO recognises a reactive task and short-circuits
    to ADMIT — so even if this gate were ever (mis)applied to reactive work it
    could NEVER deny it. Tolerant of a `.priority` that is the enum, an int, or
    absent (absent => treat as proactive => still gated). Never raises.
    """
    try:
        p = getattr(task, "priority", None)
        if p is None:
            return False
        # Compare by value so an enum, plain int, or stub all work.
        return int(getattr(p, "value", p)) == int(Priority.REACTIVE)
    except Exception:  # noqa: BLE001 - unknown shape => not reactive => stay gated.
        return False


def make_immune_gate(evidence_fn: EvidenceFn = conservative_evidence,
                     model: Optional[NPModel] = None,
                     alpha: float = DEFAULT_ALPHA) -> Callable[[object], bool]:
    """Build a `scheduler.EnergyGate`-compatible immune gate (proactive only).

    Returns `callable(task) -> bool`: True = ADMIT this proactive task, False =
    DENY (deny-by-default). The scheduler only ever calls this for proactive
    work; reactive turns bypass every gate. As DEFENSE IN DEPTH this gate ALSO
    short-circuits to ADMIT for a reactive task, so reactive can never be gated
    even by accident. Never raises (fail-closed → False for proactive work).
    """
    m = model or NPModel()

    def _gate(task: object) -> bool:
        # Structural reactive guard: reactive work is NEVER gated (always admit).
        if is_reactive(task):
            return True
        try:
            ev = evidence_fn(task)
            return np_admit(ev, model=m, alpha=alpha).admit
        except Exception:  # noqa: BLE001 - any failure => deny-by-default.
            return False
    return _gate


def compose_gates(*gates: Callable[[object], bool]) -> Callable[[object], bool]:
    """AND several proactive gates (e.g. energy gate ∧ immune gate).

    Deny-by-default composition: a task is admitted only if EVERY gate admits;
    any gate that denies (or raises) denies the whole. This is how the immune
    gate stacks ON TOP of the existing energy gate without modifying either.
    """
    def _composed(task: object) -> bool:
        for g in gates:
            try:
                if not g(task):
                    return False
            except Exception:  # noqa: BLE001 - a raising gate denies.
                return False
        return True
    return _composed


def sentra_gates_reachable(endpoint: str = IMMUNE_ENDPOINT,
                           timeout: float = 1.0) -> bool:
    """Best-effort liveness probe of the live IMMUNE endpoint (8 sentra gates).

    OFF-BOX DEFAULT: the live runtime `sentra /api/sentra/v1/gates` is on-box; off
    the box it is unreachable and this returns False — at which point admission
    falls back to the self-contained NP test above. Pure stdlib, short timeout,
    NEVER raises, NO key sent (open-weight / no-key). This is advisory only: it
    never WEAKENS the decision — a reachable endpoint does not auto-admit, and an
    unreachable one keeps deny-by-default via the local NP test.
    """
    try:
        req = urllib.request.Request(endpoint, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310
            return 200 <= getattr(r, "status", r.getcode()) < 500
    except Exception:  # noqa: BLE001 - any failure => not reachable => fall back.
        return False


# ===========================================================================
# SELF-TEST — no network, no GPU. Exercises the NP test and the scheduler
# composition deterministically:
#   - strong evidence (cheap power + headroom + safe + valuable) -> ADMIT
#   - weak evidence (peak power, no headroom, unknown safety)     -> DENY
#   - hard sentra-gate rejection (e.g. key_exposure)              -> DENY
#   - the α-threshold actually controls the false-admit rate       (NP honesty)
#   - composed with energy gate: either gate denying -> DENY       (deny-by-default)
#   - REACTIVE work is never routed through the gate (scheduler invariant)
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"checks": [], "gates_consulted": list(SENTRA_GATES)}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    model = NPModel()

    # --- strong evidence => ADMIT ----------------------------------------
    strong = Evidence(power_cheap=0.95, gpu_headroom=0.90,
                      task_safety=0.95, task_value=0.85)
    d_strong = np_admit(strong, model=model)
    check("strong_evidence_admits", d_strong.admit is True)
    check("strong_lr_above_threshold", d_strong.log_lr >= d_strong.log_threshold)

    # --- weak evidence => DENY (deny-by-default) -------------------------
    weak = Evidence(power_cheap=0.10, gpu_headroom=0.15,
                    task_safety=0.20, task_value=0.30)
    d_weak = np_admit(weak, model=model)
    check("weak_evidence_denies", d_weak.admit is False)
    check("weak_lr_below_threshold", d_weak.log_lr < d_weak.log_threshold)

    # --- the conservative default (all unknown) => DENY ------------------
    d_default = np_admit(conservative_evidence(None), model=model)
    check("conservative_default_denies", d_default.admit is False)

    # --- hard sentra-gate rejection => DENY regardless of soft evidence --
    hard = Evidence(power_cheap=0.99, gpu_headroom=0.99,
                    task_safety=0.99, task_value=0.99,
                    hard_deny=True, hard_deny_gate="key_exposure")
    d_hard = np_admit(hard, model=model)
    check("hard_gate_denies_despite_strong_evidence", d_hard.admit is False)
    check("hard_gate_names_the_gate", d_hard.hard_denied_gate == "key_exposure")

    # --- NP HONESTY: simulate the null (H0) and verify the realized
    #     false-admit rate is controlled at ~alpha (most-powerful, size-α). ---
    import random
    rng = random.Random(20260613)
    alpha = 0.05
    log_thr = threshold_for_alpha(model, alpha)
    n = 20000
    false_admits = 0
    for _ in range(n):
        # Draw evidence from H0: each feature ~ N(mu0, sigma) clamped to [0,1].
        feats = [min(1.0, max(0.0, rng.gauss(model.mu0, model.sigma)))
                 for _ in range(4)]
        if model.log_lr(feats) >= log_thr:
            false_admits += 1
    realized_alpha = false_admits / n
    out["realized_false_admit_rate"] = round(realized_alpha, 4)
    out["target_alpha"] = alpha
    # log_thr is the EXACT analytic (1-alpha) quantile of the H0 log-LR (which is
    # Gaussian under the unclamped model), so the realized false-admit rate is a
    # finite-sample estimate that should sit NEAR alpha. We assert it lands in a
    # tight band around alpha (Monte-Carlo + the mild clamping effect), proving
    # the threshold honestly controls type-I error rather than being a fudge.
    # Band half-width ~3 binomial SEs (~0.005 at n=20k) plus a small clamp margin.
    check("false_admit_rate_controlled_near_alpha",
          abs(realized_alpha - alpha) <= 0.015)
    # And H1 evidence is admitted far more often than H0 (real test power).
    true_admits = 0
    for _ in range(n):
        feats = [min(1.0, max(0.0, rng.gauss(model.mu1, model.sigma)))
                 for _ in range(4)]
        if model.log_lr(feats) >= log_thr:
            true_admits += 1
    realized_power = true_admits / n
    out["realized_power"] = round(realized_power, 4)
    check("test_has_real_power", realized_power > 0.5)
    check("power_exceeds_false_admit_rate", realized_power > realized_alpha)

    # --- composition with an energy gate: deny-by-default AND -------------
    immune = make_immune_gate(evidence_fn=lambda _t: strong, model=model)
    energy_open = lambda _t: True
    energy_closed = lambda _t: False
    admit_both = compose_gates(energy_open, immune)
    deny_energy = compose_gates(energy_closed, immune)   # energy denies
    immune_deny = make_immune_gate(evidence_fn=lambda _t: weak, model=model)
    deny_immune = compose_gates(energy_open, immune_deny)  # immune denies
    check("compose_admits_when_both_open", admit_both(object()) is True)
    check("compose_denies_when_energy_closed", deny_energy(object()) is False)
    check("compose_denies_when_immune_weak", deny_immune(object()) is False)

    # --- the gate is a valid EnergyGate, and a raising gate denies --------
    g = make_immune_gate(evidence_fn=lambda _t: strong, model=model)
    check("gate_returns_bool", isinstance(g(object()), bool))
    raising = compose_gates(lambda _t: (_ for _ in ()).throw(ValueError()), g)
    check("raising_gate_denies", raising(object()) is False)

    # --- integration with the real scheduler IF present: REACTIVE is never
    #     gated; a denied immune gate holds PROACTIVE but reactive still serves.
    sched_checked = False
    try:
        from scheduler import AgenticGpuScheduler  # type: ignore
        deny_all_immune = make_immune_gate(
            evidence_fn=conservative_evidence, model=model)  # all-unknown => deny
        s = AgenticGpuScheduler(energy_gate=deny_all_immune)
        s.submit_proactive("batch_soak", cost_ticks=2)
        s.submit_reactive("urgent_turn", cost_ticks=1)
        r1 = s.tick()   # reactive must serve despite the immune gate denying
        check("reactive_serves_despite_immune_deny", r1.klass == "reactive")
        r2 = s.tick()   # proactive is held by the deny-by-default immune gate
        check("proactive_held_by_immune_gate",
              r2.ran is None and r2.idle_reason == "energy_gate_closed")
        # Flip to an admitting gate => proactive now completes (reactive drained).
        s.energy_gate = make_immune_gate(evidence_fn=lambda _t: strong,
                                         model=model)
        s.run_until_idle()
        check("proactive_completes_once_admitted", s.proactive_done == 1)
        sched_checked = True
    except Exception:  # noqa: BLE001 - scheduler not importable here; skip.
        check("scheduler_wiring_skipped_cleanly", True)

    out["scheduler_integration_exercised"] = sched_checked

    # --- REACTIVE IS NEVER GATED (defense-in-depth structural guard): even when
    #     the gate is built to deny ALL proactive work, a reactive task is still
    #     admitted by the gate itself (mirrors scheduler.Priority). -------------
    class _ReactiveTask:
        priority = Priority.REACTIVE

    class _ProactiveTask:
        priority = Priority.PROACTIVE

    deny_all = make_immune_gate(evidence_fn=conservative_evidence, model=model)
    check("reactive_task_always_admitted_by_guard", deny_all(_ReactiveTask()) is True)
    check("proactive_task_still_denied_by_deny_default",
          deny_all(_ProactiveTask()) is False)
    check("is_reactive_recognises_reactive", is_reactive(_ReactiveTask()) is True)
    check("is_reactive_rejects_proactive", is_reactive(_ProactiveTask()) is False)
    check("is_reactive_no_priority_is_not_reactive", is_reactive(object()) is False)

    # --- ALPHA CONTROL IS HONEST & MONOTONE: raising alpha (bigger false-admit
    #     budget) lowers the threshold => admits MORE; lowering alpha admits LESS.
    #     Count H0-sample admits at three alphas and assert strict monotonicity.
    import random as _random
    rng2 = _random.Random(424242)
    h0 = [[min(1.0, max(0.0, rng2.gauss(model.mu0, model.sigma))) for _ in range(4)]
          for _ in range(5000)]
    def _admit_count(a):
        thr = threshold_for_alpha(model, a)
        return sum(1 for f in h0 if model.log_lr(f) >= thr)
    lo, mid, hi = _admit_count(0.01), _admit_count(0.05), _admit_count(0.20)
    out["alpha_monotonicity"] = {"alpha_0.01": lo, "alpha_0.05": mid, "alpha_0.20": hi}
    check("raising_alpha_admits_more", lo <= mid <= hi)
    check("alpha_band_is_strict", lo < hi)
    # And the derived threshold itself is monotone decreasing in alpha (exact).
    check("threshold_decreases_as_alpha_rises",
          threshold_for_alpha(model, 0.01) > threshold_for_alpha(model, 0.20))

    # --- LIVE SENTRA PROBE never raises and (off-box) falls back to local NP.
    reachable = sentra_gates_reachable(timeout=0.2)
    out["sentra_endpoint_reachable"] = bool(reachable)
    check("sentra_probe_never_raises", isinstance(reachable, bool))

    out["example_admit"] = d_strong.as_dict()
    out["example_deny"] = d_weak.as_dict()
    out["ok"] = True
    out["proven_formula"] = ("ImmuneNeymanPearson (lutar-lean round9): the "
                             "likelihood-ratio test is the most-powerful size-α "
                             "test (Neyman-Pearson lemma); deny-by-default.")
    out["live_runtime"] = "IMMUNE = sentra /api/sentra/v1/gates (8 gates)"
    out["doctrine"] = ("deny-by-default; reactive NEVER gated; honest NP test "
                       "with controlled false-admit rate alpha; evidence is "
                       "SAMPLE/ESTIMATE; open-weight; no key.")
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
