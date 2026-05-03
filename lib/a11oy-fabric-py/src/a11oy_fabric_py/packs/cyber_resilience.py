"""Reference pack #2 — Cyber Resilience (TENAX surface).

Observes the sentra/TENAX surface area:
  * Containment rules and their enforcement mode.
  * Mesh exposures (OWASP LLM-style categories).
  * Threat overview (SentraTwin assets + incidents).
  * Control drift (NIST CSF families).
  * Recovery readiness posture.

Reads sentra's existing seed data via the local mirror at
``_sentra_seed.py`` (which is kept faithful to
``artifacts/sentra/src/data/sentra-twin.ts`` and
``artifacts/sentra/src/data/agent-mesh.ts``).

This pack defines a NEW vertical slug ``tenax-cyber`` inside the Python
contract only — the TS Vertical enum is not modified by this task.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from ..models import (
    ActionBrief,
    BusinessSignal,
    CovenantPolicy,
    Outcome,
    PackRunReport,
    PolicyCondition,
)
from ..pack import PackContext
from ._sentra_seed import (
    CONTAINMENT_RULES,
    MESH_EXPOSURES,
    MESH_RESILIENCE_INDEX,
    SENTRA_TWIN,
)

PACK_SLUG = "cyber-resilience"
PACK_VERSION = "1.0.0"
PACK_VERTICAL = "tenax-cyber"

# integration seam: NetworkX — asset/agent risk graph (cross-asset blast radius)


class _CyberResiliencePack:
    slug = PACK_SLUG
    vertical = PACK_VERTICAL
    version = PACK_VERSION

    def discover(self, ctx: PackContext) -> dict[str, Any]:
        return {
            "twin": SENTRA_TWIN,
            "exposures": MESH_EXPOSURES,
            "containmentRules": CONTAINMENT_RULES,
            "resilienceIndex": MESH_RESILIENCE_INDEX,
            "executionMode": ctx.mode,
        }

    def recommend(
        self, ctx: PackContext, discovery: dict[str, Any]
    ) -> tuple[list[BusinessSignal], list[Outcome], list[ActionBrief], list[CovenantPolicy]]:
        now = datetime.now(timezone.utc).isoformat()
        run_id = ctx.run_id

        signals: list[BusinessSignal] = []
        outcomes: list[Outcome] = []
        actions: list[ActionBrief] = []
        policies: list[CovenantPolicy] = []

        twin = discovery["twin"]
        compromised = [a for a in twin["assets"] if a["status"] == "compromised"]
        critical_drift = [
            d for d in twin["controlDrifts"] if d["status"] == "drift_detected"
        ]
        active_incidents = [i for i in twin["incidents"] if i["status"] == "active"]

        # 1. Containment-rule signals.
        log_only_rules = [r for r in discovery["containmentRules"] if r["enforcementMode"] == "log-only"]
        if log_only_rules:
            signals.append(
                BusinessSignal(
                    id=f"sig-tenax-{run_id}-rule-001",
                    vertical=PACK_VERTICAL,
                    entity=log_only_rules[0]["agentClass"],
                    title=f"{len(log_only_rules)} containment rule(s) in log-only mode",
                    description=(
                        f"Elevated/critical-tier rules running in log-only do not block prohibited tool calls. "
                        f"Violation count across log-only rules: "
                        f"{sum(r['violationCount'] for r in log_only_rules)}."
                    ),
                    severity="high",
                    status="active",
                    businessImpact="Containment failures expose tenants to lateral movement.",
                    evidenceRefs=["artifacts/sentra/src/data/agent-mesh.ts#containmentRules"],
                    owner="Security Architect, A11oy",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["tenax", "containment", "log-only"],
                    metadata={
                        "rules": [r["id"] for r in log_only_rules],
                    },
                )
            )

        # 2. Mesh-exposure signals.
        for exp in discovery["exposures"]:
            if exp["status"] != "open":
                continue
            signals.append(
                BusinessSignal(
                    id=f"sig-tenax-{run_id}-exp-{exp['id']}",
                    vertical=PACK_VERTICAL,
                    entity=exp["id"],
                    title=exp["title"],
                    description=f"OWASP {exp['owaspRef']} ({exp['owaspCategory']}) — exposure currently open.",
                    severity=exp["severity"],
                    status="active",
                    businessImpact="Open mesh exposures are exploitable supply-chain attack surface.",
                    evidenceRefs=["artifacts/sentra/src/data/agent-mesh.ts#exposures"],
                    owner="Security Architect, A11oy",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["tenax", "mesh-exposure", exp["owaspRef"].lower()],
                    metadata={"owaspRef": exp["owaspRef"], "owaspCategory": exp["owaspCategory"]},
                )
            )

        # 3. Threat-overview signals (active incidents).
        for inc in active_incidents:
            signals.append(
                BusinessSignal(
                    id=f"sig-tenax-{run_id}-inc-{inc['id']}",
                    vertical=PACK_VERTICAL,
                    entity=inc["id"],
                    title=inc["title"],
                    description=inc["description"],
                    severity=inc["severity"],
                    status="active",
                    businessImpact=(
                        f"MITRE stage {inc['mitreStage']} — affected assets: "
                        f"{', '.join(inc['affectedAssets'])}."
                    ),
                    evidenceRefs=["artifacts/sentra/src/data/sentra-twin.ts#incidents"],
                    owner="Security Architect, A11oy",
                    detectedAt=inc["detectedAt"],
                    updatedAt=now,
                    tags=["tenax", "incident", "ot" if inc["affectedAssets"] else "it"],
                    metadata={
                        "mitreStage": inc["mitreStage"],
                        "affectedAssets": inc["affectedAssets"],
                    },
                )
            )

        # 4. Control-drift signals (NIST CSF families).
        for drift in critical_drift:
            signals.append(
                BusinessSignal(
                    id=f"sig-tenax-{run_id}-drift-{drift['family'].lower()}",
                    vertical=PACK_VERTICAL,
                    entity=f"NIST-CSF/{drift['family']}",
                    title=f"Control drift — {drift['family']} / {drift['control']}",
                    description=drift["evidence"],
                    severity="medium",
                    status="active",
                    businessImpact="Control drift weakens incident response and recovery posture.",
                    evidenceRefs=["artifacts/sentra/src/data/sentra-twin.ts#controlDrifts"],
                    owner="Security Architect, A11oy",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["tenax", "control-drift", drift["family"].lower()],
                    metadata={"family": drift["family"], "control": drift["control"]},
                )
            )

        # 5. Recovery-readiness signal.
        recovery = twin["recoveryPosture"]
        signals.append(
            BusinessSignal(
                id=f"sig-tenax-{run_id}-recovery-001",
                vertical=PACK_VERTICAL,
                entity="recovery-posture",
                title=f"Recovery posture at {recovery}/100",
                description=(
                    f"Sentra-twin reports recovery posture {recovery}/100 with "
                    f"${twin['financialExposure']:,} financial exposure."
                ),
                severity="critical" if recovery < 50 else "medium",
                status="active",
                businessImpact="Sub-50 recovery posture jeopardises RTO/RPO commitments.",
                evidenceRefs=["artifacts/sentra/src/data/sentra-twin.ts#recoveryPosture"],
                owner="Security Architect, A11oy",
                detectedAt=now,
                updatedAt=now,
                tags=["tenax", "recovery", "posture"],
                metadata={
                    "recoveryPosture": recovery,
                    "financialExposureUSD": twin["financialExposure"],
                },
            )
        )

        # Outcome — restore recovery posture above 80.
        outcomes.append(
            Outcome(
                id=f"out-tenax-{run_id}-001",
                title="Restore recovery posture above 80/100",
                description="Bring sentra-twin recovery posture into the safe band within the next maintenance window.",
                vertical=PACK_VERTICAL,
                status="in_progress",
                owner="Security Architect, A11oy",
                targetDate=now,
                successMetric="recoveryPosture >= 80",
                currentValue=float(recovery),
                targetValue=80.0,
                unit="score",
                linkedSignalIds=[signals[-1].id],
                createdAt=now,
                updatedAt=now,
            )
        )

        # Actions — isolate compromised OT assets, escalate log-only containment rules.
        if compromised:
            actions.append(
                ActionBrief(
                    id=f"act-tenax-{run_id}-001",
                    title="Isolate compromised OT assets",
                    description=(
                        f"Quarantine compromised assets: "
                        f"{', '.join(a['id'] for a in compromised)}."
                    ),
                    vertical=PACK_VERTICAL,
                    status="recommended",
                    recommendedBy=PACK_SLUG,
                    priority="urgent",
                    estimatedImpact="Stop lateral movement; preserve recovery options.",
                    requiresApproval=True,
                    approvalTier="executive",
                    linkedSignalIds=[s.id for s in signals if "incident" in s.tags],
                    linkedOutcomeIds=[outcomes[0].id],
                    createdAt=now,
                    updatedAt=now,
                )
            )

        if log_only_rules:
            actions.append(
                ActionBrief(
                    id=f"act-tenax-{run_id}-002",
                    title="Escalate log-only containment rules to block",
                    description=(
                        "Promote containment rules currently in log-only mode to blocking enforcement "
                        f"(rules: {', '.join(r['id'] for r in log_only_rules)})."
                    ),
                    vertical=PACK_VERTICAL,
                    status="recommended",
                    recommendedBy=PACK_SLUG,
                    priority="high",
                    estimatedImpact="Close the containment loop on elevated-tier mesh edges.",
                    requiresApproval=True,
                    approvalTier="operator",
                    linkedSignalIds=[s.id for s in signals if "containment" in s.tags],
                    linkedOutcomeIds=[outcomes[0].id],
                    createdAt=now,
                    updatedAt=now,
                )
            )

        # Policies — TENAX containment changes require executive approval; OT
        # quarantine actions are blocked without a proof packet.
        policies.append(
            CovenantPolicy(
                id=f"pol-tenax-{run_id}-001",
                name="Containment-mode escalations require executive approval",
                description="Any change to a containment rule's enforcement mode is gated by executive approval.",
                vertical=PACK_VERTICAL,
                enforcement="require_approval",
                conditions=[
                    PolicyCondition(field="action.vertical", operator="eq", value=PACK_VERTICAL),
                    PolicyCondition(field="action.priority", operator="in", value=["high", "urgent"]),
                ],
                approvalRequirements={"tier": "executive", "quorum": 1},  # type: ignore[arg-type]
                active=True,
                version=1,
                createdAt=now,
                updatedAt=now,
            )
        )

        policies.append(
            CovenantPolicy(
                id=f"pol-tenax-{run_id}-002",
                name="Block OT quarantine without proof",
                description="Quarantining OT assets requires an attached ProofPacket.",
                vertical=PACK_VERTICAL,
                enforcement="block",
                conditions=[
                    PolicyCondition(field="action.vertical", operator="eq", value=PACK_VERTICAL),
                    PolicyCondition(field="action.priority", operator="eq", value="urgent"),
                    PolicyCondition(field="action.proofPacketId", operator="eq", value=None),
                ],
                active=True,
                version=1,
                createdAt=now,
                updatedAt=now,
            )
        )

        return signals, outcomes, actions, policies

    def evaluate(
        self,
        ctx: PackContext,
        actions: list[ActionBrief],
        policies: list[CovenantPolicy],
    ) -> list[ActionBrief]:
        for pol in policies:
            ctx.layers.covenant_layer.register(pol)
        for action in actions:
            ctx_payload = {
                "action": action.model_dump(),
                "signal": {"severity": "high"},
            }
            verdict = ctx.layers.covenant_layer.evaluate(action, ctx_payload)
            v = verdict["verdict"]
            if v == "block":
                action.status = "rejected"
                action.requiresApproval = True
                action.approvalTier = "executive"
            elif v == "require_approval":
                action.status = "pending_approval"
                action.requiresApproval = True
                if action.approvalTier == "auto":
                    action.approvalTier = "executive"
        return actions

    def emit(
        self,
        ctx: PackContext,
        *,
        signals: list[BusinessSignal],
        outcomes: list[Outcome],
        actions: list[ActionBrief],
        policies: list[CovenantPolicy],
        twins: list,
        discovery: dict[str, Any],
    ) -> PackRunReport:
        return PackRunReport(
            engineVersion="0.1.0",
            packSlug=self.slug,
            packVersion=self.version,
            vertical=self.vertical,
            runId=ctx.run_id,
            mode=ctx.mode,
            startedAt=ctx.started_at,
            completedAt=datetime.now(timezone.utc).isoformat(),
            inputFingerprint="sha256:placeholder",
            signals=signals,
            outcomes=outcomes,
            actions=actions,
            policies=policies,
            twins=twins,
            metadata={
                "resilienceIndex": discovery["resilienceIndex"],
                "executionMode": ctx.mode,
            },
        )


def cyber_resilience_pack() -> _CyberResiliencePack:
    return _CyberResiliencePack()
