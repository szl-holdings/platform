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
    mcp_capabilities: tuple[str, ...] = ()  # MCP capability IDs this pack references
    pack_status: str = "live"  # 'live' | 'stub' | 'roadmap'


REGISTRY: tuple[VerticalSpec, ...] = (
    VerticalSpec(
        id="platform",
        title="Platform / AgentOps",
        purpose="AgentOps Source Of Truth — Release Gate Intelligence",
        module="services.verticals.platform",
        pack_status="live",
        research_seams=(
            "OpenTelemetry / GenAI tracing",
            "Langfuse",
            "Arize Phoenix",
            "OpenLIT",
        ),
        mcp_capabilities=(
            "github.list_prs",
            "github.get_pr",
            "github.merge_pr",
            "posthog.get_feature_flags",
            "slack.post_message",
        ),
    ),
    VerticalSpec(
        id="pulse",
        title="Pulse",
        purpose="Founder Operating Channel",
        module="services.verticals.pulse",
        pack_status="live",
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
        pack_status="live",
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
        pack_status="live",
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
        pack_status="live",
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
        pack_status="live",
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
        pack_status="live",
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
        pack_status="live",
        research_seams=(
            "HyperFrames",
            "Wistia",
            "Sanity",
            "Figma",
        ),
    ),
    VerticalSpec(
        id="sentra_cyber",
        title="Sentra Cyber",
        purpose="Cyber Resilience Command",
        module="services.verticals.sentra_cyber",
        pack_status="live",
        research_seams=(
            "MITRE ATT&CK navigator",
            "OpenCTI",
            "Elastic SIEM",
            "OTEL security signals",
        ),
        mcp_capabilities=(
            "sentry.list_issues",
            "sentry.get_issue",
            "sentry.resolve_issue",
            "pagerduty.list_incidents",
            "pagerduty.trigger_incident",
            "slack.post_message",
        ),
    ),
    VerticalSpec(
        id="firestorm_ops",
        title="Firestorm Ops",
        purpose="Crisis Operations Command",
        module="services.verticals.firestorm_ops",
        pack_status="stub",
        research_seams=(
            "PagerDuty Events API",
            "Jira Service Management",
            "Grafana Incident",
            "Crisis simulation engines",
        ),
    ),
    VerticalSpec(
        id="nuro_forge",
        title="NuroForge",
        purpose="AI Agent Forge",
        module="services.verticals.nuro_forge",
        pack_status="stub",
        research_seams=(
            "LangSmith / Langfuse eval harness",
            "OpenAI fine-tuning API",
            "Hugging Face PEFT",
            "LoRA adapter registries",
        ),
    ),
    VerticalSpec(
        id="meridian_infra",
        title="Meridian Infra",
        purpose="Infrastructure Intelligence",
        module="services.verticals.meridian_infra",
        pack_status="stub",
        research_seams=(
            "AWS Cost Explorer / Azure Cost Management",
            "Prometheus / Thanos",
            "Datadog infra metrics",
            "FinOps Foundation standards",
        ),
    ),
    VerticalSpec(
        id="szl_mechanics",
        title="SZL Mechanics",
        purpose="Verified Solid-Mechanics Solver (FE-NO) — Receipt-Verified Compute",
        module="services.verticals.szl_mechanics",
        pack_status="live",
        research_seams=(
            "FE-NO clean-room solver (method attribution: arXiv:2606.08796)",
            "DeepONet operator learning (Lu et al. 2021, doi:10.1038/s42256-021-00302-5)",
            "Schwarz / domain-decomposition iterative solvers",
            "Sovereign GPU fabric (own-metal verified compute)",
        ),
        # No MCP capabilities: the szl_lake/khipu DSSE signing path is an
        # internal provenance path (see szl_mechanics/receipt.py + MOAT.md),
        # NOT a public MCP-registry capability. Declaring it here would orphan
        # the meridian:check MCP gate; honesty + additive = leave it empty.
    ),
    VerticalSpec(
        id="szl_pinn",
        title="SZL PINN",
        purpose="Verified Physics-Informed NN Solver (heat / GPU-die thermal) \u2014 Receipt-Verified Compute",
        module="services.verticals.szl_pinn",
        pack_status="live",
        research_seams=(
            "PINN clean-room core (method attribution: Raissi/Perdikaris/Karniadakis 2019, doi:10.1016/j.jcp.2018.10.045)",
            "NVIDIA Modulus/PhysicsNeMo (Apache-2.0) + neurodiffeq (MIT) prior art, NOT copied",
            "DeepXDE (LGPL-2.1) method-only, NOT vendored",
            "Split-conformal honest error band + Lambda free-energy guard (innovations/)",
            "MODELED Landauer thermodynamic floor (Landauer 1961) for thermal-aware scheduling",
            "Sovereign GPU fabric (own-metal verified compute)",
        ),
        # No MCP capabilities: same internal szl_lake/khipu DSSE signing path as
        # szl_mechanics, NOT a public MCP-registry capability. Leaving empty keeps
        # the meridian:check MCP gate un-orphaned (honest + additive).
    ),
    VerticalSpec(
        id="constellation_graph",
        title="Constellation Graph",
        purpose="Cross-Domain Intelligence Graph",
        module="services.verticals.constellation_graph",
        pack_status="stub",
        research_seams=(
            "NetworkX / PyG",
            "Neo4j",
            "Causal inference libraries (DoWhy, EconML)",
            "Knowledge graph embedding models",
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


def live() -> tuple[VerticalSpec, ...]:
    return tuple(spec for spec in REGISTRY if spec.pack_status == "live")


def stubs() -> tuple[VerticalSpec, ...]:
    return tuple(spec for spec in REGISTRY if spec.pack_status == "stub")


__all__ = ["VerticalSpec", "REGISTRY", "by_id", "ids", "live", "stubs"]
