"""Contract-conformance test fixture.

Any future vertical pack can be pointed at ``assert_pack_conforms`` and it
will fail loudly if the pack violates the substrate's contract.
"""

from __future__ import annotations

import pytest

from a11oy_fabric_py.layers import default_layer_bundle
from a11oy_fabric_py.models import PackRunReport
from a11oy_fabric_py.pack import PackContext, VerticalPack, get_registry, run_pack
from a11oy_fabric_py.proof import build_proof_chain, fingerprint_inputs, verify_proof_chain


def assert_pack_conforms(pack: VerticalPack) -> PackRunReport:
    """Run the contract gauntlet against a candidate pack."""

    # 1. Static surface — must satisfy the Protocol.
    assert isinstance(pack, VerticalPack), f"{pack!r} fails the VerticalPack protocol"
    assert pack.slug and isinstance(pack.slug, str)
    assert pack.version and isinstance(pack.version, str)
    assert pack.vertical and isinstance(pack.vertical, str)

    # 2. Discovery is side-effect-free — calling it twice with a fresh context
    #    must produce the same fingerprint.
    ctx_a = PackContext(run_id="conformance-a", mode="discovery", layers=default_layer_bundle())
    ctx_b = PackContext(run_id="conformance-b", mode="discovery", layers=default_layer_bundle())
    disc_a = pack.discover(ctx_a)
    disc_b = pack.discover(ctx_b)
    assert fingerprint_inputs(disc_a) == fingerprint_inputs(disc_b), (
        f"{pack.slug}.discover() is not deterministic — "
        "discovery MUST be a pure read of inputs."
    )

    # 3. End-to-end run through the engine helper.
    ctx = PackContext(run_id=f"{pack.slug}-conf", mode="discovery", layers=default_layer_bundle())
    report, _ = run_pack(pack, ctx)

    # 4. Report round-trips through the JSON Schema.
    PackRunReport.model_validate_json(report.model_dump_json())

    # 5. Discovery mode never produces auto-executable actions.
    for a in report.actions:
        assert a.requiresApproval is True, (
            f"{pack.slug}: action {a.id} did not honour the discovery-plane gate"
        )
        assert a.status in ("recommended", "pending_approval", "rejected")

    # 6. PCPR builds and verifies cleanly.
    entity_ids = []
    for s in report.signals:
        entity_ids.append(("signal", s.id))
    for ac in report.actions:
        entity_ids.append(("action", ac.id))
    chain = build_proof_chain(
        pack_slug=pack.slug,
        pack_version=pack.version,
        run_id=ctx.run_id,
        input_fingerprint=report.inputFingerprint,
        entity_ids=entity_ids,
    )
    res = verify_proof_chain(chain)
    assert res.ok, f"{pack.slug}: PCPR chain failed verification — {res.reason}"

    return report


@pytest.mark.parametrize("slug", ["platform-agentops", "cyber-resilience"])
def test_bundled_packs_conform(slug: str) -> None:
    pack = get_registry().get(slug)
    assert_pack_conforms(pack)
