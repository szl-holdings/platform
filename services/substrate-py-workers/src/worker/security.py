"""Authentication and tenant-binding controls for the worker HTTP boundary."""

from __future__ import annotations

import os
import re
import secrets
import stat
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path


API_KEY_ENV = "SUBSTRATE_PYTHON_WORKER_API_KEY"
API_KEY_FILE_ENV = "SUBSTRATE_PYTHON_WORKER_API_KEY_FILE"
AUTH_BYPASS_ENV = "SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS"
WORKER_ENV_ENV = "SUBSTRATE_PYTHON_WORKER_ENV"
TENANT_ID_ENV = "SUBSTRATE_PYTHON_WORKER_TENANT_ID"
RUNTIME_MODE_ENV = "RUNTIME_MODE"

_TRUE_VALUES = frozenset({"1", "true", "yes"})
_FALSE_VALUES = frozenset({"0", "false", "no", "off"})
_BYPASS_ENVIRONMENTS = frozenset(
    {"dev", "development", "local", "local-dev", "test", "testing"}
)
_TENANT_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,127}$")
_PRODUCTION_ENVIRONMENTS = frozenset({"prod", "production"})
_ALLOWED_RUNTIME_MODES = frozenset(
    {"local-dev", "internal-preview", "demo", "production"}
)
_MAX_API_KEY_BYTES = 16 * 1024


class WorkerSecurityConfigurationError(RuntimeError):
    """The process cannot safely accept protected worker traffic."""


class ClaimAuthenticationError(RuntimeError):
    """A claim failed authentication or tenant binding."""

    def __init__(
        self,
        status_code: int,
        public_message: str,
        *,
        authenticate_header: bool = False,
    ) -> None:
        super().__init__(public_message)
        self.status_code = status_code
        self.public_message = public_message
        self.authenticate_header = authenticate_header


@dataclass(frozen=True)
class WorkerSecurityConfig:
    environment: str
    api_key: str | None
    bound_tenant_id: str | None
    bypass_enabled: bool


@dataclass(frozen=True)
class AuthenticatedClaim:
    tenant_id: str
    authentication_mode: str


def _declared_environments(environ: Mapping[str, str]) -> tuple[str, ...]:
    _validate_runtime_mode(environ)
    return tuple(
        value
        for name in (
            RUNTIME_MODE_ENV,
            WORKER_ENV_ENV,
            "APP_ENV",
            "NODE_ENV",
            "SZL_ENV",
        )
        if (value := environ.get(name, "").strip().lower())
    )


def _validate_runtime_mode(environ: Mapping[str, str]) -> None:
    runtime_mode = environ.get(RUNTIME_MODE_ENV, "").strip().lower()
    if runtime_mode and runtime_mode not in _ALLOWED_RUNTIME_MODES:
        allowed = ", ".join(sorted(_ALLOWED_RUNTIME_MODES))
        raise WorkerSecurityConfigurationError(
            f"{RUNTIME_MODE_ENV} must be one of: {allowed}"
        )


def _parse_bypass(value: str | None) -> bool:
    normalized = (value or "").strip().lower()
    if not normalized:
        return False
    if normalized in _TRUE_VALUES:
        return True
    if normalized in _FALSE_VALUES:
        return False
    raise WorkerSecurityConfigurationError(
        f"{AUTH_BYPASS_ENV} must be an explicit boolean value"
    )


def is_production_environment(environ: Mapping[str, str] | None = None) -> bool:
    source = os.environ if environ is None else environ
    return any(
        value in _PRODUCTION_ENVIRONMENTS
        for value in _declared_environments(source)
    )


def _read_api_key_file(file_value: str) -> str:
    """Read one bounded regular-file credential without following symlinks."""

    secret_path = Path(file_value)
    flags = os.O_RDONLY
    flags |= getattr(os, "O_CLOEXEC", 0)
    flags |= getattr(os, "O_NONBLOCK", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    descriptor: int | None = None
    try:
        if secret_path.is_symlink():
            raise OSError("credential path is not a regular file")
        descriptor = os.open(secret_path, flags)
        file_stat = os.fstat(descriptor)
        if not stat.S_ISREG(file_stat.st_mode):
            raise OSError("credential path is not a regular file")
        if file_stat.st_size > _MAX_API_KEY_BYTES:
            raise OSError("credential file exceeds the admitted size")
        with os.fdopen(descriptor, "rb", closefd=False) as handle:
            payload = handle.read(_MAX_API_KEY_BYTES + 1)
        if len(payload) > _MAX_API_KEY_BYTES:
            raise OSError("credential file exceeds the admitted size")
        api_key = payload.decode("utf-8").rstrip("\r\n")
    except (OSError, UnicodeError, ValueError) as error:
        raise WorkerSecurityConfigurationError(
            f"{API_KEY_FILE_ENV} is unavailable or invalid"
        ) from error
    finally:
        if descriptor is not None:
            os.close(descriptor)

    if not api_key:
        raise WorkerSecurityConfigurationError(f"{API_KEY_FILE_ENV} must not be empty")
    if api_key != api_key.strip():
        raise WorkerSecurityConfigurationError(
            f"{API_KEY_FILE_ENV} must not contain surrounding whitespace"
        )
    return api_key


def load_worker_security_config(
    environ: Mapping[str, str] | None = None,
) -> WorkerSecurityConfig:
    """Load fail-closed worker security configuration.

    A credential has no default. The only credential-free mode is an explicit
    bypass in a development or test environment; setting that bypass in any
    other environment is itself a startup error.
    """

    source = os.environ if environ is None else environ
    declared_environments = _declared_environments(source)
    if any(value in _PRODUCTION_ENVIRONMENTS for value in declared_environments):
        environment = "production"
    elif declared_environments:
        environment = declared_environments[0]
    else:
        environment = "development"
    bypass_enabled = _parse_bypass(source.get(AUTH_BYPASS_ENV))
    api_key = source.get(API_KEY_ENV)
    api_key_file = source.get(API_KEY_FILE_ENV)
    configured_tenant_id = source.get(TENANT_ID_ENV)

    if bypass_enabled and (
        not declared_environments
        or any(value not in _BYPASS_ENVIRONMENTS for value in declared_environments)
    ):
        raise WorkerSecurityConfigurationError(
            f"{AUTH_BYPASS_ENV} is permitted only in development or test environments"
        )

    if api_key is not None and not api_key.strip():
        api_key = None
    if api_key_file is not None and not api_key_file.strip():
        api_key_file = None
    if api_key is not None and api_key_file is not None:
        raise WorkerSecurityConfigurationError(
            f"Configure only one of {API_KEY_ENV} and {API_KEY_FILE_ENV}"
        )
    if api_key is not None and api_key != api_key.strip():
        raise WorkerSecurityConfigurationError(
            f"{API_KEY_ENV} must not contain surrounding whitespace"
        )
    if api_key_file is not None:
        if api_key_file != api_key_file.strip():
            raise WorkerSecurityConfigurationError(
                f"{API_KEY_FILE_ENV} must not contain surrounding whitespace"
            )
        api_key = _read_api_key_file(api_key_file)

    if api_key is None and not bypass_enabled:
        raise WorkerSecurityConfigurationError(
            f"{API_KEY_ENV} or {API_KEY_FILE_ENV} must be injected, or "
            f"{AUTH_BYPASS_ENV}=1 must be set explicitly in development/test"
        )

    if configured_tenant_id is not None and not configured_tenant_id.strip():
        configured_tenant_id = None
    if configured_tenant_id is not None:
        configured_tenant_id = configured_tenant_id.strip()
        if not _TENANT_ID_PATTERN.fullmatch(configured_tenant_id):
            raise WorkerSecurityConfigurationError(
                f"{TENANT_ID_ENV} must contain a valid tenant identity"
            )
    if environment == "production" and configured_tenant_id is None:
        raise WorkerSecurityConfigurationError(
            f"{TENANT_ID_ENV} must bind the worker credential to one tenant in production"
        )

    return WorkerSecurityConfig(
        environment=environment,
        api_key=api_key,
        bound_tenant_id=configured_tenant_id,
        bypass_enabled=bypass_enabled,
    )


def validate_tenant_id(value: str | None) -> str:
    tenant_id = (value or "").strip()
    if value != tenant_id or not _TENANT_ID_PATTERN.fullmatch(tenant_id):
        raise ClaimAuthenticationError(400, "A valid X-Tenant-ID header is required")
    return tenant_id


def authenticate_claim(
    *,
    authorization: str | None,
    header_tenant_id: str | None,
    claim_tenant_id: str | None,
    environ: Mapping[str, str] | None = None,
) -> AuthenticatedClaim:
    """Authenticate a claim and bind its payload to the authenticated tenant."""

    config = load_worker_security_config(environ)
    if not config.bypass_enabled:
        scheme, separator, provided_key = (authorization or "").partition(" ")
        valid = (
            separator == " "
            and scheme.lower() == "bearer"
            and bool(provided_key)
            and config.api_key is not None
            and secrets.compare_digest(
                provided_key.encode("utf-8"), config.api_key.encode("utf-8")
            )
        )
        if not valid:
            raise ClaimAuthenticationError(
                401,
                "Invalid worker credentials",
                authenticate_header=True,
            )

    tenant_id = validate_tenant_id(header_tenant_id)

    if config.bound_tenant_id is not None and not secrets.compare_digest(
        tenant_id.encode("utf-8"), config.bound_tenant_id.encode("utf-8")
    ):
        raise ClaimAuthenticationError(
            403,
            "Authenticated worker credential is not authorized for this tenant",
        )

    if claim_tenant_id is not None:
        payload_tenant_id = validate_tenant_id(claim_tenant_id)
        if not secrets.compare_digest(
            tenant_id.encode("utf-8"), payload_tenant_id.encode("utf-8")
        ):
            raise ClaimAuthenticationError(
                403,
                "Claim tenant does not match the authenticated tenant",
            )

    return AuthenticatedClaim(
        tenant_id=tenant_id,
        authentication_mode="development-bypass" if config.bypass_enabled else "bearer",
    )
