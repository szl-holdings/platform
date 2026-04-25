"""Registry of Alloy Meridian vertical packs.

Each entry binds a stable vertical id to:
- the human-readable title and purpose
- the import path of the pack subpackage
- the research-radar libraries it considers (comments/docs only — never
  installed as hard dependencies in this pass)

The registry is intentionally a plain Python literal; it is consumed by the
CLI in ``vertical_moats.py`` and by the unit tests. To add a new pack, append
an entry here and create a ``services/verticals/<id>/`` directory matching the
substrate contract.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class VerticalSpec:
    id: str
    title: str
    purpose: str
    module: str  # importable Python module path
    research_seams: tuple[str, ...]


REGISTRY: tuple[VerticalSpec, ...] = (
    VerticalSpec(
        id="pulse",
        title="Pulse",
        purpose="Founder Operating Channel",
        module="services.verticals.pulse",
        research_seams=(
            "OpenTelemetry / GenAI tracing",
            "Langfuse",
            "HyperFrames (future video briefs)",
        ),
    ),
    VerticalSpec(
        id="finance_fincept",
        title="Finance / Fincept",
        purpose="Capital Weather",
        module="services.verticals.finance_fincept",
        research_seams=(
            "Fincept",
            "FinGPT",
            "FinRobot",
            "OpenBB",
            "Darts / StatsForecast",
        ),
    ),
    VerticalSpec(
        id="lyte_kora",
        title="Lyte / KORA",
        purpose="Decision Debt Ledger",
        module="services.verticals.lyte_kora",
        research_seams=(
            "NetworkX",
            "PydanticAI",
            "LangGraph",
        ),
    ),
    VerticalSpec(
        id="terra",
        title="Terra",
        purpose="Acquisition Time Machine",
        module="services.verticals.terra",
        research_seams=(
            "GeoPandas",
            "Darts",
            "Google Maps Platform MCP",
        ),
    ),
    VerticalSpec(
        id="vessels",
        title="Vessels",
        purpose="Voyage Risk Exchange",
        module="services.verticals.vessels",
        research_seams=(
            "Graph routing libraries",
            "AIS providers",
            "Weather / geospatial providers",
        ),
    ),
    VerticalSpec(
        id="prism_counsel",
        title="PRISM Counsel",
        purpose="Matter Flight Recorder",
        module="services.verticals.prism_counsel",
        research_seams=(
            "OpenContracts",
            "Haystack",
            "LlamaIndex",
        ),
    ),
    VerticalSpec(
        id="marketing_growth",
        title="Marketing / Growth",
        purpose="Proof-To-Pipeline Engine",
        module="services.verticals.marketing_growth",
        research_seams=(
            "HyperFrames",
            "Wistia",
            "Sanity",
            "Figma",
        ),
    ),
)


def by_id(vertical_id: str) -> VerticalSpec:
    for spec in REGISTRY:
        if spec.id == vertical_id:
            return spec
    raise KeyError(f"unknown vertical id: {vertical_id}")


def ids() -> tuple[str, ...]:
    return tuple(spec.id for spec in REGISTRY)


__all__ = ["VerticalSpec", "REGISTRY", "by_id", "ids"]
