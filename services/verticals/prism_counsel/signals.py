from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_counsel_deadline",
            "source": "matter_calendar",
            "kind": "deadline_risk",
            "summary": "Response brief due in 6 days; draft 0% complete",
            "weight": 0.9,
        },
        {
            "id": "sig_counsel_obligation",
            "source": "contract",
            "kind": "obligation_gap",
            "summary": "Indemnification carve-out missing from MSA-2026-014 redline",
            "weight": 0.75,
        },
        {
            "id": "sig_counsel_evidence_pending",
            "source": "discovery",
            "kind": "evidence_state",
            "summary": "Two custodian preservation notices unconfirmed",
            "weight": 0.7,
        },
    ]
