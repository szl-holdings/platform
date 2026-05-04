"""End-to-end tests for both reference packs and the CLI."""

import json
import tempfile
from pathlib import Path

import pytest
from a11oy_fabric_py.pack import get_registry, list_packs, get_pack, PackRegistry
from a11oy_fabric_py.engine import run_pack, emit_schemas
from a11oy_fabric_py.models import PackRunReport, PCPRProof
from a11oy_fabric_py.pcpr import verify_directory
from a11oy_fabric_py.__main__ import main, build_parser, EXIT_OK, EXIT_PROOF_DRIFT, EXIT_UNKNOWN_PACK


@pytest.fixture(autouse=True)
def _reset_registry(monkeypatch):
    import a11oy_fabric_py.pack as pack_mod
    monkeypatch.setattr(pack_mod, "_REGISTRY", None)
    yield
    monkeypatch.setattr(pack_mod, "_REGISTRY", None)


class TestPackRegistry:
    def test_list_packs(self):
        packs = list_packs()
        assert "platform-agentops" in packs
        assert "cyber-resilience" in packs

    def test_get_pack(self):
        pack = get_pack("platform-agentops")
        assert pack is not None
        assert pack.slug == "platform-agentops"
        assert pack.vertical == "alloy-core"

    def test_get_cyber_pack(self):
        pack = get_pack("cyber-resilience")
        assert pack is not None
        assert pack.slug == "cyber-resilience"
        assert pack.vertical == "tenax-cyber"

    def test_registry_class(self):
        reg = get_registry()
        assert isinstance(reg, PackRegistry)
        assert reg.has("platform-agentops")
        assert reg.has("cyber-resilience")
        assert len(reg.list_all()) >= 2


class TestPlatformAgentOpsPack:
    def test_discovery_mode(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report, report_path, proof_path = run_pack("platform-agentops", "discovery", tmpdir)
            assert report.packSlug == "platform-agentops"
            assert report.mode == "discovery"
            assert len(report.signals) > 0
            active = [a for a in report.actions if a.status != "rejected"]
            assert len(active) == 0
            assert all(a.status == "rejected" for a in report.actions)
            assert len(report.outcomes) > 0
            assert report_path is not None
            assert proof_path is not None
            assert report_path.exists()
            assert proof_path.exists()

            report_data = json.loads(report_path.read_text())
            PackRunReport(**report_data)

            proof_data = json.loads(proof_path.read_text())
            PCPRProof(**proof_data)

    def test_governed_mode(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report, _, _ = run_pack("platform-agentops", "governed", tmpdir)
            assert len(report.signals) > 0
            assert len(report.actions) > 0
            assert len(report.outcomes) > 0

    def test_signals_are_schema_valid(self):
        pack = get_pack("platform-agentops")
        signals = pack.discover()
        for sig in signals:
            assert sig.vertical == "alloy-core"
            assert sig.severity in ("critical", "high", "medium", "low", "info")
            assert sig.status in ("active", "acknowledged", "resolved", "escalated", "suppressed")


class TestCyberResiliencePack:
    def test_discovery_mode(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report, report_path, proof_path = run_pack("cyber-resilience", "discovery", tmpdir)
            assert report.packSlug == "cyber-resilience"
            assert report.mode == "discovery"
            assert len(report.signals) > 0
            active = [a for a in report.actions if a.status != "rejected"]
            assert len(active) == 0
            assert all(a.status == "rejected" for a in report.actions)
            assert report_path.exists()
            assert proof_path.exists()

    def test_governed_mode(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report, _, _ = run_pack("cyber-resilience", "governed", tmpdir)
            assert len(report.signals) > 0
            assert len(report.actions) > 0
            assert len(report.outcomes) > 0

    def test_signals_cover_key_areas(self):
        pack = get_pack("cyber-resilience")
        signals = pack.discover()
        all_tags = set()
        for sig in signals:
            all_tags.update(sig.tags)
        assert "compromised-asset" in all_tags
        assert "incident" in all_tags
        assert "control-drift" in all_tags
        assert "mesh-exposure" in all_tags
        assert "recovery-readiness" in all_tags
        assert "containment-rule" in all_tags


class TestSchemaEmission:
    def test_emit_schemas(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            emit_schemas(tmpdir)
            schema_dir = Path(tmpdir) / "_schema"
            assert schema_dir.exists()
            expected = [
                "BusinessSignal.schema.json",
                "Outcome.schema.json",
                "ActionBrief.schema.json",
                "CovenantPolicy.schema.json",
                "ProofPacket.schema.json",
                "PackRunReport.schema.json",
                "PCPRProof.schema.json",
                "FabricStatus.schema.json",
            ]
            for name in expected:
                path = schema_dir / name
                assert path.exists(), f"Missing schema: {name}"
                data = json.loads(path.read_text())
                assert "properties" in data


class TestVerifyDirectory:
    def test_verify_clean_run(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            run_pack("platform-agentops", "discovery", tmpdir)
            run_pack("cyber-resilience", "discovery", tmpdir)
            results = verify_directory(Path(tmpdir))
            assert len(results) > 0
            for path, ok, msg in results:
                assert ok, f"Verification failed for {path}: {msg}"

    def test_verify_detects_tampering(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            report, report_path, _ = run_pack("platform-agentops", "discovery", tmpdir)
            data = json.loads(report_path.read_text())
            data["signals"][0]["title"] = "TAMPERED"
            report_path.write_text(json.dumps(data))
            results = verify_directory(Path(tmpdir))
            failed = [r for r in results if not r[1]]
            assert len(failed) > 0


class TestCLI:
    def test_list_packs_json(self, capsys):
        rc = main(["list-packs"])
        assert rc == EXIT_OK
        captured = capsys.readouterr()
        payload = json.loads(captured.out)
        slugs = {p["slug"] for p in payload["packs"]}
        assert {"platform-agentops", "cyber-resilience"}.issubset(slugs)

    def test_run_writes_report_and_proof(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            rc = main(["run", "--pack", "platform-agentops", "--mode", "discovery", "--out", tmpdir])
            assert rc == EXIT_OK
            pack_dir = Path(tmpdir) / "platform-agentops"
            files = list(pack_dir.glob("*.json"))
            proof_files = [f for f in files if f.name.endswith(".proof.json")]
            report_files = [f for f in files if not f.name.endswith(".proof.json")]
            assert len(report_files) == 1
            assert len(proof_files) == 1
            assert (Path(tmpdir) / "_schema" / "PackRunReport.schema.json").exists()

    def test_run_then_verify_passes(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            assert main(["run", "--pack", "cyber-resilience", "--mode", "governed", "--out", tmpdir]) == EXIT_OK
            rc = main(["verify", tmpdir])
            assert rc == EXIT_OK

    def test_verify_detects_tampering(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            assert main(["run", "--pack", "platform-agentops", "--mode", "discovery", "--out", tmpdir]) == EXIT_OK
            pack_dir = Path(tmpdir) / "platform-agentops"
            proof_path = next(pack_dir.glob("*.proof.json"))
            data = json.loads(proof_path.read_text())
            data["chainHash"] = "0" * 64
            proof_path.write_text(json.dumps(data))
            rc = main(["verify", tmpdir])
            assert rc == EXIT_PROOF_DRIFT

    def test_unknown_pack_returns_exit_code(self, capsys):
        rc = main(["run", "--pack", "nonexistent-pack"])
        assert rc == EXIT_UNKNOWN_PACK

    def test_build_parser_has_all_commands(self):
        parser = build_parser()
        actions = {a.dest: a for a in parser._actions if a.dest == "cmd"}
        assert "cmd" in actions
        sub = actions["cmd"].choices
        assert set(sub.keys()) == {"list-packs", "run", "verify"}
