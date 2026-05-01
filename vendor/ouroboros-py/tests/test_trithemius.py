"""Tests for trithemius.py — Primitives 53-56."""

import pytest

from ouroboros.trithemius import (
    # Primitive 53
    CarrierTest,
    check_carrier,
    # Primitive 54
    CipherProvenance,
    bind_cipher,
    verify_cipher,
    # Primitive 55
    ChannelBinding,
    audit_key_separation,
    # Primitive 56
    SymbolicRendering,
    check_polygraphic,
)


# ---------------------------------------------------------------------------
# Primitive 53 — Carrier integrity
# ---------------------------------------------------------------------------

class TestCarrierIntegrity:
    def test_chi_square_zero_for_matching_distributions(self):
        r = check_carrier(CarrierTest(
            observed={"a": 10, "b": 20},
            expected={"a": 10, "b": 20},
            threshold=3.84,
        ))
        assert abs(r.chi_square) < 1e-12
        assert r.anomalous is False

    def test_flags_anomalous_when_chi_exceeds_threshold(self):
        r = check_carrier(CarrierTest(
            observed={"a": 1, "b": 99},
            expected={"a": 50, "b": 50},
            threshold=3.84,
        ))
        assert r.anomalous is True

    def test_missing_observed_key_counts_as_zero(self):
        r = check_carrier(CarrierTest(
            observed={"a": 10},
            expected={"a": 10, "b": 10},
            threshold=3.84,
        ))
        assert abs(r.chi_square - 10) < 1e-6

    def test_degrees_of_freedom_at_least_1(self):
        r = check_carrier(CarrierTest(
            observed={"a": 5},
            expected={"a": 5},
            threshold=3.84,
        ))
        assert r.degrees_of_freedom == 1

    def test_rationale_describes_outcome(self):
        ok = check_carrier(CarrierTest(
            observed={"a": 10, "b": 10},
            expected={"a": 10, "b": 10},
            threshold=3.84,
        ))
        assert "consistent" in ok.rationale


# ---------------------------------------------------------------------------
# Primitive 54 — Cipher-table provenance
# ---------------------------------------------------------------------------

PROV = CipherProvenance(author="Trithemius", work="Polygraphiae", edition="1518", page="fol.12r")


class TestCipherProvenance:
    def test_binds_and_verifies(self):
        ct = bind_cipher({"A": "1", "B": "2"}, PROV)
        assert verify_cipher(ct) is True

    def test_digest_changes_if_table_changes(self):
        a = bind_cipher({"A": "1"}, PROV)
        b = bind_cipher({"A": "2"}, PROV)
        assert a.digest != b.digest

    def test_digest_changes_if_provenance_changes(self):
        from dataclasses import replace
        a = bind_cipher({"A": "1"}, PROV)
        prov2 = CipherProvenance(author=PROV.author, work=PROV.work, edition="1606", page=PROV.page)
        b = bind_cipher({"A": "1"}, prov2)
        assert a.digest != b.digest

    def test_verify_cipher_fails_on_tampered_table(self):
        ct = bind_cipher({"A": "1"}, PROV)
        from dataclasses import replace
        tampered = CipherTable_from(ct, table={"A": "9"})
        assert verify_cipher(tampered) is False

    def test_digest_is_deterministic_across_key_order(self):
        a = bind_cipher({"A": "1", "B": "2"}, PROV)
        b = bind_cipher({"B": "2", "A": "1"}, PROV)
        assert a.digest == b.digest

    def test_digest_is_64_hex_chars(self):
        import re
        ct = bind_cipher({"A": "1"}, PROV)
        assert re.match(r'^[0-9a-f]{64}$', ct.digest)


def CipherTable_from(ct, **kwargs):
    """Helper to create a modified CipherTable (like TS spread operator)."""
    from ouroboros.trithemius import CipherTable
    return CipherTable(
        table=kwargs.get("table", ct.table),
        provenance=kwargs.get("provenance", ct.provenance),
        digest=kwargs.get("digest", ct.digest),
    )


# ---------------------------------------------------------------------------
# Primitive 55 — Key separation
# ---------------------------------------------------------------------------

class TestKeySeparation:
    def test_passes_when_key_and_carrier_on_disjoint_channels(self):
        r = audit_key_separation([
            ChannelBinding(asset="key", channel_id="courier-A"),
            ChannelBinding(asset="carrier", channel_id="letter-B"),
        ])
        assert r.passes is True
        assert r.overlap == []

    def test_fails_when_key_shares_channel_with_carrier(self):
        r = audit_key_separation([
            ChannelBinding(asset="key", channel_id="letter-B"),
            ChannelBinding(asset="carrier", channel_id="letter-B"),
        ])
        assert r.passes is False
        assert r.overlap == ["letter-B"]

    def test_fails_when_no_key_channel_declared(self):
        r = audit_key_separation([ChannelBinding(asset="carrier", channel_id="x")])
        assert r.passes is False

    def test_fails_when_no_carrier_declared(self):
        r = audit_key_separation([ChannelBinding(asset="key", channel_id="x")])
        assert r.passes is False

    def test_dedups_channel_ids(self):
        r = audit_key_separation([
            ChannelBinding(asset="key", channel_id="k1"),
            ChannelBinding(asset="key", channel_id="k1"),
            ChannelBinding(asset="carrier", channel_id="c1"),
        ])
        assert r.key_channels == ["k1"]
        assert r.passes is True


# ---------------------------------------------------------------------------
# Primitive 56 — Polygraphic redundancy
# ---------------------------------------------------------------------------

class TestPolygraphicRedundancy:
    def test_passes_with_unanimous_quorum_across_3_systems(self):
        r = check_polygraphic([
            SymbolicRendering(system_id="s1", decoded="ATTACK AT DAWN"),
            SymbolicRendering(system_id="s2", decoded="ATTACK AT DAWN"),
            SymbolicRendering(system_id="s3", decoded="ATTACK AT DAWN"),
        ])
        assert r.passes is True
        assert r.quorum_value == "ATTACK AT DAWN"

    def test_fails_when_fewer_than_3_distinct_systems(self):
        r = check_polygraphic([
            SymbolicRendering(system_id="s1", decoded="X"),
            SymbolicRendering(system_id="s2", decoded="X"),
        ])
        assert r.passes is False

    def test_fails_when_no_quorum_reached(self):
        r = check_polygraphic([
            SymbolicRendering(system_id="s1", decoded="A"),
            SymbolicRendering(system_id="s2", decoded="B"),
            SymbolicRendering(system_id="s3", decoded="C"),
        ])
        assert r.passes is False
        assert r.quorum_value is None

    def test_passes_with_2_of_3_majority_at_default_fraction(self):
        r = check_polygraphic([
            SymbolicRendering(system_id="s1", decoded="X"),
            SymbolicRendering(system_id="s2", decoded="X"),
            SymbolicRendering(system_id="s3", decoded="Y"),
        ])
        assert r.passes is True
        assert r.quorum_value == "X"

    def test_required_threshold_is_configurable(self):
        r = check_polygraphic([
            SymbolicRendering(system_id="s1", decoded="X"),
            SymbolicRendering(system_id="s2", decoded="X"),
        ], required=2)
        assert r.passes is True

    def test_counts_distinct_systems_only(self):
        r = check_polygraphic([
            SymbolicRendering(system_id="s1", decoded="X"),
            SymbolicRendering(system_id="s1", decoded="Y"),
            SymbolicRendering(system_id="s2", decoded="X"),
        ])
        assert r.systems == 2
