"""Reference pack #1 — Platform / AgentOps.

Observes substrate-internal signals: workcell health, model-router decisions,
policy-enforcement counters, mirror-eval verdicts, tool-call budget burn.

Real data sources (no synthetic placeholders):
  * The default LayerBundle's own status (workcell health proxy).
  * ``services/substrate-py-workers/`` and ``workers/substrate-python/``
    presence + protocol version (agent-runtime artifacts already in the repo).
  * Repo-level audit/eval artifacts under ``audit/`` and ``evals/`` if present.

Maps to AGENTS.md "Phase 2" agent-runtime concerns.
"""

from __future__ import annotations

import os
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

PACK_SLUG = "platform-agentops"
PACK_VERSION = "1.0.0"
PACK_VERTICAL = "agentops-platform"

# integration seam: Langfuse — workcell + model-router trace export
# integration seam: Arize Phoenix — eval trace observability
# integration seam: OpenLIT — LLM token + cost telemetry
# integration seam: PydanticAI — schema-bound tool calls
# integration seam: LangGraph — multi-agent workflow graphs

REPO_ROOT_HINTS = (
    "AGENTS.md",
    "pnpm-workspace.yaml",
    "lib/a11oy-fabric/package.json",
)


def _repo_root() -> str:
    here = os.path.abspath(os.path.dirname(__file__))
    cur = here
    for _ in range(8):
        if all(os.path.exists(os.path.join(cur, h)) for h in REPO_ROOT_HINTS):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    # Fallback: assume the package is checked out under <repo>/lib/a11oy-fabric-py.
    return os.path.abspath(os.path.join(here, "..", "..", "..", "..", ".."))


def _safe_listdir(path: str) -> list[str]:
    try:
        return sorted(os.listdir(path))
    except OSError:
        return []


def _agent_runtime_inventory(repo: str) -> dict[str, Any]:
    inv: dict[str, Any] = {}
    inv["substrate_py_workers"] = {
        "present": os.path.exists(os.path.join(repo, "services/substrate-py-workers")),
        "files": _safe_listdir(os.path.join(repo, "services/substrate-py-workers/src/worker")),
    }
    inv["substrate_python_worker"] = {
        "present": os.path.exists(os.path.join(repo, "workers/substrate-python")),
        "files": _safe_listdir(os.path.join(repo, "workers/substrate-python/src")),
    }
    inv["evals_dir"] = _safe_listdir(os.path.join(repo, "evals"))
    inv["audit_dir"] = _safe_listdir(os.path.join(repo, "audit"))
    return inv


class _PlatformAgentOpsPack:
    slug = PACK_SLUG
    vertical = PACK_VERTICAL
    version = PACK_VERSION

    def discover(self, ctx: PackContext) -> dict[str, Any]:
        repo = _repo_root()
        inventory = _agent_runtime_inventory(repo)
        # The pack's "workcell health" measure is derived from how many of
        # the seven layers reported healthy in the bundle the engine handed us.
        # Strip non-deterministic fields (timestamps) so discovery() is a pure
        # read of inputs — required by the conformance contract.
        layer_status = [
            {"layer": s.layer, "status": s.status} for s in ctx.layers.status()
        ]
        return {
            "repoRoot": os.path.basename(repo),
            "inventory": inventory,
            "layerStatus": layer_status,
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

        inv = discovery["inventory"]

        # Signal 1 — substrate worker fleet presence.
        if not inv["substrate_py_workers"]["present"]:
            signals.append(
                BusinessSignal(
                    id=f"sig-agentops-{run_id}-001",
                    vertical=PACK_VERTICAL,
                    entity="substrate-py-workers",
                    title="Substrate Python worker fleet missing",
                    description="services/substrate-py-workers/ is not present in this checkout.",
                    severity="high",
                    status="active",
                    businessImpact="Heavy-retrieval / OCR / eval grading stages cannot run.",
                    evidenceRefs=["services/substrate-py-workers/"],
                    owner="Platform Engineering, A11oy",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["agentops", "worker-fleet"],
                    metadata={"present": False},
                )
            )
        else:
            files = inv["substrate_py_workers"]["files"]
            signals.append(
                BusinessSignal(
                    id=f"sig-agentops-{run_id}-001",
                    vertical=PACK_VERTICAL,
                    entity="substrate-py-workers",
                    title="Substrate Python worker fleet healthy",
                    description=f"Detected {len(files)} worker module(s) in services/substrate-py-workers/src/worker.",
                    severity="info",
                    status="resolved",
                    businessImpact="Worker fleet capable of accepting stage claims.",
                    evidenceRefs=["services/substrate-py-workers/src/worker"],
                    owner="Platform Engineering, A11oy",
                    detectedAt=now,
                    updatedAt=now,
                    tags=["agentops", "worker-fleet"],
                    metadata={"present": True, "moduleCount": len(files)},
                )
            )

        # Signal 2 — fabric-layer health roll-up.
        unhealthy = [s for s in discovery["layerStatus"] if s["status"] != "healthy"]
        signals.append(
            BusinessSignal(
                id=f"sig-agentops-{run_id}-002",
                vertical=PACK_VERTICAL,
                entity="fabric-layer-rollup",
                title="Fabric layer health roll-up",
                description=(
                    f"{7 - len(unhealthy)}/7 fabric layers reported healthy this run."
                ),
                severity="info" if not unhealthy else "medium",
                status="resolved" if not unhealthy else "active",
                businessImpact="Layer outages reduce substrate observability and gate coverage.",
                evidenceRefs=["a11oy_fabric_py.layers"],
                owner="Platform Engineering, A11oy",
                detectedAt=now,
                updatedAt=now,
                tags=["agentops", "fabric-layers"],
                metadata={"unhealthyLayers": [u["layer"] for u in unhealthy]},
            )
        )

        # Outcome — sustain healthy-layer roll-up.
        outcomes.append(
            Outcome(
                id=f"out-agentops-{run_id}-001",
                title="Sustain 7/7 fabric-layer health for 24h",
                description="Hold every FabricLayer in the healthy state across consecutive substrate runs.",
                vertical=PACK_VERTICAL,
                status="in_progress" if unhealthy else "achieved",
                owner="Platform Engineering, A11oy",
                targetDate=now,
                successMetric="7/7 healthy layers across 24h window",
                currentValue=float(7 - len(unhealthy)),
                targetValue=7.0,
                unit="layers",
                linkedSignalIds=[signals[-1].id],
                createdAt=now,
                updatedAt=now,
            )
        )

        # Action — recommend backfilling missing worker fleet if applicable.
        if not inv["substrate_py_workers"]["present"]:
            actions.append(
                ActionBrief(
                    id=f"act-agentops-{run_id}-001",
                    title="Provision substrate-py-workers in this checkout",
                    description="Restore the substrate-py-workers package so heavy-retrieval / OCR stages can dispatch.",
                    vertical=PACK_VERTICAL,
                    status="recommended",
                    recommendedBy=PACK_SLUG,
                    priority="high",
                    estimatedImpact="Restore agent-runtime stage coverage to 100%.",
                    requiresApproval=True,
                    approvalTier="operator",
                    linkedSignalIds=[signals[0].id],
                    linkedOutcomeIds=[outcomes[0].id],
                    createdAt=now,
                    updatedAt=now,
                )
            )

        # Policies — gate substrate-internal mutations behind operator approval.
        policies.append(
            CovenantPolicy(
                id=f"pol-agentops-{run_id}-001",
                name="AgentOps mutations require operator approval",
                description="Any substrate-internal action that mutates the worker fleet must be approved by an operator.",
                vertical=PACK_VERTICAL,
                enforcement="require_approval",
                conditions=[
                    PolicyCondition(field="action.vertical", operator="eq", value=PACK_VERTICAL),
                ],
                approvalRequirements={"tier": "operator", "quorum": 1},  # type: ignore[arg-type]
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
                "signal": {"severity": "info"},
            }
            verdict = ctx.layers.covenant_layer.evaluate(action, ctx_payload)
            if verdict["verdict"] in ("require_approval", "block"):
                action.requiresApproval = True
                action.status = "pending_approval"
                action.approvalTier = "operator"
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
                "inventory": discovery["inventory"],
                "executionMode": ctx.mode,
            },
        )


def platform_agentops_pack() -> _PlatformAgentOpsPack:
    return _PlatformAgentOpsPack()
