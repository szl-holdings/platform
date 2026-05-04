"""Contract-conformance test fixture.

Any future vertical pack can be pointed at ``assert_pack_conforms`` and it
will fail loudly if the pack violates the substrate's contract.
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from a11oy_fabric_py.models import PackRunReport, BusinessSignal
from a11oy_fabric_py.pack import VerticalPack, get_registry
from a11oy_fabric_py.engine import run_pack
from a11oy_fabric_py.pcpr import create_proof, verify_proof


def assert_pack_conforms(pack: VerticalPack) -> PackRunReport:
    assert isinstance(pack, VerticalPack), f"{pack!r} fails the VerticalPack protocol"
    assert pack.slug and isinstance(pack.slug, str)
    assert pack.version and isinstance(pack.version, str)
    assert pack.vertical and isinstance(pack.vertical, str)

    signals_a = pack.discover()
    signals_b = pack.discover()
    assert len(signals_a) == len(signals_b), (
        f"{pack.slug}.discover() returned different signal counts — "
        "discovery MUST be deterministic."
    )
    for sig in signals_a:
        assert isinstance(sig, BusinessSignal)
        BusinessSignal.model_validate_json(sig.model_dump_json())

    with tempfile.TemporaryDirectory() as tmpdir:
        report, report_path, proof_path = run_pack(pack.slug, "discovery", tmpdir)

        PackRunReport.model_validate_json(report.model_dump_json())

        for a in report.actions:
            assert a.requiresApproval is True, (
                f"{pack.slug}: action {a.id} did not honour the discovery-plane gate"
            )
            assert a.status in ("recommended", "pending_approval", "rejected")

        ok, msg = verify_proof(report_path, proof_path)
        assert ok, f"{pack.slug}: PCPR verification failed — {msg}"

    return report


@pytest.fixture(autouse=True)
def _reset_registry(monkeypatch):
    import a11oy_fabric_py.pack as pack_mod
    monkeypatch.setattr(pack_mod, "_REGISTRY", None)
    yield
    monkeypatch.setattr(pack_mod, "_REGISTRY", None)


@pytest.mark.parametrize("slug", ["platform-agentops", "cyber-resilience"])
def test_bundled_packs_conform(slug: str) -> None:
    pack = get_registry().get(slug)
    assert_pack_conforms(pack)
