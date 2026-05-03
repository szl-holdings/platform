"""A11oy Python Substrate Engine.

Runs alongside the TypeScript fabric at lib/a11oy-fabric/. Defines the
pydantic contract every vertical pack implements and emits deterministic
JSON + Proof-Carrying Pack Run (PCPR) artifacts under
reports/a11oy-substrate/<pack-slug>/<run-id>.{json,proof.json}.
"""

from __future__ import annotations

from .models import (
    ActionBrief,
    BusinessSignal,
    BusinessTwin,
    CovenantPolicy,
    ExecutionTrace,
    MirrorEvalResult,
    Outcome,
    PackRunReport,
    ProofPacket,
    Workcell,
)
from .pack import VerticalPack, PackContext, PackRegistry, get_registry
from .layers import (
    ActionRail,
    CausalCore,
    CovenantLayer,
    CoverageGraph,
    InMemoryActionRail,
    InMemoryCausalCore,
    InMemoryCovenantLayer,
    InMemoryCoverageGraph,
    InMemoryProofLedger,
    InMemorySignalMesh,
    InMemoryStateEngine,
    ProofLedger,
    SignalMesh,
    StateEngine,
    default_layer_bundle,
)
from .proof import (
    ProofChain,
    ProofRecord,
    build_proof_chain,
    verify_proof_chain,
)
from .types import (
    ENGINE_VERSION,
    PYTHON_VERTICAL_IDS,
    SUBSTRATE_REPORTS_ROOT,
)

__all__ = [
    "ENGINE_VERSION",
    "PYTHON_VERTICAL_IDS",
    "SUBSTRATE_REPORTS_ROOT",
    "ActionBrief",
    "ActionRail",
    "BusinessSignal",
    "BusinessTwin",
    "CausalCore",
    "CovenantLayer",
    "CovenantPolicy",
    "CoverageGraph",
    "ExecutionTrace",
    "InMemoryActionRail",
    "InMemoryCausalCore",
    "InMemoryCovenantLayer",
    "InMemoryCoverageGraph",
    "InMemoryProofLedger",
    "InMemorySignalMesh",
    "InMemoryStateEngine",
    "MirrorEvalResult",
    "Outcome",
    "PackContext",
    "PackRegistry",
    "PackRunReport",
    "ProofChain",
    "ProofLedger",
    "ProofPacket",
    "ProofRecord",
    "SignalMesh",
    "StateEngine",
    "VerticalPack",
    "Workcell",
    "build_proof_chain",
    "default_layer_bundle",
    "get_registry",
    "verify_proof_chain",
]
