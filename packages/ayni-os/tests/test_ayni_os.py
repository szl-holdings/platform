"""pytest — verifies rewind, checkpoint, reciprocity-violation halt, Tinkuy, and
yuyay_v3 non-disturbance. All honest: event-sourcing replay + Kuramoto sync.
"""
import math

import pytest

from ayni_os.ledger import ReciprocityLedger, ORGANS
from ayni_os.checkpoint import (
    CheckpointStore, snapshot_state, sign_checkpoint, verify_envelope,
    CHECKPOINT_INTERVAL_SECONDS,
)
from ayni_os.rewind import reconstruct_at, verify_rewind_determinism
from ayni_os.reciprocity_monitor import (
    scan, enforce, ReciprocityViolation, ALPHA_MIN,
    yuyay_v3_hash, yuyay_v4_vector, yuyay_v4_hash, YUYAY_V3_REPLAY_HASH,
)
from ayni_os.tinkuy import TinkuyMonitor, order_parameter, TINKUY_R_THRESHOLD
from ayni_os.replay_api import AyniService


def _balanced_ledger():
    """Build a ledger of balanced internal exchanges at known timestamps."""
    led = ReciprocityLedger()
    led.record_exchange(taker="amaru", giver="sentra", resource="gpu_min",
                        amount=10.0, pair_id="p1", ts=100.0)
    led.record_exchange(taker="rosie", giver="vessels", resource="tokens",
                        amount=5.0, pair_id="p2", ts=200.0)
    # amaru pays sentra back later -> reciprocation closing p1
    led.reciprocate(organ="sentra", resource="gpu_min", amount=10.0,
                    pair_id="p1", ts=300.0)
    led.reciprocate(organ="amaru", resource="gpu_min", amount=10.0,
                    pair_id="p1b", ts=350.0)
    # close p2: rosie took 5, give it >= 5 back; vessels gave 5, return its outflow
    led.reciprocate(organ="rosie", resource="tokens", amount=5.0,
                    pair_id="p2", ts=360.0)
    led.reciprocate(organ="vessels", resource="tokens", amount=5.0,
                    pair_id="p2b", ts=370.0)
    return led


# ---- ledger / reciprocity organism ---------------------------------------
def test_ledger_records_paired_entries():
    led = _balanced_ledger()
    entries = led.entries()
    assert len(entries) >= 4
    # every exchange produced a take and a give
    sides = [e.side for e in entries]
    assert "take" in sides and "give" in sides


def test_chain_integrity():
    led = _balanced_ledger()
    assert led.verify_chain() is True


def test_double_entry_internal_sum_zero():
    """Ayni conservation (double-entry): internal exchanges net to zero."""
    led = ReciprocityLedger()
    led.record_exchange(taker="amaru", giver="sentra", resource="r",
                        amount=42.0, pair_id="x", ts=1.0)
    total = sum((e.amount if e.side == "give" else -e.amount)
                for e in led.entries())
    assert total == 0.0


# ---- checkpoint (signed, 7-min cadence) -----------------------------------
def test_checkpoint_interval_is_7_minutes():
    assert CHECKPOINT_INTERVAL_SECONDS == 7 * 60


def test_checkpoint_sign_and_verify():
    led = _balanced_ledger()
    cp = snapshot_state(led, at_ts=400.0)
    env = sign_checkpoint(cp)
    assert verify_envelope(env) is True
    # tamper -> verify fails
    env["payload"] = env["payload"][:-4] + "AAAA"
    assert verify_envelope(env) is False


def test_checkpoint_cadence():
    led = _balanced_ledger()
    store = CheckpointStore()
    assert store.maybe_checkpoint(led, now=0.0) is not None      # first
    assert store.maybe_checkpoint(led, now=10.0) is None         # too soon
    assert store.maybe_checkpoint(led, now=CHECKPOINT_INTERVAL_SECONDS + 1) is not None


# ---- rewind (event-sourcing replay) ---------------------------------------
def test_rewind_reconstructs_past_state():
    led = _balanced_ledger()
    # at t=150 only the first exchange (t=100) has happened
    st = reconstruct_at(led, target_ts=150.0)
    assert st.n_entries == 2
    # amaru took 10, sentra gave 10
    assert st.balances["amaru"] == -10.0
    assert st.balances["sentra"] == 10.0
    # at t=400 everything has happened
    st2 = reconstruct_at(led, target_ts=400.0)
    assert st2.n_entries == len(led.entries())


def test_rewind_is_deterministic():
    led = _balanced_ledger()
    assert verify_rewind_determinism(led, target_ts=300.0) is True


def test_rewind_uses_checkpoint():
    led = _balanced_ledger()
    store = CheckpointStore()
    store.force_checkpoint(led, at_ts=250.0)
    st = reconstruct_at(led, target_ts=400.0, store=store)
    assert st.started_from_checkpoint == 250.0


# ---- reciprocity violation halt (HUKLLA T24) ------------------------------
def test_reciprocity_violation_halts():
    led = ReciprocityLedger()
    # killinchu is drained with no reciprocation -> alpha = 0 < 0.45
    led.drain(organ="killinchu", resource="gpu_min", amount=100.0,
              pair_id="d1", ts=10.0)
    report = scan(led)
    assert report.halt is True
    assert any(d.organ == "killinchu" and d.tripwire == "T24"
               for d in report.deficits)
    with pytest.raises(ReciprocityViolation):
        enforce(led)


def test_balanced_ledger_does_not_halt():
    led = _balanced_ledger()
    report = scan(led)
    assert report.halt is False


def test_idle_organ_is_balanced():
    led = ReciprocityLedger()
    assert led.ayni_coefficient("wayra") == 0.5


# ---- yuyay_v3 non-disturbance ---------------------------------------------
def test_yuyay_v3_hash_untouched_by_axis_14():
    """Dropping axis 14 reproduces the v3 hash byte-for-byte (additive proof)."""
    v3 = [0.96, 0.97] + [0.91] * 7 + [0.92] * 4   # 13 axes
    assert len(v3) == 13
    v3_receipts = ["r1", "r2"]
    h3 = yuyay_v3_hash(v3, v3_receipts)
    led = _balanced_ledger()
    v4 = yuyay_v4_vector(v3, led, "amaru")
    assert len(v4) == 14
    h4 = yuyay_v4_hash(v4, v3_receipts + ["r_v4"])
    # v4 differs from v3 (separate hash), but recomputing v3 from first 13 is stable
    assert h4 != h3
    assert yuyay_v3_hash(v4[:13], v3_receipts) == h3


def test_locked_replay_hash_constant_present():
    assert YUYAY_V3_REPLAY_HASH == (
        "bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5"
    )


# ---- Tinkuy (Kuramoto) ----------------------------------------------------
def test_kuramoto_fully_synced_r_is_one():
    r, _ = order_parameter([1.0, 1.0, 1.0, 1.0])
    assert abs(r - 1.0) < 1e-9


def test_kuramoto_antiphase_r_is_zero():
    r, _ = order_parameter([0.0, math.pi])
    assert abs(r) < 1e-9


def test_tinkuy_flow_detected_above_threshold():
    mon = TinkuyMonitor()
    # near-identical phases -> high r -> flow
    for i, o in enumerate(ORGANS):
        mon.set_phase(o, 0.01 * i)
    st = mon.state()
    assert st.r > TINKUY_R_THRESHOLD
    assert st.in_tinkuy is True
    assert st.suppress_reflexion is True
    assert len(mon.flow_log()) == 1


def test_tinkuy_no_flow_when_incoherent():
    mon = TinkuyMonitor()
    for i, o in enumerate(ORGANS):
        mon.set_phase(o, 2 * math.pi * i / len(ORGANS))  # evenly spread -> r~0
    st = mon.state()
    assert st.in_tinkuy is False
    assert st.suppress_reflexion is False


# ---- API ------------------------------------------------------------------
def test_api_endpoints():
    svc = AyniService(ledger=_balanced_ledger())
    code, body = svc.handle("/v1/ayni")
    assert code == 200 and "alphas" in body and body["tripwire"] == "T24"

    code, body = svc.handle("/v1/replay", {"at": 150.0})
    assert code == 200
    assert body["mechanism"] == "event-sourcing-replay"
    assert body["n_entries"] == 2

    code, body = svc.handle("/v1/tinkuy")
    assert code == 200 and body["model"] == "kuramoto-1975-order-parameter"

    code, body = svc.handle("/v1/replay")
    assert code == 400  # missing 'at'

    code, body = svc.handle("/nope")
    assert code == 404
