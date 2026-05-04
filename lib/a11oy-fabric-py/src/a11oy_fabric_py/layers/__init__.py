"""FabricLayer protocol interfaces and default in-memory implementations."""

from .protocols import (
    CoverageGraphLayer,
    SignalMeshLayer,
    StateEngineLayer,
    CausalCoreLayer,
    ActionRailLayer,
    CovenantLayerProtocol,
    ProofLedgerLayer,
)
from .defaults import (
    InMemoryCoverageGraph,
    InMemorySignalMesh,
    InMemoryStateEngine,
    InMemoryCausalCore,
    InMemoryActionRail,
    InMemoryCovenantLayer,
    InMemoryProofLedger,
    build_default_layers,
)

__all__ = [
    "CoverageGraphLayer", "SignalMeshLayer", "StateEngineLayer",
    "CausalCoreLayer", "ActionRailLayer", "CovenantLayerProtocol",
    "ProofLedgerLayer",
    "InMemoryCoverageGraph", "InMemorySignalMesh", "InMemoryStateEngine",
    "InMemoryCausalCore", "InMemoryActionRail", "InMemoryCovenantLayer",
    "InMemoryProofLedger", "build_default_layers",
]
