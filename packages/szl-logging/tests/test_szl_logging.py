# SPDX-License-Identifier: Apache-2.0
"""Tests for szl_logging — schema validation, OTel injection, drop-in API."""
from __future__ import annotations

import io
import json
import logging

import pytest

import szl_logging
from szl_logging import LogRecordModel, ORGANS, get_logger, set_caller_id


def _emit(organ="rosie", **kw):
    buf = io.StringIO()
    log = get_logger(f"t.{organ}.{id(buf)}", organ=organ, stream=buf, level=logging.DEBUG)
    log.info(kw.pop("msg", "hello"), **kw)
    line = buf.getvalue().strip()
    return json.loads(line)


def test_required_keys_present():
    rec = _emit(endpoint="/recall")
    for k in ("ts", "level", "organ", "endpoint", "trace_id", "span_id", "msg"):
        assert k in rec, k
    assert rec["level"] == "INFO"
    assert rec["organ"] == "rosie"
    assert rec["endpoint"] == "/recall"


def test_ts_is_iso_utc():
    rec = _emit(endpoint="/x")
    assert rec["ts"].endswith("Z")
    # millisecond precision ISO 8601
    assert "T" in rec["ts"]


def test_trace_span_ids_are_hex_when_no_otel():
    rec = _emit(endpoint="/x")
    assert len(rec["trace_id"]) == 32
    assert len(rec["span_id"]) == 16
    int(rec["trace_id"], 16)
    int(rec["span_id"], 16)


def test_warn_level_normalised():
    buf = io.StringIO()
    log = get_logger("t.warn", organ="sentra", stream=buf)
    log.warning("careful", endpoint="/gate")
    rec = json.loads(buf.getvalue().strip())
    assert rec["level"] == "WARN"


def test_attrs_and_caller_and_khipu():
    rec = _emit(endpoint="/sign", attrs={"score": 0.9}, caller_id="user-7", khipu_seq=42)
    assert rec["attrs"] == {"score": 0.9}
    assert rec["caller_id"] == "user-7"
    assert rec["khipu_seq"] == 42


def test_caller_id_from_contextvar():
    set_caller_id("ctx-caller")
    try:
        rec = _emit(endpoint="/x")
        assert rec["caller_id"] == "ctx-caller"
    finally:
        set_caller_id(None)


def test_unknown_organ_rejected():
    with pytest.raises(ValueError):
        get_logger("t.bad", organ="not-an-organ")


def test_schema_validates_organ():
    with pytest.raises(Exception):
        LogRecordModel(
            ts="2026-06-01T00:00:00Z", level="INFO", organ="bogus",
            endpoint="/x", trace_id="a" * 32, span_id="b" * 16, msg="m",
        )


def test_schema_rejects_bad_hex():
    with pytest.raises(Exception):
        LogRecordModel(
            ts="2026-06-01T00:00:00Z", level="INFO", organ="rosie",
            endpoint="/x", trace_id="zz", span_id="b" * 16, msg="m",
        )


def test_all_organs_loggable():
    for organ in ORGANS:
        rec = _emit(organ=organ, endpoint="/x")
        assert rec["organ"] == organ


def test_otel_injection_when_active():
    pytest.importorskip("opentelemetry.sdk")
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider

    trace.set_tracer_provider(TracerProvider())
    tracer = trace.get_tracer("test")
    with tracer.start_as_current_span("span"):
        rec = _emit(endpoint="/traced")
    assert rec["trace_id"] != "0" * 32
    assert rec["span_id"] != "0" * 16


def test_single_json_line():
    buf = io.StringIO()
    log = get_logger("t.line", organ="amaru", stream=buf)
    log.error("boom", endpoint="/e")
    out = buf.getvalue().strip()
    assert out.count("\n") == 0
    json.loads(out)  # parseable
