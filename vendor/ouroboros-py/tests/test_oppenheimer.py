"""Tests for the Oppenheimer primitives Python port (Primitives 25–28)."""
from __future__ import annotations

import pytest

from ouroboros.oppenheimer import (
    CLASS_RANK,
    ClearanceEntry,
    ClearanceLedger,
    DowngradeOrder,
    DualUseInput,
    MoralEntry,
    MoralLedger,
    can_read,
    downgrade,
    dual_use_review,
)


# ---------------------------------------------------------------------------
# Primitive 25 — Clearance ledger
# ---------------------------------------------------------------------------

class TestClearanceLedger:
    def test_requires_basis_citation(self) -> None:
        l = ClearanceLedger()
        with pytest.raises(ValueError):
            l.append(ClearanceEntry(
                principal_id="p", action="GRANT", level="SECRET",
                basis_citation="", timestamp=1,
            ))

    def test_enforces_append_only_by_timestamp(self) -> None:
        l = ClearanceLedger()
        l.append(ClearanceEntry(principal_id="p", action="GRANT", level="SECRET",
                                basis_citation="AEC 1947", timestamp=100))
        with pytest.raises(ValueError):
            l.append(ClearanceEntry(principal_id="p", action="REVOKE", level="NONE",
                                    basis_citation="AEC 1954", timestamp=50))

    def test_grant_suspend_restore(self) -> None:
        l = ClearanceLedger()
        l.append(ClearanceEntry(principal_id="p", action="GRANT", level="TOP_SECRET",
                                basis_citation="x", timestamp=1))
        l.append(ClearanceEntry(principal_id="p", action="SUSPEND", level="NONE",
                                basis_citation="y", timestamp=2))
        assert l.for_principal("p").current == "NONE"
        l.append(ClearanceEntry(principal_id="p", action="RESTORE", level="SECRET",
                                basis_citation="z", timestamp=3))
        assert l.for_principal("p").current == "SECRET"

    def test_is_cleared_for_uses_rank(self) -> None:
        l = ClearanceLedger()
        l.append(ClearanceEntry(principal_id="p", action="GRANT", level="SECRET",
                                basis_citation="x", timestamp=1))
        res = l.for_principal("p")
        assert res.is_cleared_for("CONFIDENTIAL") is True
        assert res.is_cleared_for("SECRET") is True
        assert res.is_cleared_for("TOP_SECRET") is False

    def test_isolates_per_principal(self) -> None:
        l = ClearanceLedger()
        l.append(ClearanceEntry(principal_id="a", action="GRANT", level="TOP_SECRET",
                                basis_citation="x", timestamp=1))
        l.append(ClearanceEntry(principal_id="b", action="GRANT", level="PUBLIC",
                                basis_citation="y", timestamp=2))
        assert l.for_principal("a").current == "TOP_SECRET"
        assert l.for_principal("b").current == "PUBLIC"

    def test_revoke_drops_to_none(self) -> None:
        l = ClearanceLedger()
        l.append(ClearanceEntry(principal_id="p", action="GRANT", level="TOP_SECRET",
                                basis_citation="x", timestamp=1))
        l.append(ClearanceEntry(principal_id="p", action="REVOKE", level="NONE",
                                basis_citation="1954 Personnel Security Board", timestamp=2))
        assert l.for_principal("p").current == "NONE"

    def test_tracks_ledger_size(self) -> None:
        l = ClearanceLedger()
        assert l.size() == 0
        l.append(ClearanceEntry(principal_id="p", action="GRANT", level="PUBLIC",
                                basis_citation="x", timestamp=1))
        assert l.size() == 1


# ---------------------------------------------------------------------------
# Primitive 26 — Classification ladder
# ---------------------------------------------------------------------------

class TestClassificationLadder:
    def test_ranks_ordered(self) -> None:
        assert CLASS_RANK["UNCLASSIFIED"] == 0
        assert CLASS_RANK["RESTRICTED_DATA"] == 4

    def test_no_downgrade_leaves_declared(self) -> None:
        r = downgrade("a1", "SECRET", [])
        assert r.effective == "SECRET"
        assert r.downgrades == []

    def test_multi_step_downgrade_chain(self) -> None:
        r = downgrade("a1", "TOP_SECRET", [
            DowngradeOrder(from_level="TOP_SECRET", to_level="SECRET",
                           basis_citation="EO 12356", authorized_by="Director X"),
            DowngradeOrder(from_level="SECRET", to_level="CONFIDENTIAL",
                           basis_citation="EO 12356", authorized_by="Director X"),
        ])
        assert r.effective == "CONFIDENTIAL"
        assert len(r.downgrades) == 2

    def test_rejects_broken_chain(self) -> None:
        with pytest.raises(ValueError):
            downgrade("a1", "SECRET", [
                DowngradeOrder(from_level="TOP_SECRET", to_level="SECRET",
                               basis_citation="x", authorized_by="y"),
            ])

    def test_rejects_non_strict_downgrade(self) -> None:
        with pytest.raises(ValueError):
            downgrade("a1", "SECRET", [
                DowngradeOrder(from_level="SECRET", to_level="SECRET",
                               basis_citation="x", authorized_by="y"),
            ])
        with pytest.raises(ValueError):
            downgrade("a1", "SECRET", [
                DowngradeOrder(from_level="SECRET", to_level="TOP_SECRET",
                               basis_citation="x", authorized_by="y"),
            ])

    def test_requires_basis_and_authorizer(self) -> None:
        with pytest.raises(ValueError):
            downgrade("a1", "SECRET", [
                DowngradeOrder(from_level="SECRET", to_level="CONFIDENTIAL",
                               basis_citation="", authorized_by="x"),
            ])

    def test_can_read_respects_clearance(self) -> None:
        r = downgrade("a1", "SECRET", [])
        assert can_read(r, "SECRET") is True
        assert can_read(r, "CONFIDENTIAL") is False
        assert can_read(r, "TOP_SECRET") is True
        assert can_read(r, "NONE") is False

    def test_downgrade_lowers_required_clearance(self) -> None:
        r = downgrade("a1", "TOP_SECRET", [
            DowngradeOrder(from_level="TOP_SECRET", to_level="CONFIDENTIAL",
                           basis_citation="EO", authorized_by="X"),
        ])
        assert can_read(r, "CONFIDENTIAL") is True


# ---------------------------------------------------------------------------
# Primitive 27 — Dual-use review
# ---------------------------------------------------------------------------

class TestDualUseReview:
    def test_open_publish(self) -> None:
        r = dual_use_review(DualUseInput(
            artifact_id="open-source-runtime",
            benign_benefit=0.9, harm_potential=0.1,
            reproducibility=0.9, verifiability=0.9,
        ))
        assert r.verdict == "OPEN_PUBLISH"
        assert r.bohr_score >= 0.4

    def test_publish_guarded(self) -> None:
        r = dual_use_review(DualUseInput(
            artifact_id="x", benign_benefit=0.6, harm_potential=0.4,
            reproducibility=0.6, verifiability=0.6,
        ))
        assert r.verdict == "PUBLISH_GUARDED"

    def test_hold(self) -> None:
        r = dual_use_review(DualUseInput(
            artifact_id="x", benign_benefit=0.3, harm_potential=0.6,
            reproducibility=0.4, verifiability=0.4,
        ))
        assert r.verdict == "HOLD"

    def test_suppress(self) -> None:
        r = dual_use_review(DualUseInput(
            artifact_id="x", benign_benefit=0.1, harm_potential=0.95,
            reproducibility=0.05, verifiability=0.1,
        ))
        assert r.verdict == "SUPPRESS"

    def test_rejects_out_of_range(self) -> None:
        with pytest.raises(ValueError):
            dual_use_review(DualUseInput(
                artifact_id="x", benign_benefit=2.0, harm_potential=0.1,
                reproducibility=0.5, verifiability=0.5,
            ))

    def test_includes_bohr_score_and_rationale(self) -> None:
        r = dual_use_review(DualUseInput(
            artifact_id="x", benign_benefit=0.8, harm_potential=0.1,
            reproducibility=0.8, verifiability=0.8,
        ))
        assert isinstance(r.bohr_score, float)
        assert len(r.rationale) > 0


# ---------------------------------------------------------------------------
# Primitive 28 — Moral-responsibility ledger
# ---------------------------------------------------------------------------

def _entry(entry_id: str, witness: str | None, causality: float = 0.7) -> MoralEntry:
    return MoralEntry(
        entry_id=entry_id,
        actor_id="actor",
        action_id="action",
        foreseen_harms=["x"],
        unforeseen_harms=[],
        counterfactual="nothing happens",
        causality=causality,
        authority_claim="self",
        accountability_witness=witness,
        timestamp=1,
    )


class TestMoralLedger:
    def test_refuses_anonymous_entries(self) -> None:
        l = MoralLedger()
        r = l.record(_entry("1", None))
        assert r["accepted"] is False
        assert l.summary().anonymous_count == 1

    def test_accepts_named_witness(self) -> None:
        l = MoralLedger()
        r = l.record(_entry("1", "AEC chair"))
        assert r["accepted"] is True
        assert len(l.summary().accepted_entries) == 1

    def test_mean_causality(self) -> None:
        l = MoralLedger()
        l.record(_entry("1", "w", 0.4))
        l.record(_entry("2", "w", 0.8))
        import math
        assert math.isclose(l.summary().mean_causality, 0.6, abs_tol=1e-5)

    def test_m_axis_one_on_empty_ledger(self) -> None:
        l = MoralLedger()
        assert l.moral_grounding_axis() == 1.0

    def test_m_axis_drops_with_anonymous(self) -> None:
        l = MoralLedger()
        l.record(_entry("1", "w", 0.9))
        before = l.moral_grounding_axis()
        l.record(_entry("2", None))
        after = l.moral_grounding_axis()
        assert after < before

    def test_rejects_causality_out_of_range(self) -> None:
        l = MoralLedger()
        with pytest.raises(ValueError):
            l.record(_entry("1", "w", 2))

    def test_entry_count_both_accepted_and_refused(self) -> None:
        l = MoralLedger()
        l.record(_entry("1", "w"))
        l.record(_entry("2", None))
        assert l.summary().entry_count == 2
