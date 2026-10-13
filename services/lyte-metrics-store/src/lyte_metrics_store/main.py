"""
Lyte Metrics Store — FastAPI application.

The Substrate Python worker fleet's retrieval stage POSTs to this service
when a workflow is configured with ``retrieverAdapterId =
"lyte-metrics-store"`` (or ``"lyte-retriever"``). See
``services/substrate-py-workers/src/worker/adapters/retriever.py`` for the
client side.

Endpoints:
  POST /v1/retrieve   — score the deterministic fixture corpus in dev/test
  GET  /health        — liveness probe
  GET  /ready         — readiness probe

Environment variables:
  PORT                            — port to bind (default: 8081)
  LYTE_METRICS_STORE_API_KEY      — Bearer token for POST /v1/retrieve; no default
  LYTE_METRICS_STORE_TENANT_ID    — production tenant bound to that credential
  LYTE_METRICS_STORE_ENV          — development/test/production environment marker
  LYTE_METRICS_STORE_AUTH_BYPASS — explicit development/test-only auth bypass
"""

from __future__ import annotations

import os
import re
import secrets
from collections.abc import Mapping
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any

import structlog
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .corpus import FIXTURE_CORPUS_ID, FIXTURE_KIND, LYTE_CORPUS
from .retrieval import top_k_documents

log = structlog.get_logger(__name__)

API_KEY_ENV = "LYTE_METRICS_STORE_API_KEY"
AUTH_BYPASS_ENV = "LYTE_METRICS_STORE_AUTH_BYPASS"
SERVICE_ENV = "LYTE_METRICS_STORE_ENV"
TENANT_ID_ENV = "LYTE_METRICS_STORE_TENANT_ID"
_TRUE_VALUES = frozenset({"1", "true", "yes"})
_FALSE_VALUES = frozenset({"0", "false", "no", "off"})
_DEVELOPMENT_ENVIRONMENTS = frozenset(
    {"dev", "development", "local", "local-dev", "test", "testing"}
)
_PRODUCTION_ENVIRONMENTS = frozenset({"prod", "production"})
_VALID_RUNTIME_MODES = frozenset(
    {"local-dev", "internal-preview", "demo", "production"}
)
_TENANT_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,127}$")


class SecurityConfigurationError(RuntimeError):
    """The service cannot safely accept retrieval traffic."""


@dataclass(frozen=True)
class SecurityConfig:
    environment: str
    api_key: str | None
    bound_tenant_id: str | None
    bypass_enabled: bool


@dataclass(frozen=True)
class RetrievalCapability:
    """Identity and evidence required before retrieval may serve production."""

    backend_id: str
    backend_kind: str
    fixture: bool
    tenant_scoped: bool
    backend_qualified: bool
    source_receipt_id: str | None
    source_receipt_verified: bool

    @property
    def production_ready(self) -> bool:
        return (
            not self.fixture
            and self.tenant_scoped
            and self.backend_qualified
            and self.source_receipt_verified
            and bool(self.source_receipt_id)
        )


# The only backend wired in this release is a process-local deterministic
# fixture. There is deliberately no environment switch that can relabel it as
# production evidence. A future real backend must replace this capability with
# tenant isolation, qualification evidence, and a verified source receipt.
RETRIEVAL_CAPABILITY = RetrievalCapability(
    backend_id=FIXTURE_CORPUS_ID,
    backend_kind=FIXTURE_KIND,
    fixture=True,
    tenant_scoped=False,
    backend_qualified=False,
    source_receipt_id=None,
    source_receipt_verified=False,
)


def build_production_retrieval_hold() -> dict[str, Any]:
    """Return the explicit production HOLD without synthetic result fields."""

    return {
        "ready": False,
        "status": "HOLD",
        "code": "PRODUCTION_RETRIEVAL_UNAVAILABLE",
        "evidenceState": "UNAVAILABLE",
        "service": "lyte-metrics-store",
        "message": (
            "Production retrieval is disabled until a qualified tenant-scoped "
            "metrics backend and verified source receipt are wired. The bundled "
            "corpus is a deterministic synthetic fixture only."
        ),
        "capability": {
            "backendId": RETRIEVAL_CAPABILITY.backend_id,
            "backendKind": RETRIEVAL_CAPABILITY.backend_kind,
            "fixture": RETRIEVAL_CAPABILITY.fixture,
            "tenantScoped": RETRIEVAL_CAPABILITY.tenant_scoped,
            "backendQualified": RETRIEVAL_CAPABILITY.backend_qualified,
            "sourceReceiptId": RETRIEVAL_CAPABILITY.source_receipt_id,
            "sourceReceiptVerified": RETRIEVAL_CAPABILITY.source_receipt_verified,
        },
    }


def _production_retrieval_held(config: SecurityConfig) -> bool:
    return config.environment == "production" and not RETRIEVAL_CAPABILITY.production_ready


def _declared_environments(environ: Mapping[str, str]) -> tuple[str, ...]:
    return tuple(
        value
        for name in ("RUNTIME_MODE", SERVICE_ENV, "APP_ENV", "NODE_ENV", "SZL_ENV")
        if (value := environ.get(name, "").strip().lower())
    )


def load_security_config(
    environ: Mapping[str, str] | None = None,
) -> SecurityConfig:
    source = os.environ if environ is None else environ
    runtime_mode = source.get("RUNTIME_MODE", "").strip().lower()
    if runtime_mode and runtime_mode not in _VALID_RUNTIME_MODES:
        raise SecurityConfigurationError(
            "RUNTIME_MODE must be one of local-dev, internal-preview, demo, production"
        )
    declared_environments = _declared_environments(source)
    production = any(
        value in _PRODUCTION_ENVIRONMENTS for value in declared_environments
    )
    environment = (
        "production"
        if production
        else declared_environments[0]
        if declared_environments
        else "development"
    )
    raw_bypass = source.get(AUTH_BYPASS_ENV, "").strip().lower()
    if raw_bypass and raw_bypass not in _TRUE_VALUES | _FALSE_VALUES:
        raise SecurityConfigurationError(
            f"{AUTH_BYPASS_ENV} must be an explicit boolean value"
        )
    bypass_enabled = raw_bypass in _TRUE_VALUES
    api_key = source.get(API_KEY_ENV)
    if api_key is not None and not api_key.strip():
        api_key = None
    if api_key is not None and api_key != api_key.strip():
        raise SecurityConfigurationError(
            f"{API_KEY_ENV} must not contain surrounding whitespace"
        )

    bound_tenant_id = source.get(TENANT_ID_ENV)
    if bound_tenant_id is not None and not bound_tenant_id.strip():
        bound_tenant_id = None
    if bound_tenant_id is not None:
        bound_tenant_id = bound_tenant_id.strip()
        if not _TENANT_ID_PATTERN.fullmatch(bound_tenant_id):
            raise SecurityConfigurationError(
                f"{TENANT_ID_ENV} must contain a valid tenant identity"
            )

    if bypass_enabled and (
        not declared_environments
        or any(
            value not in _DEVELOPMENT_ENVIRONMENTS
            for value in declared_environments
        )
    ):
        raise SecurityConfigurationError(
            f"{AUTH_BYPASS_ENV} is permitted only in development or test environments"
        )
    if api_key is None and not bypass_enabled:
        raise SecurityConfigurationError(
            f"{API_KEY_ENV} must be injected, or {AUTH_BYPASS_ENV}=1 must be "
            "set explicitly in development/test"
        )
    if production and bound_tenant_id is None:
        raise SecurityConfigurationError(
            f"{TENANT_ID_ENV} must bind the service credential to one tenant in production"
        )

    return SecurityConfig(
        environment=environment,
        api_key=api_key,
        bound_tenant_id=bound_tenant_id,
        bypass_enabled=bypass_enabled,
    )


# ─── Schemas ──────────────────────────────────────────────────────────────────


class RetrieveRequest(BaseModel):
    query: str = Field(min_length=1)
    topK: int = Field(default=20, ge=1, le=200)
    minRelevanceScore: float = Field(default=0.0, ge=0.0, le=1.0)
    filters: dict[str, Any] | None = None


class RetrievedDocument(BaseModel):
    id: str
    content: str
    relevanceScore: float
    source: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class RetrieveResponse(BaseModel):
    documents: list[RetrievedDocument]
    corpusSize: int
    matched: int


# ─── Auth ─────────────────────────────────────────────────────────────────────


def _request_tenant_id(request: Request) -> str | None:
    raw_tenant_id = request.headers.get("x-tenant-id")
    if raw_tenant_id is None:
        return None
    tenant_id = raw_tenant_id.strip()
    if raw_tenant_id != tenant_id or not _TENANT_ID_PATTERN.fullmatch(tenant_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="a valid X-Tenant-ID header is required",
        )
    return tenant_id


async def require_bearer(request: Request) -> str | None:
    """Validate Bearer auth without trusting proxy-reported client addresses."""
    try:
        config = load_security_config()
    except SecurityConfigurationError:
        log.error("lyte_metrics_store_security_configuration_unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="service security configuration is unavailable",
        ) from None

    if config.bypass_enabled:
        return _request_tenant_id(request)

    auth = request.headers.get("authorization") or ""
    scheme, separator, presented = auth.partition(" ")
    valid = (
        separator == " "
        and scheme.lower() == "bearer"
        and bool(presented)
        and config.api_key is not None
        and secrets.compare_digest(
            presented.encode("utf-8"), config.api_key.encode("utf-8")
        )
    )
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    request_tenant_id = _request_tenant_id(request)
    if config.bound_tenant_id is not None:
        if request_tenant_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="a valid X-Tenant-ID header is required",
            )
        if not secrets.compare_digest(
            request_tenant_id.encode("utf-8"),
            config.bound_tenant_id.encode("utf-8"),
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="authenticated metrics credential is not authorized for this tenant",
            )
    return request_tenant_id


# ─── App ──────────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(_app: FastAPI):
    config = load_security_config()
    log.info(
        "lyte_metrics_store_security_ready",
        environment=config.environment,
        authentication_mode=(
            "development-bypass" if config.bypass_enabled else "bearer"
        ),
        retrieval_backend=RETRIEVAL_CAPABILITY.backend_id,
        production_retrieval_ready=RETRIEVAL_CAPABILITY.production_ready,
    )
    yield


app = FastAPI(
    title="Lyte Metrics Store",
    version="1.0.0",
    description=(
        "Retrieval backend for the SZL Holdings Substrate Opportunity Audit "
        "and Operational Drift workflows. This release scores a labelled "
        "deterministic synthetic fixture in development and test; production "
        "retrieval remains on HOLD pending a qualified tenant backend and "
        "verified source receipt."
    ),
    lifespan=lifespan,
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Minimal public liveness with no corpus or query state."""

    return {"status": "ok"}


@app.get("/ready")
async def ready(response: Response) -> dict[str, Any]:
    try:
        config = load_security_config()
    except SecurityConfigurationError:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not-ready",
            "reason": "service security configuration is unavailable",
        }
    if _production_retrieval_held(config):
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        response.headers["X-Evidence-State"] = "UNAVAILABLE"
        response.headers["Retry-After"] = "60"
        return build_production_retrieval_hold()
    return {
        "status": "ready",
        "backendId": RETRIEVAL_CAPABILITY.backend_id,
        "backendKind": RETRIEVAL_CAPABILITY.backend_kind,
        "fixture": RETRIEVAL_CAPABILITY.fixture,
        "productionQualified": RETRIEVAL_CAPABILITY.production_ready,
    }


@app.post("/v1/retrieve", response_model=RetrieveResponse)
async def retrieve(
    body: RetrieveRequest,
    authenticated_tenant_id: str | None = Depends(require_bearer),
) -> RetrieveResponse | Response:
    # Authentication and production tenant binding run first. A valid
    # credential is necessary but does not qualify the synthetic fixture as a
    # production retrieval backend.
    try:
        config = load_security_config()
    except SecurityConfigurationError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "HOLD",
                "code": "SECURITY_CONFIGURATION_UNAVAILABLE",
                "evidenceState": "UNAVAILABLE",
                "message": "Service security configuration is unavailable.",
            },
            headers={"X-Evidence-State": "UNAVAILABLE", "Retry-After": "60"},
        )
    if _production_retrieval_held(config):
        log.warning(
            "lyte_metrics_production_retrieval_held",
            tenant_id=authenticated_tenant_id,
            backend_id=RETRIEVAL_CAPABILITY.backend_id,
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=build_production_retrieval_hold(),
            headers={"X-Evidence-State": "UNAVAILABLE", "Retry-After": "60"},
        )

    docs = top_k_documents(
        body.query,
        top_k=body.topK,
        min_relevance_score=body.minRelevanceScore,
        filters=body.filters,
        corpus=LYTE_CORPUS,
    )
    log.info(
        "lyte_metrics_retrieve",
        query=body.query[:120],
        topK=body.topK,
        minRelevanceScore=body.minRelevanceScore,
        matched=len(docs),
        tenant_id=authenticated_tenant_id,
    )
    return RetrieveResponse(
        documents=[RetrievedDocument(**d) for d in docs],
        corpusSize=len(LYTE_CORPUS),
        matched=len(docs),
    )


def main() -> None:
    port = int(os.environ.get("PORT", "8081"))
    uvicorn.run(
        "lyte_metrics_store.main:app",
        host="0.0.0.0",
        port=port,
        log_level=os.environ.get("LOG_LEVEL", "info"),
    )


if __name__ == "__main__":
    main()
