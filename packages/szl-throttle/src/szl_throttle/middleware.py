# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v11 — 749/14/163 — replay hash c7c0ba17 — signed Yachay
"""Token-bucket rate limiter + CORS + Khipu-audited rejections for FastAPI."""
from __future__ import annotations

import hashlib
import json
import os
import re
import threading
import time
from typing import Callable, Iterable, List, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

# SZL default CORS allow-list (origins). *.hf.space / *.github.io are matched as
# suffix wildcards; localhost (any port) is allowed for local dev.
SZL_DEFAULT_CORS_ALLOW: List[str] = [
    "https://szlholdings.com",
    "https://*.hf.space",
    "https://*.github.io",
    "http://localhost",
    "https://localhost",
]


def _origin_allowed(origin: str, allow: Iterable[str]) -> bool:
    if not origin:
        return False
    for pat in allow:
        if pat == origin:
            return True
        if pat.startswith("http://localhost") or pat.startswith("https://localhost"):
            if origin.startswith("http://localhost") or origin.startswith("https://localhost"):
                return True
        if "*" in pat:
            # turn https://*.hf.space into a regex
            rx = "^" + re.escape(pat).replace(r"\*", r"[^.]+") + "$"
            if re.match(rx, origin):
                return True
    return False


# ---------------------------------------------------------------------------
# Khipu audit ledger — hash-chained receipts for every rejection.
# ---------------------------------------------------------------------------
class KhipuAuditLedger:
    """In-process hash-chained ledger. Mirrors the SZL Khipu receipt model:
    each receipt's hash = sha256(prev_hash + canonical(payload)). An optional
    DSSE signer hook lets a flagship attach a real cosign signature when its
    SZL_COSIGN_PRIVATE_PEM secret is present (else receipts are honestly UNSIGNED).
    """

    GENESIS = "0" * 64

    def __init__(self, signer: Optional[Callable[[dict], Optional[str]]] = None):
        self._lock = threading.Lock()
        self._receipts: List[dict] = []
        self._head = self.GENESIS
        self._signer = signer

    @staticmethod
    def _canon(obj: dict) -> str:
        return json.dumps(obj, sort_keys=True, separators=(",", ":"))

    def emit(self, kind: str, detail: dict) -> dict:
        with self._lock:
            payload = {
                "kind": kind,  # "rate_limit_429" | "cors_reject"
                "ts": time.time(),
                "detail": detail,
                "prev_hash": self._head,
            }
            payload_hash = hashlib.sha256(
                (self._head + self._canon(payload)).encode()
            ).hexdigest()
            receipt = {**payload, "hash": payload_hash}
            sig = None
            if self._signer is not None:
                try:
                    sig = self._signer(receipt)
                except Exception:
                    sig = None
            receipt["signature"] = sig  # None == honestly UNSIGNED
            self._receipts.append(receipt)
            self._head = payload_hash
            return receipt

    @property
    def head(self) -> str:
        return self._head

    def tail(self, n: int = 50) -> List[dict]:
        with self._lock:
            return list(self._receipts[-n:])

    def verify(self) -> bool:
        """Replay the chain and confirm hash integrity."""
        prev = self.GENESIS
        with self._lock:
            for r in self._receipts:
                body = {k: r[k] for k in ("kind", "ts", "detail", "prev_hash")}
                expect = hashlib.sha256((prev + self._canon(body)).encode()).hexdigest()
                if expect != r["hash"] or r["prev_hash"] != prev:
                    return False
                prev = r["hash"]
        return True


# ---------------------------------------------------------------------------
# Token-bucket rate limiter middleware.
# ---------------------------------------------------------------------------
class TokenBucketRateLimiter(BaseHTTPMiddleware):
    """Per-client-IP token bucket. Default 100 req/min (refill 100/60 tokens/s,
    burst = capacity). Emits a Khipu receipt on every 429.
    """

    def __init__(
        self,
        app,
        rate_per_min: int = 100,
        burst: Optional[int] = None,
        ledger: Optional[KhipuAuditLedger] = None,
        exempt_paths: Optional[Iterable[str]] = None,
    ):
        super().__init__(app)
        self.capacity = float(burst if burst is not None else rate_per_min)
        self.refill_per_s = rate_per_min / 60.0
        self.ledger = ledger
        self.exempt = set(exempt_paths or ("/healthz", "/readyz", "/metrics"))
        self._buckets: dict[str, list] = {}  # ip -> [tokens, last_ts]
        self._lock = threading.Lock()

    def _client_ip(self, request: Request) -> str:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _take(self, ip: str) -> bool:
        now = time.time()
        with self._lock:
            tokens, last = self._buckets.get(ip, [self.capacity, now])
            tokens = min(self.capacity, tokens + (now - last) * self.refill_per_s)
            if tokens >= 1.0:
                tokens -= 1.0
                self._buckets[ip] = [tokens, now]
                return True
            self._buckets[ip] = [tokens, now]
            return False

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.exempt:
            return await call_next(request)
        ip = self._client_ip(request)
        if self._take(ip):
            return await call_next(request)
        receipt_hash = None
        if self.ledger is not None:
            r = self.ledger.emit(
                "rate_limit_429",
                {"ip": ip, "path": request.url.path, "method": request.method},
            )
            receipt_hash = r["hash"]
        retry_after = max(1, int(1.0 / self.refill_per_s))
        return JSONResponse(
            {"detail": "rate limit exceeded", "khipu_receipt": receipt_hash},
            status_code=429,
            headers={"Retry-After": str(retry_after)},
        )


# ---------------------------------------------------------------------------
# CORS middleware that Khipu-audits rejected origins.
# ---------------------------------------------------------------------------
class AuditedCORSMiddleware(BaseHTTPMiddleware):
    """Lightweight CORS gate that records a Khipu receipt when a cross-origin
    request presents a disallowed Origin. The permissive headers themselves are
    set by Starlette's CORSMiddleware (added in setup); this layer only audits.
    """

    def __init__(self, app, allow_origins: Iterable[str], ledger: Optional[KhipuAuditLedger] = None):
        super().__init__(app)
        self.allow = list(allow_origins)
        self.ledger = ledger

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        if origin and not _origin_allowed(origin, self.allow):
            if self.ledger is not None:
                self.ledger.emit(
                    "cors_reject",
                    {"origin": origin, "path": request.url.path, "method": request.method},
                )
            # Do not abort the request body, but signal the rejection clearly for
            # cross-origin (browser) callers — the browser blocks on missing ACAO.
            resp: Response = await call_next(request)
            # Intentionally DO NOT set Access-Control-Allow-Origin for bad origins.
            return resp
        return await call_next(request)


# ---------------------------------------------------------------------------
# Public one-liner.
# ---------------------------------------------------------------------------
def setup(
    app,
    *,
    rate_per_min: int = 100,
    burst: Optional[int] = None,
    cors_allow: Optional[Iterable[str]] = None,
    signer: Optional[Callable[[dict], Optional[str]]] = None,
    expose_ledger_route: bool = True,
) -> KhipuAuditLedger:
    """Wire rate limiting + CORS + Khipu audit into a FastAPI/Starlette app.

    Returns the KhipuAuditLedger so callers can inspect/verify the receipt chain.
    Configurable via env: SZL_RATE_PER_MIN, SZL_CORS_ALLOW (comma-separated).
    """
    rate_per_min = int(os.environ.get("SZL_RATE_PER_MIN", rate_per_min))
    allow = list(cors_allow) if cors_allow else list(SZL_DEFAULT_CORS_ALLOW)
    env_allow = os.environ.get("SZL_CORS_ALLOW")
    if env_allow:
        allow = [o.strip() for o in env_allow.split(",") if o.strip()]

    ledger = KhipuAuditLedger(signer=signer)

    # Starlette CORS for the happy path (sets ACAO for allowed origins). We pass an
    # origin regex so the *.hf.space / *.github.io wildcards work.
    origin_regex = "|".join(
        "^" + re.escape(p).replace(r"\*", r"[^.]+") + "$" for p in allow
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Audit layer for rejected origins.
    app.add_middleware(AuditedCORSMiddleware, allow_origins=allow, ledger=ledger)
    # Rate limiter (outermost so it sheds load before CORS work).
    app.add_middleware(
        TokenBucketRateLimiter,
        rate_per_min=rate_per_min,
        burst=burst,
        ledger=ledger,
    )

    if expose_ledger_route:
        @app.get("/api/throttle/khipu/ledger")
        async def _throttle_ledger():  # pragma: no cover - thin route
            return {
                "head": ledger.head,
                "verified": ledger.verify(),
                "receipts": ledger.tail(50),
            }

    return ledger
