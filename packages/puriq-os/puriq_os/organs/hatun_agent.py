# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
hatun_agent.py — Hatun as an autonomous OrganAgent.

Cadence: 49s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Proposal counts come only from the caller. The Yuyay gate and the
Hukulla STOP/provenance predicates see that caller context. A missing or
nonnumeric or non-finite measurement is a numeric zero, because the base scorer ignores
nonnumeric axes and would otherwise stay open. This organ does not open a
network client. A caller-supplied evaluator is the only backend, and the GET
loop constructors do not supply one.
"""
from __future__ import annotations

import copy
import math
import re
import time
from typing import Any, Callable, Dict, List, Optional

from ..hukulla_tripwires import TripwireResult
from ..loop import Action, LoopStatus, OrganAgent, TickResult
from ..yuyay_gate import YuyayScores

_PROVENANCE = re.compile(r"[0-9a-f]{40}\Z|[0-9a-f]{64}\Z")
_REVISION = re.compile(r"[0-9a-f]{40}\Z|[0-9a-f]{64}\Z")
_LICENSE = re.compile(r"[A-Za-z0-9.+-]{1,64}\Z")
_OPERATION = re.compile(r"[A-Za-z0-9_.:-]{1,128}\Z")
_PRIVATE = frozenset({"content", "text", "document", "documents", "body", "raw"})
_RIGHTS_OK = frozenset({"public_handles", "public_citation"})
_RIGHTS_WITHDRAWN = frozenset({"withdrawn", "revoked"})


def _terminal(state: str, *, provenance: Any = None, measurability: float = 0.0) -> Dict[str, Any]:
    return {
        "evaluated": False,
        "backend_called": False,
        "state": state,
        "evidence": [],
        "terminal": True,
        "provenance": provenance if isinstance(provenance, str) else None,
        "measurability": measurability,
        "execution_authority": "NONE",
    }


def _number(value: Any) -> Optional[float]:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    if not math.isfinite(number) or number < 0.0 or number > 1.0:
        return None
    return number


def _evidence(value: Any, allowed_tenant: str) -> tuple[str, List[Dict[str, str]]]:
    if not isinstance(value, list):
        return "malformed", []
    rows: List[Dict[str, str]] = []
    hold = "ok"
    for item in value:
        if not isinstance(item, dict) or _PRIVATE.intersection(item):
            return "malformed", []
        node = item.get("node_id")
        digest = item.get("sha256")
        revision = item.get("document_revision")
        license_name = item.get("license")
        rights = item.get("rights")
        tenant = item.get("tenant")
        source = item.get("source")
        if not isinstance(node, str) or not node or len(node) > 256:
            return "malformed", []
        if not isinstance(digest, str) or re.fullmatch(r"[0-9a-f]{64}", digest.lower()) is None:
            return "malformed", []
        if not isinstance(source, str) or not source or len(source) > 256:
            return "malformed", []
        if isinstance(rights, str) and rights in _RIGHTS_WITHDRAWN:
            hold = "withdrawn"
            continue
        if isinstance(tenant, str) and tenant != allowed_tenant:
            return "wrong_tenant", []
        rights_ok = isinstance(rights, str) and rights in _RIGHTS_OK
        if (
            not isinstance(revision, str)
            or _REVISION.fullmatch(revision.lower()) is None
            or not isinstance(license_name, str)
            or _LICENSE.fullmatch(license_name) is None
            or not rights_ok
            or tenant != allowed_tenant
        ):
            hold = "unbound"
            continue
        rows.append({
            "node_id": node,
            "source": source,
            "sha256": digest.lower(),
            "document_revision": revision.lower(),
            "license": license_name,
            "rights": rights,
            "tenant": tenant,
        })
    if hold != "ok":
        return hold, []
    return "ok", rows


class HatunAgent(OrganAgent):
    organ = "Hatun"
    cadence_seconds = 49

    def __init__(self, ledger, gate=None, hukulla=None, *, evaluator: Optional[Callable[[Dict[str, Any]], Any]] = None,
                 allowed_tenant: str = "public", clock: Optional[Callable[[], float]] = None):
        super().__init__(ledger, gate=gate, hukulla=hukulla)
        self._evaluator = evaluator
        self._allowed_tenant = allowed_tenant
        self._clock = clock or time.time
        self._evaluator_called = False
        # Separate from the Second Brain adapter's 32-id table. This cache has
        # no capacity. A future capacity must refuse a new id and must keep
        # every stored result and every in-flight reservation.
        self._replay: Dict[str, tuple] = {}

    def observe(self, world: Any) -> Dict[str, Any]:
        world = world if isinstance(world, dict) else {}
        stop = world.get("stop") == "STOP" or world.get("stop_directive") is True
        authorized = world.get("authorized") is True and world.get("tenant") == self._allowed_tenant
        provenance = world.get("provenance")
        provenance_ok = isinstance(provenance, str) and _PROVENANCE.fullmatch(provenance.lower()) is not None
        provenance_out = provenance.lower() if provenance_ok else None
        if "config_proposals" in world and type(world.get("config_proposals")) is int and world["config_proposals"] >= 0:
            proposals = world["config_proposals"]
        else:
            proposals = 0
        meas = _number(world.get("measurability"))
        now = self._clock()
        expires_at = world.get("expires_at")
        not_before = world.get("not_before")
        window_ok = (
            type(now) is not bool
            and isinstance(now, (int, float))
            and type(expires_at) is int
            and type(not_before) is int
            and not_before <= int(now) < expires_at
        )
        operation_id = world.get("operation_id")
        operation_ok = operation_id is None or (
            isinstance(operation_id, str) and _OPERATION.fullmatch(operation_id) is not None
        )
        read_only = world.get("method") == "GET"
        admissible = bool(
            authorized
            and provenance_ok
            and meas is not None
            and proposals > 0
            and window_ok
            and operation_ok
            and not read_only
            and not stop
            and world.get("operation", "evaluate_proposal") == "evaluate_proposal"
        )
        # Zero is fail-closed. None would disappear from the base scorer and
        # leave Lambda on its neutral fallback. STOP stays at zero.
        health = 0.0 if (not admissible or stop) else meas
        return {
            "proposals": proposals,
            "governance_health": health if health is not None else 0.0,
            "measurability": meas if meas is not None else 0.0,
            "authorized": admissible and not stop,
            "admissible": admissible,
            "stop_directive": stop,
            "provenance_ok": provenance_ok,
            "provenance": provenance_out,
            "tenant": self._allowed_tenant if authorized else None,
            "evidence": [],
            "expires_at": expires_at if type(expires_at) is int else None,
            "not_before": not_before if type(not_before) is int else None,
            "operation_id": operation_id if isinstance(operation_id, str) and operation_ok else None,
            "read_only": read_only,
        }

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        meas = float(x.get("measurability") or 0.0)
        context = {
            "stop_directive": x.get("stop_directive") is True,
            "provenance_ok": x.get("provenance_ok") is True,
            "provenance": x.get("provenance"),
            "measurability": meas,
        }
        idle = Action(name="idle", yuyay=YuyayScores(measurability_honesty=meas), khipu_factors=[0.5], context=context)
        if not x.get("admissible"):
            return [idle]
        evaluate = Action(
            name="evaluate_proposal",
            yuyay=YuyayScores(measurability_honesty=meas),
            khipu_factors=[1.0],
            state_changing=True,
            context=context,
        )
        return [idle, evaluate]

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        provenance = x.get("provenance") if isinstance(x, dict) else None
        meas = float(x.get("measurability") or 0.0) if isinstance(x, dict) else 0.0
        window_open = True
        if (
            isinstance(x, dict)
            and action.name == "evaluate_proposal"
            and x.get("authorized")
            and not x.get("stop_directive")
            and not x.get("read_only")
        ):
            window_open = self._window_open(x)
        if (
            not isinstance(x, dict)
            or action.name != "evaluate_proposal"
            or not x.get("authorized")
            or x.get("stop_directive")
            or x.get("read_only")
            or not window_open
        ):
            denied = _terminal("DENIED", provenance=provenance, measurability=meas)
            denied["backend_called"] = False
            denied["reason"] = "EXPIRED" if not window_open else "DENIED"
            return denied
        operation = x.get("operation_id") if isinstance(x, dict) else None
        replay_key = (x.get("proposals"), x.get("tenant"))
        if isinstance(operation, str) and operation in self._replay:
            prior_key, prior = self._replay[operation]
            if prior_key != replay_key:
                conflict = _terminal("DENIED", provenance=provenance, measurability=meas)
                conflict["reason"] = "REPLAY_CONFLICT"
                conflict["backend_called"] = False
                return conflict
            if prior is None:
                inflight = _terminal("UNAVAILABLE", provenance=provenance, measurability=meas)
                inflight["reason"] = "REPLAY_IN_FLIGHT"
                inflight["backend_called"] = False
                return inflight
            replayed = copy.deepcopy(prior)
            replayed["replayed"] = True
            replayed["backend_called"] = False
            replayed["execution_authority"] = "NONE"
            return replayed
        if isinstance(operation, str):
            self._replay[operation] = (replay_key, None)
        if self._evaluator is None:
            closed = _terminal("ABSENT_BACKEND", provenance=provenance, measurability=meas)
            closed["evaluated"] = False
            return self._store_replay(operation, replay_key, closed)
        if self.ledger._unresolved_locked():
            blocked = _terminal("UNAVAILABLE", provenance=provenance, measurability=meas)
            blocked["reason"] = "LEDGER_UNRESOLVED"
            blocked["backend_called"] = False
            blocked["execution_authority"] = "NONE"
            return blocked
        self._evaluator_called = True
        try:
            raw = self._evaluator({
                "proposals": x.get("proposals"),
                "provenance": provenance,
                "measurability": meas,
                "tenant": x.get("tenant"),
            })
        except TimeoutError:
            failed = _terminal("TIMEOUT", provenance=provenance, measurability=meas)
            failed["backend_called"] = True
            return self._store_replay(operation, replay_key, failed)
        except Exception:
            failed = _terminal("EXECUTION_FAILURE", provenance=provenance, measurability=meas)
            failed["backend_called"] = True
            return self._store_replay(operation, replay_key, failed)
        if not self._window_open(x):
            denied = _terminal("DENIED", provenance=provenance, measurability=meas)
            denied["reason"] = "EXPIRED"
            denied["backend_called"] = True
            denied["evidence"] = []
            denied["execution_authority"] = "NONE"
            return self._store_replay(operation, replay_key, denied)
        admitted = _admit_backend(
            raw,
            provenance=provenance,
            measurability=meas,
            allowed_tenant=self._allowed_tenant,
        )
        admitted["backend_called"] = True
        return self._store_replay(operation, replay_key, admitted)

    def _store_replay(self, operation: Any, replay_key: tuple, admitted: Dict[str, Any]) -> Dict[str, Any]:
        snapshot = copy.deepcopy(admitted)
        if isinstance(operation, str):
            self._replay[operation] = (replay_key, snapshot)
        return copy.deepcopy(snapshot)

    def _window_open(self, x: Dict[str, Any]) -> bool:
        now = self._clock()
        expires_at = x.get("expires_at")
        not_before = x.get("not_before")
        return (
            type(now) is not bool
            and isinstance(now, (int, float))
            and type(expires_at) is int
            and type(not_before) is int
            and not_before <= int(now) < expires_at
        )

    def emit_receipt(self, action_name: str, decision_value: float, yuyay_value: float,
                     hukulla_clear: bool, payload: Dict[str, Any]) -> Any:
        if "backend_called" not in payload:
            result = payload.get("result")
            if isinstance(result, dict) and isinstance(result.get("backend_called"), bool):
                called = result["backend_called"]
            else:
                called = self._evaluator_called
            payload = {**payload, "backend_called": called}
        return super().emit_receipt(
            action_name, decision_value, yuyay_value, hukulla_clear, payload,
        )

    def _replacement_receipt(self, reason: str):
        # The flag is the call that already happened. A STOP halt never sets it.
        return self.emit_receipt(
            "__terminal__",
            0.0,
            0.0,
            False,
            {
                "state": "UNAVAILABLE",
                "reason": reason,
                "evidence": [],
                "terminal": True,
                "backend_called": self._evaluator_called,
            },
        )

    def _closed_tick(self, receipt, *, tick: int, chosen, decision: float,
                     yuyay: float, hukulla) -> TickResult:
        # STOP latches HALTED before the noop receipt. A failed receipt must
        # not resume that latch as PAUSED.
        halted = self.status == LoopStatus.HALTED
        if not halted:
            self.status = LoopStatus.PAUSED
        return TickResult(
            self.organ,
            tick,
            self.status,
            chosen,
            decision,
            yuyay,
            hukulla,
            receipt,
            "halted" if halted else "terminal",
        )

    def _paused_tick_allowed(self, world: Any) -> bool:
        # PAUSED stays paused for a fresh evaluator call. A replay, conflict,
        # in-flight id, or pre-call denial does not invoke the evaluator.
        return not self._would_call_evaluator(world)

    def _would_call_evaluator(self, world: Any) -> bool:
        if self._evaluator is None or self.status == LoopStatus.HALTED:
            return False
        try:
            observed = self.observe(world)
        except Exception:
            return False
        if not isinstance(observed, dict) or not observed.get("admissible"):
            return False
        operation = observed.get("operation_id")
        if isinstance(operation, str) and operation in self._replay:
            return False
        return True

    def tick(self, world: Any = None, now: Optional[float] = None) -> TickResult:
        # The scheduler pre-check is not the gate. Hold the ledger lock across
        # observe, execute, and this tick's own emit. A PAUSED or ALIVE agent
        # does not call the evaluator or append a receipt while a transaction
        # this thread does not own is still open. A resolved PAUSED replay
        # still enters the normal tick.
        with self.ledger._lock:
            if self.ledger._unresolved_locked():
                return TickResult(
                    self.organ, self.tick_count, self.status, None, 0.0, 0.0,
                    TripwireResult(clear=True), None, "invocation_blocked",
                )
            return self._tick_locked(world, now)

    def _tick_locked(self, world: Any = None, now: Optional[float] = None) -> TickResult:
        self._evaluator_called = False
        before = self.ledger.count()
        try:
            result = super().tick(world, now)
        except Exception:
            # The ledger append commits before emit returns. A raise after
            # that append already has its one receipt; minting another would
            # duplicate it and could reopen the tick.
            if self.ledger.count() != before:
                raise
            trip = self.hukulla.last_trip
            if self.status != LoopStatus.HALTED or not isinstance(trip, TripwireResult):
                trip = TripwireResult(clear=False, tripped=["terminal"])
            return self._closed_tick(
                self._replacement_receipt("TERMINAL_EXCEPTION"),
                tick=self.tick_count,
                chosen=None,
                decision=0.0,
                yuyay=0.0,
                hukulla=trip,
            )
        if result.note == "admission-blocked":
            return result
        if result.receipt is None:
            if self.ledger.count() != before:
                return result
            return self._closed_tick(
                self._replacement_receipt("MISSING_RECEIPT"),
                tick=result.tick,
                chosen=result.chosen,
                decision=result.decision_value,
                yuyay=result.yuyay_value,
                hukulla=result.hukulla,
            )
        return result


def _admit_backend(
    raw: Any,
    *,
    provenance: Any,
    measurability: float,
    allowed_tenant: str,
) -> Dict[str, Any]:
    if not isinstance(raw, dict) or _PRIVATE.intersection(raw):
        out = _terminal("UNCERTAIN", provenance=provenance, measurability=measurability)
        out["backend_called"] = True
        out["reason"] = "MALFORMED"
        return out
    if raw.get("execution_authority") not in (None, "NONE") or raw.get("execution_authorized") not in (None, False):
        out = _terminal("DENIED", provenance=provenance, measurability=measurability)
        out["reason"] = "AUTHORITY_PROMOTION"
        out["backend_called"] = True
        return out
    state = raw.get("state")
    if not isinstance(state, str):
        out = _terminal("UNCERTAIN", provenance=provenance, measurability=measurability)
        out["reason"] = "UNEXPECTED_STATE"
        out["backend_called"] = True
        return out
    if state == "TIMEOUT":
        out = _terminal("TIMEOUT", provenance=provenance, measurability=measurability)
        out["backend_called"] = True
        return out
    if state in {"UNCERTAIN", "INDETERMINATE"}:
        out = _terminal("UNCERTAIN", provenance=provenance, measurability=measurability)
        out["reason"] = "UNCERTAIN"
        out["backend_called"] = True
        return out
    if state not in {"AVAILABLE", "ABSTAIN"}:
        out = _terminal("UNCERTAIN", provenance=provenance, measurability=measurability)
        out["reason"] = "UNEXPECTED_STATE"
        out["backend_called"] = True
        return out
    status, evidence = _evidence(raw.get("evidence", []), allowed_tenant)
    if status == "malformed":
        out = _terminal("UNCERTAIN", provenance=provenance, measurability=measurability)
        out["reason"] = "MALFORMED"
        out["backend_called"] = True
        return out
    if status == "wrong_tenant":
        out = _terminal("DENIED", provenance=provenance, measurability=measurability)
        out["reason"] = "WRONG_TENANT"
        out["backend_called"] = True
        return out
    if status == "withdrawn":
        out = _terminal("ABSTAIN", provenance=provenance, measurability=measurability)
        out["reason"] = "WITHDRAWN"
        out["backend_called"] = True
        return out
    if status == "unbound":
        out = _terminal("ABSTAIN", provenance=provenance, measurability=measurability)
        out["reason"] = "RIGHTS_UNBOUND"
        out["backend_called"] = True
        return out
    if state == "AVAILABLE" and not evidence:
        state = "ABSTAIN"
    return {
        "evaluated": state == "AVAILABLE",
        "backend_called": True,
        "state": state,
        "evidence": evidence,
        "terminal": True,
        "provenance": provenance if isinstance(provenance, str) else None,
        "measurability": measurability,
        "execution_authority": "NONE",
        "tenant": allowed_tenant,
        "reason": "MEASURED",
    }
