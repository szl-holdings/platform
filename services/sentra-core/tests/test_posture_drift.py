from sentra_core.posture_drift import (
    Control,
    PostureSnapshot,
    compute_drift,
)


def _ctrl(cid, state="enabled", sev="medium", name=None):
    return Control(id=cid, name=name or cid, severity=sev, state=state)


def test_no_change_yields_zero_score():
    base = PostureSnapshot("b1", "2025-01-01T00:00:00Z", (_ctrl("a"), _ctrl("b")))
    cur = PostureSnapshot("c1", "2025-01-02T00:00:00Z", (_ctrl("a"), _ctrl("b")))
    rep = compute_drift(base, cur)
    assert rep.added == ()
    assert rep.removed == ()
    assert rep.changed == ()
    assert rep.lambda_score == 0.0
    assert rep.severity_band == "low"


def test_removed_critical_drives_high_band():
    base = PostureSnapshot(
        "b", "t", (_ctrl("mfa", sev="critical"), _ctrl("edr", sev="critical"))
    )
    cur = PostureSnapshot("c", "t", (_ctrl("edr", sev="critical"),))
    rep = compute_drift(base, cur)
    assert len(rep.removed) == 1
    assert rep.removed[0].control_id == "mfa"
    assert rep.severity_band in {"medium", "high", "critical"}
    assert rep.lambda_score > 0


def test_added_control_low_weight():
    base = PostureSnapshot("b", "t", (_ctrl("a", sev="high"),))
    cur = PostureSnapshot(
        "c", "t", (_ctrl("a", sev="high"), _ctrl("new", sev="high"))
    )
    rep = compute_drift(base, cur)
    assert len(rep.added) == 1
    assert rep.added[0].change == "added"


def test_state_change_detected():
    base = PostureSnapshot("b", "t", (_ctrl("edr", state="enabled", sev="high"),))
    cur = PostureSnapshot("c", "t", (_ctrl("edr", state="disabled", sev="high"),))
    rep = compute_drift(base, cur)
    assert len(rep.changed) == 1
    assert rep.changed[0].notes.startswith("state enabled->disabled")


def test_metadata_only_change_lower_weight():
    base = PostureSnapshot("b", "t", (
        Control(id="x", name="x", state="enabled", severity="medium", metadata={"v": "1"}),
    ))
    cur = PostureSnapshot("c", "t", (
        Control(id="x", name="x", state="enabled", severity="medium", metadata={"v": "2"}),
    ))
    rep = compute_drift(base, cur)
    assert len(rep.changed) == 1
    assert rep.changed[0].notes == "metadata changed"


def test_to_dict_roundtrip_keys():
    base = PostureSnapshot("b", "t", (_ctrl("a", sev="critical"),))
    cur = PostureSnapshot("c", "t", ())
    d = compute_drift(base, cur).to_dict()
    assert {"added", "removed", "changed", "lambda_score", "severity_band"} <= set(d)
    assert d["removed"][0]["control_id"] == "a"


def test_band_thresholds():
    # Force many critical removals -> band tops out
    base = PostureSnapshot(
        "b", "t",
        tuple(_ctrl(f"c{i}", sev="critical") for i in range(20)),
    )
    cur = PostureSnapshot("c", "t", ())
    rep = compute_drift(base, cur)
    assert rep.severity_band == "critical"
    assert rep.lambda_score >= 0.8
