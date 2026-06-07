"""Alloy Meridian control plane — vertical pack orchestrator.

This module is the primary entry-point for the Python substrate. It:

1. Loads the model policy from ``ops/a11oy/model-policy.json``.
2. Walks the vertical registry (``services.verticals.registry``), skipping
   stubs (``pack_status != 'live'``).
3. For each live vertical, invokes the five-stage pipeline:
       signals -> forecast -> evidence -> recommendations -> brief
4. Enforces the human-approval gate: recommendations with
   ``requires_human_approval=True`` are flagged in the output; the gate
   itself is managed by the flight recorder (callers must record an approval
   before marking the action).
5. Writes flight recorder entries for every model-call and every
   recommendation produced.
6. Assembles the unified executive brief and writes it to
   ``reports/vertical-moats-brief.json``.

The orchestrator does NOT call any external API. Model calls in this pass
are simulated with deterministic stubs — the policy routing logic is exercised
so the plumbing is real, but the actual LLM call is deferred until
``OPENAI_API_KEY`` is available and the caller opts in.

Research seam: replace ``_simulate_model_call()`` with a real
``openai.ChatCompletion.create()`` call once the environment is wired.
"""

from __future__ import annotations

import dataclasses
import importlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from services.meridian_control_plane.flight_recorder import (
    ApprovalRequiredError,
    FlightRecorder,
)
from services.meridian_control_plane.model_policy import ModelPolicy
from services.verticals import registry

REPO_ROOT = Path(__file__).resolve().parents[2]
BRIEF_OUTPUT_PATH = REPO_ROOT / "reports" / "vertical-moats-brief.json"


def _simulate_model_call(
    *,
    vertical: str,
    input_class: str,
    model: str,
) -> dict[str, Any]:
    """Stub model call — returns a deterministic placeholder.

    Research seam: replace with ``openai.chat.completions.create()`` when
    ``OPENAI_API_KEY`` is available.  The stub preserves the full call
    metadata so the flight recorder and policy enforcement are exercised.
    """
    return {
        "model": model,
        "vertical": vertical,
        "input_class": input_class,
        "stub": True,
        "content": f"[STUB] Meridian strategic analysis for vertical={vertical}",
        "tool_calls": [],
        "confidence": 0.75,
    }


class MeridianControlPlane:
    """Orchestrator for the Alloy Meridian vertical intelligence substrate."""

    def __init__(
        self,
        policy: ModelPolicy | None = None,
        recorder: FlightRecorder | None = None,
    ) -> None:
        self.policy = policy or ModelPolicy.from_file()
        self.recorder = recorder or FlightRecorder()

    def run(self, *, dry_run: bool = False) -> dict[str, Any]:
        """Execute the full pipeline across all live vertical packs.

        Parameters
        ----------
        dry_run:
            When True the brief JSON is not written to disk (useful for tests).

        Returns
        -------
        The unified executive brief as a dict.
        """
        brief_entries: list[dict[str, Any]] = []
        cross_vertical_evidence: dict[str, list[str]] = {}

        for spec in registry.live():
            entry = self._run_vertical(spec, cross_vertical_evidence)
            brief_entries.append(entry)
            cross_vertical_evidence[spec.id] = [
                e["id"] for e in (entry.get("evidence") or [])
            ]

        brief: dict[str, Any] = {
            "generated_at": _utc_now(),
            "substrate_version": "1.0.0",
            "model_policy_default": self.policy.default_model,
            "model_policy_critical_path": self.policy.critical_path_model,
            "vertical_count": len(brief_entries),
            "verticals": brief_entries,
            "cross_vertical_provenance": cross_vertical_evidence,
            "approval_required": [
                e["recommendation"]["id"]
                for e in brief_entries
                if e.get("recommendation", {}).get("requires_human_approval")
            ],
        }

        if not dry_run:
            BRIEF_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
            BRIEF_OUTPUT_PATH.write_text(
                json.dumps(brief, indent=2, sort_keys=True), encoding="utf-8"
            )

        return brief

    def _run_vertical(
        self,
        spec: registry.VerticalSpec,
        cross_vertical_evidence: dict[str, list[str]],
    ) -> dict[str, Any]:
        mod = importlib.import_module(spec.module)
        signals_mod = importlib.import_module(f"{spec.module}.signals")
        forecast_mod = importlib.import_module(f"{spec.module}.forecast")
        recommendations_mod = importlib.import_module(f"{spec.module}.recommendations")
        evidence_mod = importlib.import_module(f"{spec.module}.evidence")
        brief_mod = importlib.import_module(f"{spec.module}.brief")

        signals = signals_mod.collect()
        forecast = forecast_mod.compute(signals)
        evidence = evidence_mod.gather(signals)
        rec = recommendations_mod.build(
            signals=signals, forecast=forecast, evidence=evidence
        )
        brief = brief_mod.synthesise(
            signals=signals, forecast=forecast, evidence=evidence, recommendation=rec
        )

        input_class = rec.input_class
        output_class = rec.output_class
        model = self.policy.resolve_model(input_class)

        # Stamp the policy-routed model into the recommendation envelope so
        # that downstream consumers (flight recorder, brief, UI) see the actual
        # model that will be used — not just the vertical pack's default.
        rec = dataclasses.replace(rec, model=model)

        model_result = _simulate_model_call(
            vertical=spec.id, input_class=input_class, model=model
        )

        self.recorder.record_model_call(
            vertical=spec.id,
            input_class=input_class,
            output_class=output_class,
            model=model,
            confidence=rec.confidence,
            recommendation_id=rec.id,
            tool_calls=model_result.get("tool_calls", []),
            approval_state=(
                "awaiting_approval" if rec.requires_human_approval else "auto_approved"
            ),
        )

        self.recorder.record_recommendation(
            vertical=spec.id,
            recommendation_id=rec.id,
            title=rec.title,
            owner=rec.owner,
            requires_human_approval=rec.requires_human_approval,
            confidence=rec.confidence,
            model=model,
            input_class=input_class,
            output_class=output_class,
            evidence_ids=rec.evidence_ids,
        )

        approval_gate_passed = (
            not rec.requires_human_approval
            or self.recorder.has_approval(rec.id)
        )

        return {
            "vertical_id": spec.id,
            "title": spec.title,
            "purpose": spec.purpose,
            "signals": signals,
            "forecast": forecast,
            "evidence": evidence,
            "recommendation": rec.to_dict(),
            "brief": brief,
            "model_used": model,
            "approval_gate_passed": approval_gate_passed,
            "cross_vertical_dependencies": list(cross_vertical_evidence.keys()),
        }


    def attempt_action_transition(
        self,
        rec_id: str,
        *,
        actor: str,
        from_state: str = "awaiting_approval",
        to_state: str = "actioned",
        note: str = "",
    ) -> str:
        """Attempt to advance a recommendation to the next action state.

        Raises :class:`~services.meridian_control_plane.flight_recorder.ApprovalRequiredError`
        if the recommendation requires human approval and no approved record
        exists in the flight recorder.

        On success, writes an ``action_transition`` entry to the flight recorder
        and returns the new entry's id.

        Parameters
        ----------
        rec_id:
            The recommendation ID to transition.
        actor:
            The human or service principal performing the transition.
        from_state:
            Starting lifecycle state (default: ``'awaiting_approval'``).
        to_state:
            Target lifecycle state (default: ``'actioned'``).
        note:
            Optional free-text note attached to the transition entry.

        Raises
        ------
        ApprovalRequiredError
            If the recommendation has not been approved and approval is
            required.
        """
        needs_approval = self.recorder.recommendation_requires_approval(rec_id)
        if needs_approval is True and not self.recorder.has_approval(rec_id):
            raise ApprovalRequiredError(rec_id)

        return self.recorder.record_action_transition(
            recommendation_id=rec_id,
            from_state=from_state,
            to_state=to_state,
            actor=actor,
            note=note,
        )


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


__all__ = ["MeridianControlPlane", "BRIEF_OUTPUT_PATH"]
