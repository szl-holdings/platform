"""Canonical operational blueprints for every registered SZL platform vertical.

The legacy deterministic pack id ``vessels`` remains import-compatible, but its
canonical product identity is ``killinchu``.  Blueprints describe required
sources and contracts; they do not mark a runtime operational.  A request-level
``VerticalOperationalManifest`` must still satisfy the fail-closed gates.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Iterable

from services.verticals.operational import (
    AnatomyBinding,
    AnatomyOrganBinding,
    DataSourceBinding,
    DeploymentEvidence,
    EvidenceState,
    FormulaBinding,
    FormulaProofState,
    SecondBrainBinding,
    VerticalOperationalManifest,
)
from services.verticals.source_catalog import by_id as source_by_id


@dataclass(frozen=True)
class VerticalBlueprint:
    vertical_id: str
    registry_id: str
    title: str
    repository: str
    module: str
    domains: tuple[str, ...]
    runtime_routes: tuple[str, ...]
    source_ids: tuple[str, ...]
    formula_names: tuple[str, ...]
    implementation_state: str
    deterministic_pack_is_sample: bool = True
    legacy_ids: tuple[str, ...] = ()
    notes: str | None = None

    def errors(self) -> list[str]:
        errors: list[str] = []
        if not self.vertical_id:
            errors.append("vertical_id is required")
        if not self.registry_id:
            errors.append(f"{self.vertical_id}: registry_id is required")
        if "/" not in self.repository:
            errors.append(f"{self.vertical_id}: repository must be owner/name")
        if not self.domains:
            errors.append(f"{self.vertical_id}: domains are required")
        if not self.runtime_routes:
            errors.append(f"{self.vertical_id}: runtime_routes are required")
        if not self.source_ids:
            errors.append(f"{self.vertical_id}: source_ids are required")
        for source_id in self.source_ids:
            try:
                source_by_id(source_id)
            except KeyError:
                errors.append(f"{self.vertical_id}: unknown source plan {source_id}")
        if not self.formula_names:
            errors.append(f"{self.vertical_id}: formula_names are required")
        return errors

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


STANDARD_FORMULAS = (
    "lambda_aggregate",
    "lambda_bounded",
    "khipu_merkle_root",
    "dsse_envelope",
)
SCIENCE_FORMULAS = (
    "lambda_aggregate",
    "lambda_bounded",
    "khipu_merkle_root",
    "dsse_envelope",
    "conformal_interval",
)
GRAPH_FORMULAS = (
    "lambda_aggregate",
    "lambda_bounded",
    "khipu_merkle_root",
    "outcome_graph_consistency",
)


BLUEPRINTS: tuple[VerticalBlueprint, ...] = (
    VerticalBlueprint(
        vertical_id="platform",
        registry_id="platform",
        title="Platform / AgentOps",
        repository="szl-holdings/platform",
        module="services.verticals.platform",
        domains=("agentops", "release_governance", "estate_observability"),
        runtime_routes=(
            "/api/platform/v1/vertical/contract",
            "/api/platform/v1/vertical/runtime",
        ),
        source_ids=("github_org", "huggingface_hub", "otel", "prometheus"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="SAMPLE_PACK_WITH_PRIVATE_CONNECTORS_REQUIRED",
    ),
    VerticalBlueprint(
        vertical_id="pulse",
        registry_id="pulse",
        title="Pulse",
        repository="szl-holdings/platform",
        module="services.verticals.pulse",
        domains=("founder_ops", "decision_queue", "incident_coordination"),
        runtime_routes=(
            "/api/pulse/v1/vertical/contract",
            "/api/pulse/v1/vertical/runtime",
        ),
        source_ids=("github_org", "billing_private", "incident_private"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="SAMPLE_PACK_WITH_PRIVATE_CONNECTORS_REQUIRED",
    ),
    VerticalBlueprint(
        vertical_id="finance_fincept",
        registry_id="finance_fincept",
        title="Finance / PURiQ / Fincept",
        repository="szl-holdings/platform",
        module="services.verticals.finance_fincept",
        domains=("capital_weather", "public_filings", "economic_context", "private_finance"),
        runtime_routes=(
            "/api/finance/v1/vertical/contract",
            "/api/finance/v1/vertical/runtime",
        ),
        source_ids=("sec_edgar", "fred", "federal_register", "billing_private"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="SAMPLE_PACK_OFFICIAL_AND_PRIVATE_ADAPTERS_PLANNED",
    ),
    VerticalBlueprint(
        vertical_id="lyte_kora",
        registry_id="lyte_kora",
        title="Lyte / KORA",
        repository="szl-holdings/platform",
        module="services.verticals.lyte_kora",
        domains=("business_observability", "decision_debt", "outcomes"),
        runtime_routes=(
            "/api/lyte/v1/vertical/contract",
            "/api/lyte/v1/vertical/runtime",
        ),
        source_ids=("otel", "prometheus", "github_org", "huggingface_hub"),
        formula_names=GRAPH_FORMULAS,
        implementation_state="SAMPLE_PACK_TELEMETRY_CONNECTORS_REQUIRED",
    ),
    VerticalBlueprint(
        vertical_id="terra",
        registry_id="terra",
        title="Terra",
        repository="szl-holdings/platform",
        module="services.verticals.terra",
        domains=("real_estate", "acquisition", "property_risk", "diligence"),
        runtime_routes=(
            "/api/terra/v1/vertical/contract",
            "/api/terra/v1/vertical/runtime",
        ),
        source_ids=("openfema", "nws_alerts", "census", "fred", "federal_register", "property_private"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="SAMPLE_PACK_PUBLIC_RISK_AND_PROPERTY_CONNECTORS_PLANNED",
    ),
    VerticalBlueprint(
        vertical_id="killinchu",
        registry_id="vessels",
        title="Killinchu",
        repository="szl-holdings/killinchu",
        module="services.verticals.vessels",
        domains=("counter_uas", "vessels", "maritime_domain_awareness"),
        runtime_routes=(
            "/api/killinchu/v1/vertical/contract",
            "/api/killinchu/v1/vertical/runtime",
            "/api/killinchu/v1/fleet/voyage-risk/current",
        ),
        source_ids=("aisstream", "digitraffic_ais", "kystverket_ais", "un1718_vessels", "nws_alerts"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="IMPLEMENTED_PENDING_KILLINCHU_PR_381_AND_DEPLOYMENT_RECEIPT",
        legacy_ids=("vessels",),
        notes="Vessels is a Killinchu domain, not a standalone product.",
    ),
    VerticalBlueprint(
        vertical_id="prism_counsel",
        registry_id="prism_counsel",
        title="PRISM Counsel",
        repository="szl-holdings/platform",
        module="services.verticals.prism_counsel",
        domains=("legal_matters", "deadlines", "citation_integrity", "evidence"),
        runtime_routes=(
            "/api/counsel/v1/vertical/contract",
            "/api/counsel/v1/vertical/runtime",
        ),
        source_ids=("courtlistener_v4", "govinfo", "federal_register", "matter_private"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="SAMPLE_PACK_PUBLIC_LAW_AND_PRIVATE_MATTER_ADAPTERS_PLANNED",
    ),
    VerticalBlueprint(
        vertical_id="marketing_growth",
        registry_id="marketing_growth",
        title="Marketing / Growth",
        repository="szl-holdings/platform",
        module="services.verticals.marketing_growth",
        domains=("growth", "attribution", "proof_to_pipeline"),
        runtime_routes=(
            "/api/growth/v1/vertical/contract",
            "/api/growth/v1/vertical/runtime",
        ),
        source_ids=("analytics_private", "billing_private", "census"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="SAMPLE_PACK_PRIVATE_ANALYTICS_REQUIRED",
    ),
    VerticalBlueprint(
        vertical_id="sentra_cyber",
        registry_id="sentra_cyber",
        title="Sentra Cyber",
        repository="szl-holdings/platform",
        module="services.verticals.sentra_cyber",
        domains=("cybersecurity", "vulnerability_priority", "incident_response"),
        runtime_routes=(
            "/api/sentra/v1/vertical/contract",
            "/api/sentra/v1/vertical/runtime",
        ),
        source_ids=("cisa_kev", "nvd", "first_epss", "siem_private"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="SAMPLE_PACK_OFFICIAL_THREAT_AND_PRIVATE_SIEM_ADAPTERS_PLANNED",
    ),
    VerticalBlueprint(
        vertical_id="firestorm_ops",
        registry_id="firestorm_ops",
        title="Firestorm Ops",
        repository="szl-holdings/platform",
        module="services.verticals.firestorm_ops",
        domains=("crisis_ops", "emergency_information", "incident_coordination"),
        runtime_routes=(
            "/api/firestorm/v1/vertical/contract",
            "/api/firestorm/v1/vertical/runtime",
        ),
        source_ids=("nws_alerts", "openfema", "incident_private", "siem_private"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="STUB_PUBLIC_ALERT_AND_PRIVATE_INCIDENT_ADAPTERS_PLANNED",
    ),
    VerticalBlueprint(
        vertical_id="nuro_forge",
        registry_id="nuro_forge",
        title="NuroForge",
        repository="szl-holdings/platform",
        module="services.verticals.nuro_forge",
        domains=("model_forge", "evaluation", "training_lineage"),
        runtime_routes=(
            "/api/nuro-forge/v1/vertical/contract",
            "/api/nuro-forge/v1/vertical/runtime",
        ),
        source_ids=("huggingface_hub", "github_org", "model_eval_private"),
        formula_names=SCIENCE_FORMULAS,
        implementation_state="STUB_GOVERNED_EVAL_REGISTRY_REQUIRED",
    ),
    VerticalBlueprint(
        vertical_id="meridian_infra",
        registry_id="meridian_infra",
        title="Meridian Infra",
        repository="szl-holdings/platform",
        module="services.verticals.meridian_infra",
        domains=("infrastructure", "finops", "reliability", "capacity"),
        runtime_routes=(
            "/api/meridian-infra/v1/vertical/contract",
            "/api/meridian-infra/v1/vertical/runtime",
        ),
        source_ids=("otel", "prometheus", "cloud_cost_private"),
        formula_names=STANDARD_FORMULAS,
        implementation_state="STUB_PRIVATE_INFRA_AND_COST_CONNECTORS_REQUIRED",
    ),
    VerticalBlueprint(
        vertical_id="szl_mechanics",
        registry_id="szl_mechanics",
        title="SZL Mechanics",
        repository="szl-holdings/platform",
        module="services.verticals.szl_mechanics",
        domains=("solid_mechanics", "verified_compute"),
        runtime_routes=(
            "/api/mechanics/v1/vertical/contract",
            "/api/mechanics/v1/vertical/runtime",
        ),
        source_ids=("mechanics_receipts",),
        formula_names=SCIENCE_FORMULAS,
        implementation_state="COMPUTE_IMPLEMENTED_PHYSICAL_VALIDATION_REQUIRED",
        deterministic_pack_is_sample=False,
    ),
    VerticalBlueprint(
        vertical_id="szl_pinn",
        registry_id="szl_pinn",
        title="SZL PINN",
        repository="szl-holdings/platform",
        module="services.verticals.szl_pinn",
        domains=("physics_informed_ml", "thermal", "verified_compute"),
        runtime_routes=(
            "/api/pinn/v1/vertical/contract",
            "/api/pinn/v1/vertical/runtime",
        ),
        source_ids=("pinn_receipts",),
        formula_names=SCIENCE_FORMULAS,
        implementation_state="COMPUTE_IMPLEMENTED_PHYSICAL_VALIDATION_REQUIRED",
        deterministic_pack_is_sample=False,
    ),
    VerticalBlueprint(
        vertical_id="constellation_graph",
        registry_id="constellation_graph",
        title="Constellation Graph",
        repository="szl-holdings/platform",
        module="services.verticals.constellation_graph",
        domains=("cross_domain_graph", "outcomes", "provenance"),
        runtime_routes=(
            "/api/constellation/v1/vertical/contract",
            "/api/constellation/v1/vertical/runtime",
        ),
        source_ids=("cross_vertical_receipts",),
        formula_names=GRAPH_FORMULAS,
        implementation_state="STUB_RECEIPT_PLANE_REQUIRED",
    ),
)


def by_id(vertical_id: str) -> VerticalBlueprint:
    for blueprint in BLUEPRINTS:
        if vertical_id in {
            blueprint.vertical_id,
            blueprint.registry_id,
            *blueprint.legacy_ids,
        }:
            return blueprint
    raise KeyError(f"unknown vertical blueprint: {vertical_id}")


def canonical_ids() -> tuple[str, ...]:
    return tuple(blueprint.vertical_id for blueprint in BLUEPRINTS)


def validate_blueprints(
    blueprints: Iterable[VerticalBlueprint] = BLUEPRINTS,
) -> list[str]:
    errors: list[str] = []
    canonical_seen: set[str] = set()
    registry_seen: set[str] = set()
    aliases_seen: dict[str, str] = {}
    for blueprint in blueprints:
        errors.extend(blueprint.errors())
        if blueprint.vertical_id in canonical_seen:
            errors.append(f"duplicate canonical vertical id: {blueprint.vertical_id}")
        canonical_seen.add(blueprint.vertical_id)
        if blueprint.registry_id in registry_seen:
            errors.append(f"duplicate registry vertical id: {blueprint.registry_id}")
        registry_seen.add(blueprint.registry_id)
        for alias in {blueprint.registry_id, *blueprint.legacy_ids}:
            previous = aliases_seen.get(alias)
            if previous and previous != blueprint.vertical_id:
                errors.append(
                    f"alias {alias} resolves to both {previous} and {blueprint.vertical_id}"
                )
            aliases_seen[alias] = blueprint.vertical_id
    return errors


def _formula_binding(name: str) -> FormulaBinding:
    proof_state = (
        FormulaProofState.LOCKED_PROVEN
        if name in {"lambda_bounded", "khipu_merkle_root", "dsse_envelope"}
        else FormulaProofState.EMPIRICAL
    )
    total = 13 if name == "lambda_aggregate" else 1
    return FormulaBinding(
        name=name,
        role="Blueprint binding; request-level measured inputs required before execution.",
        proof_state=proof_state,
        measured_input_count=0,
        total_input_count=total,
        output_name="partial_operational_lambda" if name == "lambda_aggregate" else None,
        theorem_claimed=False,
        full_yuyay13_claimed=False,
        notes="A blueprint is not runtime formula evidence.",
    )


def snapshot_manifest(blueprint: VerticalBlueprint) -> VerticalOperationalManifest:
    """Build an honest source-tree snapshot; never fabricates live observations."""
    data_sources = [
        DataSourceBinding(
            id=source.id,
            kind=source.role,
            authority=source.authority,
            state=EvidenceState.UNAVAILABLE,
            credential=source.credential_env or "none",
            coverage=source.limitations,
            notes=(
                f"Source plan state={source.implementation}; a request-level fetch "
                "must attach URL, timestamp, provenance, and counts."
            ),
        )
        for source in (source_by_id(source_id) for source_id in blueprint.source_ids)
    ]
    if blueprint.deterministic_pack_is_sample:
        data_sources.append(
            DataSourceBinding(
                id=f"{blueprint.registry_id}_deterministic_pack",
                kind="deterministic vertical-pack demonstration",
                authority="szl-holdings/platform source tree",
                state=EvidenceState.SAMPLE,
                source_url=(
                    "https://github.com/szl-holdings/platform/tree/main/"
                    f"services/verticals/{blueprint.registry_id}"
                ),
                provenance="Fixed source-code collector; not fetched from the named upstream.",
                record_count=3,
                live_record_count=0,
                sample_record_count=3,
                credential="none",
                coverage="demonstration only",
            )
        )

    organs = tuple(
        AnatomyOrganBinding(
            organ=organ,
            state="HUMAN_LOCK" if organ == "HANDS" else "UNAVAILABLE",
            evidence=(
                "Blueprint requires human approval and automation_authority=NONE"
                if organ == "HANDS"
                else None
            ),
            notes="Request-level evidence required.",
        )
        for organ in (
            "EYES_EARS",
            "IMMUNE",
            "BRAIN",
            "SKELETON",
            "HEART",
            "HANDS",
            "MEMORY",
        )
    )
    return VerticalOperationalManifest(
        vertical_id=blueprint.vertical_id,
        title=blueprint.title,
        repository=blueprint.repository,
        domains=blueprint.domains,
        runtime_routes=blueprint.runtime_routes,
        data_sources=tuple(data_sources),
        formulas=tuple(_formula_binding(name) for name in blueprint.formula_names),
        second_brain=SecondBrainBinding(
            state=EvidenceState.UNAVAILABLE,
            notes="Blueprint requires request-level handles and evidence digests.",
        ),
        anatomy=AnatomyBinding(organs=organs),
        requires_human_approval=True,
        rollback_path="Return to monitor-only state and invalidate the proposed action.",
        automation_authority="NONE",
        evidence_digest=None,
        receipt_state="UNAVAILABLE",
        deployment=DeploymentEvidence(
            notes="Exact-source deploy receipt and live route probes not attached to source snapshot."
        ),
        legacy_ids=blueprint.legacy_ids,
        implementation_state=blueprint.implementation_state,
        notes=blueprint.notes,
    )


def snapshot_manifests() -> tuple[VerticalOperationalManifest, ...]:
    return tuple(snapshot_manifest(blueprint) for blueprint in BLUEPRINTS)


def source_plan_ids(vertical_id: str) -> tuple[str, ...]:
    return by_id(vertical_id).source_ids


def source_plans(vertical_id: str):
    return tuple(source_by_id(source_id) for source_id in source_plan_ids(vertical_id))


__all__ = [
    "BLUEPRINTS",
    "VerticalBlueprint",
    "by_id",
    "canonical_ids",
    "snapshot_manifest",
    "snapshot_manifests",
    "source_plan_ids",
    "source_plans",
    "validate_blueprints",
]
