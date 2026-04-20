"""
Lyte metrics corpus.

A self-contained snapshot of Lyte service performance metrics, SLO compliance
states, anomaly findings, capacity trend summaries, and alert digests — shaped
for retrieval by the Substrate Opportunity Audit and Operational Drift
workflows.

Each document is a small structured block of natural-language text plus a
metadata envelope so downstream reasoning stages can cite specific
service / metric / time-window pairs.

In Phase 2 this loader will be replaced by a query against the real Lyte
metrics tables (pgvector + Elasticsearch); the document shape returned here
is the same one the production loader will produce so downstream stages do
not change.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass(frozen=True)
class MetricsDocument:
    """A single retrievable document in the Lyte metrics corpus."""

    id: str
    content: str
    source: str
    relevanceScore: float
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ─── Default corpus ───────────────────────────────────────────────────────────
#
# The corpus is intentionally compact (≈30 docs) and focused on the kinds of
# evidence an Opportunity Audit / Operational Drift run cites: per-service SLO
# compliance, latency / error / throughput anomalies, capacity headroom, alert
# storms, and config-divergence signals.

_LYTE_SERVICES = [
    "lyte-api-gateway",
    "lyte-data-pipeline",
    "lyte-scheduler",
    "lyte-billing",
    "lyte-observability",
    "lyte-cognitive",
    "lyte-prism-scoring",
]


def _slo_snapshot(service: str, slo_pct: float, target_pct: float) -> MetricsDocument:
    delta = slo_pct - target_pct
    direction = "below" if delta < 0 else "at or above"
    return MetricsDocument(
        id=f"slo-{service}",
        content=(
            f"SLO snapshot for {service}: 30-day availability is {slo_pct:.2f}% "
            f"against a {target_pct:.2f}% target, {abs(delta):.2f} percentage "
            f"points {direction} the SLO line. Error budget burn rate is "
            f"{max(0.0, -delta) * 7.0:.2f}x the steady-state allowance. "
            f"This document supports SLO drift, availability, and "
            f"reliability audit queries."
        ),
        source="lyte-slo-store",
        relevanceScore=0.78 + max(0.0, -delta) * 0.05,
        metadata={
            "service": service,
            "kind": "slo-snapshot",
            "slo_pct": slo_pct,
            "target_pct": target_pct,
            "windowDays": 30,
        },
    )


def _latency_anomaly(service: str, p99_ms: int, baseline_ms: int) -> MetricsDocument:
    pct = int((p99_ms / max(baseline_ms, 1) - 1) * 100)
    return MetricsDocument(
        id=f"anom-latency-{service}",
        content=(
            f"Latency anomaly on {service}: P99 latency is {p99_ms}ms over the "
            f"last 2 hours vs. a 14-day baseline of {baseline_ms}ms ({pct:+d}%). "
            f"P95 is also elevated. The anomaly correlates with a deploy of "
            f"the upstream config service. This document supports "
            f"latency-spike, anomaly, performance, and SLO breach queries."
        ),
        source="lyte-anomaly-detector",
        relevanceScore=0.84,
        metadata={
            "service": service,
            "kind": "latency-anomaly",
            "p99_ms": p99_ms,
            "baseline_ms": baseline_ms,
            "windowMinutes": 120,
        },
    )


def _throughput_drop(service: str, current_rps: float, baseline_rps: float) -> MetricsDocument:
    pct = int((current_rps / max(baseline_rps, 0.0001) - 1) * 100)
    return MetricsDocument(
        id=f"anom-throughput-{service}",
        content=(
            f"Throughput degradation on {service}: requests-per-second dropped "
            f"to {current_rps:.1f} from a 7-day baseline of {baseline_rps:.1f} "
            f"({pct:+d}%). Backlog grew by 38% in the same window. The "
            f"degradation persists across replicas, ruling out a single-host "
            f"issue. This document supports throughput, opportunity audit, "
            f"and capacity queries."
        ),
        source="lyte-metrics-store",
        relevanceScore=0.75,
        metadata={
            "service": service,
            "kind": "throughput-degradation",
            "currentRps": current_rps,
            "baselineRps": baseline_rps,
        },
    )


def _capacity_trend(service: str, headroom_pct: float) -> MetricsDocument:
    pressure = "tight" if headroom_pct < 25 else "moderate" if headroom_pct < 50 else "comfortable"
    return MetricsDocument(
        id=f"capacity-{service}",
        content=(
            f"Capacity trend for {service}: 7-day rolling CPU headroom is "
            f"{headroom_pct:.1f}% ({pressure}). Memory headroom tracks within "
            f"5 points of CPU. Forward projection at current growth velocity "
            f"crosses the 15% headroom alert line in approximately "
            f"{max(1, int(headroom_pct / 2))} days. This document supports "
            f"capacity, drift, headroom, and operational drift queries."
        ),
        source="lyte-capacity-planner",
        relevanceScore=0.7,
        metadata={
            "service": service,
            "kind": "capacity-trend",
            "headroomPct": headroom_pct,
        },
    )


def _alert_digest(service: str, firing: int, resolved: int) -> MetricsDocument:
    return MetricsDocument(
        id=f"alerts-{service}",
        content=(
            f"Alert digest for {service} (last 24h): {firing} firing alerts, "
            f"{resolved} resolved. Top alert categories: latency-budget-burn, "
            f"error-rate-elevated, queue-depth-high. Mean time to "
            f"acknowledgement is 4.2 minutes; mean time to resolution is "
            f"21 minutes. This document supports alert, incident, opportunity "
            f"audit, and risk queries."
        ),
        source="lyte-alert-pipeline",
        relevanceScore=0.72,
        metadata={
            "service": service,
            "kind": "alert-digest",
            "firing": firing,
            "resolved": resolved,
            "windowHours": 24,
        },
    )


def _config_divergence(service: str, expected: str, actual: str) -> MetricsDocument:
    return MetricsDocument(
        id=f"config-divergence-{service}",
        content=(
            f"Configuration divergence on {service}: expected {expected} per "
            f"the declared baseline, observed {actual} in the running fleet. "
            f"The drift was introduced 3 deploys ago and has not been "
            f"reconciled. This document supports config-divergence, drift, "
            f"and operational drift review queries."
        ),
        source="lyte-config-snapshot",
        relevanceScore=0.68,
        metadata={
            "service": service,
            "kind": "config-divergence",
            "expected": expected,
            "actual": actual,
        },
    )


def build_default_corpus() -> list[MetricsDocument]:
    """Build the default in-memory Lyte metrics corpus."""
    docs: list[MetricsDocument] = []

    # SLO snapshots — mix of healthy + breaching.
    for service, slo, target in [
        ("lyte-api-gateway", 99.72, 99.95),
        ("lyte-data-pipeline", 99.81, 99.90),
        ("lyte-scheduler", 99.95, 99.90),
        ("lyte-billing", 99.99, 99.95),
        ("lyte-observability", 99.88, 99.90),
        ("lyte-cognitive", 99.62, 99.90),
        ("lyte-prism-scoring", 99.92, 99.90),
    ]:
        docs.append(_slo_snapshot(service, slo, target))

    # Latency anomalies — concentrated on degraded services.
    docs.append(_latency_anomaly("lyte-api-gateway", p99_ms=1620, baseline_ms=370))
    docs.append(_latency_anomaly("lyte-cognitive", p99_ms=940, baseline_ms=410))
    docs.append(_latency_anomaly("lyte-data-pipeline", p99_ms=510, baseline_ms=420))

    # Throughput drops.
    docs.append(_throughput_drop("lyte-data-pipeline", current_rps=72.4, baseline_rps=100.6))
    docs.append(_throughput_drop("lyte-billing", current_rps=18.1, baseline_rps=19.0))

    # Capacity trends.
    for service, headroom in [
        ("lyte-api-gateway", 18.0),
        ("lyte-data-pipeline", 22.5),
        ("lyte-scheduler", 41.0),
        ("lyte-cognitive", 29.0),
        ("lyte-billing", 58.0),
        ("lyte-observability", 47.0),
        ("lyte-prism-scoring", 36.0),
    ]:
        docs.append(_capacity_trend(service, headroom))

    # Alert digests.
    for service, firing, resolved in [
        ("lyte-api-gateway", 7, 18),
        ("lyte-cognitive", 4, 9),
        ("lyte-data-pipeline", 3, 11),
        ("lyte-scheduler", 1, 4),
        ("lyte-billing", 0, 2),
    ]:
        docs.append(_alert_digest(service, firing, resolved))

    # Config divergence.
    docs.append(_config_divergence("lyte-scheduler", "replica:3", "replica:2"))
    docs.append(_config_divergence(
        "lyte-data-pipeline",
        "max_inflight:256",
        "max_inflight:128",
    ))

    return docs


LYTE_CORPUS: list[MetricsDocument] = build_default_corpus()
