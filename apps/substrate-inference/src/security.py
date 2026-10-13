"""Authentication policy for the Substrate inference HTTP service."""

from __future__ import annotations

import hmac
import os
from dataclasses import dataclass
from typing import Mapping

from fastapi import Header, HTTPException, Request, status

API_KEY_ENV = "SUBSTRATE_API_KEY"
API_TENANT_ENV = "SUBSTRATE_API_TENANT_ID"
MODEL_ADMIN_API_KEY_ENV = "SUBSTRATE_MODEL_ADMIN_API_KEY"
AUTH_BYPASS_ENV = "SUBSTRATE_INFERENCE_AUTH_BYPASS"
SERVICE_ENV = "SUBSTRATE_INFERENCE_ENV"

_ENVIRONMENT_MARKERS = (
    "RUNTIME_MODE",
    SERVICE_ENV,
    "APP_ENV",
    "NODE_ENV",
    "SZL_ENV",
)
_VALID_RUNTIME_MODES = {"local-dev", "internal-preview", "demo", "production"}
_DEVELOPMENT_ENVIRONMENTS = {
    "dev",
    "development",
    "local",
    "local-dev",
    "test",
    "testing",
    "ci",
}
_PRODUCTION_ENVIRONMENTS = {"prod", "production"}
_TRUE_VALUES = {"1", "true", "yes", "on"}
_FALSE_VALUES = {"0", "false", "no", "off"}


@dataclass(frozen=True)
class InferenceSecurityConfig:
    """Validated authentication settings captured once during startup."""

    api_key: str | None
    api_tenant_id: str | None
    model_admin_api_key: str | None
    bypass_enabled: bool
    environment: str


@dataclass(frozen=True)
class AuthenticatedPrincipal:
    """Server-derived identity and scopes for one authenticated request."""

    tenant_id: str | None
    scopes: frozenset[str]
    environment: str


def _configured_environments(environ: Mapping[str, str]) -> list[str]:
    return [
        value.strip().lower()
        for name in _ENVIRONMENT_MARKERS
        if (value := environ.get(name, "")).strip()
    ]


def _parse_bypass(environ: Mapping[str, str]) -> bool:
    raw_value = environ.get(AUTH_BYPASS_ENV, "").strip().lower()
    if not raw_value:
        return False
    if raw_value in _TRUE_VALUES:
        return True
    if raw_value in _FALSE_VALUES:
        return False
    raise RuntimeError(f"{AUTH_BYPASS_ENV} must be an explicit boolean value")


def load_security_config(
    environ: Mapping[str, str] | None = None,
) -> InferenceSecurityConfig:
    """Load a fail-closed auth configuration.

    A credential is mandatory unless the bypass flag is explicitly enabled and
    every declared environment marker is a development or test environment.
    Production always wins when environment markers conflict.
    """

    source = os.environ if environ is None else environ
    runtime_mode = source.get("RUNTIME_MODE", "").strip().lower()
    if runtime_mode and runtime_mode not in _VALID_RUNTIME_MODES:
        raise RuntimeError(
            "RUNTIME_MODE must be one of local-dev, internal-preview, demo, production"
        )
    environments = _configured_environments(source)
    is_production = any(value in _PRODUCTION_ENVIRONMENTS for value in environments)
    bypass_requested = _parse_bypass(source)

    if bypass_requested:
        if not environments:
            raise RuntimeError(
                f"{AUTH_BYPASS_ENV} requires {SERVICE_ENV}=development or test"
            )
        if is_production or any(
            value not in _DEVELOPMENT_ENVIRONMENTS for value in environments
        ):
            raise RuntimeError(
                f"{AUTH_BYPASS_ENV} is permitted only in development and test environments"
            )

    def exact_optional(name: str) -> str | None:
        raw_value = source.get(name, "")
        if raw_value and raw_value != raw_value.strip():
            raise RuntimeError(f"{name} must not contain surrounding whitespace")
        return raw_value or None

    api_key = exact_optional(API_KEY_ENV)
    api_tenant_id = exact_optional(API_TENANT_ENV)
    model_admin_api_key = exact_optional(MODEL_ADMIN_API_KEY_ENV)
    if not api_key and not bypass_requested:
        raise RuntimeError(
            f"{API_KEY_ENV} is required; development/test bypass must be explicitly configured"
        )
    if is_production and not api_tenant_id:
        raise RuntimeError(
            f"{API_TENANT_ENV} is required in production to bind inference credentials"
        )
    if is_production and not model_admin_api_key:
        raise RuntimeError(
            f"{MODEL_ADMIN_API_KEY_ENV} is required in production for model administration"
        )
    if (
        api_key is not None
        and model_admin_api_key is not None
        and hmac.compare_digest(api_key, model_admin_api_key)
    ):
        raise RuntimeError(
            f"{MODEL_ADMIN_API_KEY_ENV} must be distinct from {API_KEY_ENV}"
        )

    if is_production:
        environment = "production"
    elif environments:
        environment = environments[0]
    else:
        environment = "unspecified"

    return InferenceSecurityConfig(
        api_key=api_key,
        api_tenant_id=api_tenant_id,
        model_admin_api_key=model_admin_api_key,
        bypass_enabled=bypass_requested,
        environment=environment,
    )


def _security_config(request: Request) -> InferenceSecurityConfig:
    config: InferenceSecurityConfig | None = getattr(
        request.app.state, "security_config", None
    )
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service authentication is not initialized",
        )
    return config


def _bearer_matches(authorization: str | None, expected: str | None) -> bool:
    if not authorization or expected is None:
        return False
    scheme, separator, credential = authorization.partition(" ")
    return (
        separator == " "
        and scheme.lower() == "bearer"
        and bool(credential)
        and hmac.compare_digest(credential.encode("utf-8"), expected.encode("utf-8"))
    )


def _reject_invalid_bearer(detail: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def require_inference_access(
    request: Request,
    authorization: str | None = Header(default=None),
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-ID"),
) -> AuthenticatedPrincipal:
    """Authenticate the inference credential and bind it to one tenant."""

    config = _security_config(request)
    if config.bypass_enabled:
        tenant_id = x_tenant_id.strip() if x_tenant_id else None
        return AuthenticatedPrincipal(
            tenant_id=tenant_id,
            scopes=frozenset({"inference:read", "inference:execute"}),
            environment=config.environment,
        )

    if not authorization:
        _reject_invalid_bearer("Bearer authentication required")
    if not _bearer_matches(authorization, config.api_key):
        _reject_invalid_bearer("Invalid inference bearer credential")

    if x_tenant_id is not None and x_tenant_id != x_tenant_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Tenant-ID must not contain surrounding whitespace",
        )
    requested_tenant = x_tenant_id or None
    if config.api_tenant_id is not None:
        if requested_tenant is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="X-Tenant-ID is required for the inference credential",
            )
        if not hmac.compare_digest(requested_tenant, config.api_tenant_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inference credential is not authorized for this tenant",
            )

    return AuthenticatedPrincipal(
        tenant_id=config.api_tenant_id or requested_tenant,
        scopes=frozenset({"inference:read", "inference:execute"}),
        environment=config.environment,
    )


async def require_model_admin(
    request: Request,
    authorization: str | None = Header(default=None),
) -> AuthenticatedPrincipal:
    """Require the separate process-wide model-administration credential."""

    config = _security_config(request)
    if config.bypass_enabled:
        return AuthenticatedPrincipal(
            tenant_id=None,
            scopes=frozenset({"model:admin"}),
            environment=config.environment,
        )
    if config.model_admin_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model administration credential is not configured",
        )
    if not authorization:
        _reject_invalid_bearer("Model administration bearer credential required")
    if not _bearer_matches(authorization, config.model_admin_api_key):
        _reject_invalid_bearer("Invalid model administration bearer credential")
    return AuthenticatedPrincipal(
        tenant_id=None,
        scopes=frozenset({"model:admin"}),
        environment=config.environment,
    )
