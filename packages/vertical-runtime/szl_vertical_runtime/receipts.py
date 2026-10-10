"""Strict append-only decision receipts for the local vertical runtime."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Mapping

from .canonical import digest_value, utc_now
from .ledger import LedgerError, OutcomeLedger


RECEIPT_SCHEMA = "szl.vertical-decision-receipt/v2"
RECEIPT_KEYS = {
    "authority_state",
    "decision",
    "decision_id",
    "evidence_digests",
    "execution_permitted",
    "external_side_effects",
    "formula_receipts",
    "human_actor_id",
    "limitations",
    "receipt_id",
    "receipt_kind",
    "recorded_at",
    "replay_digest",
    "schema",
    "source_manifest_sha256",
    "vertical_id",
}
DECISION_KEYS = {
    "approval_requirements",
    "decision",
    "decision_digest",
    "decision_id",
    "evaluated_at",
    "evidence_state",
    "execution_permitted",
    "external_side_effects",
    "formula_bindings",
    "manifest_digest",
    "matched_rule",
    "mode",
    "reasons",
    "request_digest",
    "request_id",
    "schema",
    "vertical_id",
}
DECISION_LEDGER_KEYS = {"ledger_event_hash", "ledger_event_id"}
HEX_64 = re.compile(r"^[0-9a-f]{64}$")
DECISION_ID = re.compile(r"^decision:[0-9a-f]{64}$")
RECEIPT_ID = re.compile(r"^(?:receipt|human-receipt):[0-9a-f]{64}$")
HUMAN_ACTOR_ID = re.compile(r"^[A-Za-z0-9._:@/+-]{1,128}$")
INITIAL_LIMITATIONS = (
    "EVIDENCE_BYTES_NOT_VERIFIED",
    "FORMULAS_NOT_EXECUTED",
    "LOCAL_PERSISTENCE_UNVERIFIED",
    "NOT_PRODUCTION_READY",
    "NO_EXTERNAL_EFFECTORS",
)


class ReceiptError(ValueError):
    """Receipt construction, validation, or persistence failed closed."""


class ReceiptConflict(ReceiptError):
    """A deterministic receipt identifier is already bound to other content."""


def _validated_decision_payload(
    decision: Mapping[str, Any],
    *,
    source_manifest_sha256: str,
    vertical_id: str,
) -> dict[str, Any]:
    if not isinstance(decision, Mapping):
        raise ReceiptError("decision must be an object")
    keys = set(decision)
    if keys != DECISION_KEYS and keys != DECISION_KEYS | DECISION_LEDGER_KEYS:
        raise ReceiptError("decision has missing or unknown fields")
    if decision.get("schema") != "szl.vertical-decision/v1":
        raise ReceiptError("decision schema is invalid")
    decision_id = decision.get("decision_id")
    if not isinstance(decision_id, str) or not DECISION_ID.fullmatch(decision_id):
        raise ReceiptError("decision_id is invalid")
    if decision.get("vertical_id") != vertical_id:
        raise ReceiptError("decision vertical_id is invalid")
    if decision.get(
        "manifest_digest"
    ) != source_manifest_sha256 or not HEX_64.fullmatch(source_manifest_sha256):
        raise ReceiptError("decision source manifest identity is invalid")
    if decision.get("mode") != "ENFORCE":
        raise ReceiptError("only ENFORCE decisions may produce receipts")
    if decision.get("decision") not in {"DENY", "ESCALATE", "REQUIRE_APPROVAL"}:
        raise ReceiptError("decision state is invalid")
    if decision.get("execution_permitted") is not False:
        raise ReceiptError("decision must never permit execution")
    if decision.get("external_side_effects") != []:
        raise ReceiptError("decision external side effects must be empty")
    if not _timestamp(decision.get("evaluated_at")):
        raise ReceiptError("decision evaluated_at is invalid")
    request_digest = decision.get("request_digest")
    if not isinstance(request_digest, str) or not HEX_64.fullmatch(request_digest):
        raise ReceiptError("decision request_digest is invalid")
    request_id = decision.get("request_id")
    if not isinstance(request_id, str) or not request_id.strip():
        raise ReceiptError("decision request_id is invalid")

    payload = {key: decision[key] for key in DECISION_KEYS}
    stored_digest = payload.pop("decision_digest")
    if not isinstance(stored_digest, str) or not HEX_64.fullmatch(stored_digest):
        raise ReceiptError("decision_digest is invalid")
    if stored_digest != digest_value(payload):
        raise ReceiptError("decision payload digest is invalid")
    payload["decision_digest"] = stored_digest

    if keys == DECISION_KEYS | DECISION_LEDGER_KEYS:
        if decision.get("ledger_event_id") != decision_id:
            raise ReceiptError("decision ledger event identity is invalid")
        event_hash = decision.get("ledger_event_hash")
        if not isinstance(event_hash, str) or not HEX_64.fullmatch(event_hash):
            raise ReceiptError("decision ledger event hash is invalid")
    return payload


def _stored_decision(
    event: Mapping[str, Any] | None,
    *,
    decision_id: str,
    source_manifest_sha256: str,
    vertical_id: str,
) -> dict[str, Any]:
    if event is None:
        raise ReceiptError("decision is not recorded for this vertical")
    payload = event.get("payload")
    if (
        event.get("event_id") != decision_id
        or event.get("event_type") != "DECISION"
        or event.get("subject_id") != decision_id
        or event.get("vertical_id") != vertical_id
        or not isinstance(payload, Mapping)
    ):
        raise ReceiptError("stored decision event identity is invalid")
    decision = _validated_decision_payload(
        payload,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    if decision["decision_id"] != decision_id:
        raise ReceiptError("stored decision payload identity is invalid")
    return decision


def _timestamp(value: object) -> bool:
    if not isinstance(value, str) or not value:
        return False
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False
    return parsed.tzinfo is not None and parsed.utcoffset() is not None


def _unique_strings(value: object, *, field: str, allow_empty: bool) -> list[str]:
    if not isinstance(value, list) or (not value and not allow_empty):
        raise ReceiptError(
            f"{field} must be a {'possibly empty' if allow_empty else 'nonempty'} string array"
        )
    result: list[str] = []
    seen: set[str] = set()
    for item in value:
        if not isinstance(item, str) or not item.strip():
            raise ReceiptError(f"{field} must contain only nonempty strings")
        normalized = item.strip()
        if normalized in seen:
            raise ReceiptError(f"{field} must not contain duplicates")
        seen.add(normalized)
        result.append(normalized)
    return result


def initial_receipt_id(
    *, decision_digest: str, source_manifest_sha256: str, vertical_id: str
) -> str:
    return "receipt:" + digest_value(
        {
            "decision_digest": decision_digest,
            "scope": "szl.vertical-decision-receipt-id/v1",
            "source_manifest_sha256": source_manifest_sha256,
            "vertical_id": vertical_id,
        }
    )


def human_receipt_id(
    *, decision_id: str, source_manifest_sha256: str, vertical_id: str
) -> str:
    return "human-receipt:" + digest_value(
        {
            "decision_id": decision_id,
            "scope": "szl.vertical-human-disposition-receipt-id/v1",
            "source_manifest_sha256": source_manifest_sha256,
            "vertical_id": vertical_id,
        }
    )


def build_initial_receipt(
    *,
    decision: Mapping[str, Any],
    request: Mapping[str, Any],
    source_manifest_sha256: str,
) -> dict[str, Any]:
    if not isinstance(decision, Mapping):
        raise ReceiptError("decision must be an object")
    vertical_id = decision.get("vertical_id")
    if not isinstance(vertical_id, str) or not vertical_id:
        raise ReceiptError("decision vertical_id is invalid")
    decision = _validated_decision_payload(
        decision,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    decision_id = decision.get("decision_id")
    decision_digest = decision.get("decision_digest")
    if not isinstance(decision_id, str) or not DECISION_ID.fullmatch(decision_id):
        raise ReceiptError("decision_id is invalid")
    if not isinstance(decision_digest, str) or not HEX_64.fullmatch(decision_digest):
        raise ReceiptError("decision_digest is invalid")
    if decision.get("manifest_digest") != source_manifest_sha256:
        raise ReceiptError("decision manifest identity does not match source bytes")
    if not isinstance(request, Mapping):
        raise ReceiptError("request must be an object")
    try:
        request_digest = digest_value(dict(request))
    except (TypeError, ValueError) as error:
        raise ReceiptError(
            "request must contain finite canonical JSON values"
        ) from error
    if request_digest != decision["request_digest"]:
        raise ReceiptError("request digest does not match the recorded decision")
    mapped = {
        "DENY": ("DENY", "DENIED"),
        "ESCALATE": ("ESCALATE", "APPROVAL_REQUIRED"),
        "REQUIRE_APPROVAL": ("RECOMMEND", "APPROVAL_REQUIRED"),
    }.get(decision.get("decision"))
    if mapped is None:
        raise ReceiptError("decision state cannot be mapped to a bounded receipt")

    evidence = request.get("evidence")
    if not isinstance(evidence, list):
        raise ReceiptError("request evidence must be an array")
    evidence_digests: list[str] = []
    limitations = set(INITIAL_LIMITATIONS)
    for item in evidence:
        if not isinstance(item, Mapping):
            raise ReceiptError("request evidence item must be an object")
        digest = item.get("digest")
        if not isinstance(digest, str) or not re.fullmatch(
            r"sha256:[0-9a-f]{64}", digest
        ):
            raise ReceiptError("request evidence digest is invalid")
        evidence_digests.append(digest.removeprefix("sha256:"))
        for limitation in _unique_strings(
            item.get("limitations"),
            field="request evidence limitations",
            allow_empty=True,
        ):
            limitations.add(limitation)
    if len(evidence_digests) != len(set(evidence_digests)):
        raise ReceiptError("request evidence digests must be unique")

    receipt = {
        "authority_state": mapped[1],
        "decision": mapped[0],
        "decision_id": decision_id,
        "evidence_digests": evidence_digests,
        "execution_permitted": False,
        "external_side_effects": [],
        "formula_receipts": [],
        "human_actor_id": None,
        "limitations": sorted(limitations),
        "receipt_id": initial_receipt_id(
            decision_digest=decision_digest,
            source_manifest_sha256=source_manifest_sha256,
            vertical_id=vertical_id,
        ),
        "receipt_kind": "INITIAL",
        "recorded_at": decision.get("evaluated_at"),
        "replay_digest": decision_digest,
        "schema": RECEIPT_SCHEMA,
        "source_manifest_sha256": source_manifest_sha256,
        "vertical_id": vertical_id,
    }
    validate_receipt(receipt, source_manifest_sha256=source_manifest_sha256)
    return receipt


def validate_receipt(
    receipt: Mapping[str, Any], *, source_manifest_sha256: str
) -> None:
    if not isinstance(receipt, Mapping) or set(receipt) != RECEIPT_KEYS:
        raise ReceiptError("receipt has missing or unknown fields")
    if receipt.get("schema") != RECEIPT_SCHEMA:
        raise ReceiptError("receipt schema is invalid")
    if receipt.get(
        "source_manifest_sha256"
    ) != source_manifest_sha256 or not HEX_64.fullmatch(source_manifest_sha256):
        raise ReceiptError("receipt source manifest identity is invalid")
    vertical_id = receipt.get("vertical_id")
    if not isinstance(vertical_id, str) or not vertical_id:
        raise ReceiptError("receipt vertical_id is invalid")
    decision_id = receipt.get("decision_id")
    if not isinstance(decision_id, str) or not DECISION_ID.fullmatch(decision_id):
        raise ReceiptError("receipt decision_id is invalid")
    receipt_id = receipt.get("receipt_id")
    if not isinstance(receipt_id, str) or not RECEIPT_ID.fullmatch(receipt_id):
        raise ReceiptError("receipt_id is invalid")
    replay_digest = receipt.get("replay_digest")
    if not isinstance(replay_digest, str) or not HEX_64.fullmatch(replay_digest):
        raise ReceiptError("receipt replay_digest is invalid")
    if receipt.get("decision") not in {"RECOMMEND", "DENY", "ESCALATE"}:
        raise ReceiptError("receipt decision is invalid")
    if receipt.get("authority_state") not in {
        "APPROVAL_REQUIRED",
        "APPROVED",
        "DENIED",
    }:
        raise ReceiptError("receipt authority_state is invalid")
    if receipt.get("receipt_kind") not in {"INITIAL", "HUMAN_DISPOSITION"}:
        raise ReceiptError("receipt kind is invalid")
    if receipt.get("execution_permitted") is not False:
        raise ReceiptError("receipt must never permit execution")
    if receipt.get("external_side_effects") != []:
        raise ReceiptError("receipt external side effects must be empty")
    if receipt.get("formula_receipts") != []:
        raise ReceiptError("formula receipts must be empty until formulas execute")
    evidence_digests = _unique_strings(
        receipt.get("evidence_digests"),
        field="receipt evidence_digests",
        allow_empty=True,
    )
    if any(not HEX_64.fullmatch(item) for item in evidence_digests):
        raise ReceiptError("receipt evidence digest is invalid")
    _unique_strings(
        receipt.get("limitations"), field="receipt limitations", allow_empty=False
    )
    if not _timestamp(receipt.get("recorded_at")):
        raise ReceiptError("receipt recorded_at is invalid")

    kind = receipt["receipt_kind"]
    actor = receipt.get("human_actor_id")
    if kind == "INITIAL":
        expected_id = initial_receipt_id(
            decision_digest=replay_digest,
            source_manifest_sha256=source_manifest_sha256,
            vertical_id=vertical_id,
        )
        if receipt_id != expected_id or actor is not None:
            raise ReceiptError("initial receipt identity or actor is invalid")
        expected_authority = (
            "DENIED" if receipt["decision"] == "DENY" else "APPROVAL_REQUIRED"
        )
        if receipt["authority_state"] != expected_authority:
            raise ReceiptError("initial receipt decision and authority state diverge")
    else:
        expected_id = human_receipt_id(
            decision_id=decision_id,
            source_manifest_sha256=source_manifest_sha256,
            vertical_id=vertical_id,
        )
        if receipt_id != expected_id:
            raise ReceiptError("human disposition receipt identity is invalid")
        if not isinstance(actor, str) or not HUMAN_ACTOR_ID.fullmatch(actor):
            raise ReceiptError("human_actor_id is invalid")
        if receipt.get("authority_state") == "APPROVAL_REQUIRED":
            raise ReceiptError("human disposition must resolve the authority state")
        if (
            receipt["authority_state"] == "APPROVED"
            and receipt["decision"] != "RECOMMEND"
        ):
            raise ReceiptError("only a recommendation may be locally approved")
        if receipt["authority_state"] == "DENIED" and receipt["decision"] != "DENY":
            raise ReceiptError("a denied human disposition must remain denied")


def _stored_receipt(
    event: Mapping[str, Any],
    *,
    ledger: OutcomeLedger,
    event_types: set[str],
    receipt_id: str,
    source_manifest_sha256: str,
    vertical_id: str,
) -> dict[str, Any]:
    payload = event.get("payload")
    if (
        event.get("event_id") != receipt_id
        or event.get("event_type") not in event_types
        or event.get("vertical_id") != vertical_id
        or not isinstance(payload, Mapping)
    ):
        raise ReceiptError("stored receipt event identity is invalid")
    stored = dict(payload)
    validate_receipt(stored, source_manifest_sha256=source_manifest_sha256)
    expected_event_type = (
        "DECISION_RECEIPT"
        if stored["receipt_kind"] == "INITIAL"
        else "HUMAN_DISPOSITION_RECEIPT"
    )
    if (
        event.get("event_type") != expected_event_type
        or event.get("subject_id") != stored["decision_id"]
        or event.get("occurred_at") != stored["recorded_at"]
        or stored["receipt_id"] != receipt_id
        or stored["vertical_id"] != vertical_id
    ):
        raise ReceiptError("stored receipt event semantics are invalid")
    _validate_receipt_parent(
        ledger,
        event=event,
        receipt=stored,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    return stored


def _validate_receipt_parent(
    ledger: OutcomeLedger,
    *,
    event: Mapping[str, Any],
    receipt: Mapping[str, Any],
    source_manifest_sha256: str,
    vertical_id: str,
) -> None:
    decision_event = ledger.get(receipt["decision_id"])
    decision = _stored_decision(
        decision_event,
        decision_id=receipt["decision_id"],
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    if (
        receipt["replay_digest"] != decision["decision_digest"]
        or decision_event["sequence"] >= event["sequence"]
    ):
        raise ReceiptError("receipt parent decision identity or ordering is invalid")
    if not set(INITIAL_LIMITATIONS).issubset(receipt["limitations"]):
        raise ReceiptError("receipt is missing required local limitations")
    if receipt["receipt_kind"] == "INITIAL":
        expected_decision = {
            "DENY": "DENY",
            "ESCALATE": "ESCALATE",
            "REQUIRE_APPROVAL": "RECOMMEND",
        }[decision["decision"]]
        if (
            receipt["decision"] != expected_decision
            or receipt["recorded_at"] != decision["evaluated_at"]
        ):
            raise ReceiptError("initial receipt diverges from its parent decision")
        return

    initial_id = initial_receipt_id(
        decision_digest=decision["decision_digest"],
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    initial_event = ledger.get(initial_id)
    if initial_event is None:
        raise ReceiptError("human disposition initial receipt is missing")
    initial = _stored_receipt(
        initial_event,
        ledger=ledger,
        event_types={"DECISION_RECEIPT"},
        receipt_id=initial_id,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    if (
        initial["authority_state"] != "APPROVAL_REQUIRED"
        or initial_event["sequence"] >= event["sequence"]
    ):
        raise ReceiptError("human disposition parent state or ordering is invalid")
    expected = {
        **initial,
        "authority_state": receipt["authority_state"],
        "decision": "DENY"
        if receipt["authority_state"] == "DENIED"
        else initial["decision"],
        "human_actor_id": receipt["human_actor_id"],
        "limitations": sorted(
            set(initial["limitations"]) | {"HUMAN_IDENTITY_CALLER_DECLARED_UNVERIFIED"}
        ),
        "receipt_id": receipt["receipt_id"],
        "receipt_kind": "HUMAN_DISPOSITION",
        "recorded_at": receipt["recorded_at"],
    }
    if dict(receipt) != expected:
        raise ReceiptError("human disposition diverges from its initial receipt")


def persist_initial_receipt(
    ledger: OutcomeLedger,
    *,
    decision: Mapping[str, Any],
    request: Mapping[str, Any],
    source_manifest_sha256: str,
) -> tuple[dict[str, Any], bool]:
    if ledger.verify()["status"] == "INVALID":
        raise ReceiptError("decision ledger integrity is invalid")
    decision_id = decision.get("decision_id")
    vertical_id = decision.get("vertical_id")
    if not isinstance(decision_id, str) or not DECISION_ID.fullmatch(decision_id):
        raise ReceiptError("decision_id is invalid")
    if not isinstance(vertical_id, str) or not vertical_id:
        raise ReceiptError("decision vertical_id is invalid")
    supplied_decision = _validated_decision_payload(
        decision,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    recorded_decision = _stored_decision(
        ledger.get(decision_id),
        decision_id=decision_id,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    if supplied_decision != recorded_decision:
        raise ReceiptError("supplied decision diverges from the recorded decision")
    receipt = build_initial_receipt(
        decision=decision,
        request=request,
        source_manifest_sha256=source_manifest_sha256,
    )
    try:
        ledger.append(
            event_type="DECISION_RECEIPT",
            vertical_id=receipt["vertical_id"],
            subject_id=receipt["decision_id"],
            payload=receipt,
            event_id=receipt["receipt_id"],
            occurred_at=receipt["recorded_at"],
        )
        return receipt, True
    except LedgerError as error:
        if ledger.verify()["status"] == "INVALID":
            raise ReceiptError("decision ledger integrity is invalid") from error
        existing = ledger.get(receipt["receipt_id"])
        if existing is None:
            raise ReceiptError("initial receipt persistence failed closed") from error
        stored = _stored_receipt(
            existing,
            ledger=ledger,
            event_types={"DECISION_RECEIPT"},
            receipt_id=receipt["receipt_id"],
            source_manifest_sha256=source_manifest_sha256,
            vertical_id=receipt["vertical_id"],
        )
        if stored != receipt:
            raise ReceiptConflict(
                "initial receipt identifier is bound to divergent content"
            ) from error
        return stored, False


def persist_human_disposition(
    ledger: OutcomeLedger,
    *,
    authority_state: str,
    decision_id: str,
    human_actor_id: str,
    source_manifest_sha256: str,
    vertical_id: str,
) -> tuple[dict[str, Any], bool]:
    if authority_state not in {"APPROVED", "DENIED"}:
        raise ReceiptError("authority_state must be APPROVED or DENIED")
    if not isinstance(human_actor_id, str) or not HUMAN_ACTOR_ID.fullmatch(
        human_actor_id
    ):
        raise ReceiptError("human_actor_id is invalid")
    if not DECISION_ID.fullmatch(decision_id):
        raise ReceiptError("decision_id is invalid")
    if ledger.verify()["status"] == "INVALID":
        raise ReceiptError("decision ledger integrity is invalid")

    decision = _stored_decision(
        ledger.get(decision_id),
        decision_id=decision_id,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    initial_id = initial_receipt_id(
        decision_digest=str(decision.get("decision_digest", "")),
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    initial_event = ledger.get(initial_id)
    if initial_event is None:
        raise ReceiptError("initial decision receipt is missing")
    initial = _stored_receipt(
        initial_event,
        ledger=ledger,
        event_types={"DECISION_RECEIPT"},
        receipt_id=initial_id,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    if initial["authority_state"] != "APPROVAL_REQUIRED":
        raise ReceiptError("decision is not awaiting a human disposition")
    if authority_state == "APPROVED" and initial["decision"] != "RECOMMEND":
        raise ReceiptError("only a bounded recommendation can be locally approved")

    receipt_id = human_receipt_id(
        decision_id=decision_id,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )
    existing = ledger.get(receipt_id)
    if existing is not None:
        stored = _stored_receipt(
            existing,
            ledger=ledger,
            event_types={"HUMAN_DISPOSITION_RECEIPT"},
            receipt_id=receipt_id,
            source_manifest_sha256=source_manifest_sha256,
            vertical_id=vertical_id,
        )
        if (
            stored.get("authority_state") != authority_state
            or stored.get("human_actor_id") != human_actor_id
        ):
            raise ReceiptConflict(
                "human disposition already exists with different content"
            )
        return stored, False

    receipt = {
        **initial,
        "authority_state": authority_state,
        "decision": "DENY" if authority_state == "DENIED" else initial["decision"],
        "human_actor_id": human_actor_id,
        "limitations": sorted(
            set(initial["limitations"]) | {"HUMAN_IDENTITY_CALLER_DECLARED_UNVERIFIED"}
        ),
        "receipt_id": receipt_id,
        "receipt_kind": "HUMAN_DISPOSITION",
        "recorded_at": utc_now(),
    }
    validate_receipt(receipt, source_manifest_sha256=source_manifest_sha256)
    try:
        ledger.append(
            event_type="HUMAN_DISPOSITION_RECEIPT",
            vertical_id=vertical_id,
            subject_id=decision_id,
            payload=receipt,
            event_id=receipt_id,
            occurred_at=receipt["recorded_at"],
        )
        return receipt, True
    except LedgerError as error:
        if ledger.verify()["status"] == "INVALID":
            raise ReceiptError("decision ledger integrity is invalid") from error
        existing = ledger.get(receipt_id)
        if existing is None:
            raise ReceiptError("human disposition persistence failed closed") from error
        stored = _stored_receipt(
            existing,
            ledger=ledger,
            event_types={"HUMAN_DISPOSITION_RECEIPT"},
            receipt_id=receipt_id,
            source_manifest_sha256=source_manifest_sha256,
            vertical_id=vertical_id,
        )
        if (
            stored.get("authority_state") != authority_state
            or stored.get("human_actor_id") != human_actor_id
        ):
            raise ReceiptConflict(
                "human disposition already exists with different content"
            ) from error
        return stored, False


def get_receipt(
    ledger: OutcomeLedger,
    *,
    receipt_id: str,
    source_manifest_sha256: str,
    vertical_id: str,
) -> dict[str, Any] | None:
    if not RECEIPT_ID.fullmatch(receipt_id):
        return None
    if ledger.verify()["status"] == "INVALID":
        raise ReceiptError("decision ledger integrity is invalid")
    event = ledger.get(receipt_id)
    if event is None:
        return None
    if (
        event.get("event_type") not in {"DECISION_RECEIPT", "HUMAN_DISPOSITION_RECEIPT"}
        or event.get("vertical_id") != vertical_id
    ):
        return None
    return _stored_receipt(
        event,
        ledger=ledger,
        event_types={"DECISION_RECEIPT", "HUMAN_DISPOSITION_RECEIPT"},
        receipt_id=receipt_id,
        source_manifest_sha256=source_manifest_sha256,
        vertical_id=vertical_id,
    )


__all__ = [
    "ReceiptConflict",
    "ReceiptError",
    "build_initial_receipt",
    "get_receipt",
    "human_receipt_id",
    "initial_receipt_id",
    "persist_human_disposition",
    "persist_initial_receipt",
    "validate_receipt",
]
