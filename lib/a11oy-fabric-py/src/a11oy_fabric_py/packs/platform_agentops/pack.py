"""
Platform / AgentOps reference pack (vertical = alloy-core).

Observes substrate-internal signals: workcell health, model-router
decisions, policy-enforcement counters, mirror-eval verdicts,
tool-call budget burn.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from ...models import (
    BusinessSignal, Outcome, ActionBrief, CovenantPolicy,
    ProofPacket, BusinessTwin, Workcell, ExecutionTrace,
    PackRunReport, ExecutionMode,
)
from ... import __version__

PACK_VERSION = "0.1.0"
VERTICAL = "alloy-core"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


class PlatformAgentOpsPack:
    @property
    def slug(self) -> str:
        return "platform-agentops"

    @property
    def vertical(self) -> str:
        return VERTICAL

    @property
    def version(self) -> str:
        return PACK_VERSION

    def discover(self) -> list[BusinessSignal]:
        # integration seam: Langfuse
        # integration seam: Arize Phoenix
        # integration seam: OpenLIT
        now = _now()
        return [
            BusinessSignal(
                id=_id("sig-plat"),
                vertical=VERTICAL,
                entity="substrate-engine",
                title="Workcell Health Degradation",
                description="3 of 12 workcells report error status in the last 24h cycle. "
                            "Failure rate exceeds 25% SLO threshold.",
                severity="high",
                status="active",
                businessImpact="Degraded autonomous execution capacity; manual fallback required for affected verticals.",
                evidenceRefs=["workcell-metrics/24h-summary"],
                owner="platform-sre",
                detectedAt=now,
                updatedAt=now,
                tags=["workcell", "health", "slo-breach"],
                metadata={"failedCount": 3, "totalCount": 12, "sloThreshold": 0.25},
            ),
            BusinessSignal(
                id=_id("sig-plat"),
                vertical=VERTICAL,
                entity="model-router",
                title="Model Router Latency Spike",
                description="P95 model-router latency exceeded 2000ms for the last 30 minutes. "
                            "Likely cause: cold-start on fallback model pool.",
                severity="medium",
                status="active",
                businessImpact="Increased end-to-end workcell execution time; potential timeout cascades.",
                evidenceRefs=["model-router/latency-histogram"],
                owner="platform-ml",
                detectedAt=now,
                updatedAt=now,
                tags=["model-router", "latency", "performance"],
                metadata={"p95Ms": 2150, "baselineP95Ms": 450, "windowMinutes": 30},
            ),
            BusinessSignal(
                id=_id("sig-plat"),
                vertical=VERTICAL,
                entity="covenant-engine",
                title="Policy Enforcement Counter Anomaly",
                description="Block-enforcement triggers increased 4x over baseline in the last 6 hours. "
                            "May indicate a misconfigured policy or an adversarial probe.",
                severity="high",
                status="active",
                businessImpact="Legitimate actions may be falsely blocked; review policy rule set.",
                evidenceRefs=["covenant/enforcement-counters"],
                owner="platform-governance",
                detectedAt=now,
                updatedAt=now,
                tags=["covenant", "policy", "enforcement", "anomaly"],
                metadata={"blockCount": 47, "baselineBlockCount": 12, "windowHours": 6},
            ),
            BusinessSignal(
                id=_id("sig-plat"),
                vertical=VERTICAL,
                entity="mirror-eval",
                title="Mirror Eval Verdict Drift",
                description="Mirror eval 'fail' verdicts rose from 5% to 18% of total evaluations. "
                            "Evaluator model may need recalibration.",
                severity="medium",
                status="active",
                businessImpact="Reduced confidence in autonomous action execution; increased human-review queue.",
                evidenceRefs=["mirror-eval/verdict-distribution"],
                owner="platform-ml",
                detectedAt=now,
                updatedAt=now,
                tags=["mirror-eval", "drift", "quality"],
                metadata={"failRate": 0.18, "baselineFailRate": 0.05, "evalCount": 200},
            ),
            BusinessSignal(
                id=_id("sig-plat"),
                vertical=VERTICAL,
                entity="tool-budget",
                title="Tool-Call Budget Burn Rate Warning",
                description="3 workcells consumed >80% of their tool-call budget in the first "
                            "quarter of their execution window. Runaway loop risk.",
                severity="high",
                status="active",
                businessImpact="Potential cost overrun and execution stall if budgets exhaust early.",
                evidenceRefs=["workcell/budget-burn-report"],
                owner="platform-cost",
                detectedAt=now,
                updatedAt=now,
                tags=["tool-budget", "cost", "runaway"],
                metadata={"affectedWorkcells": 3, "burnThreshold": 0.8, "windowQuartile": 1},
            ),
        ]

    def recommend(self, signals: list[BusinessSignal], mode: ExecutionMode) -> list[ActionBrief]:
        # integration seam: PydanticAI
        # integration seam: LangGraph
        now = _now()
        actions: list[ActionBrief] = []
        for sig in signals:
            requires_approval = mode != "autonomous"
            if "workcell" in sig.tags:
                actions.append(ActionBrief(
                    id=_id("act-plat"),
                    title="Restart Failed Workcells",
                    description=f"Auto-restart workcells flagged by signal {sig.id}. "
                                "Apply exponential backoff and notify on-call SRE.",
                    vertical=VERTICAL,
                    status="recommended",
                    recommendedBy="platform-agentops-pack",
                    priority="high",
                    estimatedImpact="Restore workcell fleet to full capacity within 15 minutes.",
                    requiresApproval=requires_approval,
                    approvalTier="operator",
                    linkedSignalIds=[sig.id],
                    createdAt=now,
                    updatedAt=now,
                ))
            elif "covenant" in sig.tags:
                actions.append(ActionBrief(
                    id=_id("act-plat"),
                    title="Audit Covenant Policy Rules",
                    description=f"Review all active block-enforcement rules triggered by signal {sig.id}. "
                                "Flag any rules added in the last 48h for human review.",
                    vertical=VERTICAL,
                    status="recommended",
                    recommendedBy="platform-agentops-pack",
                    priority="urgent",
                    estimatedImpact="Prevent false-positive blocks on legitimate actions.",
                    requiresApproval=True,
                    approvalTier="executive",
                    linkedSignalIds=[sig.id],
                    createdAt=now,
                    updatedAt=now,
                ))
            elif "tool-budget" in sig.tags:
                actions.append(ActionBrief(
                    id=_id("act-plat"),
                    title="Throttle Runaway Workcells",
                    description=f"Apply tool-call rate limiter to workcells identified by signal {sig.id}.",
                    vertical=VERTICAL,
                    status="recommended",
                    recommendedBy="platform-agentops-pack",
                    priority="high",
                    estimatedImpact="Prevent budget exhaustion and cost overrun.",
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
                id=_id("out-plat"),
                title="Restore Workcell Fleet Health",
                description="Bring workcell error rate below 25% SLO threshold.",
                vertical=VERTICAL,
                status="pending",
                owner="platform-sre",
                targetDate=now,
                successMetric="workcell_error_rate < 0.25",
                currentValue=0.25,
                targetValue=0.10,
                unit="ratio",
                linkedSignalIds=[s.id for s in signals if "workcell" in s.tags],
                createdAt=now,
                updatedAt=now,
            ),
            Outcome(
                id=_id("out-plat"),
                title="Stabilize Mirror Eval Quality",
                description="Reduce mirror-eval fail rate to baseline levels.",
                vertical=VERTICAL,
                status="pending",
                owner="platform-ml",
                targetDate=now,
                successMetric="mirror_eval_fail_rate < 0.08",
                currentValue=0.18,
                targetValue=0.05,
                unit="ratio",
                linkedSignalIds=[s.id for s in signals if "mirror-eval" in s.tags],
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
                "packDescription": "Platform / AgentOps — substrate self-observation pack",
                "signalCount": len(signals),
                "actionCount": len(actions),
                "outcomeCount": len(outcomes),
            },
        )
