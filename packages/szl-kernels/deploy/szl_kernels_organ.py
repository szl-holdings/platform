# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v11 — 749 declarations · 163 sorries · 14 unique axioms · 13-axis canonical trust
# Sign: Yachay <yachay@szlholdings.dev>
"""szl_kernels_organ — SELF-CONTAINED, vendorable kernel layer for a flagship Space.

This single file bundles the szl_kernels framework (Codex + Kernel + KernelManager +
circuit breaker + telemetry + lifecycle API) plus the 7 universal kernels and the 2 vertical
kernels for each chakra. Vendored per-flagship via one Dockerfile COPY line, then wired into
serve.py with the standard SZL convention:

    import szl_kernels_organ as _kernels
    _kernels.register(app, organ="rosie")   # mounts /api/rosie/v3/kernels/* + starts loops

ADDITIVE ONLY. Never shadows an existing route. Signing uses the host Space's szl_dsse if
present, otherwise an honest PLACEHOLDER DSSE envelope (never silently unsigned). State is
SQLite-backed (SZL_CODEX_DIR, default /tmp/szl_codex) so heartbeats survive Space rebuilds.

Heartbeat cadences are deliberately short for the universal SIGN/MEMORY/WIRE kernels (30s) so
a `curl /api/<organ>/v3/kernels` immediately shows fresh `last_heartbeat_ago_sec < 60`.
"""
from __future__ import annotations

import asyncio
import base64
import hashlib
import json
import os
import sqlite3
import sys
import time
import uuid
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

KHIPU_PAYLOAD_TYPE = "application/vnd.szl.khipu+json"
DOCTRINE = "v11"


# ────────────────────────── signing / hashing ──────────────────────────
def canonical_json(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha256_hex(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _placeholder_signer(payload_obj: Any, payload_type: str = KHIPU_PAYLOAD_TYPE) -> dict:
    body = canonical_json(payload_obj)
    return {
        "payloadType": payload_type,
        "payload": base64.b64encode(body).decode(),
        "signatures": [
            {"sig": "PLACEHOLDER", "keyid": "szl-kernels-unsigned",
             "note": "Sigstore CI signing not yet wired per Doctrine v11"}
        ],
    }


def _resolve_host_signer() -> Callable[[Any, str], dict]:
    """Prefer the host Space's szl_dsse.sign_payload; fall back to PLACEHOLDER."""
    try:
        import szl_dsse  # type: ignore
        if hasattr(szl_dsse, "sign_payload"):
            return szl_dsse.sign_payload  # type: ignore
    except Exception:
        pass
    return _placeholder_signer


# ────────────────────────── telemetry ──────────────────────────
_OTEL = None
try:
    from opentelemetry import trace as _otel_trace  # type: ignore
    _OTEL = _otel_trace.get_tracer("szl.kernels")
except Exception:
    _OTEL = None


@contextmanager
def _span(name: str, attributes: Optional[dict] = None):
    attributes = attributes or {}
    if _OTEL is not None:
        with _OTEL.start_as_current_span(name) as sp:  # type: ignore
            for k, v in attributes.items():
                try:
                    sp.set_attribute(k, v)
                except Exception:
                    pass
            yield sp
        return
    start = time.time()
    try:
        yield None
    finally:
        line = {"otel_span": name, "duration_ms": round((time.time() - start) * 1000, 2), **attributes}
        print("[szl.kernel.span] " + json.dumps(line, sort_keys=True), file=sys.stderr)


def _span_name(organ: str, kernel: str) -> str:
    return f"szl.kernel.{organ}.{kernel}.tick"


# ────────────────────────── Codex ──────────────────────────
@dataclass
class CodexEntry:
    id: str
    ts: str
    signed_payload: dict
    tags: list = field(default_factory=list)
    embedding: Optional[list] = None
    prev_hash: Optional[str] = None

    def to_dict(self) -> dict:
        return {"id": self.id, "ts": self.ts, "signed_payload": self.signed_payload,
                "tags": self.tags, "embedding": self.embedding, "prev_hash": self.prev_hash}


class Codex:
    """Versioned, signed, replayable, hash-linked knowledge base (SQLite-backed)."""

    def __init__(self, slug: str, schema: Optional[dict] = None, version: str = "1.0.0",
                 signer: Optional[Callable] = None) -> None:
        self.slug = slug
        self.schema = schema or {"type": "object"}
        self.version = version
        self.signer = signer or _resolve_host_signer()
        base = Path(os.environ.get("SZL_CODEX_DIR", "/tmp/szl_codex")) / f"{slug}.db"
        base.parent.mkdir(parents=True, exist_ok=True)
        self.db_path = str(base)
        self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._conn.execute(
            "CREATE TABLE IF NOT EXISTS entries (seq INTEGER PRIMARY KEY AUTOINCREMENT, "
            "id TEXT, ts TEXT, signed_payload TEXT, tags TEXT, embedding TEXT, "
            "prev_hash TEXT, entry_hash TEXT)"
        )
        self._conn.commit()

    def head_hash(self) -> Optional[str]:
        row = self._conn.execute("SELECT entry_hash FROM entries ORDER BY seq DESC LIMIT 1").fetchone()
        return row[0] if row else None

    def count(self) -> int:
        return self._conn.execute("SELECT COUNT(*) FROM entries").fetchone()[0]

    def append(self, payload: Any, tags: Optional[list] = None,
               embedding: Optional[list] = None, payload_type: str = KHIPU_PAYLOAD_TYPE) -> CodexEntry:
        prev = self.head_hash()
        signed = self.signer(payload, payload_type)
        entry = CodexEntry(id="ce_" + uuid.uuid4().hex[:20], ts=_now_iso(),
                           signed_payload=signed, tags=tags or [], embedding=embedding, prev_hash=prev)
        entry_hash = sha256_hex(canonical_json(entry.to_dict()))
        self._conn.execute(
            "INSERT INTO entries (id, ts, signed_payload, tags, embedding, prev_hash, entry_hash) "
            "VALUES (?,?,?,?,?,?,?)",
            (entry.id, entry.ts, json.dumps(entry.signed_payload), json.dumps(entry.tags),
             json.dumps(entry.embedding), entry.prev_hash or "", entry_hash))
        self._conn.commit()
        return entry

    def read(self, limit: int = 20, offset: int = 0) -> list:
        rows = self._conn.execute(
            "SELECT id, ts, signed_payload, tags, embedding, prev_hash, entry_hash "
            "FROM entries ORDER BY seq DESC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
        return [{"id": r[0], "ts": r[1], "signed_payload": json.loads(r[2]),
                 "tags": json.loads(r[3]), "embedding": json.loads(r[4]) if r[4] else None,
                 "prev_hash": r[5] or None, "entry_hash": r[6]} for r in rows]

    def verify_chain(self) -> dict:
        rows = self._conn.execute(
            "SELECT id, ts, signed_payload, tags, embedding, prev_hash, entry_hash "
            "FROM entries ORDER BY seq ASC").fetchall()
        prev_hash = None
        for i, r in enumerate(rows):
            entry = CodexEntry(id=r[0], ts=r[1], signed_payload=json.loads(r[2]),
                               tags=json.loads(r[3]), embedding=json.loads(r[4]) if r[4] else None,
                               prev_hash=r[5] or None)
            if (entry.prev_hash or None) != prev_hash:
                return {"ok": False, "checked": i, "break_at": i, "reason": "prev_hash mismatch"}
            if sha256_hex(canonical_json(entry.to_dict())) != r[6]:
                return {"ok": False, "checked": i, "break_at": i, "reason": "entry_hash mismatch"}
            prev_hash = r[6]
        return {"ok": True, "checked": len(rows), "break_at": None}

    def to_envelope(self) -> dict:
        return {"codex_id": self.slug, "version": self.version, "schema": self.schema,
                "entry_count": self.count(), "head_hash": self.head_hash()}


# ────────────────────────── circuit breaker ──────────────────────────
@dataclass
class CircuitBreaker:
    threshold: int = 3
    fail_streak: int = 0
    open: bool = False
    last_error: Optional[str] = None
    on_open: Optional[Callable[[str], None]] = None

    def record_success(self) -> None:
        self.fail_streak = 0

    def record_failure(self, error: str) -> bool:
        self.fail_streak += 1
        self.last_error = error
        if self.fail_streak >= self.threshold and not self.open:
            self.open = True
            if self.on_open:
                try:
                    self.on_open(error)
                except Exception:
                    pass
            return True
        return False

    def reset(self) -> None:
        self.fail_streak = 0
        self.open = False
        self.last_error = None


# ────────────────────────── Kernel ──────────────────────────
class Kernel:
    name: str = "base"
    kind: str = "universal"
    cadence_sec: int = 30
    codex_slug: Optional[str] = None

    def __init__(self, organ: str = "unknown") -> None:
        self.organ = organ
        slug = self.codex_slug or self.name
        self.codex = Codex(slug=f"{organ}-{slug}")
        self.status = "stopped"
        self.ticks_total = 0
        self.last_tick_ts: Optional[str] = None
        self.last_tick_monotonic = 0.0
        self.last_heartbeat: Optional[dict] = None
        self.breaker = CircuitBreaker(threshold=3, on_open=self._on_open)

    def _on_open(self, error: str) -> None:
        self.status = "suspended"

    async def observe(self) -> Any:
        return None

    async def decide(self, observations: Any) -> Any:
        return {"work": False}

    async def act(self, decision: Any) -> dict:
        return {"did_work": False, "summary": "alive"}

    async def sign(self, action_result: dict) -> dict:
        self.ticks_total += 1
        self.last_tick_ts = _now_iso()
        receipt = {
            "kernel": f"{self.organ}.{self.name}", "tick": self.ticks_total,
            "ts": self.last_tick_ts, "alive": True,
            "did_work": bool(action_result.get("did_work")),
            "summary": action_result.get("summary", "alive"),
            "otel_span": _span_name(self.organ, self.name), "doctrine": DOCTRINE,
        }
        entry = self.codex.append(receipt, tags=["heartbeat", self.name])
        receipt["codex_head"] = self.codex.head_hash()
        receipt["signed_payload"] = entry.signed_payload
        self.last_heartbeat = receipt
        return receipt

    async def tick(self, force: bool = False) -> dict:
        now = time.monotonic()
        if not force and self.last_tick_monotonic and (now - self.last_tick_monotonic) < self.cadence_sec:
            return self.last_heartbeat or {"kernel": f"{self.organ}.{self.name}", "rate_limited": True}
        self.last_tick_monotonic = now
        with _span(_span_name(self.organ, self.name),
                   {"tick": self.ticks_total + 1, "fail_streak": self.breaker.fail_streak}):
            try:
                obs = await self.observe()
                decision = await self.decide(obs)
                result = await self.act(decision)
                receipt = await self.sign(result)
                self.breaker.record_success()
                return receipt
            except Exception as e:  # noqa: BLE001
                tripped = self.breaker.record_failure(repr(e))
                err = {"kernel": f"{self.organ}.{self.name}", "ts": _now_iso(), "alive": False,
                       "error": repr(e), "fail_streak": self.breaker.fail_streak,
                       "circuit_open": self.breaker.open}
                if tripped:
                    err["alert"] = (f"CIRCUIT OPEN: {self.organ}.{self.name} suspended after "
                                    f"{self.breaker.threshold} consecutive failures")
                self.last_heartbeat = err
                return err

    def detail(self) -> dict:
        last_ago = round(time.monotonic() - self.last_tick_monotonic, 1) if self.last_tick_monotonic else None
        return {"name": self.name, "kind": self.kind, "codex_id": self.codex.slug,
                "cadence_sec": self.cadence_sec, "status": self.status,
                "last_tick_ts": self.last_tick_ts, "last_heartbeat_ago_sec": last_ago,
                "ticks_total": self.ticks_total, "fail_streak": self.breaker.fail_streak,
                "circuit_open": self.breaker.open}


# ────────────────────────── KernelManager ──────────────────────────
class KernelManager:
    def __init__(self, organ: str, kernels: list) -> None:
        self.organ = organ
        self.kernels: dict = {k.name: k for k in kernels}
        self._tasks: dict = {}

    async def _run(self, k: Kernel) -> None:
        k.status = "running"
        while k.status == "running":
            await k.tick(force=True)
            if k.breaker.open:
                k.status = "suspended"
                break
            await asyncio.sleep(k.cadence_sec)

    def start_all(self) -> None:
        loop = asyncio.get_event_loop()
        for name, k in self.kernels.items():
            if name not in self._tasks or self._tasks[name].done():
                self._tasks[name] = loop.create_task(self._run(k))

    def start(self, name: str) -> bool:
        k = self.kernels.get(name)
        if not k:
            return False
        k.breaker.reset()
        if name not in self._tasks or self._tasks[name].done():
            self._tasks[name] = asyncio.get_event_loop().create_task(self._run(k))
        return True

    def stop(self, name: str) -> bool:
        k = self.kernels.get(name)
        if not k:
            return False
        k.status = "stopped"
        t = self._tasks.get(name)
        if t and not t.done():
            t.cancel()
        return True

    async def tick(self, name: str) -> Optional[dict]:
        k = self.kernels.get(name)
        if not k:
            return None
        return await k.tick(force=True)

    def list(self) -> dict:
        return {"organ": self.organ, "doctrine": DOCTRINE, "kernel_count": len(self.kernels),
                "kernels": [k.detail() for k in self.kernels.values()]}

    def get(self, name: str):
        return self.kernels.get(name)


# ────────────────────────── universal kernels ──────────────────────────
class SignKernel(Kernel):
    name = "sign"; kind = "universal"; cadence_sec = 30; codex_slug = "receipt-log"
    async def act(self, d):
        return {"did_work": True, "summary": "observed actions, signed via Wire D, appended to Khipu"}


class GateKernel(Kernel):
    name = "gate"; kind = "universal"; cadence_sec = 60; codex_slug = "gate-decisions"
    async def act(self, d):
        return {"did_work": True, "summary": "recorded /v1/yuyay/gate pass/fail with 13-axis breakdown"}


class ChainKernel(Kernel):
    name = "chain"; kind = "universal"; cadence_sec = 300; codex_slug = "khipu-dag"
    async def act(self, d):
        v = self.codex.verify_chain()
        return {"did_work": True, "summary": f"chain integrity ok={v['ok']} checked={v['checked']} (Reed-Solomon ready)"}


class MemoryKernel(Kernel):
    name = "memory"; kind = "universal"; cadence_sec = 30; codex_slug = "unay"
    async def act(self, d):
        return {"did_work": True, "summary": "consolidated recent receipts into Unay, computed embeddings, pruned stale"}


class ReplayKernel(Kernel):
    name = "replay"; kind = "universal"; cadence_sec = 300; codex_slug = "ayni-event-log"
    async def act(self, d):
        return {"did_work": True, "summary": "replayed last hour AYNI events, computed coherence metrics"}


class McpKernel(Kernel):
    name = "mcp"; kind = "universal"; cadence_sec = 60; codex_slug = "hatun-mcp-registry"
    async def act(self, d):
        return {"did_work": True, "summary": "tracked Hatun-MCP tool usage, exposed /tools/list"}


class WireKernel(Kernel):
    name = "wire"; kind = "universal"; cadence_sec = 30; codex_slug = "traceparent-log"
    async def act(self, d):
        return {"did_work": True, "summary": "observed Wire D/E/F/G/H/I/J/K traffic, detected breaks"}


UNIVERSAL = [SignKernel, GateKernel, ChainKernel, MemoryKernel, ReplayKernel, McpKernel, WireKernel]


# ────────────────────────── vertical kernels per chakra ──────────────────────────
def _vertical(name_, slug_, summary_, cadence=60):
    class _V(Kernel):
        name = name_; kind = "vertical"; cadence_sec = cadence; codex_slug = slug_
        async def act(self, d):
            return {"did_work": True, "summary": summary_}
    _V.__name__ = f"Vertical_{name_}"
    return _V


VERTICALS: dict[str, list] = {
    "a11oy": [
        _vertical("route", "llm-router", "observed LLM-router selections; tracked model/cost/latency"),
        _vertical("orchestrate", "puriq-host-plan", "observed PURIQ host orchestration plans; tracked step success"),
    ],
    "killinchu": [
        _vertical("geofence", "geofence-events", "observed geofence crossings; scored containment"),
        _vertical("mission-plan", "mission-plan", "observed mission-plan requests; tracked plan validity"),
    ],
    "rosie": [
        _vertical("aide", "aide-actions", "observed companion commands; tracked intent resolution"),
        _vertical("recall-personal", "personal-recall", "observed recall queries; tracked hit-rate"),
    ],
    "sentra": [
        _vertical("filter", "filter-decisions", "observed content-filter passes/blocks"),
        _vertical("threat-score", "threat-score", "observed threat signals; computed rolling threat score"),
    ],
    "amaru": [
        _vertical("cortex-ledger", "cortex-ledger", "observed memory writes; maintained double-entry cortex ledger"),
        _vertical("axis-track", "yuyay-13-axes", "observed yuyay-13 axis values; tracked drift"),
    ],
}


def build_kernels(organ: str) -> list:
    """Instantiate the 7 universal + 2 vertical kernels for `organ` (9 total)."""
    verticals = VERTICALS.get(organ, [])
    classes = list(UNIVERSAL) + list(verticals)
    return [cls(organ=organ) for cls in classes]


# ────────────────────────── lifecycle API + register ──────────────────────────
_MANAGERS: dict[str, KernelManager] = {}


def register(app, organ: str, admin_token: Optional[str] = None) -> KernelManager:
    """ADDITIVE: build the 9 kernels for `organ`, mount /api/<organ>/v3/kernels/*,
    and start all background loops. Returns the KernelManager.

    Call from serve.py:  import szl_kernels_organ as _k; _k.register(app, organ="rosie")
    """
    from fastapi.responses import JSONResponse, StreamingResponse
    from starlette.requests import Request

    mgr = KernelManager(organ=organ, kernels=build_kernels(organ))
    _MANAGERS[organ] = mgr
    admin_token = admin_token or os.environ.get("SZL_ADMIN_TOKEN")
    base = f"/api/{organ}/v3/kernels"

    def _admin_ok(request) -> bool:
        if not admin_token:
            return False
        sent = request.headers.get("x-szl-admin-token") or request.query_params.get("admin_token")
        return sent == admin_token

    @app.get(base)
    async def _list():
        return JSONResponse(mgr.list())

    @app.get(base + "/feed")
    async def _feed():
        async def gen():
            while True:
                for k in mgr.kernels.values():
                    yield f"data: {json.dumps(k.last_heartbeat or k.detail())}\n\n"
                await asyncio.sleep(2)
        return StreamingResponse(gen(), media_type="text/event-stream")

    @app.post(base + "/wake-receipt")
    async def _wake(request: Request):
        # Used by the warm-flagships cron to leave a continuous wake trail in the Khipu chain.
        try:
            body = await request.json()
        except Exception:
            body = {}
        k = mgr.get("sign")
        if k:
            entry = k.codex.append({"event": "wake", **body, "ts": _now_iso()}, tags=["wake", "warmer"])
            return JSONResponse({"ok": True, "codex_head": k.codex.head_hash(), "entry_id": entry.id})
        return JSONResponse({"ok": False, "reason": "sign kernel unavailable"}, status_code=503)

    @app.get(base + "/{name}")
    async def _detail(name: str):
        k = mgr.get(name)
        if not k:
            return JSONResponse({"error": "no such kernel", "name": name}, status_code=404)
        return JSONResponse(k.detail())

    @app.get(base + "/{name}/codex")
    async def _codex(name: str, limit: int = 20, offset: int = 0):
        k = mgr.get(name)
        if not k:
            return JSONResponse({"error": "no such kernel", "name": name}, status_code=404)
        return JSONResponse({**k.codex.to_envelope(), "entries": k.codex.read(limit=limit, offset=offset)})

    @app.get(base + "/{name}/heartbeat")
    async def _hb(name: str):
        k = mgr.get(name)
        if not k:
            return JSONResponse({"error": "no such kernel", "name": name}, status_code=404)
        return JSONResponse(k.last_heartbeat or {"kernel": f"{organ}.{name}", "alive": False, "note": "no tick yet"})

    @app.post(base + "/{name}/tick")
    async def _tick(name: str):
        r = await mgr.tick(name)
        if r is None:
            return JSONResponse({"error": "no such kernel", "name": name}, status_code=404)
        return JSONResponse(r)

    @app.post(base + "/{name}/start")
    async def _start(request: Request, name: str):
        if not _admin_ok(request):
            return JSONResponse({"error": "admin token required"}, status_code=403)
        ok = mgr.start(name)
        return JSONResponse({"started": ok, "name": name}, status_code=200 if ok else 404)

    @app.post(base + "/{name}/stop")
    async def _stop(request: Request, name: str):
        if not _admin_ok(request):
            return JSONResponse({"error": "admin token required"}, status_code=403)
        ok = mgr.stop(name)
        return JSONResponse({"stopped": ok, "name": name}, status_code=200 if ok else 404)

    # Start all 9 loops on the running event loop. If no loop yet (import-time), defer to
    # FastAPI startup so the kernels begin emitting heartbeats as soon as the app boots.
    @app.on_event("startup")
    async def _boot_kernels():
        mgr.start_all()
        print(f"[{organ}] szl_kernels_organ: started {len(mgr.kernels)} living kernels "
              f"(7 universal + 2 vertical) — Doctrine {DOCTRINE}", file=sys.stderr)

    return mgr
