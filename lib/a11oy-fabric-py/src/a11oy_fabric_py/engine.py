"""Substrate engine — orchestrates pack runs through the seven-layer system.

Implements the two-plane execution model:
  - discovery mode: signals flow through SignalMesh; covenant gate blocks
    all actions (read-only observation).
  - governed mode: full pipeline — recommend, covenant-evaluate, execute.

All pack execution is routed through the layer bundle so that
CoverageGraph, SignalMesh, CovenantLayer, and ProofLedger participate
in every run.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from . import __version__
from .layers.defaults import build_default_layers
from .models import (
    CovenantPolicy,
    ExecutionMode,
    PackRunReport,
    SCHEMA_EXPORTS,
)
from .pack import get_pack, list_packs, VerticalPack
from .pcpr import create_proof, compute_input_fingerprint


def _run_id() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:8]


def run_pack(
    pack_slug: str,
    mode: ExecutionMode = "discovery",
    out_dir: str | None = None,
) -> tuple[PackRunReport, Path | None, Path | None]:
    pack = get_pack(pack_slug)
    if pack is None:
        available = list_packs()
        raise ValueError(
            f"Unknown pack '{pack_slug}'. Available: {available}"
        )

    layers = build_default_layers()
    signal_mesh = layers["signal_mesh"]
    coverage_graph = layers["coverage_graph"]
    covenant_layer = layers["covenant_layer"]
    proof_ledger = layers["proof_ledger"]

    if mode == "discovery":
        covenant_layer.register_policy(CovenantPolicy(
            id="engine-discovery-gate",
            name="Discovery Mode Gate",
            description="Block all autonomous execution in discovery mode",
            vertical="global",
            enforcement="block",
            active=True,
            version=1,
        ))

    started_at = datetime.now(timezone.utc).isoformat()

    signals = pack.discover()
    for sig in signals:
        signal_mesh.ingest(sig)

    raw_actions = pack.recommend(signals, mode)

    covenant_filtered = []
    for action in raw_actions:
        allowed, _triggered = covenant_layer.evaluate(action)
        if allowed:
            covenant_filtered.append(action)
        else:
            covenant_filtered.append(
                action.model_copy(update={"status": "rejected"})
            )

    active_actions = [a for a in covenant_filtered if a.status != "rejected"]
    outcomes = pack.evaluate(signals, active_actions)

    report = pack.emit(signals, covenant_filtered, outcomes, mode)

    for twin in report.twins:
        coverage_graph.register_twin(twin)
    for pp in report.proofPackets:
        proof_ledger.record(pp)

    completed_at = datetime.now(timezone.utc).isoformat()
    report.startedAt = started_at
    report.completedAt = completed_at
    report.inputFingerprint = compute_input_fingerprint(pack_slug, mode)

    if out_dir is None:
        return report, None, None

    base = Path(out_dir) / pack_slug
    base.mkdir(parents=True, exist_ok=True)

    report_path = base / f"{report.runId}.json"
    report_path.write_text(report.model_dump_json(indent=2))

    proof = create_proof(report)
    proof_path = base / f"{report.runId}.proof.json"
    proof_path.write_text(proof.model_dump_json(indent=2))

    return report, report_path, proof_path


def emit_schemas(out_dir: str) -> None:
    schema_dir = Path(out_dir) / "_schema"
    schema_dir.mkdir(parents=True, exist_ok=True)

    for model in SCHEMA_EXPORTS:
        schema = model.model_json_schema()
        name = model.__name__
        path = schema_dir / f"{name}.schema.json"
        path.write_text(json.dumps(schema, indent=2))
