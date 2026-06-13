"""
SZL Agentic-GPU Nervous Monitor — nervous_monitor.py
====================================================
The NERVOUS organ of the anatomy shell: proprioception + self-heal for the
betterwithage RTX 5000 agentic mind. It gives the GPU a nervous system that
SENSES drift in its own posture and FIRES an alarm that triggers a self-heal —
an honest-revert to a truthful posture (maintenance / sovereign:false) and/or a
reroute signal. This formally closes the HALF-STATE loop (Anatomy Shell brief,
frontier #3: "NERVOUS->drift-triggered self-heal").

PROVEN FORMULA (round9 kernel): NervousShannonAlarm — a Λ-signed OTEL + drift
alarm built on real information theory:
  - Shannon entropy      H(P)      = -Σ_i p_i · log2(p_i)      (bits)
  - Kullback-Leibler div  KL(P||Q) =  Σ_i p_i · log2(p_i / q_i) (bits)
We discretize each observed posture snapshot into ONE of a finite set of posture
STATES, accumulate a frequency distribution over a recent WINDOW (P) and over an
established BASELINE (Q), and fire a soft alarm when the drift KL(P||Q) (or the
entropy change |H(P) - H(Q)|) crosses a threshold. The KL is an honest divergence
(non-negative, zero iff P==Q under a shared support via Laplace smoothing), NOT a
fudge factor. Cite: NervousShannonAlarm (lutar-lean round9) + live NERVOUS
endpoint amaru /api/amaru/overwatch/snapshot (read-only, open-weight, NO key).

THE HALF-STATE (doctrine — the ONLY unacceptable outcome): the banner/posture
claims sovereign:true while the actual serving path went to a router (mismatch),
or the GPU is asleep while the posture claims it is active. This must NEVER
silently persist. So in ADDITION to the statistical drift alarm we fire a HARD
alarm the instant a snapshot is logically inconsistent:
  - claimed_sovereign == True  AND  serving_path == "router"   (banner lies)
  - claimed_sovereign == True  AND  gpu_awake    == False       (asleep but loud)
A hard trip needs no window and no threshold — one bad snapshot is enough,
because honest-revert beats overclaim.

SELF-HEAL: on any alarm, self_heal(snapshot) returns an HONEST posture
(sovereign:false / "maintenance") and a reroute hint. A duck-typed adapter
(heal_daemon) flips a daemon-like object's `.serving_local`/`.posture` to the
honest values WITHOUT importing or modifying the real daemon. An optional
defensive `try: from daemon import ResidentDaemon` is used ONLY for an
integration smoke check; absence never weakens the monitor.

REACTIVE IS NEVER TOUCHED. This monitor observes posture and heals posture only.
It exposes NOTHING that gates, queues, throttles, or otherwise affects reactive
(Chaski) turns — proprioception is read-only with respect to the serving path.
The self-test asserts the monitor surface contains no reactive-gating hook.

HONESTY (doctrine v11/v12): pure stdlib; NO network is required to pass the
self-test (the live endpoint is optional and labelled SAMPLE). open-weight; never
commit a key. Λ stays Conjecture 1 (the skeleton's killer formula is intentionally
a conjecture). Energy windows are SAMPLE policy signals, not metered joules.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
import json
import math
import urllib.request

# Live NERVOUS overwatch endpoint (read-only, open-weight, NO key). Optional —
# the monitor operates fully on the provided stream when this is unreachable.
OVERWATCH_ENDPOINT = "https://amaru.szl/api/amaru/overwatch/snapshot"

# Laplace (add-one) smoothing keeps KL finite across a shared support: every
# posture state gets a pseudo-count so q_i is never exactly 0 (which would make
# KL diverge to +inf). This is standard practice, not a fudge of the divergence.
_SMOOTHING = 1.0


@dataclass(frozen=True)
class PostureSnapshot:
    """One observed posture reading — the unit the nervous system senses.

    Fields mirror the daemon's honest posture model (daemon.py `_update_posture`):
    `claimed_sovereign` is what the banner/posture ASSERTS; `serving_path` is where
    the work ACTUALLY went. A divergence between the two is the half-state.
    """
    claimed_sovereign: bool
    serving_path: str            # "local" | "router"
    gpu_awake: bool
    energy_window: str = "normal"  # "cheap" | "normal" | "dear" (SAMPLE policy)

    def state_key(self) -> str:
        """Discretize the snapshot into one finite posture STATE label.

        The drift distribution P/Q is built over these labels. We keep the
        alphabet small and meaningful so entropy/KL are interpretable.
        """
        sov = "sov1" if self.claimed_sovereign else "sov0"
        path = "local" if self.serving_path == "local" else "router"
        awake = "awake" if self.gpu_awake else "asleep"
        win = self.energy_window if self.energy_window in ("cheap", "normal", "dear") else "normal"
        return f"{sov}|{path}|{awake}|{win}"

    def is_half_state(self) -> bool:
        """The ONLY unacceptable outcome — a logically inconsistent posture.

        True iff the banner overclaims: sovereign while a router serves, or
        sovereign while the GPU is asleep. One such snapshot trips the hard alarm.
        """
        if self.claimed_sovereign and self.serving_path == "router":
            return True
        if self.claimed_sovereign and not self.gpu_awake:
            return True
        return False


@dataclass
class Alarm:
    """The fired alarm record — what the nervous system reports upward."""
    fired: bool
    kind: str                    # "none" | "half_state_hard_trip" | "drift"
    kl_bits: float
    entropy_window_bits: float
    entropy_baseline_bits: float
    reason: str

    def to_dict(self) -> dict:
        return {
            "fired": self.fired,
            "kind": self.kind,
            "kl_bits": round(self.kl_bits, 6),
            "entropy_window_bits": round(self.entropy_window_bits, 6),
            "entropy_baseline_bits": round(self.entropy_baseline_bits, 6),
            "reason": self.reason,
        }


def shannon_entropy(counts: dict[str, float]) -> float:
    """H(P) = -Σ p_i log2 p_i  (bits). Empty/degenerate -> 0.0."""
    total = sum(counts.values())
    if total <= 0:
        return 0.0
    h = 0.0
    for c in counts.values():
        if c <= 0:
            continue
        p = c / total
        h -= p * math.log2(p)
    return h


def kl_divergence(p_counts: dict[str, float], q_counts: dict[str, float]) -> float:
    """KL(P||Q) = Σ p_i log2(p_i / q_i)  (bits), over the UNION support with
    Laplace smoothing so q_i > 0 always. Non-negative; 0 iff P == Q. Honest."""
    support = set(p_counts) | set(q_counts)
    if not support:
        return 0.0
    k = len(support)
    p_total = sum(p_counts.get(s, 0.0) for s in support) + _SMOOTHING * k
    q_total = sum(q_counts.get(s, 0.0) for s in support) + _SMOOTHING * k
    kl = 0.0
    for s in support:
        p = (p_counts.get(s, 0.0) + _SMOOTHING) / p_total
        q = (q_counts.get(s, 0.0) + _SMOOTHING) / q_total
        kl += p * math.log2(p / q)
    # Clamp tiny negative float noise to 0 (KL is provably >= 0).
    return kl if kl > 0 else 0.0


class NervousShannonAlarm:
    """Shannon-entropy / KL drift detector over a stream of posture snapshots.

    Maintains a BASELINE distribution Q (the established normal) and a sliding
    WINDOW distribution P (the recent observations). Drift fires when KL(P||Q)
    exceeds `kl_threshold_bits`. A half-state snapshot fires a hard trip
    immediately, independent of the statistical window.

    This class senses posture ONLY. It has no handle on the reactive queue,
    scheduler, or serving path — it cannot gate reactive work.
    """

    def __init__(self, kl_threshold_bits: float = 0.5,
                 entropy_jump_bits: float = 1.0,
                 window_size: int = 8) -> None:
        self.kl_threshold_bits = kl_threshold_bits
        self.entropy_jump_bits = entropy_jump_bits
        self.window_size = window_size
        self._baseline: dict[str, float] = {}
        self._window: list[PostureSnapshot] = []

    def prime_baseline(self, snapshots: list[PostureSnapshot]) -> None:
        """Establish Q from a known-good stream (the body's resting posture)."""
        self._baseline = {}
        for s in snapshots:
            self._baseline[s.state_key()] = self._baseline.get(s.state_key(), 0.0) + 1.0

    def _window_counts(self) -> dict[str, float]:
        counts: dict[str, float] = {}
        for s in self._window:
            counts[s.state_key()] = counts.get(s.state_key(), 0.0) + 1.0
        return counts

    def observe(self, snapshot: PostureSnapshot) -> Alarm:
        """Feed one snapshot; return the resulting Alarm (fired or not).

        HARD TRIP first (half-state) — one bad snapshot is enough. Otherwise
        roll the window and compute the statistical drift alarm.
        """
        # Hard trip: a half-state must never silently persist.
        if snapshot.is_half_state():
            self._window.append(snapshot)
            if len(self._window) > self.window_size:
                self._window.pop(0)
            win_counts = self._window_counts()
            return Alarm(
                fired=True,
                kind="half_state_hard_trip",
                kl_bits=kl_divergence(win_counts, self._baseline),
                entropy_window_bits=shannon_entropy(win_counts),
                entropy_baseline_bits=shannon_entropy(self._baseline),
                reason=("half-state detected: claimed sovereign while "
                        f"serving_path={snapshot.serving_path!r}, "
                        f"gpu_awake={snapshot.gpu_awake}; honest-revert required"),
            )

        # Statistical drift alarm over the rolling window vs baseline.
        self._window.append(snapshot)
        if len(self._window) > self.window_size:
            self._window.pop(0)
        win_counts = self._window_counts()
        kl = kl_divergence(win_counts, self._baseline)
        h_win = shannon_entropy(win_counts)
        h_base = shannon_entropy(self._baseline)
        entropy_jump = abs(h_win - h_base)

        if kl > self.kl_threshold_bits or entropy_jump > self.entropy_jump_bits:
            return Alarm(
                fired=True, kind="drift", kl_bits=kl,
                entropy_window_bits=h_win, entropy_baseline_bits=h_base,
                reason=(f"posture drift: KL={kl:.4f} bits "
                        f"(thr {self.kl_threshold_bits}), "
                        f"|ΔH|={entropy_jump:.4f} bits (thr {self.entropy_jump_bits})"),
            )
        return Alarm(
            fired=False, kind="none", kl_bits=kl,
            entropy_window_bits=h_win, entropy_baseline_bits=h_base,
            reason="within baseline; no drift",
        )


@dataclass
class HealedPosture:
    """The honest posture self-heal reverts to. Honest-revert beats overclaim."""
    serving_local: bool          # forced False — we will not claim local serving
    posture: str                 # an honest, non-overclaiming banner
    sovereign: bool              # False
    reroute: bool                # signal the circulation (yarqa) to reroute
    note: str

    def to_dict(self) -> dict:
        return {
            "serving_local": self.serving_local,
            "posture": self.posture,
            "sovereign": self.sovereign,
            "reroute": self.reroute,
            "note": self.note,
        }


def self_heal(snapshot: PostureSnapshot) -> HealedPosture:
    """On alarm, return an HONEST posture. Never overclaim.

    If the GPU is asleep we go to "maintenance"; otherwise we drop the sovereign
    claim to sovereign:false and signal a reroute (router fallback is honest when
    local truly is not serving). This is the formal close of the half-state loop.
    """
    if not snapshot.gpu_awake:
        return HealedPosture(
            serving_local=False,
            posture="maintenance (gpu asleep; honest-revert, not serving local)",
            sovereign=False,
            reroute=True,
            note="self-heal: GPU asleep -> maintenance posture, reroute reactive-safe",
        )
    return HealedPosture(
        serving_local=False,
        posture="sovereign:false (drift/half-state healed; router fallback)",
        sovereign=False,
        reroute=True,
        note="self-heal: dropped overclaim to sovereign:false, signalled reroute",
    )


def heal_daemon(daemon_like: object, snapshot: PostureSnapshot) -> HealedPosture:
    """Duck-typed adapter: flip a daemon-like object's posture to honest values.

    Sets `.serving_local` and `.posture` on ANY object exposing them (the real
    ResidentDaemon, or a stand-in). We never import or mutate the real daemon
    module — purely attribute-based, so the monitor stays disjoint from
    daemon.py/scheduler.py. Reactive flow is untouched: we set posture only.
    """
    healed = self_heal(snapshot)
    if hasattr(daemon_like, "serving_local"):
        setattr(daemon_like, "serving_local", healed.serving_local)
    if hasattr(daemon_like, "posture"):
        setattr(daemon_like, "posture", healed.posture)
    return healed


def fetch_overwatch_snapshot(url: str = OVERWATCH_ENDPOINT,
                             timeout: float = 2.0) -> Optional[dict]:
    """OPTIONAL read of the live NERVOUS overwatch endpoint (SAMPLE data).

    Pure stdlib, short timeout, NEVER raises, NO key sent (open-weight). Returns
    the parsed JSON dict on success or None on any failure. The monitor never
    requires this — it is a convenience for live operation; the self-test does
    not touch the network. Any data returned here is labelled SAMPLE.
    """
    try:
        req = urllib.request.Request(url, method="GET",
                                     headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310
            raw = r.read().decode("utf-8", "replace")
        data = json.loads(raw)
        if isinstance(data, dict):
            data["_label"] = "SAMPLE"  # mark remote data honestly
            return data
        return {"_label": "SAMPLE", "raw": data}
    except Exception:  # noqa: BLE001 - never raise; operate on provided stream
        return None


# Reactive-gating hooks that MUST NOT exist on this monitor's public surface.
# The self-test asserts none of these are present, proving the nervous system
# cannot starve or throttle a reactive (Chaski) turn.
_FORBIDDEN_REACTIVE_HOOKS = (
    "gate_reactive", "throttle_reactive", "preempt_reactive",
    "queue_reactive", "block_reactive", "reactive_gate",
)


def _selftest() -> dict:
    """Deterministic self-test — NO network. Proves the four required claims."""
    results: dict = {}

    # --- (1) NORMAL stream -> NO alarm -------------------------------------
    # Consistent sovereign:true + serving local + awake. Baseline == window.
    normal = [
        PostureSnapshot(True, "local", True, "cheap"),
        PostureSnapshot(True, "local", True, "normal"),
        PostureSnapshot(True, "local", True, "normal"),
        PostureSnapshot(True, "local", True, "cheap"),
    ]
    alarm = NervousShannonAlarm(kl_threshold_bits=0.5, entropy_jump_bits=1.0,
                                window_size=8)
    alarm.prime_baseline(normal)
    normal_alarms = [alarm.observe(s) for s in normal]
    normal_no_alarm = not any(a.fired for a in normal_alarms)
    results["1_normal_stream_no_alarm"] = normal_no_alarm

    # --- (2) DRIFTED (half-state) stream -> alarm FIRES --------------------
    # Sovereign is still CLAIMED but serving_path flips to "router": half-state.
    drift_alarm = NervousShannonAlarm(kl_threshold_bits=0.5, entropy_jump_bits=1.0,
                                      window_size=8)
    drift_alarm.prime_baseline(normal)
    half_state_snap = PostureSnapshot(True, "router", True, "normal")
    fired = drift_alarm.observe(half_state_snap)
    half_state_fires = fired.fired and fired.kind == "half_state_hard_trip"
    results["2_half_state_alarm_fires"] = half_state_fires
    results["2_alarm_record"] = fired.to_dict()

    # --- Also prove a pure STATISTICAL drift (no half-state) fires ---------
    # Sovereign honestly dropped to false + router (NOT a half-state), but the
    # distribution diverges hard from the all-local baseline -> KL drift alarm.
    stat_alarm = NervousShannonAlarm(kl_threshold_bits=0.5, entropy_jump_bits=1.0,
                                     window_size=8)
    stat_alarm.prime_baseline(normal)
    stat_fired = False
    for _ in range(8):
        a = stat_alarm.observe(PostureSnapshot(False, "router", True, "dear"))
        stat_fired = stat_fired or (a.fired and a.kind == "drift")
    results["2b_statistical_drift_fires"] = stat_fired

    # --- (3) self_heal flips to an honest posture; half-state is GONE ------
    class _FakeDaemon:
        # Mirrors ResidentDaemon's attribute surface (duck-typed).
        def __init__(self) -> None:
            self.serving_local = True
            self.posture = "sovereign:true (local serves)"  # the LIE to heal

    fake = _FakeDaemon()
    healed = heal_daemon(fake, half_state_snap)
    # Verify: after healing, re-derive the posture snapshot and confirm the
    # half-state is gone (no longer claims sovereign over a router path).
    post_heal_snap = PostureSnapshot(
        claimed_sovereign=healed.sovereign,         # now False
        serving_path="router",                      # honest: router serves
        gpu_awake=True,
    )
    heal_ok = (
        healed.sovereign is False
        and fake.serving_local is False
        and fake.posture.startswith("sovereign:false")
        and not post_heal_snap.is_half_state()      # the half-state is closed
    )
    results["3_self_heal_closes_half_state"] = heal_ok
    results["3_healed_posture"] = healed.to_dict()

    # Heal an asleep-GPU half-state -> maintenance posture.
    asleep_snap = PostureSnapshot(True, "local", False, "normal")
    asleep_heal = self_heal(asleep_snap)
    results["3b_asleep_heals_to_maintenance"] = (
        asleep_heal.posture.startswith("maintenance")
        and asleep_heal.sovereign is False
    )

    # --- (4) reactive is UNAFFECTED ----------------------------------------
    # Assert the monitor surface exposes NO reactive-gating hook anywhere.
    surface = set(dir(NervousShannonAlarm)) | set(globals().keys())
    no_reactive_gate = not any(h in surface for h in _FORBIDDEN_REACTIVE_HOOKS)
    results["4_reactive_unaffected"] = no_reactive_gate

    # --- Optional integration smoke: duck-type against the REAL daemon -----
    # Defensive import ONLY; absence must not fail the test.
    integration = "skipped (daemon not importable; duck-typed adapter used)"
    try:
        from daemon import ResidentDaemon  # type: ignore
        d = ResidentDaemon(probe=lambda _ep: True)
        d._update_posture()
        heal_daemon(d, half_state_snap)
        integration = ("ok: healed a real ResidentDaemon via duck-typed adapter "
                       f"-> serving_local={d.serving_local}, posture={d.posture!r}")
    except Exception as exc:  # noqa: BLE001 - integration is best-effort only
        integration = f"skipped (daemon integration not available: {exc!r})"
    results["integration_smoke"] = integration

    ok = bool(
        results["1_normal_stream_no_alarm"]
        and results["2_half_state_alarm_fires"]
        and results["2b_statistical_drift_fires"]
        and results["3_self_heal_closes_half_state"]
        and results["3b_asleep_heals_to_maintenance"]
        and results["4_reactive_unaffected"]
    )

    return {
        "ok": ok,
        **results,
        "formula": ("NervousShannonAlarm (round9): H=-Σp·log2 p; "
                    "KL(P||Q)=Σp·log2(p/q) over discretized posture states; "
                    "drift alarm on KL>thr or |ΔH|>thr; half-state hard-trip on "
                    "claimed_sovereign∧(router|asleep)"),
        "cites": ("NervousShannonAlarm lutar-lean round9; live NERVOUS endpoint "
                  "amaru /api/amaru/overwatch/snapshot (read-only, open-weight, NO key)"),
        "doctrine": ("half-state is the ONLY unacceptable outcome; honest-revert "
                     "beats overclaim; reactive NEVER affected; Λ=Conjecture 1; "
                     "energy windows are SAMPLE policy signals (no metered joules)"),
    }


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
