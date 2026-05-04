"""
Cyber Resilience reference pack (vertical = tenax-cyber).

Reads sentra's existing seed data (sentra-twin, agent-mesh) and produces
BusinessSignals + ActionBriefs covering containment rules, mesh exposures,
threat overview, control drift, and recovery readiness.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from ...models import (
    BusinessSignal, Outcome, ActionBrief, CovenantPolicy,
    ProofPacket, BusinessTwin, PackRunReport, ExecutionMode,
)
from ... import __version__
from .seed_data import get_sentra_twin, get_agent_mesh

PACK_VERSION = "0.1.0"
VERTICAL = "tenax-cyber"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


class CyberResiliencePack:
    @property
    def slug(self) -> str:
        return "cyber-resilience"

    @property
    def vertical(self) -> str:
        return VERTICAL

    @property
    def version(self) -> str:
        return PACK_VERSION

    def discover(self) -> list[BusinessSignal]:
        # integration seam: NetworkX
        twin = get_sentra_twin()
        mesh = get_agent_mesh()
        now = _now()
        signals: list[BusinessSignal] = []

        for asset in twin["assets"]:
            if asset["status"] == "compromised":
                signals.append(BusinessSignal(
                    id=_id("sig-cyber"),
                    vertical=VERTICAL,
                    entity=asset["id"],
                    title=f"Compromised Asset: {asset['name']}",
                    description=f"{asset['name']} ({asset['type']}) is in compromised state. "
                                f"Exposure score: {asset['exposureScore']}. "
                                f"Control gaps: {', '.join(asset['controlGaps'])}.",
                    severity="critical",
                    status="active",
                    businessImpact=f"Critical {asset['type']} asset compromised; lateral movement risk.",
                    evidenceRefs=[f"sentra-twin/assets/{asset['id']}"],
                    owner="cyber-soc",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["compromised-asset", asset["type"].lower(), "containment"],
                    metadata={
                        "assetId": asset["id"],
                        "assetType": asset["type"],
                        "exposureScore": asset["exposureScore"],
                        "backupStatus": asset["backupStatus"],
                    },
                ))

        for incident in twin["incidents"]:
            if incident["status"] == "active":
                signals.append(BusinessSignal(
                    id=_id("sig-cyber"),
                    vertical=VERTICAL,
                    entity=incident["id"],
                    title=f"Active Incident: {incident['title']}",
                    description=f"{incident['description']} "
                                f"MITRE stage: {incident['mitreStage']}. "
                                f"Affected assets: {', '.join(incident['affectedAssets'])}.",
                    severity=incident["severity"],
                    status="active",
                    businessImpact="Active threat requiring immediate containment and response.",
                    evidenceRefs=[f"sentra-twin/incidents/{incident['id']}"],
                    owner="cyber-soc",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["incident", "threat-overview", incident["mitreStage"].lower().replace(" / ", "-")],
                    metadata={
                        "incidentId": incident["id"],
                        "mitreStage": incident["mitreStage"],
                        "affectedAssets": incident["affectedAssets"],
                    },
                ))

        for drift in twin["controlDrifts"]:
            if drift["status"] == "drift_detected":
                signals.append(BusinessSignal(
                    id=_id("sig-cyber"),
                    vertical=VERTICAL,
                    entity=f"control-{drift['family'].lower()}",
                    title=f"Control Drift: {drift['control']}",
                    description=f"NIST {drift['family']} control '{drift['control']}' has drifted. "
                                f"Evidence: {drift['evidence']}",
                    severity="high",
                    status="active",
                    businessImpact=f"Degraded {drift['family']} capability; compliance gap.",
                    evidenceRefs=[f"sentra-twin/controlDrifts/{drift['family']}"],
                    owner="cyber-compliance",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["control-drift", drift["family"].lower(), "compliance"],
                    metadata={"family": drift["family"], "control": drift["control"]},
                ))

        for exposure in mesh["exposures"]:
            if exposure["status"] == "open":
                signals.append(BusinessSignal(
                    id=_id("sig-cyber"),
                    vertical=VERTICAL,
                    entity=exposure["id"],
                    title=f"Mesh Exposure: {exposure['title']}",
                    description=f"{exposure['explanation']} "
                                f"OWASP: {exposure['owaspCategory']}. "
                                f"Fix: {exposure['fixLabel']}.",
                    severity=exposure["severity"],
                    status="active",
                    businessImpact="Agent mesh security boundary violation; potential data exfiltration.",
                    evidenceRefs=[f"agent-mesh/exposures/{exposure['id']}"],
                    owner="cyber-mesh-ops",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["mesh-exposure", exposure["fixType"], "agent-mesh"],
                    metadata={
                        "exposureId": exposure["id"],
                        "owaspCategory": exposure["owaspCategory"],
                        "fixType": exposure["fixType"],
                        "affectedAgentIds": exposure["affectedAgentIds"],
                    },
                ))

        recovery = twin["recoveryPosture"]
        if recovery < 60:
            signals.append(BusinessSignal(
                id=_id("sig-cyber"),
                vertical=VERTICAL,
                entity="recovery-posture",
                title="Recovery Readiness Below Threshold",
                description=f"Recovery posture score is {recovery}/100, below the 60-point threshold. "
                            f"Financial exposure: ${twin['financialExposure']:,.0f}.",
                severity="high",
                status="active",
                businessImpact=f"Inadequate recovery capability; ${twin['financialExposure']:,.0f} at risk.",
                evidenceRefs=["sentra-twin/recoveryPosture"],
                owner="cyber-resilience",
                detectedAt=now,
                updatedAt=now,
                tags=["recovery-readiness", "posture", "financial-exposure"],
                metadata={
                    "recoveryPosture": recovery,
                    "financialExposure": twin["financialExposure"],
                },
            ))

        for rule in mesh["containmentRules"]:
            if rule["violationCount"] > 0:
                signals.append(BusinessSignal(
                    id=_id("sig-cyber"),
                    vertical=VERTICAL,
                    entity=rule["id"],
                    title=f"Containment Rule Violations: {rule['name']}",
                    description=f"Containment rule '{rule['name']}' for agent class '{rule['agentClass']}' "
                                f"has {rule['violationCount']} violations. "
                                f"Enforcement mode: {rule['enforcementMode']}.",
                    severity="high" if rule["tier"] == "critical" else "medium",
                    status="active",
                    businessImpact="Agent boundary violations may lead to unauthorized access or data leakage.",
                    evidenceRefs=[f"agent-mesh/containmentRules/{rule['id']}"],
                    owner="cyber-mesh-ops",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["containment-rule", "violation", rule["tier"]],
                    metadata={
                        "ruleId": rule["id"],
                        "agentClass": rule["agentClass"],
                        "violationCount": rule["violationCount"],
                        "enforcementMode": rule["enforcementMode"],
                        "tier": rule["tier"],
                    },
                ))

        return signals

    def recommend(self, signals: list[BusinessSignal], mode: ExecutionMode) -> list[ActionBrief]:
        now = _now()
        actions: list[ActionBrief] = []
        requires_approval = mode != "autonomous"

        for sig in signals:
            if "compromised-asset" in sig.tags:
                actions.append(ActionBrief(
                    id=_id("act-cyber"),
                    title=f"Isolate {sig.entity}",
                    description=f"Network-isolate compromised asset {sig.entity} to prevent lateral movement.",
                    vertical=VERTICAL,
                    status="recommended",
                    recommendedBy="cyber-resilience-pack",
                    priority="urgent",
                    estimatedImpact="Contain threat spread; reduce blast radius.",
                    requiresApproval=requires_approval,
                    approvalTier="operator",
                    linkedSignalIds=[sig.id],
                    createdAt=now,
                    updatedAt=now,
                ))
            elif "recovery-readiness" in sig.tags:
                actions.append(ActionBrief(
                    id=_id("act-cyber"),
                    title="Initiate Bare-Metal Recovery Drill",
                    description="Execute a recovery drill for critical OT assets to validate backup integrity.",
                    vertical=VERTICAL,
                    status="recommended",
                    recommendedBy="cyber-resilience-pack",
                    priority="high",
                    estimatedImpact="Validate recovery capability; improve posture score.",
                    requiresApproval=True,
                    approvalTier="executive",
                    linkedSignalIds=[sig.id],
                    createdAt=now,
                    updatedAt=now,
                ))
            elif "mesh-exposure" in sig.tags:
                actions.append(ActionBrief(
                    id=_id("act-cyber"),
                    title=f"Remediate Mesh Exposure: {sig.entity}",
                    description=f"Apply fix for mesh exposure {sig.entity}.",
                    vertical=VERTICAL,
                    status="recommended",
                    recommendedBy="cyber-resilience-pack",
                    priority="high",
                    estimatedImpact="Close agent-mesh security gap.",
                    requiresApproval=requires_approval,
                    approvalTier="operator",
                    linkedSignalIds=[sig.id],
                    createdAt=now,
                    updatedAt=now,
                ))
            elif "control-drift" in sig.tags:
                actions.append(ActionBrief(
                    id=_id("act-cyber"),
                    title=f"Remediate Control Drift: {sig.entity}",
                    description=f"Address NIST control drift for {sig.entity}.",
                    vertical=VERTICAL,
                    status="recommended",
                    recommendedBy="cyber-resilience-pack",
                    priority="high",
                    estimatedImpact="Restore compliance posture.",
                    requiresApproval=requires_approval,
                    approvalTier="operator",
                    linkedSignalIds=[sig.id],
                    createdAt=now,
                    updatedAt=now,
                ))

        return actions

    def evaluate(self, signals: list[BusinessSignal], actions: list[ActionBrief]) -> list[Outcome]:
        now = _now()
        return [
            Outcome(
                id=_id("out-cyber"),
                title="Contain Active Threats",
                description="Isolate all compromised assets and contain active incidents.",
                vertical=VERTICAL,
                status="pending",
                owner="cyber-soc",
                targetDate=now,
                successMetric="compromised_asset_count == 0",
                currentValue=float(sum(1 for s in signals if "compromised-asset" in s.tags)),
                targetValue=0.0,
                unit="count",
                linkedSignalIds=[s.id for s in signals if "compromised-asset" in s.tags or "incident" in s.tags],
                createdAt=now,
                updatedAt=now,
            ),
            Outcome(
                id=_id("out-cyber"),
                title="Restore Recovery Readiness",
                description="Bring recovery posture score above 60-point threshold.",
                vertical=VERTICAL,
                status="pending",
                owner="cyber-resilience",
                targetDate=now,
                successMetric="recovery_posture >= 60",
                currentValue=42.0,
                targetValue=60.0,
                unit="score",
                linkedSignalIds=[s.id for s in signals if "recovery-readiness" in s.tags],
                createdAt=now,
                updatedAt=now,
            ),
            Outcome(
                id=_id("out-cyber"),
                title="Close Mesh Exposures",
                description="Remediate all open agent-mesh security exposures.",
                vertical=VERTICAL,
                status="pending",
                owner="cyber-mesh-ops",
                targetDate=now,
                successMetric="open_exposure_count == 0",
                currentValue=float(sum(1 for s in signals if "mesh-exposure" in s.tags)),
                targetValue=0.0,
                unit="count",
                linkedSignalIds=[s.id for s in signals if "mesh-exposure" in s.tags],
                createdAt=now,
                updatedAt=now,
            ),
        ]

    def emit(
        self,
        signals: list[BusinessSignal],
        actions: list[ActionBrief],
        outcomes: list[Outcome],
        mode: ExecutionMode,
    ) -> PackRunReport:
        run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:8]
        return PackRunReport(
            runId=run_id,
            packSlug=self.slug,
            vertical=self.vertical,
            mode=mode,
            engineVersion=__version__,
            packVersion=self.version,
            signals=signals,
            actions=actions,
            outcomes=outcomes,
            metadata={
                "packDescription": "Cyber Resilience — TENAX/sentra surface observation pack",
                "signalCount": len(signals),
                "actionCount": len(actions),
                "outcomeCount": len(outcomes),
                "dataSource": "sentra-twin + agent-mesh seed data",
            },
        )
