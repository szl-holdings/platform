import io, json
from szl_logging import SZLLogger, REQUIRED_KEYS

def test_required_keys_present():
    buf = io.StringIO()
    log = SZLLogger("a11oy", stream=buf)
    rec = log.info("/khipu/sign", trace_id="t1", span_id="s1",
                   caller_id="c1", khipu_seq=42)
    for k in REQUIRED_KEYS:
        assert k in rec, f"missing {k}"
    line = json.loads(buf.getvalue().strip())
    assert line["organ"] == "a11oy"
    assert line["endpoint"] == "/khipu/sign"
    assert line["level"] == "INFO"
    assert line["khipu_seq"] == 42

def test_extra_cannot_override_required():
    buf = io.StringIO()
    log = SZLLogger("rosie", stream=buf)
    rec = log.error("/healthz", organ="HACK", note="boom")
    assert rec["organ"] == "rosie"   # not overridden
    assert rec["note"] == "boom"
