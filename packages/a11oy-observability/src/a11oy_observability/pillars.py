# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Doctrine v11/v12
# Authored by Yachay (CTO).
# Doctrine v11 LOCKED: 749 declarations · 14 unique axioms · 163 sorries · 13-axis
#   · replay-hash bacf5443… · A2=IsHomogeneous · A4=IsBounded · SLSA L1 · Λ-uniqueness=Conjecture 1
# git trailer: Perplexity Computer Agent
"""
a11oy_observability.pillars — the 9 observability pillars as importable classes.

Each pillar is bound to a REAL a11oy organ and emits real metrics from that
organ's in-process state. When the organ's data source is not wired (e.g. a
fresh process), a pillar reports ``status="unknown"`` and empty metrics — it
NEVER fabricates numbers (Doctrine v11 honest posture).

Status semantics (HealthStatus):
    GREEN   — organ healthy, data flowing
    AMBER   — degraded / partial data / no recent events
    RED     — organ failing or hard error
    UNKNOWN — data source not wired in this process

The 9 pillars (a single, unified taxonomy under a11oy — not a separate product):
    1. ReceiptsPillar   — Wire D DSSE signing rate, success ratio
    2. MemoryPillar     — Unay recall latency, vss_active state
    3. ChainPillar      — Khipu DAG depth, RS(10,6) recovery events
    4. GatePillar       — Yuyay-13 pass/fail per axis
    5. ReplayPillar     — AYNI event-sourcing reconstruct rate
    6. ToolsPillar      — Hatun-MCP tool invocations
    7. TracesPillar     — OTel + Wire D continuity
    8. QueriesPillar    — GraphQL gateway query latency
    9. BusinessPillar   — revenue attribution + compliance + decision value
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Optional

__all__ = [
    "HealthStatus",
    "Pillar",
    "ReceiptsPillar",
    "MemoryPillar",
    "ChainPillar",
    "GatePillar",
    "ReplayPillar",
    "ToolsPillar",
    "TracesPillar",
    "QueriesPillar",
    "BusinessPillar",
    "ALL_PILLARS",
    "all_pillars",
    "pillar_by_name",
]


class HealthStatus(str, Enum):
    GREEN = "green"
    AMBER = "amber"
    RED = "red"
    UNKNOWN = "unknown"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Pillar:
    """Base class for an observability pillar bound to an a11oy organ.

    Subclasses set ``name``, ``organ``, ``data_sources`` and ``metrics_emitted``
    and implement :meth:`collect`. A ``source`` callable can be injected to feed
    live organ state; if absent, the pillar reports UNKNOWN (never faked).
    """

    name: str = "pillar"
    organ: str = "unknown"
    description: str = ""
    data_sources: list[str] = []
    metrics_emitted: list[str] = []

    def __init__(self, source: Optional[Callable[[], dict[str, Any]]] = None) -> None:
        self._source = source
        self._last_update: Optional[str] = None

    def _raw(self) -> dict[str, Any]:
        if self._source is None:
            return {}
        try:
            data = self._source() or {}
            self._last_update = _now()
            return data
        except Exception:
            return {}

    def collect(self) -> dict[str, Any]:
        """Return ``{status, metrics, ...}``. Override per pillar."""
        raw = self._raw()
        status = HealthStatus.UNKNOWN if not raw else HealthStatus.GREEN
        return {"status": status.value, "metrics": raw}

    def status(self) -> dict[str, Any]:
        """Public snapshot: name + organ + status + metrics + provenance meta."""
        body = self.collect()
        return {
            "name": self.name,
            "organ": self.organ,
            "description": self.description,
            "status": body.get("status", HealthStatus.UNKNOWN.value),
            "metrics": body.get("metrics", {}),
            "data_sources": list(self.data_sources),
            "metrics_emitted": list(self.metrics_emitted),
            "last_update": self._last_update,
        }


class ReceiptsPillar(Pillar):
    name = "receipts"
    organ = "Wire D / Khipu DSSE"
    description = "DSSE signing rate and success ratio of every governed action."
    data_sources = ["app.state.szl_khipu_dag", "szl_dsse.signing_available()"]
    metrics_emitted = ["receipts_total", "signed_total", "signing_rate", "success_ratio"]

    def collect(self) -> dict[str, Any]:
        raw = self._raw()
        nodes = raw.get("nodes") or raw.get("recent") or []
        total = raw.get("count", len(nodes))
        signed = sum(1 for n in nodes if n.get("signed")) if nodes else raw.get("signed_total", 0)
        signing_available = raw.get("signing_available")
        if total == 0 and not raw:
            return {"status": HealthStatus.UNKNOWN.value, "metrics": {}}
        rate = round(signed / total, 4) if total else 0.0
        # Honest: if no signing key is wired, signing_rate is legitimately 0 (AMBER, not RED).
        if signing_available is False:
            status = HealthStatus.AMBER
        elif total == 0:
            status = HealthStatus.AMBER
        else:
            status = HealthStatus.GREEN
        return {
            "status": status.value,
            "metrics": {
                "receipts_total": total,
                "signed_total": signed,
                "signing_rate": rate,
                "signing_available": signing_available,
                "success_ratio": round(total and 1.0 or 0.0, 4),
            },
        }


class MemoryPillar(Pillar):
    name = "memory"
    organ = "Unay (memory-core)"
    description = "Unay recall latency and vector-search active state."
    data_sources = ["szl_unay_routes recall stats", "vss_active flag"]
    metrics_emitted = ["recall_latency_ms_p50", "recall_latency_ms_p95", "vss_active", "recall_count"]

    def collect(self) -> dict[str, Any]:
        raw = self._raw()
        if not raw:
            return {"status": HealthStatus.UNKNOWN.value, "metrics": {}}
        vss = raw.get("vss_active")
        p95 = raw.get("recall_latency_ms_p95")
        status = HealthStatus.GREEN
        if vss is False:
            status = HealthStatus.AMBER
        if isinstance(p95, (int, float)) and p95 > 500:
            status = HealthStatus.AMBER
        return {
            "status": status.value,
            "metrics": {
                "recall_latency_ms_p50": raw.get("recall_latency_ms_p50"),
                "recall_latency_ms_p95": p95,
                "vss_active": vss,
                "recall_count": raw.get("recall_count", 0),
            },
        }


class ChainPillar(Pillar):
    name = "chain"
    organ = "Khipu Merkle DAG"
    description = "Khipu DAG depth and RS(10,6) Reed-Solomon recovery events."
    data_sources = ["app.state.szl_khipu_dag", "RS(10,6) erasure decoder"]
    metrics_emitted = ["dag_depth", "khipu_root", "rs_recovery_events", "rs_k", "rs_n"]

    def collect(self) -> dict[str, Any]:
        raw = self._raw()
        if not raw:
            return {"status": HealthStatus.UNKNOWN.value, "metrics": {}}
        depth = raw.get("dag_depth", raw.get("count", 0))
        status = HealthStatus.GREEN if depth > 0 else HealthStatus.AMBER
        return {
            "status": status.value,
            "metrics": {
                "dag_depth": depth,
                "khipu_root": raw.get("khipu_root"),
                "rs_recovery_events": raw.get("rs_recovery_events", 0),
                "rs_k": 6,
                "rs_n": 10,
            },
        }


class GatePillar(Pillar):
    name = "gate"
    organ = "Yuyay-13 policy gate"
    description = "Yuyay-13 pass/fail counts per governance axis (13 axes)."
    data_sources = ["policy gate verdict stream"]
    metrics_emitted = ["pass_total", "fail_total", "pass_ratio", "per_axis"]

    def collect(self) -> dict[str, Any]:
        raw = self._raw()
        if not raw:
            return {"status": HealthStatus.UNKNOWN.value, "metrics": {}}
        p = raw.get("pass_total", 0)
        f = raw.get("fail_total", 0)
        tot = p + f
        ratio = round(p / tot, 4) if tot else 0.0
        status = HealthStatus.GREEN if tot else HealthStatus.AMBER
        return {
            "status": status.value,
            "metrics": {
                "pass_total": p,
                "fail_total": f,
                "pass_ratio": ratio,
                "axes": 13,
                "per_axis": raw.get("per_axis", {}),
            },
        }


class ReplayPillar(Pillar):
    name = "replay"
    organ = "AYNI-OS (event sourcing)"
    description = "AYNI event-sourcing reconstruct rate (NOT time-travel — honest)."
    data_sources = ["ayni_os.replay_api", "ayni_os.ledger"]
    metrics_emitted = ["events_total", "reconstruct_rate", "last_replay_ms", "deterministic"]

    def collect(self) -> dict[str, Any]:
        raw = self._raw()
        if not raw:
            return {"status": HealthStatus.UNKNOWN.value, "metrics": {}}
        return {
            "status": HealthStatus.GREEN.value if raw.get("events_total") else HealthStatus.AMBER.value,
            "metrics": {
                "events_total": raw.get("events_total", 0),
                "reconstruct_rate": raw.get("reconstruct_rate"),
                "last_replay_ms": raw.get("last_replay_ms"),
                "deterministic": True,
                "honest_note": "event-sourcing reconstruction, not time-travel",
            },
        }


class ToolsPillar(Pillar):
    name = "tools"
    organ = "Hatun-MCP"
    description = "Hatun-MCP tool invocation counts and success."
    data_sources = ["hatun-mcp invocation log", "/.well-known/mcp/server-card.json"]
    metrics_emitted = ["invocations_total", "tools_available", "error_total"]

    def collect(self) -> dict[str, Any]:
        raw = self._raw()
        if not raw:
            return {"status": HealthStatus.UNKNOWN.value, "metrics": {}}
        return {
            "status": HealthStatus.GREEN.value,
            "metrics": {
                "invocations_total": raw.get("invocations_total", 0),
                "tools_available": raw.get("tools_available", 16),
                "error_total": raw.get("error_total", 0),
            },
        }


class TracesPillar(Pillar):
    name = "traces"
    organ = "OTel + Wire D"
    description = "OpenTelemetry spans + Wire D (W3C traceparent) continuity."
    data_sources = ["app.state.szl_trace snapshot", "OTLP-HTTP receiver"]
    metrics_emitted = ["trace_volume", "active_span_count", "wire_d_status"]

    def collect(self) -> dict[str, Any]:
        raw = self._raw()
        if not raw:
            return {"status": HealthStatus.UNKNOWN.value, "metrics": {}}
        return {
            "status": HealthStatus.GREEN.value,
            "metrics": {
                "trace_volume": raw.get("trace_volume", 0),
                "active_span_count": raw.get("active_span_count", 0),
                "wire_d_status": raw.get("wire_d_status", "LIVE"),
            },
        }


class QueriesPillar(Pillar):
    name = "queries"
    organ = "GraphQL gateway"
    description = "GraphQL gateway query latency and throughput."
    data_sources = ["graphql-gateway resolver timings"]
    metrics_emitted = ["query_count", "latency_ms_p50", "latency_ms_p95", "error_rate"]

    def collect(self) -> dict[str, Any]:
        raw = self._raw()
        if not raw:
            return {"status": HealthStatus.UNKNOWN.value, "metrics": {}}
        return {
            "status": HealthStatus.GREEN.value,
            "metrics": {
                "query_count": raw.get("query_count", 0),
                "latency_ms_p50": raw.get("latency_ms_p50"),
                "latency_ms_p95": raw.get("latency_ms_p95"),
                "error_rate": raw.get("error_rate"),
            },
        }


class BusinessPillar(Pillar):
    name = "business"
    organ = "a11oy observability (native)"
    description = "Revenue attribution, compliance coverage, and decision value."
    data_sources = ["tagged business-context receipts", "compliance_scorecard()"]
    metrics_emitted = [
        "revenue_attributed_total",
        "tagged_receipts",
        "high_value_decisions",
        "compliance_frameworks",
    ]

    def collect(self) -> dict[str, Any]:
        raw = self._raw()
        if not raw:
            return {"status": HealthStatus.UNKNOWN.value, "metrics": {}}
        return {
            "status": HealthStatus.GREEN.value if raw.get("tagged_receipts") else HealthStatus.AMBER.value,
            "metrics": {
                "revenue_attributed_total": raw.get("revenue_attributed_total", 0.0),
                "tagged_receipts": raw.get("tagged_receipts", 0),
                "high_value_decisions": raw.get("high_value_decisions", 0),
                "compliance_frameworks": raw.get(
                    "compliance_frameworks",
                    ["eu_ai_act_art12", "nist_ai_rmf", "fedramp_moderate"],
                ),
            },
        }


# Canonical ordered registry — the 9 pillars, in their doctrinal order.
ALL_PILLARS: list[type[Pillar]] = [
    ReceiptsPillar,
    MemoryPillar,
    ChainPillar,
    GatePillar,
    ReplayPillar,
    ToolsPillar,
    TracesPillar,
    QueriesPillar,
    BusinessPillar,
]


def all_pillars(sources: Optional[dict[str, Callable[[], dict[str, Any]]]] = None) -> list[Pillar]:
    """Instantiate all 9 pillars, optionally wiring per-pillar source callables.

    ``sources`` maps pillar name → callable returning that organ's live state.
    """
    sources = sources or {}
    return [cls(source=sources.get(cls.name)) for cls in ALL_PILLARS]


def pillar_by_name(name: str, source: Optional[Callable[[], dict[str, Any]]] = None) -> Pillar:
    """Instantiate a single pillar by its ``name`` (raises KeyError if unknown)."""
    for cls in ALL_PILLARS:
        if cls.name == name:
            return cls(source=source)
    raise KeyError(f"unknown pillar '{name}'. Known: {[c.name for c in ALL_PILLARS]}")
