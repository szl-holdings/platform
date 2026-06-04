# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS / FORMULA-OS PURIQ-OS compatibility shim
"""
_puriq_compat.py — single import surface for the PURIQ-OS base classes.

KHIPU-OS (the agentic DAG) and FORMULA-OS (the agentic formulas) build *on top of*
the sibling `szl_puriq_os` runtime (OrganAgent, KhipuSigner, YuyayGate, HukullaTripwires).
That package is being shipped concurrently by the PURIQ-OS agent; to avoid a build-time
collision (and so this layer is testable in isolation), we import the real classes when
they are importable, and otherwise fall back to a *behaviourally identical* vendored
mini-implementation. Either way the public names are stable:

    OrganAgent, KhipuSigner, KhipuReceipt, YuyayGate, YuyayScores, YuyayGateError,
    HukullaTripwires, lambda_aggregate, LOCKED

The vendored fallbacks preserve the LOCKED v11 canonical numbers verbatim and implement
the same observe→decide→execute→sign_khipu→reflect tick contract, so swapping in the real
PURIQ-OS package later is a no-op for KHIPU-OS / FORMULA-OS.
"""
from __future__ import annotations

# LOCKED canonical numbers — verbatim, never edited by this layer.
LOCKED = {
    "declarations": 749,
    "unique_axioms": 14,
    "tracked_sorries": 163,
    "yuyay_axes": 13,
    "replay_hash": "bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5",
    "A2": "IsHomogeneous",
    "A4": "IsBounded",
    "slsa": "L1",
    "lambda_uniqueness": "Conjecture 1",
    "hukulla_core_tripwires": 10,  # T01–T10 sole halt-authority core; T22 etc. are additive
}

_USING_REAL_PURIQ_OS = False

try:  # prefer the real sibling runtime when present and complete
    from szl_puriq_os.puriq_os import (  # type: ignore  # noqa: F401
        OrganAgent, KhipuSigner, KhipuReceipt,
        YuyayGate, YuyayScores, YuyayGateError,
        HukullaTripwires, lambda_aggregate,
    )
    _USING_REAL_PURIQ_OS = True
except Exception:  # pragma: no cover - exercised when sibling not yet on path
    # ---- Vendored, behaviourally-identical fallbacks -------------------------
    import math
    import json
    import time
    import hashlib
    import hmac
    from dataclasses import dataclass, field, asdict
    from typing import Any, Dict, List, Optional, Sequence

    SACRED_FLOOR = 0.95
    STRUCTURAL_FLOOR = 0.90
    SACRED_AXES = ["moral_grounding", "measurability_honesty"]
    STRUCTURAL_AXES = [
        "epistemic_humility", "perspectival_flexibility", "context_sensitivity",
        "dialectical_integration", "uncertainty_calibration", "outcome_reasoning",
        "metacognition",
    ]
    INTROSPECTION_AXES = ["t03_clear", "t04_clear", "t09_clear", "t10_clear"]

    class YuyayGateError(Exception):
        """13-axis conjunctive gate failure (used by state-changing ticks)."""

    @dataclass
    class YuyayScores:
        moral_grounding: float = 1.0
        measurability_honesty: float = 1.0
        epistemic_humility: float = 1.0
        perspectival_flexibility: float = 1.0
        context_sensitivity: float = 1.0
        dialectical_integration: float = 1.0
        uncertainty_calibration: float = 1.0
        outcome_reasoning: float = 1.0
        metacognition: float = 1.0
        t03_clear: bool = True
        t04_clear: bool = True
        t09_clear: bool = True
        t10_clear: bool = True

        def continuous_axes(self) -> List[float]:
            return [getattr(self, a) for a in SACRED_AXES + STRUCTURAL_AXES]

        def as_dict(self) -> Dict[str, Any]:
            return {a: getattr(self, a) for a in
                    SACRED_AXES + STRUCTURAL_AXES + INTROSPECTION_AXES}

    @dataclass
    class YuyayGate:
        sacred_floor: float = SACRED_FLOOR
        structural_floor: float = STRUCTURAL_FLOOR
        failures: List[str] = field(default_factory=list)

        def evaluate(self, scores: YuyayScores) -> float:
            """Return Yuyay₁₃(a): 0.0 if any axis sub-floor / introspection axis uncleared;
            else the conservative min of passing continuous axes."""
            self.failures = []
            for a in SACRED_AXES:
                if getattr(scores, a) < self.sacred_floor:
                    self.failures.append(f"{a}<{self.sacred_floor}(SACRED)")
            for a in STRUCTURAL_AXES:
                if getattr(scores, a) < self.structural_floor:
                    self.failures.append(f"{a}<{self.structural_floor}(STRUCT)")
            for a in INTROSPECTION_AXES:
                if not getattr(scores, a):
                    self.failures.append(f"{a}=False(INTROSPECT)")
            if self.failures:
                return 0.0
            return min(scores.continuous_axes())

        def require(self, scores: YuyayScores) -> float:
            v = self.evaluate(scores)
            if v <= 0.0:
                raise YuyayGateError("; ".join(self.failures) or "Yuyay gate = 0")
            return v

    def lambda_aggregate(axes: Sequence[float], weights: Optional[Sequence[float]] = None) -> float:
        """Weighted geometric mean Λ(x)=∏ xᵢ^{wᵢ}, Σwᵢ=1. A2 IsHomogeneous, A4 IsBounded."""
        n = len(axes)
        if n == 0:
            return 0.0
        if weights is None:
            weights = [1.0 / n] * n
        if len(weights) != n:
            raise ValueError("axes/weights length mismatch")
        sw = sum(weights)
        if sw <= 0:
            raise ValueError("weights must sum > 0")
        weights = [w / sw for w in weights]
        acc = 0.0
        for x, w in zip(axes, weights):
            x = min(max(float(x), 0.0), 1.0)
            if x <= 0.0:
                return 0.0
            acc += w * math.log(x)
        return min(max(math.exp(acc), 0.0), 1.0)

    @dataclass
    class KhipuReceipt:
        """A signed Khipu receipt — the atomic provenance unit of the DAG."""
        receipt_id: str
        organ: str
        action: str
        payload: Dict[str, Any]
        parents: List[str] = field(default_factory=list)
        ts: float = field(default_factory=lambda: time.time())
        yuyay: float = 1.0
        content_hash: str = ""
        signature: str = ""
        chain_verified: bool = True

        def signing_bytes(self) -> bytes:
            core = {
                "receipt_id": self.receipt_id, "organ": self.organ,
                "action": self.action, "payload": self.payload,
                "parents": sorted(self.parents), "ts": round(self.ts, 6),
                "yuyay": round(self.yuyay, 6),
            }
            return json.dumps(core, sort_keys=True, separators=(",", ":")).encode()

        def as_dict(self) -> Dict[str, Any]:
            return asdict(self)

    class KhipuSigner:
        """DSSE-style HMAC-SHA256 signer over SHA3-256 content hash. Cosign-compatible
        envelope shape (payloadType + sig). Key is a process secret in the fallback;
        the real PURIQ-OS signer wires Cosign/Sigstore."""
        PAYLOAD_TYPE = "application/vnd.szl.khipu+json"

        def __init__(self, key: bytes = b"khipu-os-dev-key", signer_id: str = "Yachay"):
            self.key = key
            self.signer_id = signer_id

        def content_hash(self, receipt: KhipuReceipt) -> str:
            return hashlib.sha3_256(receipt.signing_bytes()).hexdigest()

        def sign(self, receipt: KhipuReceipt) -> KhipuReceipt:
            receipt.content_hash = self.content_hash(receipt)
            receipt.signature = hmac.new(
                self.key, receipt.content_hash.encode(), hashlib.sha256
            ).hexdigest()
            return receipt

        def verify(self, receipt: KhipuReceipt) -> bool:
            expect_hash = self.content_hash(receipt)
            if not hmac.compare_digest(expect_hash, receipt.content_hash or ""):
                return False
            expect_sig = hmac.new(
                self.key, receipt.content_hash.encode(), hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expect_sig, receipt.signature or "")

    class HukullaTripwires:
        """HUKLLA tripwire registry. T01–T10 are the LOCKED core (sole halt-authority);
        additive layer tripwires (T22 DAG-tamper, T-formula-divergence) register here
        without renumbering the core."""
        CORE = {f"T{n:02d}": f"core tripwire {n}" for n in range(1, 11)}

        def __init__(self):
            self.extensions: Dict[str, str] = {}
            self.fired: List[Dict[str, Any]] = []

        def register(self, name: str, description: str) -> None:
            if name in self.CORE:
                raise ValueError(f"cannot redefine LOCKED core tripwire {name}")
            self.extensions[name] = description

        def fire(self, name: str, reason: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
            if name not in self.CORE and name not in self.extensions:
                raise KeyError(f"unknown tripwire {name}")
            ev = {"tripwire": name, "reason": reason, "context": context or {},
                  "ts": time.time()}
            self.fired.append(ev)
            return ev

    class OrganAgent:
        """Vendored OrganAgent base: the Wiener feedback loop whose reference is the
        Doctrine. One tick = observe → decide → execute → sign_khipu → reflect. Subclasses
        override the four hooks; the base wires the Yuyay gate, HUKLLA registry, signer,
        and the mandatory Khipu-receipt-on-every-tick contract."""
        def __init__(self, name: str, cadence_s: float = 60.0,
                     signer: Optional[KhipuSigner] = None,
                     gate: Optional[YuyayGate] = None,
                     hukulla: Optional[HukullaTripwires] = None):
            self.name = name
            self.cadence_s = cadence_s
            self.signer = signer or KhipuSigner(signer_id="Yachay")
            self.gate = gate or YuyayGate()
            self.hukulla = hukulla or HukullaTripwires()
            self.tick_count = 0
            self.receipts: List[KhipuReceipt] = []
            self._seq = 0

        # ---- hooks (override) ------------------------------------------------
        def observe(self) -> Dict[str, Any]:
            return {}

        def decide(self, obs: Dict[str, Any]) -> Dict[str, Any]:
            return {"action": "noop", "args": {}}

        def execute(self, decision: Dict[str, Any]) -> Dict[str, Any]:
            return {"status": "ok"}

        def reflect(self, obs, decision, result) -> Dict[str, Any]:
            return {}

        def yuyay_scores(self, decision: Dict[str, Any]) -> YuyayScores:
            return YuyayScores()

        # ---- the loop body ---------------------------------------------------
        def _next_id(self) -> str:
            self._seq += 1
            return f"{self.name}-{int(time.time()*1000)}-{self._seq}"

        def sign_khipu(self, action: str, payload: Dict[str, Any],
                       parents: Optional[List[str]] = None, yuyay: float = 1.0) -> KhipuReceipt:
            r = KhipuReceipt(receipt_id=self._next_id(), organ=self.name, action=action,
                             payload=payload, parents=parents or [], yuyay=yuyay)
            self.signer.sign(r)
            self.receipts.append(r)
            return r

        def tick(self) -> Dict[str, Any]:
            self.tick_count += 1
            obs = self.observe()
            decision = self.decide(obs)
            scores = self.yuyay_scores(decision)
            yuyay = self.gate.evaluate(scores)
            state_changing = bool(decision.get("state_changing", False))
            if state_changing and yuyay <= 0.0:
                # gate denies a state-changing action: record but do not execute
                rec = self.sign_khipu("gate_denied",
                                      {"decision": decision, "failures": self.gate.failures},
                                      yuyay=0.0)
                return {"tick": self.tick_count, "executed": False, "yuyay": 0.0,
                        "receipt": rec.receipt_id, "failures": self.gate.failures}
            result = self.execute(decision)
            refl = self.reflect(obs, decision, result)
            rec = self.sign_khipu(decision.get("action", "tick"),
                                  {"decision": decision, "result": result, "reflect": refl},
                                  yuyay=yuyay or 1.0)
            return {"tick": self.tick_count, "executed": True, "yuyay": yuyay,
                    "receipt": rec.receipt_id, "result": result}
