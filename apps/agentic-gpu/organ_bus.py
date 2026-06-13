"""
SZL Agentic-GPU Organ Bus — organ_bus.py
========================================
The INTEGRATION SPINE that lets the resident agentic-GPU daemon (daemon.py +
scheduler.py, Agent.xpu pattern, arXiv:2506.24045) call each LIVE anatomy organ
as a body function. The RTX 5000 is the "mind"; this bus is the nervous trunk
that lets that mind drive a proven anatomical "body" of organ formulas, each
with a live HTTP endpoint, while HONEST-DEGRADING the moment an organ is
unreachable.

BODY WIRING DIAGRAM — which organ gates which step of ONE proactive cycle:

    proactive task
         |
         v
    [IMMUNE]  sentra /api/sentra/v1/gates          (Neyman-Pearson, 8 gates)
         |        deny-by-default: if DENY or DOWN -> DEFER, no run.
         |  admit?
         v
    [BRAIN]   amaru /api/amaru/v1/formulas          (PAC-Bayes McAllester)
         |        belief-update / decision: admit | defer (conservative).
         |  decide?
         v
      [RUN]   <local stub — the GPU body does the work>
         |
         +--> [HEART]  amaru /api/amaru/receipts     (sigma-algebra receipt bus)
         |        emit a receipt / heartbeat for the action.
         +--> [BLOOD]  sentra /api/sentra/khipu/sign  (DSSE-style provenance)
         |        sign the receipt (NO real key — read/probe + local digest).
         v
   [NERVOUS]  amaru /api/amaru/overwatch/snapshot     (Shannon-alarm drift)
                 proprioception: posture + drift snapshot after the action.

   [SKELETON] amaru /api/amaru/v1/math/lean/theorems  (the Lean proof spine)
                 claims trace to a proven theorem; available out-of-band so any
                 organ result can cite the formula it rests on.

DOCTRINE (never violate — mirrors daemon.py / scheduler.py v11/v12):
- HONEST-DEGRADE per organ: every organ call uses the stdlib (urllib + json +
  math), a short timeout, NEVER raises, and returns a LABELED fallback result
  carrying an `ok`/`reachable` flag and a `source` of "live" vs
  "fallback/SAMPLE". A configured endpoint is INTENT, not proof it serves.
- IMMUNE deny-by-default: if the immune organ DENIES, or is UNREACHABLE, the
  honest safe default is DENY — the proactive cycle DEFERS without running.
- REACTIVE work is NEVER gated by any organ call. This bus exposes NO reactive
  gating surface; `proactive_cycle()` only ever touches proactive admission.
  The brain/immune informs PROACTIVE admission only (scheduler.EnergyGate seam).
- Claims trace to the proven formulas; energy/belief figures are SAMPLE/ESTIMATE
  and labeled. open-weight; NEVER commit a key — all calls are read/probe with
  NO auth header sent; BLOOD signing falls back to a keyless local digest.
- Pure stdlib. Import-safe standalone (no hard dependency on the A1–A4 lane
  modules — the plug-in contracts are defined here and default to built-in
  honest-degrading HTTP clients; inject the A1–A4 implementations when present).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Optional, Protocol, runtime_checkable
import hashlib
import json
import time
import urllib.request

# ---------------------------------------------------------------------------
# LIVE ORGAN ENDPOINTS (read/probe only; no key sent; honest-degrade on failure)
# ---------------------------------------------------------------------------
AMARU_BASE = "https://amaru.szl.ai"   # BRAIN / HEART / SKELETON / NERVOUS host
SENTRA_BASE = "https://sentra.szl.ai"  # IMMUNE / BLOOD host

ENDPOINTS = {
    "brain": AMARU_BASE + "/api/amaru/v1/formulas",            # PAC-Bayes belief
    "immune": SENTRA_BASE + "/api/sentra/v1/gates",            # Neyman-Pearson
    "heart": AMARU_BASE + "/api/amaru/receipts",               # sigma-algebra bus
    "blood": SENTRA_BASE + "/api/sentra/khipu/sign",           # DSSE provenance
    "skeleton": AMARU_BASE + "/api/amaru/v1/math/lean/theorems",  # Lean spine
    "nervous": AMARU_BASE + "/api/amaru/overwatch/snapshot",   # Shannon-alarm
}

# Proven formula each organ rests on (claims trace to these names).
FORMULAS = {
    "brain": "PAC-Bayes McAllester belief-update bound",
    "immune": "Neyman-Pearson deny-by-default likelihood-ratio gates (8 gates)",
    "heart": "sigma-algebra receipt bus (measurable heartbeat)",
    "blood": "DSSE-style signed provenance (khipu)",
    "skeleton": "Lean-verified theorem spine",
    "nervous": "Shannon-entropy drift / proprioception alarm",
}

# A fetcher takes (url, payload-or-None, timeout) and returns a decoded JSON
# dict on success or None on ANY failure. This is the single injectable network
# seam — the self-test injects mocks here and NEVER touches the real network.
Fetcher = Callable[[str, Optional[dict], float], Optional[dict]]


def _stdlib_fetch(url: str, payload: Optional[dict] = None,
                  timeout: float = 2.0) -> Optional[dict]:
    """The default fetcher: stdlib urllib, short timeout, NEVER raises.

    GET when `payload` is None, else POST (JSON body). No auth header is ever
    attached — all organ calls are read/probe; the box endpoints are
    open-weight / no-key. Any failure (timeout, DNS, non-2xx, bad JSON) returns
    None so the caller can honest-degrade to a labeled fallback.
    """
    try:
        data = None
        headers = {"Accept": "application/json"}
        method = "GET"
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
            method = "POST"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310
            status = getattr(r, "status", r.getcode())
            if not (200 <= status < 300):
                return None
            raw = r.read()
            if not raw:
                return {}
            return json.loads(raw.decode("utf-8"))
    except Exception:  # noqa: BLE001 - any failure => unreachable, stay honest.
        return None


# ===========================================================================
# Organ result dataclasses — every one carries reachability + a source label.
# `source` is "live" when the organ answered, else "fallback/SAMPLE".
# ===========================================================================
@dataclass
class Decision:
    """BRAIN result (PAC-Bayes belief-update / decision)."""
    admit: bool
    belief: float
    reachable: bool
    source: str
    rationale: str = ""
    formula: str = FORMULAS["brain"]

    @property
    def ok(self) -> bool:
        return self.reachable


@dataclass
class AdmitResult:
    """IMMUNE result (Neyman-Pearson gates). DENY-by-default when down."""
    admitted: bool
    reachable: bool
    source: str
    gate: str = ""
    reason: str = ""
    formula: str = FORMULAS["immune"]

    @property
    def ok(self) -> bool:
        # An immune answer is "ok" when the organ actually adjudicated. A
        # deny-by-default fallback is a SAFE outcome but NOT a live adjudication.
        return self.reachable


@dataclass
class Receipt:
    """HEART result (sigma-algebra receipt / heartbeat)."""
    receipt_id: str
    action: str
    anchored: bool          # True only when the live receipt bus anchored it.
    reachable: bool
    source: str
    payload: dict = field(default_factory=dict)
    formula: str = FORMULAS["heart"]

    @property
    def ok(self) -> bool:
        return True  # A receipt is ALWAYS produced (live-anchored or local stub).


@dataclass
class SignedReceipt:
    """BLOOD result (DSSE-style signed provenance). NO real key in fallback."""
    receipt_id: str
    signature: str
    keyless_local: bool     # True when signed by the local keyless digest stub.
    reachable: bool
    source: str
    formula: str = FORMULAS["blood"]

    @property
    def ok(self) -> bool:
        return True  # Always signed (live khipu or local digest-link).


@dataclass
class TheoremRef:
    """SKELETON result (Lean theorem spine)."""
    name: str
    statement: str
    verified: bool          # True only if the live spine confirmed it.
    reachable: bool
    source: str
    formula: str = FORMULAS["skeleton"]

    @property
    def ok(self) -> bool:
        return True  # Always returns a reference (live or static proven name).


@dataclass
class Snapshot:
    """NERVOUS result (Shannon-alarm drift / proprioception)."""
    posture: str
    drift: float
    alarm: bool
    reachable: bool
    source: str
    formula: str = FORMULAS["nervous"]

    @property
    def ok(self) -> bool:
        return True  # Always returns a posture (live snapshot or local stub).


@dataclass
class CycleResult:
    """Trace of ONE proactive body cycle (immune->brain->run->heart/blood->nervous)."""
    ran: bool
    deferred_reason: Optional[str]
    immune: AdmitResult
    brain: Optional[Decision]
    receipt: Optional[Receipt]
    signed: Optional[SignedReceipt]
    snapshot: Optional[Snapshot]

    def to_dict(self) -> dict:
        def d(x: Any) -> Any:
            return x.__dict__ if hasattr(x, "__dict__") else x
        return {
            "ran": self.ran,
            "deferred_reason": self.deferred_reason,
            "immune": d(self.immune),
            "brain": d(self.brain),
            "receipt": d(self.receipt),
            "signed": d(self.signed),
            "snapshot": d(self.snapshot),
        }


# ===========================================================================
# Stable plug-in contracts (Protocols) so the A1–A4 lane modules can be injected.
# Each defaults to the built-in honest-degrading HTTP client (OrganBus methods).
# These are duck-typed: any object with the matching method satisfies the seam.
# ===========================================================================
@runtime_checkable
class BrainDecider(Protocol):
    def brain_decide(self, evidence: dict) -> Decision: ...


@runtime_checkable
class ImmuneAdmitter(Protocol):
    def immune_admit(self, task_or_evidence: dict) -> AdmitResult: ...


@runtime_checkable
class HeartBeater(Protocol):
    def heart_beat(self, action: dict) -> Receipt: ...


@runtime_checkable
class BloodSigner(Protocol):
    def blood_sign(self, receipt: Receipt) -> SignedReceipt: ...


@runtime_checkable
class NervousSensor(Protocol):
    def nervous_snapshot(self) -> Snapshot: ...


def _digest(obj: Any) -> str:
    """Keyless local content digest (NO secret) — used for HEART id + BLOOD link."""
    return hashlib.sha256(
        json.dumps(obj, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()


class OrganBus:
    """Typed client: one honest-degrading method per organ + a body orchestrator.

    Every method NEVER raises. When the organ endpoint answers it returns a
    "live" result; when it is unreachable it returns a LABELED "fallback/SAMPLE"
    result. The orchestrator `proactive_cycle()` runs the full body sequence for
    ONE proactive task and touches ONLY proactive work.

    The A1–A4 lane modules plug in via the optional injectors (brain/immune/
    heart/blood/nervous); each defaults to this bus's own HTTP client method.
    """

    def __init__(self, fetcher: Fetcher = _stdlib_fetch, timeout: float = 2.0,
                 *, brain: Optional[BrainDecider] = None,
                 immune: Optional[ImmuneAdmitter] = None,
                 heart: Optional[HeartBeater] = None,
                 blood: Optional[BloodSigner] = None,
                 nervous: Optional[NervousSensor] = None) -> None:
        self._fetch = fetcher
        self._timeout = timeout
        # Injected A1–A4 implementations override the built-in HTTP client; the
        # contract is defined here so the bus does NOT depend on their files.
        self._brain = brain
        self._immune = immune
        self._heart = heart
        self._blood = blood
        self._nervous = nervous

    # ---- BRAIN -----------------------------------------------------------
    def brain_decide(self, evidence: dict) -> Decision:
        """PAC-Bayes belief-update. Fallback: conservative LOCAL belief, SAMPLE.

        Honest-degrade: if amaru /v1/formulas is unreachable we DEFER on a
        conservative local belief (admit=False) rather than overclaim.
        """
        if self._brain is not None:
            return self._brain.brain_decide(evidence)
        resp = self._fetch(ENDPOINTS["brain"], {"evidence": evidence}, self._timeout)
        if resp is not None:
            belief = float(resp.get("belief", resp.get("posterior", 0.0)) or 0.0)
            admit = bool(resp.get("admit", belief >= 0.5))
            return Decision(admit=admit, belief=belief, reachable=True,
                            source="live", rationale=str(resp.get("rationale", "")))
        # Fallback: conservative local belief — defer unless evidence is strong.
        local_belief = float(evidence.get("prior", 0.0) or 0.0)
        return Decision(admit=False, belief=local_belief, reachable=False,
                        source="fallback/SAMPLE",
                        rationale="brain unreachable; conservative local defer")

    # ---- IMMUNE ----------------------------------------------------------
    def immune_admit(self, task_or_evidence: dict) -> AdmitResult:
        """Neyman-Pearson gates. Fallback: DENY-BY-DEFAULT (the safe honest default).

        Honest-degrade: if sentra /v1/gates is unreachable we DENY — never
        admit proactive work past an immune organ we cannot consult.
        """
        if self._immune is not None:
            return self._immune.immune_admit(task_or_evidence)
        resp = self._fetch(ENDPOINTS["immune"], {"subject": task_or_evidence},
                           self._timeout)
        if resp is not None:
            admitted = bool(resp.get("admit", resp.get("allow", False)))
            return AdmitResult(admitted=admitted, reachable=True, source="live",
                               gate=str(resp.get("gate", "")),
                               reason=str(resp.get("reason", "")))
        # Fallback: deny-by-default — immune organ down => do NOT run.
        return AdmitResult(admitted=False, reachable=False,
                           source="fallback/SAMPLE", gate="deny-by-default",
                           reason="immune unreachable; deny-by-default (safe)")

    # ---- HEART -----------------------------------------------------------
    def heart_beat(self, action: dict) -> Receipt:
        """sigma-algebra receipt bus. Fallback: local receipt stub, not-anchored.

        Honest-degrade: a receipt is ALWAYS produced; when the live bus is down
        it is a LABELED local SAMPLE stub (`anchored=False`) so the action is
        still accounted for and verifiable downstream.
        """
        if self._heart is not None:
            return self._heart.heart_beat(action)
        resp = self._fetch(ENDPOINTS["heart"], {"action": action}, self._timeout)
        if resp is not None:
            rid = str(resp.get("receipt_id") or resp.get("id") or _digest(action))
            return Receipt(receipt_id=rid, action=str(action.get("name", "")),
                           anchored=True, reachable=True, source="live",
                           payload=resp)
        # Fallback: local sigma-bus receipt stub (not anchored, labeled SAMPLE).
        rid = "local-" + _digest({"action": action, "t": int(time.time())})[:16]
        return Receipt(receipt_id=rid, action=str(action.get("name", "")),
                       anchored=False, reachable=False, source="fallback/SAMPLE",
                       payload={"action": action, "note": "heart down; local stub"})

    # ---- BLOOD -----------------------------------------------------------
    def blood_sign(self, receipt: Receipt) -> SignedReceipt:
        """DSSE-style khipu signing. Fallback: keyless local digest-link, SAMPLE.

        Honest-degrade: NO real key is ever used. When sentra /khipu/sign is
        down we produce a keyless local content digest as the signature so the
        provenance chain is still LINKED and verifiable (labeled SAMPLE).
        """
        if self._blood is not None:
            return self._blood.blood_sign(receipt)
        resp = self._fetch(ENDPOINTS["blood"],
                           {"receipt_id": receipt.receipt_id,
                            "payload": receipt.payload}, self._timeout)
        if resp is not None:
            sig = str(resp.get("signature") or resp.get("sig") or "")
            return SignedReceipt(receipt_id=receipt.receipt_id, signature=sig,
                                 keyless_local=False, reachable=True, source="live")
        # Fallback: keyless local digest-link (NO key) — labeled SAMPLE.
        sig = "sha256:" + _digest({"id": receipt.receipt_id,
                                   "payload": receipt.payload})
        return SignedReceipt(receipt_id=receipt.receipt_id, signature=sig,
                             keyless_local=True, reachable=False,
                             source="fallback/SAMPLE")

    # ---- SKELETON --------------------------------------------------------
    def skeleton_theorem(self, name: str) -> TheoremRef:
        """Lean theorem spine. Fallback: static reference to the proven name.

        Honest-degrade: when amaru /math/lean/theorems is down we return a
        static reference (`verified=False`) to the proven formula name so claims
        can still cite the spine — we just cannot reconfirm it live.
        """
        resp = self._fetch(ENDPOINTS["skeleton"] + "/" + urllib_quote(name),
                           None, self._timeout)
        if resp is not None:
            return TheoremRef(name=name,
                              statement=str(resp.get("statement", "")),
                              verified=bool(resp.get("verified", True)),
                              reachable=True, source="live")
        return TheoremRef(name=name, statement="(static proven reference)",
                          verified=False, reachable=False,
                          source="fallback/SAMPLE")

    # ---- NERVOUS ---------------------------------------------------------
    def nervous_snapshot(self) -> Snapshot:
        """Shannon-alarm drift snapshot. Fallback: local posture snapshot.

        Honest-degrade: when amaru /overwatch/snapshot is down we return a local
        posture with `drift` unknown (0.0) and no alarm — labeled SAMPLE.
        """
        if self._nervous is not None:
            return self._nervous.nervous_snapshot()
        resp = self._fetch(ENDPOINTS["nervous"], None, self._timeout)
        if resp is not None:
            return Snapshot(posture=str(resp.get("posture", "nominal")),
                            drift=float(resp.get("drift", 0.0) or 0.0),
                            alarm=bool(resp.get("alarm", False)),
                            reachable=True, source="live")
        return Snapshot(posture="local-unknown", drift=0.0, alarm=False,
                        reachable=False, source="fallback/SAMPLE")

    # ---- THE BODY ORCHESTRATOR ------------------------------------------
    def proactive_cycle(self, task: dict) -> CycleResult:
        """Run the full body sequence for ONE PROACTIVE task. Never raises.

        Sequence (each step honest-degrades):
          IMMUNE deny-by-default -> if admitted, BRAIN belief -> if admit, RUN
          (stub) -> HEART receipt + BLOOD sign -> NERVOUS drift snapshot.

        If IMMUNE denies (or is down -> deny-by-default), or BRAIN defers, the
        cycle DEFERS WITHOUT running — the correct safe outcome. This method
        touches ONLY proactive work; it NEVER gates or starves reactive turns
        (the bus exposes no reactive gating surface at all).
        """
        # 1. IMMUNE — deny-by-default. Down or DENY => defer, no run.
        immune = self.immune_admit(task)
        if not immune.admitted:
            reason = ("immune-denied" if immune.reachable
                      else "immune-down-deny-by-default")
            return CycleResult(ran=False, deferred_reason=reason, immune=immune,
                               brain=None, receipt=None, signed=None,
                               snapshot=None)

        # 2. BRAIN — belief-update. Down or defer => defer, no run.
        evidence = dict(task.get("evidence", task))
        brain = self.brain_decide(evidence)
        if not brain.admit:
            reason = ("brain-defer" if brain.reachable
                      else "brain-down-conservative-defer")
            return CycleResult(ran=False, deferred_reason=reason, immune=immune,
                               brain=brain, receipt=None, signed=None,
                               snapshot=None)

        # 3. RUN — the GPU body does the proactive work (local stub here).
        action = {"name": str(task.get("name", "proactive_task")),
                  "belief": brain.belief}

        # 4. HEART + BLOOD — receipt then sign (both honest-degrade locally).
        receipt = self.heart_beat(action)
        signed = self.blood_sign(receipt)

        # 5. NERVOUS — proprioception / drift snapshot after the action.
        snapshot = self.nervous_snapshot()

        return CycleResult(ran=True, deferred_reason=None, immune=immune,
                           brain=brain, receipt=receipt, signed=signed,
                           snapshot=snapshot)


def urllib_quote(s: str) -> str:
    """Minimal stdlib path-safe quote (avoids an extra import surface)."""
    import urllib.parse
    return urllib.parse.quote(s, safe="")


# ===========================================================================
# SELF-TEST — NO real network (all fetchers/clients injected/mocked).
#   (a) ALL organs reachable -> a full proactive_cycle() completes the
#       immune->brain->run->heart/blood->nervous sequence and admits + signs.
#   (b) an organ DOWN -> honest-degrade:
#         IMMUNE-down  => deny-by-default (defer, NO run);
#         HEART/BLOOD-down => receipt STILL produced as a labeled local SAMPLE
#                             stub, and verifiably signed by a keyless digest.
#   (c) reactive is NEVER gated — the bus exposes no reactive gating surface.
# out["ok"] is True only if every assert passes.
# ===========================================================================
def _mock_fetcher(routes: dict) -> Fetcher:
    """Build a fetcher that maps an endpoint substring -> canned JSON (or None).

    A route value of None models an UNREACHABLE organ (honest-degrade path).
    NO real network is touched.
    """
    def _f(url: str, payload: Optional[dict] = None,
           timeout: float = 2.0) -> Optional[dict]:
        for key, resp in routes.items():
            if key in url:
                return resp
        return None
    return _f


def _selftest() -> dict:
    out: dict = {"asserts": 0}

    def _assert(cond: bool, msg: str) -> None:
        out["asserts"] += 1
        assert cond, msg

    # --- (a) ALL organs reachable: full cycle admits, runs, signs ----------
    all_up = _mock_fetcher({
        "/v1/gates": {"admit": True, "gate": "np-gate-3", "reason": "pass"},
        "/v1/formulas": {"admit": True, "belief": 0.91, "rationale": "strong"},
        "/receipts": {"receipt_id": "rcpt-live-001"},
        "/khipu/sign": {"signature": "dsse:live-sig-abc"},
        "/overwatch/snapshot": {"posture": "nominal", "drift": 0.02, "alarm": False},
        "/lean/theorems": {"statement": "thm", "verified": True},
    })
    bus_up = OrganBus(fetcher=all_up)
    res = bus_up.proactive_cycle({"name": "energy_aware_batch",
                                  "evidence": {"prior": 0.8}})
    _assert(res.ran is True, "all-up cycle must RUN")
    _assert(res.immune.admitted and res.immune.source == "live",
            "immune must live-admit")
    _assert(res.brain is not None and res.brain.admit and res.brain.source == "live",
            "brain must live-admit")
    _assert(res.receipt is not None and res.receipt.anchored
            and res.receipt.source == "live", "heart must live-anchor receipt")
    _assert(res.signed is not None and not res.signed.keyless_local
            and res.signed.source == "live", "blood must live-sign")
    _assert(res.snapshot is not None and res.snapshot.source == "live",
            "nervous must live-snapshot")
    out["all_up"] = res.to_dict()

    # --- (b1) IMMUNE DOWN => deny-by-default: DEFER, no run ----------------
    immune_down = _mock_fetcher({
        "/v1/gates": None,  # UNREACHABLE
        "/v1/formulas": {"admit": True, "belief": 0.99},
        "/receipts": {"receipt_id": "x"},
        "/khipu/sign": {"signature": "y"},
        "/overwatch/snapshot": {"posture": "nominal"},
    })
    bus_immune_down = OrganBus(fetcher=immune_down)
    r_idown = bus_immune_down.proactive_cycle({"name": "batch",
                                               "evidence": {"prior": 0.9}})
    _assert(r_idown.ran is False, "IMMUNE-down cycle must NOT run")
    _assert(r_idown.deferred_reason == "immune-down-deny-by-default",
            f"must deny-by-default, got {r_idown.deferred_reason}")
    _assert(r_idown.immune.admitted is False and not r_idown.immune.reachable,
            "immune fallback must be deny + unreachable")
    _assert(r_idown.immune.source == "fallback/SAMPLE", "immune must be labeled")
    _assert(r_idown.brain is None and r_idown.receipt is None,
            "no downstream organ runs once immune denies")
    out["immune_down"] = r_idown.to_dict()

    # --- (b2) HEART + BLOOD DOWN (immune+brain up): receipt STILL produced
    #          as a labeled local SAMPLE stub, verifiably keyless-signed -----
    heart_blood_down = _mock_fetcher({
        "/v1/gates": {"admit": True},
        "/v1/formulas": {"admit": True, "belief": 0.77},
        "/receipts": None,       # HEART UNREACHABLE
        "/khipu/sign": None,     # BLOOD UNREACHABLE
        "/overwatch/snapshot": None,  # NERVOUS also down -> local snapshot
    })
    bus_hb_down = OrganBus(fetcher=heart_blood_down)
    r_hb = bus_hb_down.proactive_cycle({"name": "receipt_loop",
                                        "evidence": {"prior": 0.8}})
    _assert(r_hb.ran is True, "admitted work still RUNS when only heart/blood down")
    _assert(r_hb.receipt is not None and r_hb.receipt.anchored is False,
            "heart-down receipt must be a NOT-anchored local stub")
    _assert(r_hb.receipt.source == "fallback/SAMPLE"
            and r_hb.receipt.receipt_id.startswith("local-"),
            "heart-down receipt must be a labeled local SAMPLE stub")
    _assert(r_hb.signed is not None and r_hb.signed.keyless_local is True,
            "blood-down signature must be the keyless local digest")
    _assert(r_hb.signed.signature.startswith("sha256:"),
            "keyless signature must be a verifiable sha256 digest-link")
    # Verify the keyless signature actually re-derives from the receipt content.
    expected_sig = "sha256:" + _digest({"id": r_hb.receipt.receipt_id,
                                        "payload": r_hb.receipt.payload})
    _assert(r_hb.signed.signature == expected_sig,
            "keyless signature must be verifiable (re-derivable from content)")
    _assert(r_hb.snapshot is not None and r_hb.snapshot.source == "fallback/SAMPLE",
            "nervous-down must give a labeled local snapshot")
    out["heart_blood_down"] = r_hb.to_dict()

    # --- (b3) injected A1–A4 contract: a mock ImmuneAdmitter is honored -----
    class _DenyImmune:
        def immune_admit(self, task_or_evidence: dict) -> AdmitResult:
            return AdmitResult(admitted=False, reachable=True, source="live",
                               gate="A2-inject", reason="policy deny")
    bus_inj = OrganBus(fetcher=all_up, immune=_DenyImmune())
    _assert(isinstance(_DenyImmune(), ImmuneAdmitter),
            "injected immune must satisfy the ImmuneAdmitter Protocol")
    r_inj = bus_inj.proactive_cycle({"name": "t", "evidence": {"prior": 0.9}})
    _assert(r_inj.ran is False and r_inj.deferred_reason == "immune-denied",
            "injected immune DENY must defer the cycle (live deny)")
    out["injected_immune_contract"] = r_inj.to_dict()

    # --- (c) reactive is NEVER gated: the bus exposes NO reactive surface ---
    bus_surface = [m for m in dir(OrganBus) if not m.startswith("_")]
    _assert(not any("reactive" in m.lower() for m in bus_surface),
            f"bus must expose NO reactive gating method, got {bus_surface}")
    out["public_methods"] = bus_surface
    out["reactive_never_gated"] = True

    # --- skeleton reference honest-degrades to a static proven name --------
    thm = OrganBus(fetcher=_mock_fetcher({})).skeleton_theorem("PAC_Bayes_bound")
    _assert(thm.ok and not thm.verified and thm.source == "fallback/SAMPLE",
            "skeleton-down must give a static proven reference")

    out["ok"] = True
    out["doctrine"] = ("per-organ honest-degrade (urllib, short timeout, never "
                       "raises, labeled fallback); IMMUNE deny-by-default when "
                       "down; reactive NEVER gated; no key sent; claims trace to "
                       "proven formulas; SAMPLE/ESTIMATE labeled; pure stdlib.")
    out["formulas"] = FORMULAS
    out["endpoints"] = ENDPOINTS
    out["cites"] = "Agent.xpu arXiv:2506.24045"
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
