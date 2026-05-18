"""Incident response — runbook DSL + step events emitted via yawar-bus.

The DSL exposes three primitives:
    step(name, fn)          — execute fn(ctx) and record the result
    branch(name, cond, ...) — pick true/false branch by predicate
    await_approval(name)    — pause until an approval is recorded in the context

Each step emits a typed event to the configured ``EventSink``. The default sink
is in-memory; an HTTP sink to the yawar-bus (a11oy event topic) is provided.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Literal, Protocol

StepKind = Literal["step", "branch", "await_approval"]
StepStatus = Literal["ok", "failed", "skipped", "awaiting_approval"]


@dataclass(frozen=True)
class Incident:
    id: str
    title: str
    severity: Literal["critical", "high", "medium", "low"]
    mitre_techniques: tuple[str, ...] = ()
    affected_assets: tuple[str, ...] = ()
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class StepEvent:
    incident_id: str
    runbook: str
    step_name: str
    kind: StepKind
    status: StepStatus
    started_at: float
    ended_at: float
    output: Any = None
    error: str | None = None

    def to_dict(self) -> dict:
        return {
            "incident_id": self.incident_id,
            "runbook": self.runbook,
            "step_name": self.step_name,
            "kind": self.kind,
            "status": self.status,
            "started_at": self.started_at,
            "ended_at": self.ended_at,
            "duration_ms": int(round((self.ended_at - self.started_at) * 1000)),
            "output": self.output,
            "error": self.error,
        }


class EventSink(Protocol):
    def emit(self, event: StepEvent) -> None: ...


@dataclass
class InMemoryEventSink:
    events: list[StepEvent] = field(default_factory=list)

    def emit(self, event: StepEvent) -> None:
        self.events.append(event)


@dataclass
class YawarHTTPEventSink:
    """Emit step events to the yawar bus via HTTP POST.

    ``topic`` defaults to ``sentra.incident`` per the payload spec.
    Failures are swallowed and recorded on ``last_error`` — the runbook MUST
    NOT fail because the bus is unreachable.
    """

    base_url: str
    topic: str = "sentra.incident"
    timeout_s: float = 2.0
    last_error: str | None = None

    def emit(self, event: StepEvent) -> None:
        try:
            import httpx

            httpx.post(
                f"{self.base_url.rstrip('/')}/events/{self.topic}",
                content=json.dumps(event.to_dict()),
                headers={"content-type": "application/json"},
                timeout=self.timeout_s,
            )
        except Exception as exc:  # pragma: no cover - network failure path
            self.last_error = str(exc)


@dataclass
class RunbookContext:
    incident: Incident
    approvals: dict[str, bool] = field(default_factory=dict)
    state: dict[str, Any] = field(default_factory=dict)


StepFn = Callable[[RunbookContext], Any]
Predicate = Callable[[RunbookContext], bool]


@dataclass
class Step:
    name: str
    kind: StepKind
    fn: StepFn | None = None
    predicate: Predicate | None = None
    true_branch: "Runbook | None" = None
    false_branch: "Runbook | None" = None


@dataclass
class Runbook:
    name: str
    incident_class: str
    steps: list[Step] = field(default_factory=list)

    # ── DSL ──
    def step(self, name: str, fn: StepFn) -> "Runbook":
        self.steps.append(Step(name=name, kind="step", fn=fn))
        return self

    def branch(
        self,
        name: str,
        predicate: Predicate,
        true_branch: "Runbook",
        false_branch: "Runbook | None" = None,
    ) -> "Runbook":
        self.steps.append(
            Step(
                name=name,
                kind="branch",
                predicate=predicate,
                true_branch=true_branch,
                false_branch=false_branch,
            )
        )
        return self

    def await_approval(self, name: str) -> "Runbook":
        self.steps.append(Step(name=name, kind="await_approval"))
        return self


@dataclass
class RunResult:
    runbook: str
    incident_id: str
    status: Literal["completed", "failed", "awaiting_approval"]
    events: list[StepEvent]

    def to_dict(self) -> dict:
        return {
            "runbook": self.runbook,
            "incident_id": self.incident_id,
            "status": self.status,
            "events": [e.to_dict() for e in self.events],
        }


def execute(
    runbook: Runbook,
    ctx: RunbookContext,
    sink: EventSink | None = None,
    policy_gate: Any | None = None,
) -> RunResult:
    """Execute ``runbook`` against ``ctx``.

    When ``policy_gate`` is provided, the runbook is treated as a
    state-changing operation and the gate's ``guard()`` is called before any
    step executes. A deny raises ``PolicyDeniedError`` (fail-closed) and no
    steps are run.
    """

    sink = sink or InMemoryEventSink()
    events: list[StepEvent] = []
    status: Literal["completed", "failed", "awaiting_approval"] = "completed"

    if policy_gate is not None:
        policy_gate.guard(
            "sentra.incident_response.execute",
            {
                "incident_id": ctx.incident.id,
                "runbook": runbook.name,
                "incident_class": runbook.incident_class,
                "severity": ctx.incident.severity,
            },
        )

    for step in runbook.steps:
        started = time.time()
        try:
            if step.kind == "step":
                assert step.fn is not None
                out = step.fn(ctx)
                ev = StepEvent(
                    incident_id=ctx.incident.id,
                    runbook=runbook.name,
                    step_name=step.name,
                    kind="step",
                    status="ok",
                    started_at=started,
                    ended_at=time.time(),
                    output=out,
                )
            elif step.kind == "branch":
                assert step.predicate is not None
                cond = bool(step.predicate(ctx))
                chosen = step.true_branch if cond else step.false_branch
                ev = StepEvent(
                    incident_id=ctx.incident.id,
                    runbook=runbook.name,
                    step_name=step.name,
                    kind="branch",
                    status="ok",
                    started_at=started,
                    ended_at=time.time(),
                    output={"condition": cond, "branch": chosen.name if chosen else None},
                )
                events.append(ev)
                sink.emit(ev)
                if chosen is not None:
                    sub = execute(chosen, ctx, sink)
                    events.extend(sub.events)
                    if sub.status != "completed":
                        status = sub.status
                        return RunResult(runbook.name, ctx.incident.id, status, events)
                continue
            else:  # await_approval
                approved = ctx.approvals.get(step.name, False)
                ev = StepEvent(
                    incident_id=ctx.incident.id,
                    runbook=runbook.name,
                    step_name=step.name,
                    kind="await_approval",
                    status="ok" if approved else "awaiting_approval",
                    started_at=started,
                    ended_at=time.time(),
                    output={"approved": approved},
                )
                events.append(ev)
                sink.emit(ev)
                if not approved:
                    return RunResult(
                        runbook.name, ctx.incident.id, "awaiting_approval", events
                    )
                continue
        except Exception as exc:
            ev = StepEvent(
                incident_id=ctx.incident.id,
                runbook=runbook.name,
                step_name=step.name,
                kind=step.kind,
                status="failed",
                started_at=started,
                ended_at=time.time(),
                error=f"{type(exc).__name__}: {exc}",
            )
            events.append(ev)
            sink.emit(ev)
            return RunResult(runbook.name, ctx.incident.id, "failed", events)

        events.append(ev)
        sink.emit(ev)

    return RunResult(runbook.name, ctx.incident.id, status, events)


# ── Canonical runbooks for known incident classes ──

def ransomware_containment() -> Runbook:
    rb = Runbook(name="ransomware_containment", incident_class="ransomware")
    rb.step("isolate_hosts", lambda c: {"isolated": list(c.incident.affected_assets)})
    rb.step("snapshot_volumes", lambda c: {"snapshots": len(c.incident.affected_assets)})
    rb.await_approval("operator_confirm_eradication")
    rb.step("revoke_credentials", lambda c: {"revoked_for": list(c.incident.affected_assets)})
    rb.step("restore_from_backup", lambda c: {"restore_planned": True})
    return rb


def credential_compromise() -> Runbook:
    rb = Runbook(name="credential_compromise", incident_class="credential-compromise")
    rb.step("rotate_secrets", lambda c: {"rotated": list(c.incident.affected_assets)})
    rb.step("invalidate_sessions", lambda c: {"sessions_revoked": True})
    rb.step("audit_recent_auth", lambda c: {"window_hours": 24})
    return rb


def data_exfiltration() -> Runbook:
    rb = Runbook(name="data_exfiltration", incident_class="data-exfiltration")
    rb.step("block_egress", lambda c: {"blocked": list(c.incident.affected_assets)})
    rb.step("hash_artifacts", lambda c: {"artifacts_hashed": True})
    rb.await_approval("legal_review")
    rb.step("notify_regulators", lambda c: {"notified": True})
    return rb


CANONICAL_RUNBOOKS: dict[str, Callable[[], Runbook]] = {
    "ransomware": ransomware_containment,
    "credential-compromise": credential_compromise,
    "data-exfiltration": data_exfiltration,
}


def runbook_for(incident_class: str) -> Runbook:
    factory = CANONICAL_RUNBOOKS.get(incident_class)
    if not factory:
        raise KeyError(f"No canonical runbook for incident class {incident_class!r}")
    return factory()
