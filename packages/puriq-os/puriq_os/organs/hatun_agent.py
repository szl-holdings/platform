# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
hatun_agent.py — Hatun as an autonomous OrganAgent.

Cadence: 49s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Hatun reports an injected read-port observation. It does not invent
governance health, and it does not grant execution.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from ..loop import OrganAgent, Action

_HEX64 = re.compile(r"[0-9a-f]{64}\Z")
_TOKEN = re.compile(r"[A-Z0-9_]{1,64}\Z")
_PRIVATE = frozenset({"content", "text", "document", "documents", "body", "raw"})
_STATES = frozenset({"AVAILABLE", "ABSTAIN", "UNAVAILABLE", "DENIED", "TIMEOUT"})


def _unavailable() -> Dict[str, Any]:
    return {
        "proposals": 0,
        "governance_health": None,
        "hydrated": False,
        "evidence": [],
        "source_revision": None,
        "state": "UNAVAILABLE",
        "backend": "UNAVAILABLE",
        "execution_authority": "NONE",
    }


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
        if not isinstance(digest, str) or _HEX64.fullmatch(digest.lower()) is None:
            return None
        row = {"node_id": node, "sha256": digest.lower()}
        source = item.get("source")
        if isinstance(source, str) and source and len(source) <= 256:
            row["source"] = source
        rows.append(row)
    return rows


class HatunAgent(OrganAgent):
    organ = "Hatun"
    cadence_seconds = 49

    def __init__(self, ledger, gate=None, hukulla=None, *, read_port=None):
        super().__init__(ledger, gate=gate, hukulla=hukulla)
        self._read_port = read_port

    def observe(self, world: Any) -> Dict[str, Any]:
        # The world dict cannot supply health, proposal counts, or approval.
        del world
        if self._read_port is None:
            return _unavailable()
        try:
            measured = self._read_port()
        except Exception:
            return _unavailable()
        if not isinstance(measured, dict) or _PRIVATE.intersection(measured):
            closed = _unavailable()
            if isinstance(measured, dict):
                closed["state"] = "ABSTAIN"
            return closed
        evidence = _evidence(measured.get("evidence", []))
        state = measured.get("state")
        if not isinstance(state, str) or state not in _STATES:
            return _unavailable()
        if evidence is None or (state == "AVAILABLE" and not evidence):
            state = "ABSTAIN"
            evidence = []
        revision = measured.get("source_revision")
        revision_out = None
        if isinstance(revision, str) and _HEX64.fullmatch(revision.lower()) is not None:
            revision_out = revision.lower()
        if state == "AVAILABLE" and revision_out is None:
            state = "ABSTAIN"
        backend = measured.get("backend")
        if not isinstance(backend, str) or _TOKEN.fullmatch(backend) is None:
            backend = "UNAVAILABLE"
        return {
            "proposals": 0,
            "governance_health": None,
            "hydrated": False,
            "evidence": evidence,
            "source_revision": revision_out,
            "state": state,
            "backend": backend,
            "execution_authority": "NONE",
        }

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        del x
        return [Action(name="idle")]

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        if action.name != "idle":
            return {
                "evaluated": False,
                "bounded": True,
                "execution_authority": "NONE",
                "state": "DENIED",
                "governance_health": None,
            }
        state = "UNAVAILABLE"
        evidence: List[Any] = []
        revision = None
        if isinstance(x, dict):
            if isinstance(x.get("state"), str):
                state = x["state"]
            if isinstance(x.get("evidence"), list):
                evidence = x["evidence"]
            revision = x.get("source_revision")
        return {
            "evaluated": False,
            "bounded": True,
            "execution_authority": "NONE",
            "state": state,
            "governance_health": None,
            "hydrated": False,
            "evidence": evidence,
            "source_revision": revision,
        }
