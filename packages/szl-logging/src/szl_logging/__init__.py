# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 SZL Holdings. Licensed under the Apache License, Version 2.0.
"""szl-logging — Pydantic-validated structured JSON logging for the SZL mesh.

Drop-in replacement for stdlib ``logging``. Every record is validated against the
canonical SZL log schema and emitted as a single JSON line. Trace and span ids
are auto-injected from the active OpenTelemetry context (or contextvars) when
available, so logs correlate with traces in the OTel collector with zero extra
wiring.

Usage::

    import szl_logging
    logger = szl_logging.get_logger(__name__, organ="rosie")
    logger.info("recall complete", endpoint="/recall", attrs={"score": 0.92})

Doctrine v11 — LOCKED, verbatim: 749 declarations / 14 unique axioms / 163 sorries.
locked_at: c7c0ba17

Signed: Yachay <yachay@szlholdings.dev>
Co-Authored-By: Perplexity Computer Agent
"""
from __future__ import annotations

import contextvars
import datetime as _dt
import json
import logging
import re
import sys
from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, Field, field_validator

__all__ = ["LogRecordModel", "SZLJsonFormatter", "get_logger", "ORGANS", "set_caller_id"]
__version__ = "1.0.0"

# Canonical organ set for the SZL flagship mesh + observability services.
ORGANS = frozenset(
    {
        "a11oy",
        "amaru",
        "sentra",
        "rosie",
        "killinchu",
        "otel-collector",
        "mesh-cathedral",
    }
)

LogLevel = Literal["DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"]

_HEX32 = re.compile(r"^[0-9a-f]{32}$")
_HEX16 = re.compile(r"^[0-9a-f]{16}$")

# contextvar fallback when OpenTelemetry is not installed/active.
_caller_id_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "szl_caller_id", default=None
)


def set_caller_id(caller_id: Optional[str]) -> None:
    """Set the caller id for the current context (propagates into log records)."""
    _caller_id_var.set(caller_id)


# --------------------------------------------------------------------------- #
# Schema
# --------------------------------------------------------------------------- #
class LogRecordModel(BaseModel):
    """Canonical SZL structured log record.

    Required keys: ``ts``, ``level``, ``organ``, ``endpoint``, ``trace_id``,
    ``span_id``, ``msg``. Optional: ``caller_id``, ``khipu_seq``, ``attrs``.
    """

    ts: str = Field(..., description="ISO 8601 UTC timestamp")
    level: LogLevel
    organ: str
    endpoint: str
    trace_id: str = Field(..., description="32-hex OTel trace id")
    span_id: str = Field(..., description="16-hex OTel span id")
    msg: str
    caller_id: Optional[str] = None
    khipu_seq: Optional[int] = None
    attrs: Optional[Dict[str, Any]] = None

    @field_validator("organ")
    @classmethod
    def _organ_known(cls, v: str) -> str:
        if v not in ORGANS:
            raise ValueError(
                f"organ {v!r} not in canonical set {sorted(ORGANS)}"
            )
        return v

    @field_validator("trace_id")
    @classmethod
    def _trace_hex(cls, v: str) -> str:
        if not _HEX32.match(v):
            raise ValueError("trace_id must be 32 lowercase hex chars")
        return v

    @field_validator("span_id")
    @classmethod
    def _span_hex(cls, v: str) -> str:
        if not _HEX16.match(v):
            raise ValueError("span_id must be 16 lowercase hex chars")
        return v


# --------------------------------------------------------------------------- #
# OTel context extraction
# --------------------------------------------------------------------------- #
_ZERO_TRACE = "0" * 32
_ZERO_SPAN = "0" * 16


def _otel_ids() -> tuple[str, str]:
    """Return (trace_id, span_id) from the active OTel span, or zero ids."""
    try:  # OpenTelemetry is an optional dependency.
        from opentelemetry import trace as _otel_trace

        span = _otel_trace.get_current_span()
        ctx = span.get_span_context()
        if ctx and ctx.is_valid:
            return (format(ctx.trace_id, "032x"), format(ctx.span_id, "016x"))
    except Exception:
        pass
    return (_ZERO_TRACE, _ZERO_SPAN)


# --------------------------------------------------------------------------- #
# Formatter
# --------------------------------------------------------------------------- #
_LEVEL_MAP = {
    "DEBUG": "DEBUG",
    "INFO": "INFO",
    "WARNING": "WARN",  # stdlib uses WARNING; SZL schema uses WARN
    "WARN": "WARN",
    "ERROR": "ERROR",
    "CRITICAL": "CRITICAL",
}


class SZLJsonFormatter(logging.Formatter):
    """Formats a stdlib LogRecord as a validated single-line SZL JSON record."""

    def __init__(self, organ: str) -> None:
        super().__init__()
        self.organ = organ

    def format(self, record: logging.LogRecord) -> str:  # noqa: A003
        trace_id, span_id = _otel_ids()
        # allow per-call override via logger.info(..., extra={...})
        endpoint = getattr(record, "endpoint", "") or ""
        attrs = getattr(record, "attrs", None)
        caller_id = getattr(record, "caller_id", None) or _caller_id_var.get()
        khipu_seq = getattr(record, "khipu_seq", None)
        organ = getattr(record, "organ", None) or self.organ
        level = _LEVEL_MAP.get(record.levelname, record.levelname)

        model = LogRecordModel(
            ts=_dt.datetime.now(_dt.timezone.utc)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z"),
            level=level,  # type: ignore[arg-type]
            organ=organ,
            endpoint=endpoint,
            trace_id=getattr(record, "trace_id", None) or trace_id,
            span_id=getattr(record, "span_id", None) or span_id,
            msg=record.getMessage(),
            caller_id=caller_id,
            khipu_seq=khipu_seq,
            attrs=attrs,
        )
        return model.model_dump_json(exclude_none=True)


# --------------------------------------------------------------------------- #
# Adapter — keyword-friendly drop-in
# --------------------------------------------------------------------------- #
class _SZLAdapter(logging.LoggerAdapter):
    """Lets callers pass endpoint/attrs/caller_id/khipu_seq as kwargs."""

    _EXTRA_KEYS = ("endpoint", "attrs", "caller_id", "khipu_seq", "organ",
                   "trace_id", "span_id")

    def process(self, msg, kwargs):
        extra = dict(kwargs.pop("extra", {}) or {})
        for k in list(kwargs.keys()):
            if k in self._EXTRA_KEYS:
                extra[k] = kwargs.pop(k)
        kwargs["extra"] = extra
        return msg, kwargs


def get_logger(name: str, organ: str, *, level: int = logging.INFO,
               stream=None) -> _SZLAdapter:
    """Return a structured JSON logger bound to ``organ``.

    Drop-in for ``logging.getLogger`` — accepts the same name, plus ``organ``.
    """
    if organ not in ORGANS:
        raise ValueError(f"organ {organ!r} not in {sorted(ORGANS)}")
    base = logging.getLogger(name)
    base.setLevel(level)
    # Avoid duplicate handlers on repeated get_logger calls.
    tag = f"_szl_json_{organ}"
    if not any(getattr(h, "_szl_tag", None) == tag for h in base.handlers):
        handler = logging.StreamHandler(stream or sys.stdout)
        handler.setFormatter(SZLJsonFormatter(organ))
        handler._szl_tag = tag  # type: ignore[attr-defined]
        base.addHandler(handler)
        base.propagate = False
    return _SZLAdapter(base, {"organ": organ})
