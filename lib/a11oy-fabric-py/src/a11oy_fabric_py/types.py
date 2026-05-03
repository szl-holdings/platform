"""Literal type unions and constants mirroring lib/a11oy-fabric/src/types.ts.

The Python substrate's vertical taxonomy is a SUPERSET of the TS Vertical
enum. The TS enum is not modified by this task; the divergence (e.g. the
new ``tenax-cyber`` slug used by the Cyber Resilience reference pack) is
documented here and in the README.
"""

from __future__ import annotations

from typing import Literal

ENGINE_VERSION: Literal["0.1.0"] = "0.1.0"

# Path layout for emitted artifacts (relative to repo root).
SUBSTRATE_REPORTS_ROOT: str = "reports/a11oy-substrate"

# ── Vertical taxonomy ────────────────────────────────────────────────────────
# Mirrors lib/a11oy-fabric/src/types.ts ``Vertical`` and adds the Python-only
# slugs the substrate's reference packs need. Downstream JSON consumers MUST
# be tolerant of slugs they do not recognise.
PYTHON_VERTICAL_IDS: tuple[str, ...] = (
    # — Mirrored from the TS enum —
    "lyte-revenue",
    "vessels-maritime",
    "terra-real-estate",
    "aegis-defense",
    "prism-counsel",
    "carlota-jo",
    "alloy-core",
    "sentra-cyber",
    "firestorm-ops",
    "nuro-forge",
    "meridian-infra",
    "constellation-graph",
    # — Python-only superset —
    "tenax-cyber",  # cyber-resilience reference pack
    "agentops-platform",  # platform/agentops reference pack alias
)

Vertical = Literal[
    "lyte-revenue",
    "vessels-maritime",
    "terra-real-estate",
    "aegis-defense",
    "prism-counsel",
    "carlota-jo",
    "alloy-core",
    "sentra-cyber",
    "firestorm-ops",
    "nuro-forge",
    "meridian-infra",
    "constellation-graph",
    "tenax-cyber",
    "agentops-platform",
]

VerticalOrGlobal = Literal[
    "lyte-revenue",
    "vessels-maritime",
    "terra-real-estate",
    "aegis-defense",
    "prism-counsel",
    "carlota-jo",
    "alloy-core",
    "sentra-cyber",
    "firestorm-ops",
    "nuro-forge",
    "meridian-infra",
    "constellation-graph",
    "tenax-cyber",
    "agentops-platform",
    "global",
]

SignalSeverity = Literal["critical", "high", "medium", "low", "info"]
SignalStatus = Literal["active", "acknowledged", "resolved", "escalated", "suppressed"]
OutcomeStatus = Literal["pending", "in_progress", "achieved", "missed", "blocked"]
ActionStatus = Literal[
    "recommended",
    "pending_approval",
    "approved",
    "executing",
    "completed",
    "rejected",
    "failed",
]
ActionPriority = Literal["urgent", "high", "normal", "low"]
ApprovalTier = Literal["auto", "operator", "executive", "board"]
PolicyEnforcement = Literal["block", "warn", "log", "require_approval"]
WorkcellStatus = Literal["idle", "running", "paused", "error", "completed"]
ProofPacketKind = Literal[
    "signal_ingestion",
    "state_transition",
    "action_execution",
    "policy_evaluation",
    "mirror_eval",
    "human_approval",
]
EntityType = Literal["signal", "action", "outcome", "workcell", "policy"]
FabricLayerName = Literal[
    "coverage_graph",
    "signal_mesh",
    "state_engine",
    "causal_core",
    "action_rail",
    "covenant_layer",
    "proof_ledger",
]
MirrorEvalVerdict = Literal["pass", "fail", "warn", "abstain"]

# The TS ExecutionMode is {demo, governed, autonomous, supervised}. The
# substrate adds ``discovery`` so the read-only / gated-mutation two-plane
# design from the Codex Execution Plan is first-class.
ExecutionMode = Literal[
    "discovery",
    "demo",
    "governed",
    "autonomous",
    "supervised",
]
