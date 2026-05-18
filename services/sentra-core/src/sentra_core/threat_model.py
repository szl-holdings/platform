"""Threat modeling — inventory + threat-source -> typed threat graph keyed by MITRE ATT&CK.

We ship a small vendored slice of the ATT&CK Enterprise technique catalog
(see ``MITRE_TECHNIQUES``) so the module is self-contained. Callers can pass
``extra_techniques`` to merge richer catalogs at runtime.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Literal, Mapping

Severity = Literal["critical", "high", "medium", "low"]
AssetKind = Literal[
    "endpoint", "server", "identity", "cloud", "network", "data", "saas"
]


# A small, vendored subset of MITRE ATT&CK Enterprise techniques. Each entry
# is keyed by canonical technique id and carries the tactic + base severity
# weight used by the scorer. This is intentionally small so the module has no
# external network dependency at import time.
MITRE_TECHNIQUES: dict[str, dict[str, str | float]] = {
    "T1078": {"name": "Valid Accounts", "tactic": "initial-access", "weight": 0.85},
    "T1190": {"name": "Exploit Public-Facing Application", "tactic": "initial-access", "weight": 0.9},
    "T1566": {"name": "Phishing", "tactic": "initial-access", "weight": 0.7},
    "T1059": {"name": "Command and Scripting Interpreter", "tactic": "execution", "weight": 0.75},
    "T1547": {"name": "Boot or Logon Autostart Execution", "tactic": "persistence", "weight": 0.6},
    "T1098": {"name": "Account Manipulation", "tactic": "persistence", "weight": 0.65},
    "T1068": {"name": "Exploitation for Privilege Escalation", "tactic": "privilege-escalation", "weight": 0.85},
    "T1003": {"name": "OS Credential Dumping", "tactic": "credential-access", "weight": 0.9},
    "T1110": {"name": "Brute Force", "tactic": "credential-access", "weight": 0.55},
    "T1021": {"name": "Remote Services", "tactic": "lateral-movement", "weight": 0.7},
    "T1486": {"name": "Data Encrypted for Impact", "tactic": "impact", "weight": 0.95},
    "T1567": {"name": "Exfiltration Over Web Service", "tactic": "exfiltration", "weight": 0.8},
    "T1071": {"name": "Application Layer Protocol", "tactic": "command-and-control", "weight": 0.65},
}


# Asset-kind -> techniques typically relevant to that surface. Used as a
# default mapper when a threat source does not specify techniques.
_KIND_TO_TECHNIQUES: dict[AssetKind, tuple[str, ...]] = {
    "endpoint": ("T1059", "T1547", "T1068", "T1003"),
    "server": ("T1190", "T1068", "T1021", "T1486"),
    "identity": ("T1078", "T1098", "T1110", "T1003"),
    "cloud": ("T1078", "T1098", "T1567"),
    "network": ("T1071", "T1021"),
    "data": ("T1486", "T1567"),
    "saas": ("T1078", "T1566", "T1567"),
}


@dataclass(frozen=True)
class Asset:
    id: str
    name: str
    kind: AssetKind
    exposure: Severity = "medium"
    tags: tuple[str, ...] = ()


@dataclass(frozen=True)
class ThreatSource:
    """A threat source (actor, campaign, or detector hypothesis)."""

    id: str
    name: str
    motivation: str = "unknown"
    techniques: tuple[str, ...] = ()  # explicit ATT&CK technique IDs
    targets: tuple[AssetKind, ...] = ()


@dataclass(frozen=True)
class TechniqueNode:
    technique_id: str
    name: str
    tactic: str
    weight: float


@dataclass(frozen=True)
class ThreatEdge:
    source_id: str  # ThreatSource.id
    asset_id: str
    technique_id: str
    score: float  # severity-weighted edge score, 0..1
    rationale: str


@dataclass(frozen=True)
class ThreatGraph:
    sources: tuple[ThreatSource, ...]
    assets: tuple[Asset, ...]
    techniques: tuple[TechniqueNode, ...]
    edges: tuple[ThreatEdge, ...]
    top_risks: tuple[ThreatEdge, ...]  # edges sorted by score desc, capped at 10
    coverage: Mapping[str, float]  # tactic -> aggregate weight 0..1

    def to_dict(self) -> dict:
        return {
            "sources": [s.__dict__ for s in self.sources],
            "assets": [a.__dict__ for a in self.assets],
            "techniques": [t.__dict__ for t in self.techniques],
            "edges": [e.__dict__ for e in self.edges],
            "top_risks": [e.__dict__ for e in self.top_risks],
            "coverage": dict(self.coverage),
        }


_EXPOSURE_MULT: dict[Severity, float] = {
    "critical": 1.0,
    "high": 0.85,
    "medium": 0.65,
    "low": 0.4,
}


def _resolve_techniques(
    source: ThreatSource, asset: Asset, catalog: Mapping[str, Mapping[str, str | float]]
) -> Iterable[str]:
    if source.techniques:
        return [t for t in source.techniques if t in catalog]
    if source.targets and asset.kind not in source.targets:
        return []
    return [t for t in _KIND_TO_TECHNIQUES.get(asset.kind, ()) if t in catalog]


def build_threat_graph(
    assets: Iterable[Asset],
    sources: Iterable[ThreatSource],
    extra_techniques: Mapping[str, Mapping[str, str | float]] | None = None,
) -> ThreatGraph:
    """Build a typed ATT&CK-keyed threat graph from inventory + sources."""

    catalog: dict[str, Mapping[str, str | float]] = dict(MITRE_TECHNIQUES)
    if extra_techniques:
        catalog.update(extra_techniques)

    assets_t = tuple(assets)
    sources_t = tuple(sources)
    if not assets_t:
        raise ValueError("build_threat_graph requires at least one asset")
    if not sources_t:
        raise ValueError("build_threat_graph requires at least one threat source")

    used_tech: set[str] = set()
    edges: list[ThreatEdge] = []
    coverage: dict[str, float] = {}

    for src in sources_t:
        for asset in assets_t:
            for tid in _resolve_techniques(src, asset, catalog):
                meta = catalog[tid]
                weight = float(meta["weight"])
                exposure = _EXPOSURE_MULT.get(asset.exposure, 0.5)
                score = round(min(1.0, weight * exposure), 4)
                rationale = (
                    f"{src.name} -> {asset.name} via {meta['name']} "
                    f"(tactic={meta['tactic']}, exposure={asset.exposure})"
                )
                edges.append(
                    ThreatEdge(
                        source_id=src.id,
                        asset_id=asset.id,
                        technique_id=tid,
                        score=score,
                        rationale=rationale,
                    )
                )
                used_tech.add(tid)
                tactic = str(meta["tactic"])
                coverage[tactic] = round(coverage.get(tactic, 0.0) + score, 4)

    techniques = tuple(
        TechniqueNode(
            technique_id=tid,
            name=str(catalog[tid]["name"]),
            tactic=str(catalog[tid]["tactic"]),
            weight=float(catalog[tid]["weight"]),
        )
        for tid in sorted(used_tech)
    )
    edges_sorted = tuple(sorted(edges, key=lambda e: e.score, reverse=True))
    top_risks = edges_sorted[:10]

    # Normalize coverage to 0..1 by dividing by the max observed.
    if coverage:
        max_cov = max(coverage.values())
        if max_cov > 0:
            coverage = {k: round(v / max_cov, 4) for k, v in coverage.items()}

    return ThreatGraph(
        sources=sources_t,
        assets=assets_t,
        techniques=techniques,
        edges=edges_sorted,
        top_risks=top_risks,
        coverage=coverage,
    )
