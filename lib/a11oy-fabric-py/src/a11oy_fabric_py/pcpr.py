"""
Proof-Carrying Pack Run (PCPR).

Every `run` emits the JSON report AND a .proof.json companion that
hash-chains (sha256) the input fingerprint, the engine version, the
pack version, and every emitted entity ID.

`verify` re-hashes and reports drift.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .models import PackRunReport, PCPRProof


def _sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def compute_report_hash(report: PackRunReport) -> str:
    canonical = report.model_dump_json(indent=None)
    return _sha256(canonical)


def compute_input_fingerprint(pack_slug: str, mode: str) -> str:
    return _sha256(f"{pack_slug}:{mode}")


def collect_entity_ids(report: PackRunReport) -> list[str]:
    ids: list[str] = []
    for s in report.signals:
        ids.append(s.id)
    for o in report.outcomes:
        ids.append(o.id)
    for a in report.actions:
        ids.append(a.id)
    for p in report.policies:
        ids.append(p.id)
    for pp in report.proofPackets:
        ids.append(pp.id)
    for t in report.twins:
        ids.append(t.id)
    for w in report.workcells:
        ids.append(w.id)
    for tr in report.traces:
        ids.append(tr.id)
    return ids


def build_chain_hash(
    report_hash: str,
    input_fingerprint: str,
    engine_version: str,
    pack_version: str,
    entity_ids: list[str],
    previous_chain_hash: str | None = None,
) -> str:
    parts = [
        report_hash,
        input_fingerprint,
        engine_version,
        pack_version,
        ",".join(entity_ids),
        previous_chain_hash or "genesis",
    ]
    return _sha256("|".join(parts))


def create_proof(report: PackRunReport, previous_chain_hash: str | None = None) -> PCPRProof:
    report_hash = compute_report_hash(report)
    input_fp = compute_input_fingerprint(report.packSlug, report.mode)
    entity_ids = collect_entity_ids(report)
    chain_hash = build_chain_hash(
        report_hash, input_fp, report.engineVersion,
        report.packVersion, entity_ids, previous_chain_hash,
    )
    return PCPRProof(
        runId=report.runId,
        packSlug=report.packSlug,
        engineVersion=report.engineVersion,
        packVersion=report.packVersion,
        timestamp=report.timestamp,
        inputFingerprint=input_fp,
        entityIds=entity_ids,
        reportHash=report_hash,
        chainHash=chain_hash,
        previousChainHash=previous_chain_hash,
    )


def verify_proof(report_path: Path, proof_path: Path) -> tuple[bool, str]:
    try:
        report_data = json.loads(report_path.read_text())
        proof_data = json.loads(proof_path.read_text())
    except (json.JSONDecodeError, FileNotFoundError) as e:
        return False, f"Cannot read files: {e}"

    report = PackRunReport(**report_data)
    proof = PCPRProof(**proof_data)

    actual_report_hash = compute_report_hash(report)
    if actual_report_hash != proof.reportHash:
        return False, f"Report hash mismatch: expected {proof.reportHash}, got {actual_report_hash}"

    actual_entity_ids = collect_entity_ids(report)
    if actual_entity_ids != proof.entityIds:
        return False, "Entity ID list mismatch"

    actual_chain = build_chain_hash(
        actual_report_hash, proof.inputFingerprint,
        proof.engineVersion, proof.packVersion,
        actual_entity_ids, proof.previousChainHash,
    )
    if actual_chain != proof.chainHash:
        return False, f"Chain hash mismatch: expected {proof.chainHash}, got {actual_chain}"

    return True, "Proof valid"


def verify_directory(dir_path: Path) -> list[tuple[str, bool, str]]:
    results: list[tuple[str, bool, str]] = []
    for proof_file in sorted(dir_path.rglob("*.proof.json")):
        report_name = proof_file.name.replace(".proof.json", ".json")
        report_file = proof_file.parent / report_name
        if not report_file.exists():
            results.append((str(proof_file), False, "Missing report companion"))
            continue
        ok, msg = verify_proof(report_file, proof_file)
        results.append((str(report_file), ok, msg))
    return results
