# SPDX-License-Identifier: Apache-2.0
"""Smoke tests for szl_throttle — rate limit, CORS audit, Khipu chain integrity."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from szl_throttle import setup, KhipuAuditLedger


def _app(rate=3):
    app = FastAPI()

    @app.get("/ping")
    def ping():
        return {"ok": True}

    ledger = setup(app, rate_per_min=rate, burst=rate)
    return app, ledger


def test_rate_limit_429_and_receipt():
    app, ledger = _app(rate=3)
    c = TestClient(app)
    codes = [c.get("/ping").status_code for _ in range(6)]
    assert codes.count(200) == 3, codes
    assert codes.count(429) == 3, codes
    # every 429 emitted a Khipu receipt
    recs = [r for r in ledger.tail(50) if r["kind"] == "rate_limit_429"]
    assert len(recs) == 3
    assert ledger.verify() is True


def test_healthz_exempt():
    app = FastAPI()

    @app.get("/healthz")
    def hz():
        return {"status": "ok"}

    setup(app, rate_per_min=1, burst=1)
    c = TestClient(app)
    # exempt path never 429s
    assert all(c.get("/healthz").status_code == 200 for _ in range(5))


def test_cors_reject_audited():
    app, ledger = _app(rate=100)
    c = TestClient(app)
    c.get("/ping", headers={"origin": "https://evil.example.com"})
    rejects = [r for r in ledger.tail(50) if r["kind"] == "cors_reject"]
    assert len(rejects) >= 1
    assert rejects[0]["detail"]["origin"] == "https://evil.example.com"


def test_chain_tamper_detected():
    led = KhipuAuditLedger()
    led.emit("rate_limit_429", {"ip": "1.2.3.4"})
    led.emit("cors_reject", {"origin": "x"})
    assert led.verify() is True
    led._receipts[0]["detail"]["ip"] = "9.9.9.9"  # tamper
    assert led.verify() is False
