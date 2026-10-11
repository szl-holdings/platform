"""Fail-closed recommendation and policy-shadow evaluation."""

from __future__ import annotations

import re
import threading
from copy import deepcopy
from typing import Any, Mapping

from .canonical import digest_value, utc_now
from .ledger import LedgerError, OutcomeLedger
from .receipts import (
    ReceiptError,
    build_initial_receipt,
    get_receipt,
    initial_receipt_id,
)


DECISIONS = {"DENY", "ESCALATE", "REQUIRE_APPROVAL"}
REQUEST_FIELDS = frozenset(
    {"request_id", "action", "workflow", "principal", "evidence"}
)
PRINCIPAL_FIELDS = frozenset({"id", "authority_claims"})
EVIDENCE_FIELDS = frozenset(
    {"id", "digest", "evidence_class", "freshness", "limitations"}
)
EVIDENCE_CLASSES = frozenset({"OBSERVED", "MODELED", "UNVERIFIED", "UNAVAILABLE"})
FRESHNESS_STATES = frozenset({"CURRENT", "STALE", "UNKNOWN"})
KILLINCHU_EFFECTOR_TERMS = (
    "autonomous interdiction",
    "engage target",
    "missile",
    "munition",
    "navigation control",
    "operational targeting",
    "physical effector",
    "target engagement",
    "weapon",
)
DIGEST_HANDLE = re.compile(r"^sha256:[0-9a-f]{64}$")
REQUEST_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")


class PolicyError(ValueError):
    pass


class PolicyPersistenceError(PolicyError):
    """Local decision persistence or replay integrity is unavailable."""


def _normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def _exact_action_match(requested: str, rule: str) -> bool:
    left = _normalized(requested)
    right = _normalized(rule)
    return bool(left and right and left == right)


def _phrase_match(requested: str, rule: str) -> bool:
    """Match a normalized token phrase without admitting intra-word substrings."""

    requested_tokens = tuple(_normalized(requested).split())
    rule_tokens = tuple(_normalized(rule).split())
    if (
        not requested_tokens
        or not rule_tokens
        or len(rule_tokens) > len(requested_tokens)
    ):
        return False
    width = len(rule_tokens)
    return any(
        requested_tokens[index : index + width] == rule_tokens
        for index in range(len(requested_tokens) - width + 1)
    )


def _require_exact_fields(
    value: Any, expected: frozenset[str], label: str
) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise PolicyError(f"{label} must be an object")
    actual = set(value)
    if actual != expected:
        missing = sorted(expected - actual)
        unknown = sorted(str(item) for item in actual - expected)
        raise PolicyError(
            f"{label} fields must be exact; missing={missing!r}, unknown={unknown!r}"
        )
    return value


def _validate_unique_string_list(value: Any, label: str) -> None:
    if not isinstance(value, list):
        raise PolicyError(f"{label} must be an array")
    seen: set[str] = set()
    for index, item in enumerate(value):
        if type(item) is not str or not item.strip():
            raise PolicyError(f"{label}[{index}] must be a nonempty string")
        key = item.strip().casefold()
        if key in seen:
            raise PolicyError(f"{label}[{index}] is a duplicate")
        seen.add(key)


def _validate_request_contract(
    cell: Mapping[str, Any], request: Mapping[str, Any]
) -> tuple[str, str, list[Mapping[str, Any]]]:
    _require_exact_fields(request, REQUEST_FIELDS, "request")

    request_id = request["request_id"]
    if type(request_id) is not str or not REQUEST_ID.fullmatch(request_id):
        raise PolicyError("request.request_id is invalid")
    action = request["action"]
    if type(action) is not str or not action.strip():
        raise PolicyError("request.action must be a nonempty string")
    workflow = request["workflow"]
    if type(workflow) is not str or workflow not in cell.get("core_workflows", []):
        raise PolicyError("request.workflow is not admitted by the vertical cell")

    principal = _require_exact_fields(
        request["principal"], PRINCIPAL_FIELDS, "request.principal"
    )
    principal_id = principal["id"]
    if type(principal_id) is not str or not principal_id.strip():
        raise PolicyError("request.principal.id must be a nonempty string")
    _validate_unique_string_list(
        principal["authority_claims"], "request.principal.authority_claims"
    )

    evidence = request["evidence"]
    if not isinstance(evidence, list):
        raise PolicyError("request.evidence must be an array")
    seen_ids: set[str] = set()
    seen_digests: set[str] = set()
    validated_evidence: list[Mapping[str, Any]] = []
    for index, raw_item in enumerate(evidence):
        label = f"request.evidence[{index}]"
        item = _require_exact_fields(raw_item, EVIDENCE_FIELDS, label)
        evidence_id = item["id"]
        if type(evidence_id) is not str or not evidence_id.strip():
            raise PolicyError(f"{label}.id must be a nonempty string")
        evidence_key = evidence_id.strip().casefold()
        if evidence_key in seen_ids:
            raise PolicyError(f"{label}.id is a duplicate")
        seen_ids.add(evidence_key)
        digest = item["digest"]
        if type(digest) is not str or not DIGEST_HANDLE.fullmatch(digest):
            raise PolicyError(f"{label}.digest must be a sha256 content handle")
        if digest in seen_digests:
            raise PolicyError(f"{label}.digest is a duplicate")
        seen_digests.add(digest)
        evidence_class = item["evidence_class"]
        if type(evidence_class) is not str or evidence_class not in EVIDENCE_CLASSES:
            raise PolicyError(
                f"{label}.evidence_class must be one of {sorted(EVIDENCE_CLASSES)!r}"
            )
        freshness = item["freshness"]
        if type(freshness) is not str or freshness not in FRESHNESS_STATES:
            raise PolicyError(
                f"{label}.freshness must be one of {sorted(FRESHNESS_STATES)!r}"
            )
        _validate_unique_string_list(item["limitations"], f"{label}.limitations")
        validated_evidence.append(item)
    return request_id, action, validated_evidence


class DecisionEngine:
    """Evaluate recommendations without executing external side effects."""

    def __init__(
        self,
        cells: Mapping[str, Mapping[str, Any]],
        *,
        ledger: OutcomeLedger | None = None,
    ):
        self.cells = {key: deepcopy(dict(value)) for key, value in cells.items()}
        self.ledger = ledger
        self._lock = threading.RLock()

    def _cell(self, vertical_id: str) -> dict[str, Any]:
        try:
            return self.cells[vertical_id]
        except KeyError as error:
            raise PolicyError(f"unknown vertical_id: {vertical_id}") from error

    def evaluate(
        self,
        vertical_id: str,
        request: Mapping[str, Any],
        *,
        mode: str = "ENFORCE",
        record: bool = True,
    ) -> dict[str, Any]:
        with self._lock:
            return self._evaluate(
                vertical_id,
                request,
                mode=mode,
                record=record,
            )

    @staticmethod
    def _stored_decision(
        existing: Mapping[str, Any],
        *,
        decision_id: str,
        manifest_digest: str,
        mode: str,
        request_digest: str,
        request_id: str,
        vertical_id: str,
    ) -> dict[str, Any]:
        payload = existing.get("payload")
        if (
            existing.get("event_id") != decision_id
            or existing.get("event_type") != "DECISION"
            or existing.get("subject_id") != decision_id
            or existing.get("vertical_id") != vertical_id
            or not isinstance(payload, Mapping)
            or payload.get("decision_id") != decision_id
            or payload.get("manifest_digest") != manifest_digest
            or payload.get("mode") != mode
            or payload.get("request_digest") != request_digest
            or payload.get("request_id") != request_id
            or payload.get("vertical_id") != vertical_id
        ):
            raise PolicyError(
                "DIVERGENT_REPLAY: request_id is bound to different canonical request content, mode, or vertical"
            )
        unsigned_payload = dict(payload)
        stored_digest = unsigned_payload.pop("decision_digest", None)
        if stored_digest != digest_value(unsigned_payload):
            raise PolicyPersistenceError("decision ledger payload digest is invalid")
        return {
            **dict(payload),
            "ledger_event_hash": existing["event_hash"],
            "ledger_event_id": existing["event_id"],
        }

    def _validated_replay(
        self,
        existing: Mapping[str, Any],
        *,
        decision_id: str,
        manifest_digest: str,
        mode: str,
        request: Mapping[str, Any],
        request_digest: str,
        request_id: str,
        vertical_id: str,
    ) -> dict[str, Any]:
        stored = self._stored_decision(
            existing,
            decision_id=decision_id,
            manifest_digest=manifest_digest,
            mode=mode,
            request_digest=request_digest,
            request_id=request_id,
            vertical_id=vertical_id,
        )
        if mode == "ENFORCE":
            if self.ledger is None:
                raise PolicyError("decision replay requires a ledger")
            try:
                receipt = get_receipt(
                    self.ledger,
                    receipt_id=initial_receipt_id(
                        decision_digest=stored["decision_digest"],
                        source_manifest_sha256=manifest_digest,
                        vertical_id=vertical_id,
                    ),
                    source_manifest_sha256=manifest_digest,
                    vertical_id=vertical_id,
                )
                expected = build_initial_receipt(
                    decision=stored,
                    request=request,
                    source_manifest_sha256=manifest_digest,
                )
                if receipt != expected:
                    raise ReceiptError(
                        "initial decision receipt is missing or divergent"
                    )
            except ReceiptError as error:
                raise PolicyPersistenceError(
                    "decision initial receipt integrity is invalid"
                ) from error
        return stored

    def _evaluate(
        self,
        vertical_id: str,
        request: Mapping[str, Any],
        *,
        mode: str = "ENFORCE",
        record: bool = True,
    ) -> dict[str, Any]:
        if mode not in {"ENFORCE", "LOG_ONLY"}:
            raise PolicyError("mode must be ENFORCE or LOG_ONLY")
        if not isinstance(request, Mapping):
            raise PolicyError("request must be an object")
        cell = self._cell(vertical_id)
        request_id, action, evidence = _validate_request_contract(cell, request)
        manifest_digest = digest_value(cell)
        request_digest = digest_value(dict(request))
        decision_id = "decision:" + digest_value(
            {
                "request_id": request_id,
                "scope": "szl.vertical-decision-id/v1",
                "vertical_id": vertical_id,
            }
        )
        if record and self.ledger is not None:
            verification = self.ledger.verify()
            if verification["status"] == "INVALID":
                raise PolicyPersistenceError("decision ledger integrity is invalid")
            existing = self.ledger.get(decision_id)
            if existing is not None:
                return self._validated_replay(
                    existing,
                    decision_id=decision_id,
                    manifest_digest=manifest_digest,
                    mode=mode,
                    request=request,
                    request_digest=request_digest,
                    request_id=request_id,
                    vertical_id=vertical_id,
                )
        decision = "ESCALATE"
        reasons: list[str] = []
        matched_rule: str | None = None

        for prohibited in cell.get("prohibited_actions", []):
            if _phrase_match(action, str(prohibited)):
                decision = "DENY"
                matched_rule = str(prohibited)
                reasons.append("PROHIBITED_ACTION")
                break
        if vertical_id == "killinchu" and any(
            _phrase_match(action, term) for term in KILLINCHU_EFFECTOR_TERMS
        ):
            decision = "DENY"
            matched_rule = "PUBLIC_EFFECTOR_BOUNDARY"
            reasons.append("PHYSICAL_EFFECTOR_FORBIDDEN")

        if not reasons and not evidence:
            decision = "DENY"
            reasons.append("MISSING_EVIDENCE")
        if not reasons and any(
            item["freshness"] == "STALE" or item["evidence_class"] == "UNAVAILABLE"
            for item in evidence
        ):
            decision = "DENY"
            reasons.append("EVIDENCE_STALE_OR_UNAVAILABLE")
        if not reasons and any(
            item["freshness"] == "UNKNOWN" or item["evidence_class"] == "UNVERIFIED"
            for item in evidence
        ):
            decision = "ESCALATE"
            reasons.append("EVIDENCE_UNKNOWN_OR_UNVERIFIED")
        if not reasons:
            for allowed in cell.get("allowed_actions", []):
                if _exact_action_match(action, str(allowed)):
                    decision = "REQUIRE_APPROVAL"
                    matched_rule = str(allowed)
                    reasons.append("HUMAN_AUTHORITY_REQUIRED")
                    break
        if not reasons:
            if vertical_id == "killinchu":
                decision = "DENY"
                reasons.append("HIGH_STAKES_ACTION_NOT_ADMITTED")
            else:
                decision = "ESCALATE"
                reasons.append("ACTION_NOT_ADMITTED")

        if decision not in DECISIONS:
            raise AssertionError("unexpected policy decision")
        result: dict[str, Any] = {
            "approval_requirements": list(cell.get("human_authority", [])),
            "decision": decision,
            "decision_id": decision_id,
            "evaluated_at": utc_now(),
            "evidence_state": (
                "PRESENT_UNVERIFIED"
                if isinstance(evidence, list) and evidence
                else "ABSENT"
            ),
            "execution_permitted": False,
            "external_side_effects": [],
            "formula_bindings": [
                {"formula_id": formula_id, "authority": "ADVISORY_ONLY"}
                for formula_id in cell.get("formula_bindings", [])
            ],
            "manifest_digest": manifest_digest,
            "matched_rule": matched_rule,
            "mode": mode,
            "reasons": reasons,
            "request_digest": request_digest,
            "request_id": request_id,
            "schema": "szl.vertical-decision/v1",
            "vertical_id": vertical_id,
        }
        result["decision_digest"] = digest_value(result)

        if record and self.ledger is not None:
            events = [
                {
                    "event_type": "DECISION",
                    "vertical_id": vertical_id,
                    "subject_id": decision_id,
                    "payload": result,
                    "event_id": decision_id,
                    "occurred_at": result["evaluated_at"],
                }
            ]
            if mode == "ENFORCE":
                try:
                    receipt = build_initial_receipt(
                        decision=result,
                        request=request,
                        source_manifest_sha256=manifest_digest,
                    )
                except ReceiptError as error:
                    raise PolicyError(
                        "decision receipt construction failed closed"
                    ) from error
                events.append(
                    {
                        "event_type": "DECISION_RECEIPT",
                        "vertical_id": vertical_id,
                        "subject_id": decision_id,
                        "payload": receipt,
                        "event_id": receipt["receipt_id"],
                        "occurred_at": receipt["recorded_at"],
                    }
                )
            try:
                ledger_event = self.ledger.append_batch(events)[0]
            except LedgerError as error:
                verification = self.ledger.verify()
                if verification["status"] == "INVALID":
                    raise PolicyPersistenceError("decision ledger integrity is invalid")
                existing = self.ledger.get(decision_id)
                if existing is None:
                    raise PolicyPersistenceError(
                        "decision persistence failed closed"
                    ) from error
                return self._validated_replay(
                    existing,
                    decision_id=decision_id,
                    manifest_digest=manifest_digest,
                    mode=mode,
                    request=request,
                    request_digest=request_digest,
                    request_id=request_id,
                    vertical_id=vertical_id,
                )
            result["ledger_event_id"] = ledger_event["event_id"]
            result["ledger_event_hash"] = ledger_event["event_hash"]
        return result

    def record_outcome(
        self,
        *,
        vertical_id: str,
        decision_id: str,
        outcome: Mapping[str, Any],
    ) -> dict[str, Any]:
        self._cell(vertical_id)
        if self.ledger is None:
            raise PolicyError("an outcome ledger is required")
        if not decision_id.strip() or not isinstance(outcome, Mapping):
            raise PolicyError("decision_id and outcome object are required")
        verification = self.ledger.verify()
        if verification["status"] == "INVALID":
            raise PolicyPersistenceError("decision ledger integrity is invalid")
        decision_event = self.ledger.get(decision_id)
        if (
            decision_event is None
            or decision_event.get("event_type") != "DECISION"
            or decision_event.get("vertical_id") != vertical_id
        ):
            raise PolicyError(
                "decision_id is not a recorded decision for this vertical"
            )
        payload = {
            "decision_id": decision_id,
            "observed_at": utc_now(),
            "outcome": dict(outcome),
            "schema": "szl.vertical-outcome/v1",
        }
        payload["outcome_digest"] = digest_value(payload)
        return self.ledger.append(
            event_type="OUTCOME",
            vertical_id=vertical_id,
            subject_id=decision_id,
            payload=payload,
        )

    def shadow_compare(
        self,
        *,
        vertical_id: str,
        candidate_cell: Mapping[str, Any],
        scenarios: list[Mapping[str, Any]],
    ) -> dict[str, Any]:
        baseline = self._cell(vertical_id)
        candidate = deepcopy(dict(candidate_cell))
        if candidate.get("vertical_id") != vertical_id:
            raise PolicyError("candidate vertical_id must match")
        candidate_engine = DecisionEngine({vertical_id: candidate})
        observations: list[dict[str, Any]] = []
        changed = 0
        for index, scenario in enumerate(scenarios, start=1):
            before = self.evaluate(vertical_id, scenario, mode="LOG_ONLY", record=False)
            after = candidate_engine.evaluate(
                vertical_id, scenario, mode="LOG_ONLY", record=False
            )
            is_changed = before["decision"] != after["decision"]
            changed += int(is_changed)
            observations.append(
                {
                    "baseline_decision": before["decision"],
                    "candidate_decision": after["decision"],
                    "changed": is_changed,
                    "scenario_digest": digest_value(dict(scenario)),
                    "scenario_index": index,
                }
            )
        result = {
            "baseline_manifest_digest": digest_value(baseline),
            "candidate_manifest_digest": digest_value(candidate),
            "changed_decisions": changed,
            "mode": "LOG_ONLY",
            "observations": observations,
            "schema": "szl.vertical-policy-shadow/v1",
            "side_effects": [],
            "vertical_id": vertical_id,
        }
        result["result_digest"] = digest_value(result)
        return result


def scenario_forge(cell: Mapping[str, Any]) -> list[dict[str, Any]]:
    """Create deterministic synthetic policy fixtures from a cell manifest."""

    vertical_id = str(cell["vertical_id"])
    workflows = cell.get("core_workflows")
    if (
        not isinstance(workflows, list)
        or not workflows
        or type(workflows[0]) is not str
    ):
        raise PolicyError("scenario forge requires at least one cell workflow")
    workflow = workflows[0]
    evidence = [
        {
            "digest": "sha256:" + "a" * 64,
            "evidence_class": "MODELED",
            "freshness": "CURRENT",
            "id": "synthetic-evidence",
            "limitations": ["synthetic fixture; content handle is unverified"],
        }
    ]
    principal = {"authority_claims": [], "id": "synthetic-operator"}
    scenarios: list[dict[str, Any]] = []
    for index, action in enumerate(cell.get("allowed_actions", []), start=1):
        scenarios.append(
            {
                "action": action,
                "evidence": evidence,
                "principal": principal,
                "request_id": f"{vertical_id}-allowed-{index}",
                "workflow": workflow,
            }
        )
    for index, action in enumerate(cell.get("prohibited_actions", []), start=1):
        scenarios.append(
            {
                "action": action,
                "evidence": evidence,
                "principal": principal,
                "request_id": f"{vertical_id}-prohibited-{index}",
                "workflow": workflow,
            }
        )
    scenarios.append(
        {
            "action": "recommend",
            "evidence": [],
            "principal": principal,
            "request_id": f"{vertical_id}-missing-evidence",
            "workflow": workflow,
        }
    )
    return scenarios
