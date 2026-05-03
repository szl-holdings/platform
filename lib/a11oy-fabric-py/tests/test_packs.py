"""End-to-end tests for the bundled reference packs + the CLI."""

from __future__ import annotations

import json
import os
import subprocess
import sys

import pytest

from a11oy_fabric_py.cli import EXIT_OK, EXIT_PROOF_DRIFT, build_parser, main
from a11oy_fabric_py.layers import default_layer_bundle
from a11oy_fabric_py.models import PackRunReport
from a11oy_fabric_py.pack import PackContext, get_registry, run_pack


@pytest.fixture(autouse=True)
def _reset_registry(monkeypatch):
    # Force a fresh registry for each test so monkey-patched packs don't bleed.
    import a11oy_fabric_py.pack as pack_mod

    monkeypatch.setattr(pack_mod, "_REGISTRY", None)
    yield
    monkeypatch.setattr(pack_mod, "_REGISTRY", None)


def test_registry_lists_both_reference_packs() -> None:
    reg = get_registry()
    slugs = {p.slug for p in reg.list()}
    assert "platform-agentops" in slugs
    assert "cyber-resilience" in slugs


@pytest.mark.parametrize("slug", ["platform-agentops", "cyber-resilience"])
def test_pack_runs_end_to_end(slug: str) -> None:
    reg = get_registry()
    pack = reg.get(slug)
    ctx = PackContext(run_id=f"{slug}-test-001", mode="discovery", layers=default_layer_bundle())

    report, _disc = run_pack(pack, ctx)

    # Schema round-trip through JSON.
    raw = report.model_dump_json()
    PackRunReport.model_validate_json(raw)

    # Discovery mode forces every action to "recommended" + requiresApproval.
    for action in report.actions:
        assert action.status in ("recommended", "pending_approval", "rejected")
        assert action.requiresApproval is True

    # Fabric status reports all 7 layers.
    assert {s.layer for s in report.fabricStatus} == {
        "coverage_graph",
        "signal_mesh",
        "state_engine",
        "causal_core",
        "action_rail",
        "covenant_layer",
        "proof_ledger",
    }


def test_cli_run_writes_report_and_proof(tmp_path) -> None:
    out = tmp_path / "out"
    rc = main(["run", "--pack", "platform-agentops", "--mode", "discovery", "--out", str(out)])
    assert rc == EXIT_OK

    pack_dir = out / "platform-agentops"
    files = list(pack_dir.glob("*.json"))
    proof_files = [f for f in files if f.name.endswith(".proof.json")]
    report_files = [f for f in files if not f.name.endswith(".proof.json")]
    assert len(report_files) == 1
    assert len(proof_files) == 1

    # JSON Schema directory was emitted.
    assert (out / "_schema" / "PackRunReport.schema.json").exists()


def test_cli_run_then_verify_passes(tmp_path) -> None:
    out = tmp_path / "out"
    assert main(["run", "--pack", "cyber-resilience", "--mode", "governed", "--out", str(out)]) == EXIT_OK
    rc = main(["verify", str(out)])
    assert rc == EXIT_OK


def test_cli_verify_detects_proof_tampering(tmp_path) -> None:
    out = tmp_path / "out"
    assert main(["run", "--pack", "platform-agentops", "--mode", "discovery", "--out", str(out)]) == EXIT_OK

    pack_dir = out / "platform-agentops"
    proof_path = next(pack_dir.glob("*.proof.json"))
    data = json.loads(proof_path.read_text())
    # Mutate the head hash.
    data["headHash"] = "sha256:" + "0" * 64
    proof_path.write_text(json.dumps(data))

    rc = main(["verify", str(out)])
    assert rc == EXIT_PROOF_DRIFT


def test_cli_list_packs_outputs_json(capsys) -> None:
    rc = main(["list-packs"])
    assert rc == EXIT_OK
    captured = capsys.readouterr()
    payload = json.loads(captured.out)
    slugs = {p["slug"] for p in payload["packs"]}
    assert {"platform-agentops", "cyber-resilience"}.issubset(slugs)


def test_python_dash_m_invocation(tmp_path) -> None:
    """`python -m a11oy_fabric_py --help` must work end-to-end."""

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    pkg_src = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
    env = os.environ.copy()
    env["PYTHONPATH"] = pkg_src + os.pathsep + env.get("PYTHONPATH", "")
    res = subprocess.run(
        [sys.executable, "-m", "a11oy_fabric_py", "--help"],
        capture_output=True,
        text=True,
        env=env,
        cwd=repo_root,
    )
    assert res.returncode == 0
    assert "list-packs" in res.stdout
    assert "run" in res.stdout
    assert "verify" in res.stdout


def test_argparse_exposes_three_commands() -> None:
    parser = build_parser()
    actions = {a.dest: a for a in parser._actions if a.dest == "cmd"}
    assert "cmd" in actions
    sub = actions["cmd"].choices  # type: ignore[attr-defined]
    assert set(sub.keys()) == {"list-packs", "run", "verify"}
