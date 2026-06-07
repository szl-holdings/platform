"""Business Flight Recorder — append-only decision ledger.

Every consequential business decision produced by the Meridian control plane
(model calls, recommendations, approval state transitions) is written here as
a JSONL entry with a content hash for tamper-evidence.

Design principles:
  - Append-only: entries are never mutated or deleted.
  - Rotation: when a JSONL file grows beyond MAX_FILE_BYTES, a new file is
    opened. The audit gate replays all files in sorted order.
  - Tamper-evidence: each entry includes a SHA-256 hash of its JSON content
    (excluding the hash field itself). The validator can re-derive the hash
    and flag any mismatch.
  - No network I/O: the recorder writes only to the local filesystem.

Research seam: Langfuse / Arize Phoenix can consume the JSONL as an import
feed for richer observability — hook into ``FlightRecorder.append()`` when
those integrations land.
"""

from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class ApprovalRequiredError(Exception):
    """Raised when an action transition is attempted without the required approval.

    Attributes
    ----------
    recommendation_id:
        The ID of the recommendation that requires human approval before the
        action can be executed.
    """

    def __init__(self, recommendation_id: str) -> None:
        self.recommendation_id = recommendation_id
        super().__init__(
            f"recommendation '{recommendation_id}' requires human approval "
            "before the action transition can be executed"
        )

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RECORDER_DIR = REPO_ROOT / "reports" / "flight-recorder"
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MiB per JSONL shard


def _content_hash(entry_without_hash: dict[str, Any]) -> str:
    canonical = json.dumps(entry_without_hash, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


class FlightRecorder:
    """Append-only JSONL ledger for Meridian decision events.

    Parameters
    ----------
    recorder_dir:
        Directory under which JSONL shards are written.  Defaults to
        ``reports/flight-recorder/``.
    """

    def __init__(self, recorder_dir: Path = DEFAULT_RECORDER_DIR) -> None:
        self.recorder_dir = recorder_dir
        self.recorder_dir.mkdir(parents=True, exist_ok=True)
        self._current_file: Path | None = None

    # ── public API ─────────────────────────────────────────────────────────

    def record_model_call(
        self,
        *,
        vertical: str,
        input_class: str,
        output_class: str,
        model: str,
        confidence: float,
        recommendation_id: str | None = None,
        tool_calls: list[str] | None = None,
        approval_state: str = "pending",
    ) -> str:
        """Write a model-call event and return the entry id."""
        entry_id = self._make_id("mc")
        payload: dict[str, Any] = {
            "id": entry_id,
            "event_type": "model_call",
            "timestamp": _utc_now(),
            "vertical": vertical,
            "input_class": input_class,
            "output_class": output_class,
            "model": model,
            "confidence": confidence,
            "recommendation_id": recommendation_id,
            "tool_calls": tool_calls or [],
            "approval_state": approval_state,
        }
        self.append(payload)
        return entry_id

    def record_recommendation(
        self,
        *,
        vertical: str,
        recommendation_id: str,
        title: str,
        owner: str,
        requires_human_approval: bool,
        confidence: float,
        model: str,
        input_class: str,
        output_class: str,
        evidence_ids: list[str],
    ) -> str:
        """Write a recommendation event and return the entry id."""
        entry_id = self._make_id("rec")
        payload: dict[str, Any] = {
            "id": entry_id,
            "event_type": "recommendation",
            "timestamp": _utc_now(),
            "vertical": vertical,
            "recommendation_id": recommendation_id,
            "title": title,
            "owner": owner,
            "requires_human_approval": requires_human_approval,
            "confidence": confidence,
            "model": model,
            "input_class": input_class,
            "output_class": output_class,
            "evidence_ids": evidence_ids,
            "approval_state": "awaiting_approval" if requires_human_approval else "auto_approved",
        }
        self.append(payload)
        return entry_id

    def record_approval(
        self,
        *,
        recommendation_id: str,
        approved_by: str,
        approved: bool,
        note: str = "",
    ) -> str:
        """Write an approval decision for *recommendation_id*."""
        entry_id = self._make_id("appr")
        payload: dict[str, Any] = {
            "id": entry_id,
            "event_type": "approval",
            "timestamp": _utc_now(),
            "recommendation_id": recommendation_id,
            "approved_by": approved_by,
            "approved": approved,
            "note": note,
        }
        self.append(payload)
        return entry_id

    def append(self, entry: dict[str, Any]) -> None:
        """Append *entry* to the current shard (rotate if needed).

        Adds a ``content_hash`` field computed over the entry before writing.
        This method is the only write path; callers must not open the shard
        files directly.
        """
        entry_to_hash = {k: v for k, v in entry.items() if k != "content_hash"}
        entry["content_hash"] = _content_hash(entry_to_hash)

        shard = self._active_shard()
        with shard.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, sort_keys=True, separators=(",", ":")) + "\n")

    def replay(self) -> list[dict[str, Any]]:
        """Read and return all entries from all shards in chronological order.

        Entries are returned as dicts; callers should verify content_hash if
        tamper-evidence checking is required.
        """
        entries: list[dict[str, Any]] = []
        for shard in sorted(self.recorder_dir.glob("*.jsonl")):
            for line in shard.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line:
                    entries.append(json.loads(line))
        return entries

    def verify_integrity(self) -> list[str]:
        """Return a list of tamper-evidence violations (empty = clean)."""
        violations: list[str] = []
        for entry in self.replay():
            stored_hash = entry.get("content_hash", "")
            without_hash = {k: v for k, v in entry.items() if k != "content_hash"}
            expected = _content_hash(without_hash)
            if stored_hash != expected:
                violations.append(
                    f"hash mismatch for entry {entry.get('id', '?')}: "
                    f"stored={stored_hash!r} expected={expected!r}"
                )
        return violations

    def recommendation_requires_approval(self, recommendation_id: str) -> bool | None:
        """Return whether the recorded recommendation requires human approval.

        Scans flight recorder entries for the matching ``recommendation`` event
        and returns its ``requires_human_approval`` field.  Returns ``None`` if
        no matching recommendation entry is found.
        """
        for entry in self.replay():
            if (
                entry.get("event_type") == "recommendation"
                and entry.get("recommendation_id") == recommendation_id
            ):
                val = entry.get("requires_human_approval")
                if isinstance(val, bool):
                    return val
        return None

    def record_action_transition(
        self,
        *,
        recommendation_id: str,
        from_state: str,
        to_state: str,
        actor: str,
        note: str = "",
    ) -> str:
        """Write an action-state-transition event and return the entry id.

        This records the moment a recommendation moves from one lifecycle state
        to the next (e.g. ``awaiting_approval`` → ``approved`` → ``actioned``).
        Callers are responsible for checking approval before calling this method;
        the :class:`MeridianControlPlane` enforces the gate via
        :meth:`~MeridianControlPlane.attempt_action_transition`.
        """
        entry_id = self._make_id("act")
        payload: dict[str, Any] = {
            "id": entry_id,
            "event_type": "action_transition",
            "timestamp": _utc_now(),
            "recommendation_id": recommendation_id,
            "from_state": from_state,
            "to_state": to_state,
            "actor": actor,
            "note": note,
        }
        self.append(payload)
        return entry_id

    def has_approval(self, recommendation_id: str) -> bool:
        """Return True if at least one approved=True approval record exists."""
        for entry in self.replay():
            if (
                entry.get("event_type") == "approval"
                and entry.get("recommendation_id") == recommendation_id
                and entry.get("approved") is True
            ):
                return True
        return False

    # ── internals ──────────────────────────────────────────────────────────

    def _active_shard(self) -> Path:
        """Return the current shard path, rotating if the file is over the limit."""
        if self._current_file is None or (
            self._current_file.exists()
            and self._current_file.stat().st_size >= MAX_FILE_BYTES
        ):
            self._current_file = self._new_shard_path()
        return self._current_file

    def _new_shard_path(self) -> Path:
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
        return self.recorder_dir / f"bfr-{ts}.jsonl"

    @staticmethod
    def _make_id(prefix: str) -> str:
        return f"{prefix}_{int(time.time() * 1000)}"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


__all__ = [
    "ApprovalRequiredError",
    "FlightRecorder",
    "DEFAULT_RECORDER_DIR",
    "MAX_FILE_BYTES",
]
