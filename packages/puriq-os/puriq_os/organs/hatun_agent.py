# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
hatun_agent.py — Hatun as an autonomous OrganAgent.

Cadence: 49s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Proposal counts come only from the caller. The Yuyay gate and the
Hukulla STOP/provenance predicates see that caller context. A missing or
nonnumeric measurement is a numeric zero, because the base scorer ignores
nonnumeric axes and would otherwise stay open. This organ does not open a
network client. A caller-supplied evaluator is the only backend, and the GET
loop constructors do not supply one.
"""
from __future__ import annotations

import re
import time
from typing import Any, Callable, Dict, List, Optional

from ..hukulla_tripwires import TripwireResult
from ..loop import Action, LoopStatus, OrganAgent, TickResult
from ..yuyay_gate import YuyayScores

_PROVENANCE = re.compile(r"[0-9a-f]{40}\Z|[0-9a-f]{64}\Z")
_PRIVATE = frozenset({"content", "text", "document", "documents", "body", "raw"})


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
    if number < 0.0 or number > 1.0:
        return None
    return number


def _evidence(value: Any) -> Optional[List[Dict[str, str]]]:
    if not isinstance(value, list):
        return None
    rows: List[Dict[str, str]] = []
    for item in value:
        if not isinstance(item, dict) or _PRIVATE.intersection(item):
            return None
        node = item.get("node_id")
        digest = item.get("sha256")
        if not isinstance(node, str) or not node or len(node) > 256:
            return None
        if not isinstance(digest, str) or re.fullmatch(r"[0-9a-f]{64}", digest.lower()) is None:
            return None
        rows.append({"node_id": node, "sha256": digest.lower()})
    return rows


class HatunAgent(OrganAgent):
    organ = "Hatun"
    cadence_seconds = 49

    def __init__(self, ledger, gate=None, hukulla=None, *, evaluator: Optional[Callable[[Dict[str, Any]], Any]] = None,
                 allowed_tenant: str = "public", clock: Optional[Callable[[], float]] = None):
        super().__init__(ledger, gate=gate, hukulla=hukulla)
        self._evaluator = evaluator
        self._allowed_tenant = allowed_tenant
        self._clock = clock or time.time

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
        admissible = bool(
            authorized
            and provenance_ok
            and meas is not None
            and proposals > 0
            and window_ok
            and world.get("operation", "evaluate_proposal") == "evaluate_proposal"
        )
        # Zero is fail-closed. None would disappear from the base scorer and
        # leave Lambda on its neutral fallback.
        health = 0.0 if (not admissible or stop) else meas
        if stop and admissible and meas is not None:
            health = meas
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
        if (
            not isinstance(x, dict)
            or action.name != "evaluate_proposal"
            or not x.get("authorized")
            or x.get("stop_directive")
        ):
            denied = _terminal("DENIED", provenance=provenance, measurability=meas)
            denied["backend_called"] = False
            return denied
        if self._evaluator is None:
            closed = _terminal("ABSENT_BACKEND", provenance=provenance, measurability=meas)
            closed["evaluated"] = False
            return closed
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
            return failed
        except Exception:
            failed = _terminal("EXECUTION_FAILURE", provenance=provenance, measurability=meas)
            failed["backend_called"] = True
            return failed
        admitted = _admit_backend(raw, provenance=provenance, measurability=meas)
        admitted["backend_called"] = True
        return admitted

    def tick(self, world: Any = None, now: Optional[float] = None) -> TickResult:
        before = self.ledger.count()
        try:
            result = super().tick(world, now)
        except Exception:
            if self.ledger.count() != before:
                raise
            receipt = self.emit_receipt(
                "__terminal__",
                0.0,
                0.0,
                False,
                {
                    "state": "UNAVAILABLE",
                    "reason": "TERMINAL_EXCEPTION",
                    "evidence": [],
                    "terminal": True,
                    "backend_called": False,
                },
            )
            self.status = LoopStatus.PAUSED
            return TickResult(
                self.organ,
                self.tick_count,
                LoopStatus.PAUSED,
                None,
                0.0,
                0.0,
                TripwireResult(clear=False, tripped=["terminal"]),
                receipt,
                "terminal",
            )
        if result.receipt is None:
            receipt = self.emit_receipt(
                "__terminal__",
                0.0,
                0.0,
                False,
                {"state": "UNAVAILABLE", "reason": "MISSING_RECEIPT", "evidence": [], "terminal": True},
            )
            self.status = LoopStatus.PAUSED
            return TickResult(
                self.organ,
                result.tick,
                LoopStatus.PAUSED,
                result.chosen,
                result.decision_value,
                result.yuyay_value,
                result.hukulla,
                receipt,
                "terminal",
            )
        return result


def _admit_backend(raw: Any, *, provenance: Any, measurability: float) -> Dict[str, Any]:
    if not isinstance(raw, dict) or _PRIVATE.intersection(raw):
        out = _terminal("UNCERTAIN", provenance=provenance, measurability=measurability)
        out["backend_called"] = True
        return out
    state = raw.get("state")
    if state == "TIMEOUT":
        return _terminal("TIMEOUT", provenance=provenance, measurability=measurability)
    if state in {"UNCERTAIN", "INDETERMINATE"}:
        out = _terminal("UNCERTAIN", provenance=provenance, measurability=measurability)
        return out
    if state not in {"AVAILABLE", "ABSTAIN"}:
        out = _terminal("UNCERTAIN", provenance=provenance, measurability=measurability)
        return out
    evidence = _evidence(raw.get("evidence", []))
    if evidence is None:
        out = _terminal("UNCERTAIN", provenance=provenance, measurability=measurability)
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
    }
