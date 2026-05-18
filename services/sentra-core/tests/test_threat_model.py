from sentra_core.threat_model import (
    Asset,
    ThreatSource,
    build_threat_graph,
    MITRE_TECHNIQUES,
)

import pytest


def _sample():
    assets = [
        Asset(id="srv1", name="api-server", kind="server", exposure="critical"),
        Asset(id="id1", name="okta-tenant", kind="identity", exposure="high"),
        Asset(id="ep1", name="laptop-42", kind="endpoint", exposure="low"),
    ]
    sources = [
        ThreatSource(id="apt29", name="APT29", techniques=("T1078", "T1003")),
        ThreatSource(id="ransom", name="GenericRansom", targets=("server", "endpoint")),
    ]
    return assets, sources


def test_builds_typed_graph_with_attack_ids():
    assets, sources = _sample()
    g = build_threat_graph(assets, sources)
    assert g.sources == tuple(sources)
    assert all(t.technique_id in MITRE_TECHNIQUES for t in g.techniques)
    # edges reference valid ATT&CK techniques
    for e in g.edges:
        assert e.technique_id in MITRE_TECHNIQUES
        assert 0.0 < e.score <= 1.0


def test_top_risks_sorted_desc_capped():
    assets, sources = _sample()
    g = build_threat_graph(assets, sources)
    assert len(g.top_risks) <= 10
    scores = [e.score for e in g.top_risks]
    assert scores == sorted(scores, reverse=True)


def test_coverage_normalized():
    assets, sources = _sample()
    g = build_threat_graph(assets, sources)
    assert g.coverage
    assert max(g.coverage.values()) == 1.0
    assert min(g.coverage.values()) >= 0.0


def test_explicit_techniques_override_kind_default():
    assets = [Asset(id="x", name="x", kind="cloud", exposure="medium")]
    sources = [ThreatSource(id="s", name="S", techniques=("T1486",))]
    g = build_threat_graph(assets, sources)
    assert {t.technique_id for t in g.techniques} == {"T1486"}


def test_targets_filter_excludes_irrelevant_assets():
    assets = [
        Asset(id="s1", name="srv", kind="server", exposure="high"),
        Asset(id="d1", name="data", kind="data", exposure="high"),
    ]
    sources = [ThreatSource(id="x", name="X", targets=("data",))]
    g = build_threat_graph(assets, sources)
    asset_ids = {e.asset_id for e in g.edges}
    assert asset_ids == {"d1"}


def test_extra_techniques_merge():
    assets = [Asset(id="x", name="x", kind="endpoint")]
    sources = [ThreatSource(id="s", name="S", techniques=("T9999",))]
    extra = {"T9999": {"name": "Custom", "tactic": "execution", "weight": 0.5}}
    g = build_threat_graph(assets, sources, extra_techniques=extra)
    assert any(t.technique_id == "T9999" for t in g.techniques)


def test_to_dict_serializable():
    import json

    assets, sources = _sample()
    g = build_threat_graph(assets, sources)
    s = json.dumps(g.to_dict())
    assert "T1078" in s or "T1003" in s


def test_empty_inputs_raise():
    with pytest.raises(ValueError):
        build_threat_graph([], [ThreatSource(id="s", name="S")])
    with pytest.raises(ValueError):
        build_threat_graph([Asset(id="x", name="x", kind="endpoint")], [])


def test_unknown_explicit_techniques_filtered():
    assets = [Asset(id="x", name="x", kind="endpoint")]
    sources = [ThreatSource(id="s", name="S", techniques=("T_BOGUS",))]
    g = build_threat_graph(assets, sources)
    assert g.edges == ()


def test_exposure_scales_score():
    a_high = [Asset(id="h", name="h", kind="server", exposure="critical")]
    a_low = [Asset(id="l", name="l", kind="server", exposure="low")]
    src = [ThreatSource(id="s", name="S", techniques=("T1190",))]
    gh = build_threat_graph(a_high, src)
    gl = build_threat_graph(a_low, src)
    assert gh.edges[0].score > gl.edges[0].score
