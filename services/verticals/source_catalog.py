"""Authoritative source plans for SZL verticals.

This catalog is configuration, not evidence.  A source plan becomes LIVE only
when a runtime fetch returns records and emits the operational contract fields:
source URL, authority, fetch timestamp, provenance, counts, and failure state.

Secrets are named, never embedded.  Sources with contractual/licensing limits
remain explicit so a public-data adapter cannot be mistaken for private account,
property, matter, customer, or asset telemetry.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Iterable
from urllib.parse import urlparse


@dataclass(frozen=True)
class SourcePlan:
    id: str
    verticals: tuple[str, ...]
    authority: str
    role: str
    base_url: str
    transport: str
    credential_env: str | None
    freshness_seconds: int
    public: bool
    implementation: str
    limitations: str

    def errors(self) -> list[str]:
        errors: list[str] = []
        if not self.id:
            errors.append("source plan id is required")
        if not self.verticals:
            errors.append(f"{self.id}: verticals are required")
        parsed = urlparse(self.base_url)
        if parsed.scheme not in {"https", "local", "configured"}:
            errors.append(f"{self.id}: base_url must be https://, local://, or configured://")
        if parsed.scheme == "https" and not parsed.netloc:
            errors.append(f"{self.id}: HTTPS base_url requires a host")
        if self.freshness_seconds <= 0:
            errors.append(f"{self.id}: freshness_seconds must be positive")
        if self.credential_env and not self.credential_env.replace("_", "").isalnum():
            errors.append(f"{self.id}: credential_env must be an environment-variable name")
        if self.implementation not in {
            "IMPLEMENTED",
            "IMPLEMENTED_PENDING_MERGE",
            "PLANNED",
            "PRIVATE_CONNECTOR_REQUIRED",
        }:
            errors.append(f"{self.id}: unsupported implementation state")
        return errors

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


SOURCE_PLANS: tuple[SourcePlan, ...] = (
    SourcePlan(
        id="github_org",
        verticals=("platform", "pulse", "lyte_kora", "nuro_forge"),
        authority="GitHub",
        role="repositories, pull requests, checks, releases, and deployment evidence",
        base_url="https://api.github.com",
        transport="REST JSON",
        credential_env="GITHUB_TOKEN",
        freshness_seconds=300,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="Organization-private data and mutations require an authorized installation/token.",
    ),
    SourcePlan(
        id="huggingface_hub",
        verticals=("platform", "lyte_kora", "nuro_forge"),
        authority="Hugging Face Hub",
        role="model, dataset, Space, revision, and runtime metadata",
        base_url="https://huggingface.co/api",
        transport="REST JSON / Git",
        credential_env="HF_TOKEN",
        freshness_seconds=300,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="Private assets, restart, and publication require an authorized token.",
    ),
    SourcePlan(
        id="otel",
        verticals=("platform", "lyte_kora", "meridian_infra"),
        authority="OpenTelemetry project / configured collector",
        role="vendor-neutral traces, metrics, and logs",
        base_url="configured://OTEL_EXPORTER_OTLP_ENDPOINT",
        transport="OTLP gRPC or HTTP",
        credential_env="OTEL_EXPORTER_OTLP_HEADERS",
        freshness_seconds=120,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="No public default endpoint; telemetry must remain scoped to an authorized collector.",
    ),
    SourcePlan(
        id="prometheus",
        verticals=("lyte_kora", "meridian_infra", "platform"),
        authority="Configured Prometheus-compatible service",
        role="service, infrastructure, and business-observability metrics",
        base_url="configured://PROMETHEUS_BASE_URL",
        transport="Prometheus HTTP API",
        credential_env="PROMETHEUS_BEARER_TOKEN",
        freshness_seconds=120,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="The runtime must enforce an explicit host allowlist; never proxy arbitrary query URLs.",
    ),
    SourcePlan(
        id="sec_edgar",
        verticals=("finance_fincept",),
        authority="U.S. Securities and Exchange Commission",
        role="company submissions and XBRL company facts",
        base_url="https://data.sec.gov",
        transport="REST JSON",
        credential_env="SEC_USER_AGENT",
        freshness_seconds=3600,
        public=True,
        implementation="PLANNED",
        limitations="Public-company filings only; declarative User-Agent and SEC fair-access policy required.",
    ),
    SourcePlan(
        id="fred",
        verticals=("finance_fincept", "terra"),
        authority="Federal Reserve Bank of St. Louis",
        role="macroeconomic and regional time series",
        base_url="https://api.stlouisfed.org",
        transport="REST JSON",
        credential_env="FRED_API_KEY",
        freshness_seconds=21600,
        public=True,
        implementation="PLANNED",
        limitations="API key and attribution/terms compliance required; series can be revised.",
    ),
    SourcePlan(
        id="billing_private",
        verticals=("finance_fincept", "marketing_growth", "pulse"),
        authority="Configured billing/CRM systems",
        role="company-specific revenue, pipeline, runway, and customer signals",
        base_url="configured://BILLING_CONNECTOR",
        transport="authorized connector",
        credential_env="BILLING_CONNECTOR_TOKEN",
        freshness_seconds=900,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="Public market APIs cannot substitute for private company books, ARR, cash, or pipeline.",
    ),
    SourcePlan(
        id="openfema",
        verticals=("terra", "firestorm_ops"),
        authority="Federal Emergency Management Agency",
        role="disaster, assistance, resilience, and flood-loss public datasets",
        base_url="https://www.fema.gov/api/open",
        transport="REST JSON",
        credential_env=None,
        freshness_seconds=86400,
        public=True,
        implementation="PLANNED",
        limitations="OpenFEMA is not parcel-level title, appraisal, insurance, or current NFHL determination.",
    ),
    SourcePlan(
        id="nws_alerts",
        verticals=("terra", "firestorm_ops", "killinchu"),
        authority="NOAA National Weather Service",
        role="current watches, warnings, advisories, and forecast context",
        base_url="https://api.weather.gov",
        transport="REST JSON / CAP",
        credential_env="NWS_USER_AGENT",
        freshness_seconds=300,
        public=True,
        implementation="PLANNED",
        limitations="Weather alerts support decisions but do not replace local emergency authorities.",
    ),
    SourcePlan(
        id="census",
        verticals=("terra", "marketing_growth"),
        authority="U.S. Census Bureau",
        role="aggregate demographic, housing, economic, and resilience statistics",
        base_url="https://api.census.gov",
        transport="REST JSON",
        credential_env="CENSUS_API_KEY",
        freshness_seconds=86400,
        public=True,
        implementation="PLANNED",
        limitations="Aggregate statistics only; not ownership, identity, valuation, or parcel-level due diligence.",
    ),
    SourcePlan(
        id="property_private",
        verticals=("terra",),
        authority="Authorized county/municipal/licensed property sources",
        role="parcel, ownership, tax, transaction, lien, zoning, and diligence records",
        base_url="configured://TERRA_PROPERTY_CONNECTOR",
        transport="authorized connector",
        credential_env="TERRA_PROPERTY_CONNECTOR_TOKEN",
        freshness_seconds=86400,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="Coverage, licensing, and legal-use rules vary by jurisdiction; absence is never inferred as clean title.",
    ),
    SourcePlan(
        id="aisstream",
        verticals=("killinchu",),
        authority="AISStream.io",
        role="configured global current AIS",
        base_url="https://stream.aisstream.io",
        transport="WebSocket JSON",
        credential_env="AISSTREAM_API_KEY",
        freshness_seconds=120,
        public=False,
        implementation="IMPLEMENTED",
        limitations="Cooperative AIS can be stale, incomplete, or spoofed; credentials and theater filters required.",
    ),
    SourcePlan(
        id="digitraffic_ais",
        verticals=("killinchu",),
        authority="Fintraffic Digitraffic",
        role="current Finland/Baltic AIS fallback",
        base_url="https://meri.digitraffic.fi",
        transport="REST JSON",
        credential_env=None,
        freshness_seconds=300,
        public=True,
        implementation="IMPLEMENTED",
        limitations="Geographically bounded; not keyless global AIS.",
    ),
    SourcePlan(
        id="kystverket_ais",
        verticals=("killinchu",),
        authority="Norwegian Coastal Administration",
        role="current Norwegian-waters AIS fallback",
        base_url="https://kystdatahuset.no",
        transport="REST JSON",
        credential_env=None,
        freshness_seconds=300,
        public=True,
        implementation="IMPLEMENTED",
        limitations="Geographically bounded; not keyless global AIS.",
    ),
    SourcePlan(
        id="un1718_vessels",
        verticals=("killinchu",),
        authority="UN Security Council 1718 data via OpenSanctions",
        role="designated-vessel screening evidence",
        base_url="https://data.opensanctions.org",
        transport="JSON Lines",
        credential_env=None,
        freshness_seconds=86400,
        public=True,
        implementation="IMPLEMENTED",
        limitations="Exact advisory screening is not regulatory clearance or beneficial-ownership resolution.",
    ),
    SourcePlan(
        id="cisa_kev",
        verticals=("sentra_cyber",),
        authority="Cybersecurity and Infrastructure Security Agency",
        role="authoritative known-exploited-vulnerability catalog",
        base_url="https://www.cisa.gov",
        transport="JSON/CSV",
        credential_env=None,
        freshness_seconds=21600,
        public=True,
        implementation="PLANNED",
        limitations="KEV is a prioritization input; it is not an asset inventory or proof that a local asset is exploitable.",
    ),
    SourcePlan(
        id="nvd",
        verticals=("sentra_cyber",),
        authority="National Institute of Standards and Technology",
        role="CVE/CPE enrichment and change history",
        base_url="https://services.nvd.nist.gov",
        transport="REST JSON 2.0",
        credential_env="NVD_API_KEY",
        freshness_seconds=21600,
        public=True,
        implementation="PLANNED",
        limitations="NVD enrichment may lag source disclosures; rate limits and change windows must be honored.",
    ),
    SourcePlan(
        id="first_epss",
        verticals=("sentra_cyber",),
        authority="FIRST EPSS SIG",
        role="daily modeled probability of exploitation in the next 30 days",
        base_url="https://api.first.org",
        transport="REST JSON",
        credential_env=None,
        freshness_seconds=86400,
        public=True,
        implementation="PLANNED",
        limitations="EPSS is MODELED likelihood, not observed exploitation, vulnerability presence, or business impact.",
    ),
    SourcePlan(
        id="siem_private",
        verticals=("sentra_cyber", "firestorm_ops"),
        authority="Authorized SIEM/XDR/incident systems",
        role="organization-specific assets, detections, incidents, and response state",
        base_url="configured://SENTRA_SECURITY_CONNECTOR",
        transport="authorized connector",
        credential_env="SENTRA_SECURITY_CONNECTOR_TOKEN",
        freshness_seconds=120,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="Public vulnerability feeds cannot substantiate local exposure or lateral movement.",
    ),
    SourcePlan(
        id="courtlistener_v4",
        verticals=("prism_counsel",),
        authority="Free Law Project / CourtListener",
        role="case law, docket, citation, and legal-search evidence",
        base_url="https://www.courtlistener.com/api/rest/v4",
        transport="REST JSON",
        credential_env="COURTLISTENER_TOKEN",
        freshness_seconds=3600,
        public=True,
        implementation="PLANNED",
        limitations="Coverage and account limits apply; results do not constitute legal advice or matter-calendar truth.",
    ),
    SourcePlan(
        id="govinfo",
        verticals=("prism_counsel",),
        authority="U.S. Government Publishing Office",
        role="official federal publications and metadata",
        base_url="https://api.govinfo.gov",
        transport="REST JSON",
        credential_env="GOVINFO_API_KEY",
        freshness_seconds=21600,
        public=True,
        implementation="PLANNED",
        limitations="Federal content only; API key and collection-specific semantics required.",
    ),
    SourcePlan(
        id="federal_register",
        verticals=("prism_counsel", "terra", "finance_fincept"),
        authority="Office of the Federal Register / GPO",
        role="federal rules, notices, proposed rules, and presidential documents",
        base_url="https://www.federalregister.gov/api/v1",
        transport="REST JSON",
        credential_env=None,
        freshness_seconds=21600,
        public=True,
        implementation="PLANNED",
        limitations="Federal Register documents are not a complete codified-law or jurisdiction-specific matter source.",
    ),
    SourcePlan(
        id="matter_private",
        verticals=("prism_counsel",),
        authority="Authorized matter calendar, DMS, contract, and discovery systems",
        role="matter-specific deadlines, obligations, evidence, and approvals",
        base_url="configured://PRISM_MATTER_CONNECTOR",
        transport="authorized connector",
        credential_env="PRISM_MATTER_CONNECTOR_TOKEN",
        freshness_seconds=300,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="Public legal APIs cannot replace counsel-controlled matter data or calendaring rules.",
    ),
    SourcePlan(
        id="analytics_private",
        verticals=("marketing_growth",),
        authority="Authorized first-party analytics and CRM systems",
        role="traffic, conversion, campaign, attribution, and pipeline observations",
        base_url="configured://GROWTH_ANALYTICS_CONNECTOR",
        transport="authorized connector",
        credential_env="GROWTH_ANALYTICS_CONNECTOR_TOKEN",
        freshness_seconds=900,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="Competitive/public web observations cannot be presented as first-party conversion or revenue.",
    ),
    SourcePlan(
        id="incident_private",
        verticals=("firestorm_ops", "pulse"),
        authority="Authorized incident, paging, ticketing, and communication systems",
        role="incidents, ownership, acknowledgement, escalation, and recovery",
        base_url="configured://INCIDENT_CONNECTOR",
        transport="authorized connector",
        credential_env="INCIDENT_CONNECTOR_TOKEN",
        freshness_seconds=120,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="No public source can substantiate private incident state or approval ownership.",
    ),
    SourcePlan(
        id="model_eval_private",
        verticals=("nuro_forge",),
        authority="SZL governed evaluation and training runs",
        role="model revisions, datasets, benchmark outputs, lineage, and receipts",
        base_url="local://szl-eval-registry",
        transport="files / database / Hub revisions",
        credential_env=None,
        freshness_seconds=3600,
        public=False,
        implementation="PLANNED",
        limitations="Benchmark claims require reproducible configuration, dataset version, hardware, and signed/hashed evidence.",
    ),
    SourcePlan(
        id="cloud_cost_private",
        verticals=("meridian_infra",),
        authority="Authorized cloud billing and infrastructure APIs",
        role="cost, utilization, capacity, carbon, and reliability observations",
        base_url="configured://CLOUD_INFRA_CONNECTOR",
        transport="authorized connector",
        credential_env="CLOUD_INFRA_CONNECTOR_TOKEN",
        freshness_seconds=900,
        public=False,
        implementation="PRIVATE_CONNECTOR_REQUIRED",
        limitations="Public price lists cannot substantiate account-specific spend or utilization.",
    ),
    SourcePlan(
        id="mechanics_receipts",
        verticals=("szl_mechanics",),
        authority="SZL Mechanics deterministic solver",
        role="input mesh, solver configuration, residuals, outputs, and receipt chain",
        base_url="local://szl-mechanics",
        transport="local compute artifacts",
        credential_env=None,
        freshness_seconds=3600,
        public=False,
        implementation="IMPLEMENTED",
        limitations="MODELED/COMPUTED results require independent validation before physical engineering use.",
    ),
    SourcePlan(
        id="pinn_receipts",
        verticals=("szl_pinn",),
        authority="SZL PINN governed solver",
        role="training configuration, PDE residuals, evaluation bands, outputs, and receipts",
        base_url="local://szl-pinn",
        transport="local compute artifacts",
        credential_env=None,
        freshness_seconds=3600,
        public=False,
        implementation="IMPLEMENTED",
        limitations="MODELED outputs and conformal bands do not replace physical measurements or certified analysis.",
    ),
    SourcePlan(
        id="cross_vertical_receipts",
        verticals=("constellation_graph",),
        authority="SZL governed vertical receipt plane",
        role="cross-domain evidence links and outcome graph",
        base_url="local://szl-receipt-plane",
        transport="local event/evidence graph",
        credential_env=None,
        freshness_seconds=300,
        public=False,
        implementation="PLANNED",
        limitations="Graph edges inherit source truth states; inference must never be promoted to observation.",
    ),
)


def by_id(source_id: str) -> SourcePlan:
    for plan in SOURCE_PLANS:
        if plan.id == source_id:
            return plan
    raise KeyError(f"unknown source plan: {source_id}")


def for_vertical(vertical_id: str) -> tuple[SourcePlan, ...]:
    return tuple(plan for plan in SOURCE_PLANS if vertical_id in plan.verticals)


def validate_catalog(plans: Iterable[SourcePlan] = SOURCE_PLANS) -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()
    for plan in plans:
        if plan.id in seen:
            errors.append(f"duplicate source plan id: {plan.id}")
        seen.add(plan.id)
        errors.extend(plan.errors())
    return errors


__all__ = ["SOURCE_PLANS", "SourcePlan", "by_id", "for_vertical", "validate_catalog"]
