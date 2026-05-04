# A11oy Fabric — Python Substrate Engine

Python substrate that runs **alongside** the existing TypeScript fabric at `lib/a11oy-fabric/`. It provides the engine, contract, and reference packs that every future vertical intelligence pack reuses.

## Architecture

### Two-Plane Execution Model

The substrate operates in two distinct modes:

- **Discovery plane** (`--mode discovery`): Read-only. `discover()` scans data sources and emits BusinessSignals. No mutations, no side effects. Safe to run on any schedule.
- **Governed plane** (`--mode governed`): Full pipeline. After discovery, `recommend()` produces ActionBriefs with `requiresApproval` defaults derived from CovenantPolicy. Actions flow through the covenant layer before execution.

### Seven FabricLayer Interfaces

Each layer is a Python `typing.Protocol` with a default in-memory implementation:

| Layer | Purpose |
|-------|---------|
| `coverage_graph` | Track BusinessTwins and coverage scores per vertical |
| `signal_mesh` | Ingest and query BusinessSignals |
| `state_engine` | Manage Outcomes and state transitions |
| `causal_core` | Link signals to outcomes (causal graph) |
| `action_rail` | Propose, approve, reject ActionBriefs |
| `covenant_layer` | Register and evaluate CovenantPolicies |
| `proof_ledger` | Record and verify ProofPacket chains |

### Pydantic v2 Primitives

All models mirror the TypeScript interfaces in `lib/a11oy-fabric/src/schema.ts` with identical field names (camelCase):

`BusinessSignal`, `Outcome`, `ActionBrief`, `CovenantPolicy`, `ProofPacket`, `Workcell`, `ExecutionTrace`, `BusinessTwin`, `MirrorEvalResult`, `PackRunReport`, `PCPRProof`

### Vertical Taxonomy

The Python substrate defines a superset of the TS `Vertical` enum. In addition to the 12 TS verticals, it adds:

- `tenax-cyber` — Cyber resilience (TENAX/sentra surface)
- `pulse-health` — Health/wellness vertical
- `fincept-finance` — Finance/FinTech vertical
- `growth-marketing` — Marketing/growth vertical

The TS `Vertical` enum is **not modified** by this package. The divergence is documented here and in the model definitions.

## CLI

```bash
python -m a11oy_fabric_py --help
python -m a11oy_fabric_py list-packs
python -m a11oy_fabric_py run --pack platform-agentops --mode discovery --out reports/a11oy-substrate/
python -m a11oy_fabric_py run --pack cyber-resilience --mode governed --out reports/a11oy-substrate/
python -m a11oy_fabric_py verify reports/a11oy-substrate/platform-agentops/
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Schema validation failure |
| 2 | PCPR proof drift detected |
| 3 | Unknown pack slug |

## JSON Artifact Convention

All pack outputs land as deterministic JSON artifacts:

```
reports/a11oy-substrate/
  _schema/                          # JSON Schema for every entity
    BusinessSignal.schema.json
    PackRunReport.schema.json
    PCPRProof.schema.json
    ...
  platform-agentops/
    20260504T012224Z-a9aa0b7e.json        # Pack run report
    20260504T012224Z-a9aa0b7e.proof.json  # PCPR proof companion
  cyber-resilience/
    20260504T012227Z-51d5da77.json
    20260504T012227Z-51d5da77.proof.json
```

### PCPR Format (Proof-Carrying Pack Run)

Every `run` emits both a report and a `.proof.json` companion. The proof hash-chains:

- Input fingerprint (pack slug + mode)
- Engine version
- Pack version
- Every emitted entity ID
- Report content hash (sha256)
- Previous chain hash (for sequential runs)

`verify` re-hashes and reports any tampering or drift.

## Reference Packs

### Platform / AgentOps (`platform-agentops`, vertical=`alloy-core`)

Observes substrate-internal signals:
- Workcell health degradation
- Model-router latency spikes
- Policy-enforcement counter anomalies
- Mirror-eval verdict drift
- Tool-call budget burn rates

### Cyber Resilience (`cyber-resilience`, vertical=`tenax-cyber`)

Reads sentra seed data and produces signals covering:
- Compromised OT/IT assets
- Active incidents (MITRE-mapped)
- NIST control drift
- Agent-mesh exposures (OWASP-mapped)
- Recovery readiness posture
- Containment rule violations

## How to Add a New Vertical Pack

Follow this recipe to plug in one of the seven planned follow-up verticals:

### Planned Verticals

1. **Pulse** — Health/wellness monitoring
2. **Finance/Fincept** — Financial intelligence
3. **Lyte/KORA** — Revenue operations
4. **Terra** — Real estate intelligence
5. **Vessels** — Maritime intelligence
6. **PRISM Counsel** — Legal matter command
7. **Marketing/Growth** — Growth analytics

### Step-by-Step

1. Create a new directory under `src/a11oy_fabric_py/packs/<your-pack>/`
2. Create `pack.py` implementing the `VerticalPack` protocol:

```python
class MyPack:
    @property
    def slug(self) -> str:
        return "my-pack"

    @property
    def vertical(self) -> str:
        return "my-vertical"

    @property
    def version(self) -> str:
        return "0.1.0"

    def discover(self) -> list[BusinessSignal]:
        # Read-only discovery — return signals
        ...

    def recommend(self, signals, mode) -> list[ActionBrief]:
        # Gated mutation — return actions with approval defaults
        ...

    def evaluate(self, signals, actions) -> list[Outcome]:
        # Evaluate outcomes
        ...

    def emit(self, signals, actions, outcomes, mode) -> PackRunReport:
        # Assemble the final report
        ...
```

3. Register your pack in `packs/__init__.py`:

```python
from .my_pack.pack import MyPack
register_pack(MyPack())
```

4. Run the contract-conformance test to verify your pack:

```bash
pytest lib/a11oy-fabric-py/tests/test_pcpr.py::TestContractConformance -v
```

5. Run your pack end-to-end:

```bash
python -m a11oy_fabric_py run --pack my-pack --mode discovery --out reports/a11oy-substrate/
python -m a11oy_fabric_py verify reports/a11oy-substrate/my-pack/
```

## Development

```bash
# Install in dev mode
pip install -e lib/a11oy-fabric-py

# Run tests
pytest lib/a11oy-fabric-py/tests/ -v

# Emit JSON schemas
python -m a11oy_fabric_py run --pack platform-agentops --out reports/a11oy-substrate/
```

### Dependencies

- Python 3.11+
- pydantic >= 2.7.0
- structlog >= 24.1.0
- opentelemetry-api >= 1.24.0
- pytest, pytest-asyncio (dev)
