# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Doctrine v11/v12
# Authored by Yachay (CTO).
# Doctrine v11 LOCKED: 749 declarations · 14 unique axioms · 163 sorries · 13-axis
#   · replay-hash bacf5443… · A2=IsHomogeneous · A4=IsBounded · SLSA L1 · Λ-uniqueness=Conjecture 1
# git trailer: Perplexity Computer Agent
"""
a11oy_observability — provenanced **business observability** as a NATIVE a11oy capability.

a11oy is the platform. Observability is one of its endpoints — NOT a separate
product, NOT an add-on, NOT a separate brand. This package is the importable
substrate behind the a11oy observability endpoints served under
``/api/a11oy/v3/observability/*``.

DIFFERENTIATOR (honest):
    The only observability stack that **signs every event** (Wire D DSSE,
    ECDSA P-256 cosign), **proves the chain via Lean** (749/14/163), and
    **replays decisions years later** (AYNI-OS event sourcing).

    Datadog tells you *what* happened. Honeycomb tells you *why*.
    a11oy lets you *prove* it 5 years later, cryptographically.

HONEST POSTURE (Doctrine v11 preserved):
    * SLSA self-claim is L1 (provenance exists, build not hardened) — NOT L3.
    * Λ-uniqueness is a CONJECTURE (Conjecture 1), not a theorem.
    * 163 tracked sorries remain in the Lean development (749 decls / 14 axioms).
    * DSSE signatures are REAL ECDSA-P256-SHA256 only when the
      SZL_COSIGN_PRIVATE_PEM runtime secret is present; else receipts are
      emitted UNSIGNED and clearly labelled — NEVER faked.

Public surface (the founder-order spec):
    BusinessContext        — Pydantic model carrying business fields for a receipt
    tag_receipt            — add business context to a Wire D DSSE envelope
    query_observability    — Honeycomb-style high-cardinality query over receipts
    attribute_revenue      — late-binding revenue attribution to a receipt
    compliance_scorecard   — EU AI Act / NIST AI RMF / FedRAMP coverage scorecard
    decision_replay        — AYNI-OS-backed business-decision replay over a window
    Scorecard, Decision    — return types
    pillars                — the 9 observability pillars (see .pillars)
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

try:
    from pydantic import BaseModel, Field
except Exception as _e:  # pragma: no cover - pydantic is a declared dependency
    raise ImportError(
        "a11oy_observability requires pydantic>=2. Install via `pip install a11oy-observability`."
    ) from _e

__all__ = [
    "DOCTRINE_V11",
    "DecisionValue",
    "BusinessOutcome",
    "BusinessContext",
    "Scorecard",
    "Decision",
    "tag_receipt",
    "query_observability",
    "attribute_revenue",
    "compliance_scorecard",
    "decision_replay",
    "register_store",
    "InMemoryReceiptStore",
]

# Verbatim Doctrine v11 honest-posture constants (749/14/163).
DOCTRINE_V11: dict[str, Any] = {
    "version": "v11",
    "declarations": 749,
    "unique_axioms": 14,
    "tracked_sorries": 163,
    "yuyay_axes": 13,
    "slsa": "L1",
    "lambda_uniqueness": "Conjecture 1",
    "hukulla_core_tripwires": 10,
    "A2": "IsHomogeneous",
    "A4": "IsBounded",
    "replay_hash_prefix": "bacf5443",
    "honest_note": (
        "SLSA L1 (provenance exists, build not hardened — NOT L3). "
        "Λ-uniqueness is Conjecture 1 (not a theorem). 163 tracked sorries remain."
    ),
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(obj: Any) -> str:
    raw = json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str).encode()
    return hashlib.sha256(raw).hexdigest()


class DecisionValue(str, Enum):
    """Coarse business value band attached to a governed decision."""

    TRIVIAL = "trivial"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class BusinessOutcome(str, Enum):
    """The realised business outcome of a governed action."""

    PENDING = "pending"
    WON = "won"
    LOST = "lost"
    RETAINED = "retained"
    CHURNED = "churned"
    COST_SAVED = "cost_saved"
    RISK_AVERTED = "risk_averted"
    NEUTRAL = "neutral"


class BusinessContext(BaseModel):
    """Business fields layered onto a Wire D DSSE receipt.

    All fields are optional except the enums, which carry sane defaults, so a
    receipt can be tagged incrementally (late-binding revenue is the canonical
    example — see :func:`attribute_revenue`).
    """

    customer_id: Optional[str] = None
    revenue_attribution: Optional[float] = None
    decision_value: DecisionValue = DecisionValue.MEDIUM
    compliance_tags: list[str] = Field(default_factory=list)
    cost_attribution: Optional[float] = None
    business_outcome: BusinessOutcome = BusinessOutcome.PENDING
    chain_of_value: list[str] = Field(default_factory=list)

    def as_receipt_fields(self) -> dict[str, Any]:
        """Render the business fields for embedding in a receipt payload."""
        return {
            "customer_id": self.customer_id,
            "revenue_attribution": self.revenue_attribution,
            "decision_value": self.decision_value.value,
            "compliance_tags": list(self.compliance_tags),
            "cost_attribution": self.cost_attribution,
            "business_outcome": self.business_outcome.value,
            "chain_of_value": list(self.chain_of_value),
        }


class Scorecard(BaseModel):
    """Compliance coverage scorecard for a named framework."""

    framework: str
    framework_label: str
    total_controls: int
    covered: int
    partial: int
    not_covered: int
    coverage_ratio: float
    controls: list[dict[str, Any]] = Field(default_factory=list)
    honest_note: str = ""
    generated_at: str = Field(default_factory=_now)


class Decision(BaseModel):
    """A replayed business decision reconstructed from the AYNI-OS event log."""

    receipt_id: str
    ts_utc: str
    decision_value: DecisionValue = DecisionValue.MEDIUM
    business_outcome: BusinessOutcome = BusinessOutcome.PENDING
    customer_id: Optional[str] = None
    revenue_attribution: Optional[float] = None
    signed: bool = False
    traceparent: Optional[str] = None
    summary: str = ""


# ---------------------------------------------------------------------------
# Receipt store — pluggable. Defaults to an in-memory store; the a11oy Space
# wires in app.state.szl_khipu_dag so business tags ride the REAL Wire D DAG.
# ---------------------------------------------------------------------------


class InMemoryReceiptStore:
    """Minimal in-process receipt store used when no Khipu DAG is wired.

    Mirrors the shape the a11oy Space exposes via ``app.state.szl_khipu_dag``:
    each node is ``{"digest", "index", "signed", "receipt", ...}``.
    """

    def __init__(self) -> None:
        self.nodes: list[dict[str, Any]] = []

    def append_signed(self, receipt: dict[str, Any]) -> dict[str, Any]:
        idx = len(self.nodes)
        node = {
            "digest": _digest(receipt),
            "index": idx,
            "signed": False,  # honest: no key wired in the in-memory fallback
            "keyid": "szlholdings-cosign",
            "receipt": receipt,
            "dsse": None,
        }
        self.nodes.append(node)
        return node

    def recent(self, n: int = 50) -> list[dict[str, Any]]:
        return self.nodes[-n:]

    def all(self) -> list[dict[str, Any]]:
        return list(self.nodes)


_STORE: Any = InMemoryReceiptStore()


def register_store(store: Any) -> None:
    """Wire a host receipt store (e.g. the a11oy Space ``szl_khipu_dag``).

    The store must expose ``append_signed(receipt) -> node`` and either
    ``recent(n)`` or ``all()`` / ``nodes``.
    """
    global _STORE
    _STORE = store


def _store_nodes() -> list[dict[str, Any]]:
    if hasattr(_STORE, "all"):
        try:
            return _STORE.all()
        except Exception:
            pass
    if hasattr(_STORE, "nodes"):
        return list(getattr(_STORE, "nodes"))
    if hasattr(_STORE, "recent"):
        return _STORE.recent(10_000)
    return []


# ---------------------------------------------------------------------------
# Public surface
# ---------------------------------------------------------------------------


def tag_receipt(receipt: dict[str, Any], ctx: BusinessContext) -> dict[str, Any]:
    """Add business context to a Wire D DSSE envelope (or raw receipt).

    Accepts either a DSSE envelope ``{"payload", "payloadType", "signatures"}``
    or a raw receipt dict. Returns a tagged receipt node (re-signed/re-appended
    via the wired store so the business tag is itself provenanced).
    """
    if not isinstance(receipt, dict):
        raise TypeError("receipt must be a dict (DSSE envelope or raw receipt)")

    # Unwrap a DSSE envelope payload if present so we tag the inner receipt.
    inner: dict[str, Any]
    if "payload" in receipt and "payloadType" in receipt:
        import base64

        try:
            inner = json.loads(base64.b64decode(receipt["payload"]).decode())
        except Exception:
            inner = {"opaque_payload": receipt.get("payload")}
        inner = dict(inner)
        inner["_dsse_payloadType"] = receipt.get("payloadType")
    else:
        inner = dict(receipt)

    inner["business_context"] = ctx.as_receipt_fields()
    inner.setdefault("schema", "szl.khipu.business_tag/v1")
    inner["business_tagged_at"] = _now()
    inner.setdefault("doctrine", "v11")
    return _STORE.append_signed(inner)


def query_observability(filters: dict[str, Any]) -> list[dict[str, Any]]:
    """Honeycomb-style high-cardinality query over tagged receipts.

    ``filters`` is a flat dict of field → value (or field → list-of-values).
    Fields are matched against the receipt body AND the nested
    ``business_context`` (so ``customer_id``, ``decision_value``,
    ``business_outcome``, ``revenue_attribution`` etc. are first-class).
    Returns the matching receipt nodes (high-cardinality: no pre-aggregation,
    every event is queryable by any dimension).
    """
    filters = filters or {}
    out: list[dict[str, Any]] = []
    for node in _store_nodes():
        receipt = node.get("receipt", {})
        bc = receipt.get("business_context", {}) if isinstance(receipt, dict) else {}
        ok = True
        for key, want in filters.items():
            have = receipt.get(key, bc.get(key)) if isinstance(receipt, dict) else None
            if isinstance(want, (list, tuple, set)):
                if have not in want:
                    ok = False
                    break
            else:
                if str(have) != str(want):
                    ok = False
                    break
        if ok:
            out.append(node)
    return out


def attribute_revenue(receipt_id: str, amount: float) -> dict[str, Any]:
    """Late-binding revenue attribution to a previously emitted receipt.

    Emits a NEW provenanced receipt that links to ``receipt_id`` and carries the
    revenue figure — the original receipt is immutable, the attribution is a
    fresh signed event (event-sourcing-friendly). Returns the new tagged node.
    """
    parent = None
    for node in _store_nodes():
        if node.get("digest") == receipt_id or str(node.get("index")) == str(receipt_id):
            parent = node
            break
    ctx = BusinessContext(revenue_attribution=float(amount))
    receipt = {
        "schema": "szl.khipu.revenue_attribution/v1",
        "links_receipt": receipt_id,
        "parent_index": parent.get("index") if parent else None,
        "business_context": ctx.as_receipt_fields(),
        "attributed_at": _now(),
        "doctrine": "v11",
    }
    return _STORE.append_signed(receipt)


_FRAMEWORKS: dict[str, dict[str, Any]] = {
    "eu_ai_act_art12": {
        "label": "EU AI Act — Article 12 (Record-keeping / logging)",
        "controls": [
            ("art12.1", "Automatic recording of events over lifetime", "covered",
             "Wire D DSSE receipts log every governed action with timestamp + trace."),
            ("art12.2a", "Recording of period of each use", "covered",
             "Each receipt carries ts_utc + W3C traceparent span."),
            ("art12.2b", "Reference database checked against inputs", "partial",
             "Khipu DAG links inputs; external reference-DB matching is per-deployment."),
            ("art12.2c", "Input data leading to a match", "covered",
             "chain_of_value + retrieval provenance recorded on the receipt."),
            ("art12.3", "Logging for high-risk traceability", "covered",
             "RS(10,6) erasure-coded chain + AYNI-OS event-sourcing replay."),
        ],
        "honest_note": "Art.12 logging mechanisms are met by Wire D; classification of a deployment as high-risk is the operator's determination.",
    },
    "nist_ai_rmf": {
        "label": "NIST AI Risk Management Framework 1.0",
        "controls": [
            ("MAP", "Context & risk mapping", "partial",
             "Yuyay-13 axes map governance context; full org-level MAP is operator-owned."),
            ("MEASURE", "Measure analysed risks", "covered",
             "9 observability pillars emit metrics; gate pass/fail tracked per axis."),
            ("MANAGE", "Prioritise & act on risk", "covered",
             "Policy gate denies by default; signed verdicts + decision replay."),
            ("GOVERN", "Culture & accountability", "covered",
             "Every action signed + chained; human-gated autonomy enforced architecturally."),
        ],
        "honest_note": "NIST AI RMF is a voluntary framework; coverage reflects substrate mechanisms, not a third-party attestation.",
    },
    "fedramp_moderate": {
        "label": "FedRAMP Moderate (roadmap posture)",
        "controls": [
            ("AU-2", "Audit events", "covered", "Wire D receipts = tamper-evident audit events."),
            ("AU-9", "Protection of audit information", "partial",
             "DSSE signing protects integrity; at-rest/WORM storage is per-deployment."),
            ("AU-10", "Non-repudiation", "covered", "ECDSA P-256 cosign signatures provide non-repudiation when key present."),
            ("SI-7", "Software/firmware/info integrity", "partial",
             "RS(10,6) erasure coding + Merkle DAG; full SI-7 needs hardened CI (SLSA L3 NOT yet)."),
            ("CA-2", "Control assessments", "not_covered",
             "No 3PAO assessment performed; FedRAMP authorization NOT held — roadmap only."),
        ],
        "honest_note": "FedRAMP authorization is NOT held. This scorecard is an honest roadmap-posture self-assessment, not a 3PAO result.",
    },
}


def compliance_scorecard(framework: str) -> Scorecard:
    """Return an honest coverage scorecard for a named compliance framework.

    Supported: ``eu_ai_act_art12``, ``nist_ai_rmf``, ``fedramp_moderate``.
    """
    key = (framework or "").strip().lower()
    spec = _FRAMEWORKS.get(key)
    if spec is None:
        raise ValueError(
            f"unknown framework '{framework}'. Supported: {sorted(_FRAMEWORKS)}"
        )
    controls = [
        {"id": cid, "title": title, "status": status, "evidence": evidence}
        for (cid, title, status, evidence) in spec["controls"]
    ]
    covered = sum(1 for c in controls if c["status"] == "covered")
    partial = sum(1 for c in controls if c["status"] == "partial")
    not_covered = sum(1 for c in controls if c["status"] == "not_covered")
    total = len(controls)
    ratio = round((covered + 0.5 * partial) / total, 4) if total else 0.0
    return Scorecard(
        framework=key,
        framework_label=spec["label"],
        total_controls=total,
        covered=covered,
        partial=partial,
        not_covered=not_covered,
        coverage_ratio=ratio,
        controls=controls,
        honest_note=spec["honest_note"],
    )


def decision_replay(from_ts: str, to_ts: str) -> list[Decision]:
    """AYNI-OS-backed business-decision replay over a [from_ts, to_ts] window.

    Reconstructs governed business decisions from the event-sourced receipt log.
    HONEST: this is event-sourcing replay (deterministic reconstruction from the
    immutable event log) — NOT time-travel and NOT a database snapshot.
    Timestamps are ISO-8601; receipts without a parseable ts are skipped.
    """

    def _parse(ts: str) -> Optional[datetime]:
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            return None

    lo = _parse(from_ts)
    hi = _parse(to_ts)
    out: list[Decision] = []
    for node in _store_nodes():
        receipt = node.get("receipt", {})
        if not isinstance(receipt, dict):
            continue
        ts = receipt.get("ts_utc") or receipt.get("business_tagged_at") or receipt.get("attributed_at")
        dt = _parse(ts) if ts else None
        if dt is None:
            continue
        if lo and dt < lo:
            continue
        if hi and dt > hi:
            continue
        bc = receipt.get("business_context", {}) or {}
        out.append(
            Decision(
                receipt_id=str(node.get("digest")),
                ts_utc=ts,
                decision_value=DecisionValue(bc.get("decision_value", "medium")),
                business_outcome=BusinessOutcome(bc.get("business_outcome", "pending")),
                customer_id=bc.get("customer_id"),
                revenue_attribution=bc.get("revenue_attribution"),
                signed=bool(node.get("signed")),
                traceparent=receipt.get("traceparent"),
                summary=receipt.get("schema", "szl.khipu.receipt"),
            )
        )
    out.sort(key=lambda d: d.ts_utc)
    return out
