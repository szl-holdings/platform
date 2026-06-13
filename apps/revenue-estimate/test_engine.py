"""Offline stdlib unit tests for the revenue ESTIMATE engine (no network, no fastapi)."""
import engine


def test_arbitrage_positive_only_on_negative_price():
    neg = engine.estimate_arbitrage(-45.87)
    assert neg["basis"] == "live"
    assert neg["label"] == "ESTIMATE"
    assert neg["our_current_node"]["value_eur_per_h"] > 0
    assert neg["market_reference"]["value_eur_per_h"] > neg["our_current_node"]["value_eur_per_h"]
    pos = engine.estimate_arbitrage(50.0)  # positive price -> no paid-to-soak value
    assert pos["our_current_node"]["value_eur_per_h"] == 0
    assert engine.estimate_arbitrage(None) is None


def test_demand_response_scales_and_labels():
    dr = engine.estimate_demand_response()
    assert dr["basis"] == "published-comparable"
    assert dr["market_reference"]["value_usd_per_yr"] > dr["our_current_node"]["value_usd_per_yr"]
    assert "below DR market" in dr["our_current_node"]["note"]


def test_flare_and_compute_honest():
    fc = engine.estimate_flare_carbon()
    assert fc["basis"] == "published-comparable"
    assert "wellhead" in fc["our_current_node"]["note"]
    vc = engine.estimate_verified_compute_premium()
    assert vc["our_current_node"]["value_usd_per_gpu_hour"] > 0
    assert "receipt" in vc["note"]


def test_build_estimates_envelope():
    posture = {"status": "live", "price_now_eur_mwh": -15.7,
               "wasted_energy_available": True, "joules_label": "sample", "sovereign": False}
    out = engine.build_estimates(posture)
    assert out["ok"] is True
    assert len(out["streams"]) == 4
    assert "ESTIMATE" in {s["label"] for s in out["streams"]}
    assert "no free-energy" in out["doctrine"]
    assert "promise" in out["disclaimer"]
    assert out["posture"]["joules_label"] == "sample"
    assert out["posture"]["sovereign"] is False


def test_build_estimates_degraded_posture():
    out = engine.build_estimates({"status": "unreachable"})
    # arbitrage drops out (no price) -> 3 published-comparable streams remain
    assert len(out["streams"]) == 3
    assert all(s["basis"] == "published-comparable" for s in out["streams"])


def test_marketplace_estimate_honest_and_unsettled():
    mk = engine.estimate_marketplace()
    assert mk["label"] == "ESTIMATE"
    assert mk["basis"] == "published-comparable"
    # nothing settled until the founder lists + a rental clears
    assert mk["our_current_node"]["settled_usd_to_date"] == 0.0
    assert mk["our_current_node"]["status"] == "not_listed"
    lo, hi = mk["our_current_node"]["commodity_usd_per_mo"]
    plo, phi = mk["our_current_node"]["with_verified_premium_usd_per_mo"]
    # honest banded numbers, premium strictly above commodity, order matches ~$86-241
    assert 0 < lo < hi
    assert plo > lo and phi > hi
    assert 80 <= lo <= 95 and 230 <= phi <= 250
    assert mk["founder_required"]  # account + payout is a founder step
    assert "NOT mining" in mk["verified_premium_basis"]


def test_build_marketplace_envelope():
    posture = {"status": "live", "price_now_eur_mwh": -4.92, "wasted_energy_available": True}
    out = engine.build_marketplace(posture)
    assert out["ok"] is True
    assert out["posture"]["energy_gated"] is True
    assert out["estimate"]["label"] == "ESTIMATE"
    assert "NO mining" in out["doctrine"]
    assert "promise" in out["disclaimer"]


def test_thesis_is_context_not_promise():
    t = engine.build_thesis()
    assert "NOT novel" in t["honest_answer"]
    assert t["what_needs_founder"]
    assert "promise" in t["disclaimer"]


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print("PASS", fn.__name__)
    print(f"\nALL {len(fns)} TESTS PASSED")
