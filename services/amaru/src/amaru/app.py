"""Amaru — FastAPI app exposing the 7-chakra runtime."""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from . import CHAKRA_ORDER, __version__
from .chakana_wiring import wiring_snapshot
from .chakras import CHAKRA_REGISTRY, get_chakra
from .amaru_scheduler import AmaruScheduler
from .huklla import evaluate_all
from . import overwatch as _overwatch
from .receipts import ReceiptChain
from .yawar_bus import get_bus

app = FastAPI(
    title="Amaru — Andean Ouroboros brain runtime",
    version=__version__,
    description="7-chakra kernels behind one FastAPI surface (task #5176).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_chain = ReceiptChain(operator_id="amaru-runtime")
_scheduler = AmaruScheduler(_chain)
_bus = get_bus()

# Runtime counters surfaced via tripwires / metrics
_state: dict[str, Any] = {
    "bus_publishes": 0,
    "bus_publish_failures": 0,
    "oversized_envelopes": 0,
    "last_evaluation": {name: None for name in CHAKRA_ORDER},
}

ENVELOPE_SOFT_LIMIT_BYTES = 65_536

# In-process fan-out for SSE subscribers. Each subscriber gets its own bounded
# queue; slow consumers drop oldest events rather than blocking publishers.
_sse_subscribers: list[asyncio.Queue[dict[str, Any]]] = []
_SSE_QUEUE_MAX = 64


def _sse_broadcast(event: dict[str, Any]) -> None:
    for q in list(_sse_subscribers):
        try:
            if q.full():
                try:
                    q.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            q.put_nowait(event)
        except Exception:
            pass


class EvaluateRequest(BaseModel):
    envelope: dict[str, Any] = Field(default_factory=dict)


class SchedulerTickRequest(BaseModel):
    envelope: dict[str, Any] | None = None


def _publish_async(coro: Any) -> None:
    """Fire-and-forget bus publish that never blocks the request."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(coro)
    except RuntimeError:
        # No loop yet — drop. Bus publish is best-effort.
        pass


async def _publish_chakra(name: str, evaluation: dict[str, Any]) -> None:
    result = await _bus.publish(
        type_="amaru.chakra",
        source_id=f"amaru:{name}",
        payload=evaluation,
    )
    _state["bus_publishes"] += 1
    if not result.get("ok"):
        _state["bus_publish_failures"] += 1
    _sse_broadcast({"type": "amaru.chakra", "source_id": f"amaru:{name}", "payload": evaluation})


async def _publish_tick(payload: dict[str, Any]) -> None:
    result = await _bus.publish(
        type_="amaru.scheduler",
        source_id="amaru:scheduler",
        payload=payload,
    )
    _state["bus_publishes"] += 1
    if not result.get("ok"):
        _state["bus_publish_failures"] += 1
    _sse_broadcast({"type": "amaru.scheduler", "source_id": "amaru:scheduler", "payload": payload})


@app.get("/healthz")
def healthz() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "amaru",
        "version": __version__,
        "chakras": list(CHAKRA_ORDER),
        "stubbed": [name for name, e in CHAKRA_REGISTRY.items() if e.stubbed],
        "scheduler_ticks": _scheduler.tick_count,
        "receipts": _chain.length(),
    }


@app.get("/health")
def health() -> dict[str, Any]:
    """Alias of /healthz for clients that probe the conventional path."""
    return healthz()


@app.get("/")
def root() -> dict[str, Any]:
    """Service identity card — points discoverers at /docs and /healthz."""
    return {
        "service": "amaru",
        "version": __version__,
        "docs": "/docs",
        "openapi": "/openapi.json",
        "health": "/healthz",
        "endpoints": [
            "/healthz",
            "/overwatch/snapshot",
            "/chakra/{name}/leader",
            "/chakra/{name}/evaluate",
            "/scheduler/tick",
            "/scheduler/wiring",
            "/state",
            "/receipts",
            "/events",
            "/tripwires",
        ],
    }


@app.get("/overwatch/snapshot")
def overwatch_snapshot() -> dict[str, Any]:
    """R0513 — read-only OVERWATCH panel (6 invariants).

    Doctrine: R0513 watches; halt authority belongs to HUKLLA. This endpoint
    never mutates state. It computes the panel against the current receipt
    chain and chakana wiring."""
    receipts = [r.to_dict() for r in _chain.all()]
    snap = _overwatch.evaluate_panel(
        receipts=receipts,
        wiring=wiring_snapshot(),
        baseline_axes=None,
        observed_axes=None,
        margins=None,
        in_flight=0,
        regated=0,
    )
    return snap.to_dict()


@app.get("/chakra/{name}/leader")
def get_leader(name: str) -> dict[str, Any]:
    try:
        entry = get_chakra(name)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"unknown chakra: {name}")
    return {
        "chakra": entry.name,
        "leader_md": entry.leader_md,
        "proof_id": entry.proof.get("proof_id"),
        "proof_sha256": entry.proof.get("sha256"),
        "proof_kind": entry.proof.get("kind"),
        "stubbed": entry.stubbed,
        "rejected_md": entry.rejected_md,
    }


@app.post("/chakra/{name}/evaluate")
async def evaluate_chakra(name: str, body: EvaluateRequest) -> dict[str, Any]:
    try:
        entry = get_chakra(name)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"unknown chakra: {name}")

    envelope = body.envelope or {}
    # Soft envelope size guard (tripwire huklla-9).
    try:
        size = len(repr(envelope).encode("utf-8"))
        if size > ENVELOPE_SOFT_LIMIT_BYTES:
            _state["oversized_envelopes"] += 1
    except Exception:
        pass

    try:
        output = entry.evaluate(envelope)
        error: str | None = None
    except NotImplementedError as exc:
        output = None
        error = str(exc)
    except Exception as exc:  # noqa: BLE001
        output = None
        error = f"{type(exc).__name__}: {exc}"

    receipt = _chain.append(
        endpoint=f"/chakra/{name}/evaluate",
        method="POST",
        params={"envelope": envelope},
        result={"output": output, "error": error},
        metadata={
            "chakra": name,
            "stubbed": entry.stubbed,
            "proof_id": entry.proof.get("proof_id"),
        },
    )

    evaluation = {
        "chakra": name,
        "proof_id": entry.proof.get("proof_id"),
        "output": output,
        "error": error,
        "stubbed": entry.stubbed,
        "receipt": receipt.to_dict(),
    }
    _state["last_evaluation"][name] = evaluation

    _publish_async(_publish_chakra(name, evaluation))

    if error and not entry.stubbed:
        # Real runtime failure — return 500. Stub kernels return 200 with the
        # error so the Brain panel can render "stubbed, surfaced loudly".
        raise HTTPException(status_code=500, detail=evaluation)

    return evaluation


@app.post("/scheduler/tick")
async def scheduler_tick(body: SchedulerTickRequest) -> dict[str, Any]:
    result = _scheduler.tick(body.envelope)
    step_seqs = [s.receipt_seq for s in result.steps]
    # Single canonical tick-level receipt that summarises the whole tick.
    # Downstream consumers of `amaru.scheduler` can pin to this id/hash
    # for replay/audit instead of stitching together per-step seqs.
    tick_receipt = _chain.append(
        endpoint="/scheduler/tick",
        method="POST",
        params={"envelope": body.envelope or {}},
        result={
            "tick_id": result.tick_id,
            "closure": result.closure,
            "handoff": result.handoff,
            "step_receipt_seqs": step_seqs,
        },
        metadata={
            "kind": "scheduler_tick",
            "tick": result.tick_id,
            "step_count": len(result.steps),
            "stubbed_count": sum(1 for s in result.steps if s.stubbed),
        },
    )
    payload = {
        "tick_id": result.tick_id,
        "tick_receipt": {
            "seq": tick_receipt.seq,
            "hash": tick_receipt.self_hash,
            "prevHash": tick_receipt.prev_hash,
        },
        "steps": [
            {
                "chakra": s.chakra,
                "output": s.output,
                "error": s.error,
                "stubbed": s.stubbed,
                "receipt_seq": s.receipt_seq,
            }
            for s in result.steps
        ],
        "closure": result.closure,
        "handoff": result.handoff,
    }

    # Mirror per-chakra last-evaluation snapshots so the Brain panel can
    # poll a single source after a scheduler tick, AND publish each step
    # to `amaru.chakra` so the bus stream and SSE clients see every
    # kernel evaluation (replay fidelity: one tick = 7 amaru.chakra
    # events + 1 amaru.scheduler event).
    for s in result.steps:
        entry = CHAKRA_REGISTRY[s.chakra]
        step_evaluation = {
            "chakra": s.chakra,
            "proof_id": entry.proof.get("proof_id"),
            "output": s.output,
            "error": s.error,
            "stubbed": s.stubbed,
            "receipt": {"seq": s.receipt_seq},
            "via": "scheduler",
            "tick_id": result.tick_id,
        }
        _state["last_evaluation"][s.chakra] = step_evaluation
        _publish_async(_publish_chakra(s.chakra, step_evaluation))

    _publish_async(_publish_tick(payload))

    return payload


@app.get("/scheduler/wiring")
def scheduler_wiring() -> dict[str, Any]:
    return wiring_snapshot()


@app.get("/state")
def runtime_state() -> dict[str, Any]:
    return {
        "chakras": list(CHAKRA_ORDER),
        "last_evaluation": _state["last_evaluation"],
        "scheduler_ticks": _scheduler.tick_count,
        "receipts": _chain.length(),
        "bus": {
            "publishes": _state["bus_publishes"],
            "failures": _state["bus_publish_failures"],
        },
    }


@app.get("/receipts")
def receipts(limit: int = 50) -> dict[str, Any]:
    all_receipts = _chain.all()
    tail = all_receipts[-max(1, min(limit, 500)) :]
    return {
        "total": len(all_receipts),
        "head_seq": all_receipts[-1].seq if all_receipts else 0,
        "items": [r.to_dict() for r in tail],
    }


@app.get("/events")
async def events() -> StreamingResponse:
    """SSE stream of `amaru.chakra` and `amaru.scheduler` events.

    Subscribers receive a `hello` event on connect and then JSON-encoded
    bus envelopes as they are published. Topic names match the Prism Bus
    publish contract exactly (`amaru.chakra`, `amaru.scheduler`).
    """
    queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=_SSE_QUEUE_MAX)
    _sse_subscribers.append(queue)

    async def gen() -> Any:
        try:
            hello = {
                "type": "hello",
                "payload": {
                    "chakras": list(CHAKRA_ORDER),
                    "topics": ["amaru.chakra", "amaru.scheduler"],
                },
            }
            yield f"event: {hello['type']}\ndata: {json.dumps(hello)}\n\n"
            while True:
                try:
                    evt = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"event: {evt['type']}\ndata: {json.dumps(evt)}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat keeps proxies from closing the connection.
                    yield ": keepalive\n\n"
        finally:
            if queue in _sse_subscribers:
                _sse_subscribers.remove(queue)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/tripwires")
def tripwires() -> dict[str, Any]:
    snap = {
        "registered_chakras": list(CHAKRA_REGISTRY.keys()),
        "chain_breaks": 0,
        "chakras_missing_proof": [
            n for n, e in CHAKRA_REGISTRY.items() if not e.proof.get("proof_id")
        ],
        "stubbed_chakras": [n for n, e in CHAKRA_REGISTRY.items() if e.stubbed],
        "scheduler_ticks": _scheduler.tick_count,
        "unexpected_cycles": 0,
        "bus_publishes": _state["bus_publishes"],
        "bus_publish_failures": _state["bus_publish_failures"],
        "chakras_missing_leader": [
            n for n, e in CHAKRA_REGISTRY.items() if not e.leader_md.strip()
        ],
        "oversized_envelopes": _state["oversized_envelopes"],
        "declared_order": list(CHAKRA_ORDER),
    }
    results = evaluate_all(snap)
    return {
        "summary": {
            "pass": sum(1 for r in results if r.status == "pass"),
            "warn": sum(1 for r in results if r.status == "warn"),
            "trip": sum(1 for r in results if r.status == "trip"),
            "total": len(results),
        },
        "tripwires": [
            {"id": r.id, "title": r.title, "status": r.status, "detail": r.detail}
            for r in results
        ],
    }


def main() -> None:
    import uvicorn

    port = int(os.environ.get("PORT", "6810"))
    uvicorn.run("amaru.app:app", host="0.0.0.0", port=port, log_level="info")


if __name__ == "__main__":
    main()
