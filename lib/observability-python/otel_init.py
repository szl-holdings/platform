"""
SZL Holdings — Python OpenTelemetry SDK bootstrap

Usage: call `init_telemetry()` as the first statement in your service entrypoint,
before any other service initialization.

Example:
    from otel_init import init_telemetry
    init_telemetry()
    # ... rest of service startup

Environment variables expected (see .env.example):
  OTEL_SERVICE_NAME              — required; matches service name
  OTEL_SERVICE_VERSION           — required; matches service version
  OTEL_EXPORTER_OTLP_ENDPOINT   — defaults to http://localhost:4317 in dev
  DEPLOYMENT_ENV                 — development | staging | production
  OTEL_TRACES_SAMPLER_ARG       — sampling ratio 0.0–1.0 (default: 1.0 dev, 0.1 prod)
"""

import os
import atexit
import logging
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import (
    ParentBasedTraceIdRatio,
    DEFAULT_ON,
)
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.composite import CompositePropagator
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.baggage.propagation import W3CBaggagePropagator
import structlog


def init_telemetry() -> None:
    service_name = os.getenv("OTEL_SERVICE_NAME", "szl-unknown-python-service")
    service_version = os.getenv("OTEL_SERVICE_VERSION", "0.0.0")
    deployment_env = os.getenv("DEPLOYMENT_ENV", "development")
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")

    sampler_arg = float(os.getenv("OTEL_TRACES_SAMPLER_ARG",
                                   "0.1" if deployment_env == "production" else "1.0"))

    resource = Resource.create({
        SERVICE_NAME: service_name,
        SERVICE_VERSION: service_version,
        "deployment.environment": deployment_env,
        "szl.platform": "szl-holdings",
    })

    sampler = ParentBasedTraceIdRatio(sampler_arg) if sampler_arg < 1.0 else DEFAULT_ON
    provider = TracerProvider(resource=resource, sampler=sampler)

    otlp_exporter = OTLPSpanExporter(endpoint=f"{otlp_endpoint}/v1/traces")
    provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(provider)

    set_global_textmap(CompositePropagator([
        TraceContextTextMapPropagator(),
        W3CBaggagePropagator(),
    ]))

    atexit.register(lambda: provider.shutdown())

    # Configure structlog for JSON output meeting the SZL log schema
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.WriteLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    log = structlog.get_logger()
    log.info(
        "otel_init",
        service=service_name,
        version=service_version,
        env=deployment_env,
        sampler_ratio=sampler_arg,
    )
