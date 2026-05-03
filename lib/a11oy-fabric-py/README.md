# A11oy Python Substrate Engine (`a11oy-fabric-py`)

The Python substrate runs **alongside** the TypeScript fabric at
`lib/a11oy-fabric/`. It is the engine + contract every future vertical pack
reuses. The TS fabric is unchanged; this package emits deterministic JSON
artifacts under `reports/a11oy-substrate/<pack-slug>/<run-id>.json` plus a
`.proof.json` companion (Proof-Carrying Pack Run — PCPR).

## Why a Python substrate?

- A second runtime gives the fabric a clean integration surface for the
  Python ML / observability ecosystem (Langfuse, Arize Phoenix, OpenLIT,
  PydanticAI, LangGraph, NetworkX, FinGPT, Darts, …) without forcing those
  dependencies into the TS workspace.
- The artifact is the contract: every pack emits the same `PackRunReport`
  shape and the TS fabric (or any external tool) consumes it as JSON.
- The two-plane execution model (`discovery` vs. `governed`) is enforced by
  the engine, so packs cannot accidentally mutate the world during
  read-only inspection.

## The two-plane model

| Plane | `--mode` | What it does |
|-------|----------|--------------|
| Discovery | `discovery` | Read-only. The engine forces every emitted action to `status="recommended"` and `requiresApproval=True`. No external mutation may occur. |
| Governed | `governed` | The engine runs the covenant gate against every action. Actions that pass become eligible to execute *outside* this engine; the engine itself never executes them. |

`autonomous` and `supervised` modes from the TS `ExecutionMode` are accepted
by the contract but are **not** implemented inside this engine — they are
a future task that will live behind a hard policy gate.

## Contract

Pydantic v2 models in `src/a11oy_fabric_py/models.py` mirror every
`lib/a11oy-fabric/src/schema.ts` interface. The JSON Schema for every
primitive is published into `reports/a11oy-substrate/_schema/` so the TS
fabric and external consumers can typecheck the artifacts.

The seven `FabricLayer` interfaces from the TS fabric become Python
`typing.Protocol`s in `src/a11oy_fabric_py/layers.py`, each with a
functional in-memory default implementation:

| Layer | Protocol | Default impl |
|-------|----------|--------------|
| coverage_graph | `CoverageGraph` | `InMemoryCoverageGraph` |
| signal_mesh | `SignalMesh` | `InMemorySignalMesh` |
| state_engine | `StateEngine` | `InMemoryStateEngine` |
| causal_core | `CausalCore` | `InMemoryCausalCore` |
| action_rail | `ActionRail` | `InMemoryActionRail` |
| covenant_layer | `CovenantLayer` | `InMemoryCovenantLayer` |
| proof_ledger | `ProofLedger` | `InMemoryProofLedger` |

## VerticalPack contract

```python
class VerticalPack(Protocol):
    slug: str
    vertical: Vertical
    version: str

    def discover(self, ctx: PackContext) -> dict[str, Any]: ...
    def recommend(self, ctx, discovery) -> tuple[
        list[BusinessSignal], list[Outcome], list[ActionBrief], list[CovenantPolicy]
    ]: ...
    def evaluate(self, ctx, actions, policies) -> list[ActionBrief]: ...
    def emit(self, ctx, *, signals, outcomes, actions, policies, twins, discovery) -> PackRunReport: ...
```

`discover()` MUST be side-effect-free — the conformance test fingerprints
its output twice and fails the pack if the fingerprint differs.

## Reference packs

| Slug | Vertical | What it observes |
|------|----------|------------------|
| `platform-agentops` | `agentops-platform` | Workcell health, fabric-layer roll-up, model-router decisions, policy-enforcement counters, mirror-eval verdicts, tool-call budget burn |
| `cyber-resilience`  | `tenax-cyber` (Python-only superset slug) | Containment rules, mesh exposures, threat overview, control drift, recovery readiness — reads `artifacts/sentra/src/data/{sentra-twin,agent-mesh}.ts` |

## CLI

```bash
python -m a11oy_fabric_py --help
python -m a11oy_fabric_py list-packs
python -m a11oy_fabric_py run --pack platform-agentops --mode discovery --out reports/a11oy-substrate/
python -m a11oy_fabric_py run --pack cyber-resilience  --mode governed  --out reports/a11oy-substrate/
python -m a11oy_fabric_py verify reports/a11oy-substrate/
```

Exit codes are deterministic so a future scheduled job can gate on them:

| Code | Meaning |
|------|---------|
| 0 | OK |
| 1 | Schema validation failed |
| 2 | Proof drift / chain mismatch |
| 3 | Missing or unknown pack |

## JSON-artifact convention

```
reports/a11oy-substrate/
├── _schema/
│   ├── BusinessSignal.schema.json
│   ├── ActionBrief.schema.json
│   ├── CovenantPolicy.schema.json
│   ├── ProofPacket.schema.json
│   ├── PackRunReport.schema.json
│   └── … one schema per primitive
├── platform-agentops/
│   ├── platform-agentops-20260503T010203Z-abcd1234.json
│   └── platform-agentops-20260503T010203Z-abcd1234.proof.json
└── cyber-resilience/
    ├── cyber-resilience-20260503T010203Z-deadbeef.json
    └── cyber-resilience-20260503T010203Z-deadbeef.proof.json
```

## Proof-Carrying Pack Run (PCPR)

Every `run` emits a `.proof.json` companion that hash-chains (sha256) the
input fingerprint, the engine version, the pack version, and every emitted
entity ID. `verify` re-hashes and reports drift.

A chain has three record kinds:

1. `run.preamble` — engine + pack identity + input fingerprint.
2. `run.entity` — one record per emitted `(kind, id)` pair, sorted
   deterministically by `(kind, id)`.
3. `run.epilogue` — optional summary payload (signal/action/policy counts).

The chain head hash is published as `headHash`. `verify_proof_chain`
re-derives every record's hash from the canonical JSON encoding of
`{prev, payload, label}`.

## Adding a new vertical pack

The seven follow-up verticals (Pulse, Finance/Fincept, Lyte/KORA, Terra,
Vessels, PRISM Counsel, Marketing/Growth) plug in without engine changes.

1. Create a new module in `src/a11oy_fabric_py/packs/<slug>.py`.
2. Implement the `VerticalPack` protocol — `slug`, `vertical`, `version`,
   and the four lifecycle methods (`discover`, `recommend`, `evaluate`,
   `emit`). Keep `discover()` side-effect-free.
3. Register it either:
   - Programmatically: `get_registry().register(my_pack())`, or
   - Via entry-points: add
     `[project.entry-points."a11oy_fabric_py.packs"]` to your package's
     `pyproject.toml` so the engine discovers it at startup.
4. Drop integration-seam comments at the natural call sites (Langfuse,
   Phoenix, OpenLIT, PydanticAI, LangGraph, NetworkX, FinGPT, FinRobot,
   OpenBB, Darts, StatsForecast, HyperFrames, Camoufox). **Do not install
   them** — they are research-radar only for v0.1.
5. Add the pack to the conformance fixture parametrization in
   `tests/test_conformance.py`. The fixture covers schema round-trip,
   discovery determinism, the discovery-plane gate, and PCPR verification.

## Tests

```bash
pytest lib/a11oy-fabric-py
```

The suite covers:

- Pydantic schema round-trip for every primitive (`tests/test_models.py`).
- Both reference packs running end-to-end and producing schema-valid
  output (`tests/test_packs.py`).
- PCPR hash-chain build / verify / tamper detection (`tests/test_proof.py`).
- Contract-conformance fixture (`tests/test_conformance.py`).

## Divergence from the TS fabric

- The TS `Vertical` enum is not modified by this task. The Python substrate
  defines a **superset** vertical taxonomy in `src/a11oy_fabric_py/types.py`
  (`PYTHON_VERTICAL_IDS`) — currently adding `tenax-cyber` (cyber-resilience
  reference pack) and `agentops-platform` (platform/agentops reference
  pack). Downstream JSON consumers MUST be tolerant of slugs they do not
  recognise.
- `ExecutionMode` is extended with `discovery` so the read-only plane is
  first-class. The TS modes (`demo`, `governed`, `autonomous`,
  `supervised`) are preserved.

## Out of scope (v0.1)

- Wiring the substrate into deployment, scheduled jobs, or CI workflows.
- The remaining seven vertical packs.
- Hard-installing Langfuse / Arize Phoenix / OpenLIT / FinGPT / FinRobot /
  OpenBB / Darts / StatsForecast / HyperFrames / Camoufox / PydanticAI /
  LangGraph / NetworkX (research-radar only — search for
  `# integration seam:` to find the natural plug-in points).
- Any UI change to the `artifacts/a11oy` web artifact.
- Replacing the existing TS fabric primitives.
