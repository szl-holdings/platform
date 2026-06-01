"""
OpenTelemetry context propagation for Python stages.

Extracts the W3C traceparent header from the StageClaimMessage and creates
a child span so Python stage execution joins the same trace as the TypeScript
parent. All spans are exported to the configured OTEL_EXPORTER_OTLP_ENDPOINT.
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

from opentelemetry import trace
from opentelemetry.context import Context
from opentelemetry.propagate import extract
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.trace import NonRecordingSpan, SpanContext, TraceFlags

SERVICE_NAME = "substrate-py-workers"


def _build_provider() -> TracerProvider:
    resource = Resource.create({"service.name": SERVICE_NAME, "service.version": "1.0.0"})
    provider = TracerProvider(resource=resource)

    otlp_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    if otlp_endpoint:
        try:
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
            exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
            provider.add_span_processor(BatchSpanProcessor(exporter))
        except Exception:
            provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
    else:
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

    return provider


_provider = _build_provider()
trace.set_tracer_provider(_provider)
_tracer = trace.get_tracer(SERVICE_NAME, "1.0.0")


def extract_context_from_traceparent(traceparent: str | None) -> Context:
    """
    Parse a W3C traceparent header value and return an OTel Context
    so that child spans join the TypeScript parent trace.
    """
    if not traceparent:
        return Context()
    return extract({"traceparent": traceparent})


@contextmanager
def stage_span(
    stage_id: str,
    stage_type: str,
    run_id: str,
    workflow_id: str,
    traceparent: str | None,
    mode: str,
    extra_attributes: dict | None = None,
) -> Iterator[trace.Span]:
    """
    Context manager that starts a child span linked to the TypeScript parent trace.
    Yields the active span so callers can add events or attributes.
    """
    parent_ctx = extract_context_from_traceparent(traceparent)
    attributes: dict = {
        "substrate.stage_id": stage_id,
        "substrate.stage_type": stage_type,
        "substrate.run_id": run_id,
        "substrate.workflow_id": workflow_id,
        "substrate.runtime": "python",
        "substrate.mode": mode,
    }
    if extra_attributes:
        attributes.update(extra_attributes)

    with _tracer.start_as_current_span(
        f"substrate.stage.{stage_type.lower()}",
        context=parent_ctx,
        attributes=attributes,
        kind=trace.SpanKind.SERVER,
    ) as span:
        yield span


def get_current_span_id() -> str | None:
    """Return the hex span ID of the currently active span, or None."""
    span = trace.get_current_span()
    ctx = span.get_span_context()
    if ctx and ctx.span_id:
        return format(ctx.span_id, "016x")
    return None
