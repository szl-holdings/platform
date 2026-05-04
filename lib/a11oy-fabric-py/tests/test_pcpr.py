"""PCPR hash-chain tests."""

import json
import tempfile
from pathlib import Path

import pytest
from a11oy_fabric_py.models import PackRunReport, BusinessSignal, PCPRProof
from a11oy_fabric_py.pcpr import (
    compute_report_hash, create_proof, verify_proof,
    build_chain_hash, collect_entity_ids,
)


def _make_report(**overrides) -> PackRunReport:
    defaults = {
        "runId": "test-run-001",
        "packSlug": "test-pack",
        "vertical": "alloy-core",
        "mode": "discovery",
        "engineVersion": "0.1.0",
        "packVersion": "0.1.0",
        "signals": [
            BusinessSignal(
                id="sig-test-001",
                vertical="alloy-core",
                entity="test",
                title="Test",
                description="Test signal",
                severity="info",
                status="active",
                businessImpact="None",
                owner="test",
            ),
        ],
    }
    defaults.update(overrides)
    return PackRunReport(**defaults)


class TestPCPRHashChain:
    def test_deterministic_hash(self):
        report = _make_report()
        h1 = compute_report_hash(report)
        h2 = compute_report_hash(report)
        assert h1 == h2
        assert len(h1) == 64

    def test_different_reports_different_hashes(self):
        r1 = _make_report(runId="run-001")
        r2 = _make_report(runId="run-002")
        assert compute_report_hash(r1) != compute_report_hash(r2)

    def test_create_proof(self):
        report = _make_report()
        proof = create_proof(report)
        assert proof.runId == report.runId
        assert proof.packSlug == report.packSlug
        assert len(proof.reportHash) == 64
        assert len(proof.chainHash) == 64
        assert proof.previousChainHash is None

    def test_chain_links(self):
        r1 = _make_report(runId="run-001")
        p1 = create_proof(r1)

        r2 = _make_report(runId="run-002")
        p2 = create_proof(r2, previous_chain_hash=p1.chainHash)

        assert p2.previousChainHash == p1.chainHash
        assert p2.chainHash != p1.chainHash

    def test_verify_valid_proof(self):
        report = _make_report()
        proof = create_proof(report)

        with tempfile.TemporaryDirectory() as tmpdir:
            rp = Path(tmpdir) / "report.json"
            pp = Path(tmpdir) / "report.proof.json"
            rp.write_text(report.model_dump_json(indent=2))
            pp.write_text(proof.model_dump_json(indent=2))

            ok, msg = verify_proof(rp, pp)
            assert ok, msg

    def test_verify_tampered_report(self):
        report = _make_report()
        proof = create_proof(report)

        with tempfile.TemporaryDirectory() as tmpdir:
            rp = Path(tmpdir) / "report.json"
            pp = Path(tmpdir) / "report.proof.json"

            data = json.loads(report.model_dump_json())
            data["signals"][0]["title"] = "TAMPERED"
            rp.write_text(json.dumps(data))
            pp.write_text(proof.model_dump_json(indent=2))

            ok, msg = verify_proof(rp, pp)
            assert not ok
            assert "hash mismatch" in msg.lower() or "mismatch" in msg.lower()

    def test_collect_entity_ids(self):
        report = _make_report()
        ids = collect_entity_ids(report)
        assert "sig-test-001" in ids


class TestContractConformance:
    def test_pack_protocol_conformance(self):
        from a11oy_fabric_py.pack import VerticalPack
        from a11oy_fabric_py.packs.platform_agentops.pack import PlatformAgentOpsPack
        from a11oy_fabric_py.packs.cyber_resilience.pack import CyberResiliencePack

        assert isinstance(PlatformAgentOpsPack(), VerticalPack)
        assert isinstance(CyberResiliencePack(), VerticalPack)

    def test_pack_has_required_attributes(self):
        from a11oy_fabric_py.packs.platform_agentops.pack import PlatformAgentOpsPack
        pack = PlatformAgentOpsPack()
        assert hasattr(pack, "slug")
        assert hasattr(pack, "vertical")
        assert hasattr(pack, "version")
        assert hasattr(pack, "discover")
        assert hasattr(pack, "recommend")
        assert hasattr(pack, "evaluate")
        assert hasattr(pack, "emit")
