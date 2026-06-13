#!/usr/bin/env python3
"""node_thermal_agent.py — On-Node GPU Thermal Telemetry HTTP Agent (SZL Holdings)

WHAT THIS IS:
  A tiny standalone HTTP agent that exposes THIS node's real GPU telemetry
  (power draw, temperature, power limit) as a JSON endpoint so the home app
  box can READ the GPU metrics over Tailscale.  This is the GPU_THERMAL_URL
  piece that the harvest /metrics endpoint asks for — it closes the app↔GPU
  split described in the Crusoe-style architecture.

DOCTRINE (binding):
  - Honest "no GPU" response if nvidia-smi is absent — never fabricate metrics.
  - Bind to the tailnet interface only (BIND_ADDR env, default 0.0.0.0 — set
    to Tailscale IP in production, e.g. 100.x.x.x).  Never expose to the public
    internet without a firewall rule.
  - No key committed; BIND_ADDR and BIND_PORT are env-only.
  - Joules stay SAMPLE/ESTIMATE unless nvidia-smi actually responds (labeled).
  - Reactive/critical: this agent is always on — it never gates on energy posture.

ENDPOINTS:
  GET /gpu          → JSON: {measured, power_draw_w, temperature_c, power_limit_w,
                              joules_label, note, ts}
  GET /health       → JSON: {ok: true, ts}

USAGE:
  python3 node_thermal_agent.py          # starts HTTP server
  python3 node_thermal_agent.py --selftest  # runs self-test, exits

ENV:
  BIND_ADDR   bind address (default 0.0.0.0 — restrict to tailnet IP in prod)
  BIND_PORT   bind port (default 9101)

Self-test:
  python3 node_thermal_agent.py --selftest
  → asserts honest no-GPU response, prints {"ok": true, "checks": N}
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Optional

BIND_ADDR: str = os.environ.get("BIND_ADDR", "0.0.0.0")
BIND_PORT: int = int(os.environ.get("BIND_PORT", "9101"))
UA = "szl-onsite-thermal/1.0 (+https://a11oy.net)"


# ---------------------------------------------------------------------------
# GPU telemetry (mirrors node_agent.read_local_gpu but standalone)
# ---------------------------------------------------------------------------

def read_gpu_telemetry() -> dict:
    """Read on-node GPU via nvidia-smi.

    Returns a dict with:
      measured      bool  — True ONLY if nvidia-smi responded
      power_draw_w  float | null
      temperature_c float | null
      power_limit_w float | null
      joules_label  str   — "MEASURED (on-node nvidia-smi)" or "SAMPLE/ESTIMATE"
      note          str
      ts            str   — UTC ISO-8601

    HONEST: if nvidia-smi is absent or fails, returns measured=false with
    null metric values and joules_label="SAMPLE/ESTIMATE".  Never fabricates
    numbers.
    """
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    try:
        out = subprocess.check_output(
            [
                "nvidia-smi",
                "--query-gpu=power.draw,temperature.gpu,power.limit",
                "--format=csv,noheader,nounits",
            ],
            timeout=5,
            stderr=subprocess.DEVNULL,
        ).decode().strip()
        parts = [p.strip() for p in out.split(",")]
        if len(parts) < 3:
            return {
                "measured": False,
                "power_draw_w": None,
                "temperature_c": None,
                "power_limit_w": None,
                "joules_label": "SAMPLE/ESTIMATE",
                "note": "nvidia-smi returned unexpected format",
                "ts": ts,
            }
        return {
            "measured": True,
            "power_draw_w": float(parts[0]),
            "temperature_c": float(parts[1]),
            "power_limit_w": float(parts[2]),
            "joules_label": "MEASURED (on-node nvidia-smi)",
            "note": "live reading from on-node GPU",
            "ts": ts,
        }
    except FileNotFoundError:
        return {
            "measured": False,
            "power_draw_w": None,
            "temperature_c": None,
            "power_limit_w": None,
            "joules_label": "SAMPLE/ESTIMATE",
            "note": "nvidia-smi not found — no GPU on this node",
            "ts": ts,
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "measured": False,
            "power_draw_w": None,
            "temperature_c": None,
            "power_limit_w": None,
            "joules_label": "SAMPLE/ESTIMATE",
            "note": f"nvidia-smi error: {exc}",
            "ts": ts,
        }


# ---------------------------------------------------------------------------
# HTTP handler
# ---------------------------------------------------------------------------

class ThermalHandler(BaseHTTPRequestHandler):
    """Minimal HTTP handler for GPU thermal telemetry."""

    server_version = "szl-thermal/1.0"
    sys_version = ""  # suppress default Python version header

    def log_message(self, fmt: str, *args) -> None:  # noqa: ANN001
        # Quiet by default; uncomment for debug:
        # sys.stderr.write(f"[thermal] {self.address_string()} {fmt % args}\n")
        pass

    def _send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-SZL-Node", "onsite-thermal/1.0")
        # CORS: tailnet-only, but allow the app box to fetch cross-origin
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/gpu":
            data = read_gpu_telemetry()
            self._send_json(data)
        elif self.path == "/health":
            self._send_json({
                "ok": True,
                "service": "node-thermal-agent",
                "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            })
        else:
            self._send_json({"error": "not found", "path": self.path}, status=404)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()


# ---------------------------------------------------------------------------
# Server lifecycle
# ---------------------------------------------------------------------------

_server: Optional[HTTPServer] = None
_server_thread: Optional[threading.Thread] = None


def start_server(addr: str = BIND_ADDR, port: int = BIND_PORT) -> HTTPServer:
    """Start the thermal HTTP server in a background thread."""
    global _server, _server_thread
    srv = HTTPServer((addr, port), ThermalHandler)
    srv.allow_reuse_address = True
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    _server = srv
    _server_thread = t
    return srv


def stop_server() -> None:
    global _server
    if _server:
        _server.shutdown()
        _server = None


# ---------------------------------------------------------------------------
# Self-test — deterministic, no external network
# ---------------------------------------------------------------------------

def selftest() -> dict:
    """Self-test: asserts honest no-GPU response; structural checks.

    Assertions:
    1. read_gpu_telemetry() always returns a dict with required fields.
    2. If nvidia-smi absent → measured=False, joules_label contains SAMPLE.
    3. HTTP server starts, /gpu responds with correct schema, /health ok.
    4. /unknown returns 404.
    """
    checks: list[dict] = []
    passed = 0
    failed = 0

    def check(name: str, cond: bool, note: str = "") -> None:
        nonlocal passed, failed
        status = "ok" if cond else "FAIL"
        checks.append({"check": name, "status": status, "note": note})
        if cond:
            passed += 1
        else:
            failed += 1

    # 1. read_gpu_telemetry() structure
    data = read_gpu_telemetry()
    required_fields = {"measured", "power_draw_w", "temperature_c",
                       "power_limit_w", "joules_label", "note", "ts"}
    check("gpu_response_has_required_fields",
          required_fields.issubset(data.keys()),
          note=str(list(data.keys())))
    check("gpu_response_measured_is_bool",
          isinstance(data["measured"], bool),
          note=str(data["measured"]))
    check("gpu_response_joules_label_present",
          isinstance(data["joules_label"], str) and len(data["joules_label"]) > 0,
          note=data["joules_label"])

    # 2. If no GPU: measured must be False, label must say SAMPLE
    if not data["measured"]:
        check("no_gpu_measured_false", data["measured"] is False)
        check("no_gpu_label_is_sample",
              "SAMPLE" in data["joules_label"],
              note=data["joules_label"])
        check("no_gpu_metrics_are_null",
              data["power_draw_w"] is None
              and data["temperature_c"] is None
              and data["power_limit_w"] is None)

    # 3. Start HTTP server on a random high port for the test
    test_port = BIND_PORT + 1000  # avoid conflict with running instance
    import urllib.request
    import urllib.error
    srv = start_server(addr="127.0.0.1", port=test_port)
    time.sleep(0.1)  # brief settle
    try:
        # /gpu
        try:
            with urllib.request.urlopen(
                f"http://127.0.0.1:{test_port}/gpu", timeout=3
            ) as r:
                body = json.loads(r.read())
                check("http_gpu_status_200", r.status == 200)
                check("http_gpu_has_measured_field", "measured" in body)
                check("http_gpu_has_joules_label", "joules_label" in body)
                check("http_gpu_ts_present", bool(body.get("ts")))
        except Exception as exc:  # noqa: BLE001
            check("http_gpu_reachable", False, note=str(exc))

        # /health
        try:
            with urllib.request.urlopen(
                f"http://127.0.0.1:{test_port}/health", timeout=3
            ) as r:
                body = json.loads(r.read())
                check("http_health_ok", body.get("ok") is True)
        except Exception as exc:  # noqa: BLE001
            check("http_health_reachable", False, note=str(exc))

        # /unknown → 404
        try:
            urllib.request.urlopen(
                f"http://127.0.0.1:{test_port}/unknown", timeout=3
            )
            check("http_unknown_404", False, note="expected 404 but got 2xx")
        except urllib.error.HTTPError as e:
            check("http_unknown_404", e.code == 404, note=f"got {e.code}")
        except Exception as exc:  # noqa: BLE001
            check("http_unknown_404", False, note=str(exc))
    finally:
        stop_server()

    # 4. Honest no-GPU: if nvidia-smi absent, ALL metric values must be None
    if not data["measured"]:
        check("honest_no_gpu_all_null",
              data["power_draw_w"] is None and data["temperature_c"] is None,
              note="verified: no fabricated metrics when GPU absent")

    return {
        "ok": failed == 0,
        "checks": len(checks),
        "passed": passed,
        "failed": failed,
        "details": checks,
        "gpu_measured": data["measured"],
        "joules_label": data["joules_label"],
        "doctrine": (
            "honest no-GPU response when nvidia-smi absent; "
            "bind to tailnet only in production; "
            "never fabricates GPU metrics"
        ),
    }


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="SZL On-Site Node GPU Thermal Telemetry Agent"
    )
    parser.add_argument("--selftest", action="store_true", help="Run self-test and exit")
    parser.add_argument("--addr", default=BIND_ADDR)
    parser.add_argument("--port", type=int, default=BIND_PORT)
    args = parser.parse_args()

    if args.selftest:
        result = selftest()
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["ok"] else 1)

    print(json.dumps({
        "service": "node-thermal-agent",
        "bind": f"{args.addr}:{args.port}",
        "endpoints": ["/gpu", "/health"],
        "doctrine": "bind to tailnet only (set BIND_ADDR to Tailscale IP); never public internet",
        "note": "set BIND_ADDR env to your Tailscale IP for production use",
    }))
    srv = start_server(args.addr, args.port)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        stop_server()


if __name__ == "__main__":
    main()
