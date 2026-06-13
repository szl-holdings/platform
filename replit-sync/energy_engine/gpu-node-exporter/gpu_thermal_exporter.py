#!/usr/bin/env python3
"""
gpu_thermal_exporter.py — tiny stdlib-only NVML/nvidia-smi exporter for the
RTX 5000 (betterwithage) node so the a11oy app box can READ real GPU telemetry
over Tailscale and flip the FIRST MEASURED JOULE (R-ZOOMOUT-GPU step 1).

Honesty doctrine: this NEVER fabricates a reading. If nvidia-smi is missing or
fails, it returns {"ok": false, ...} so the app stays on SAMPLE joules, never a
fake "measured". No free energy; measured only when real NVML is read.

Run ON the GPU node (Windows or Linux, wherever the NVIDIA driver lives):
    python3 gpu_thermal_exporter.py            # binds 0.0.0.0:9839
Env:
    GPU_EXPORTER_PORT   (default 9839)
    GPU_EXPORTER_BIND   (default 0.0.0.0 — Tailscale IP also fine)
    GPU_EXPORTER_TOKEN  (optional bearer/?token= shared secret)

Endpoints:
    GET /gpu/thermal  -> JSON the app's GPU_THERMAL_URL reader consumes
    GET /metrics      -> Prometheus text (power_draw_watts, temp_gpu_celsius...)
    GET /healthz      -> {"ok": true/false}
"""
import json
import os
import shutil
import subprocess
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

QUERY = "power.draw,temperature.gpu,utilization.gpu,power.limit,name"
FIELDS = ["power.draw", "temperature.gpu", "utilization.gpu", "power.limit", "name"]


def read_nvidia_smi():
    exe = shutil.which("nvidia-smi")
    if not exe:
        return {"ok": False, "source": "nvidia-smi", "error": "nvidia-smi not found on PATH", "ts": time.time()}
    try:
        out = subprocess.run(
            [exe, "--query-gpu=" + QUERY, "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=10,
        )
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "source": "nvidia-smi", "error": "exec failed: %s" % e, "ts": time.time()}
    if out.returncode != 0:
        return {"ok": False, "source": "nvidia-smi", "error": (out.stderr or "nonzero exit").strip()[:300], "ts": time.time()}
    line = (out.stdout or "").strip().splitlines()
    if not line:
        return {"ok": False, "source": "nvidia-smi", "error": "no GPU rows", "ts": time.time()}
    parts = [p.strip() for p in line[0].split(",")]
    if len(parts) < len(FIELDS):
        return {"ok": False, "source": "nvidia-smi", "error": "unexpected columns: %r" % line[0], "ts": time.time()}

    def num(x):
        try:
            return float(x)
        except (TypeError, ValueError):
            return None

    power_draw = num(parts[0])
    temp = num(parts[1])
    util = num(parts[2])
    plimit = num(parts[3])
    name = parts[4]
    gpu = {
        # nvidia-smi native keys (what the order names: power.draw + temperature.gpu)
        "power.draw": power_draw,
        "temperature.gpu": temp,
        "utilization.gpu": util,
        "power.limit": plimit,
        "name": name,
        # normalized aliases so any reader shape is satisfied
        "power_draw_w": power_draw,
        "temperature_gpu_c": temp,
        "utilization_gpu_pct": util,
        "power_limit_w": plimit,
    }
    return {"ok": power_draw is not None, "source": "nvidia-smi", "ts": time.time(), "gpu": gpu}


class Handler(BaseHTTPRequestHandler):
    def _auth_ok(self, q):
        token = os.environ.get("GPU_EXPORTER_TOKEN", "")
        if not token:
            return True
        hdr = self.headers.get("Authorization", "")
        if hdr.startswith("Bearer ") and hdr[7:] == token:
            return True
        return q.get("token", [""])[0] == token

    def _send(self, code, body, ctype="application/json"):
        data = body.encode() if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):  # noqa: N802
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path == "/healthz":
            r = read_nvidia_smi()
            return self._send(200 if r["ok"] else 503, json.dumps({"ok": r["ok"]}))
        if not self._auth_ok(q):
            return self._send(401, json.dumps({"ok": False, "error": "unauthorized"}))
        if u.path == "/gpu/thermal":
            r = read_nvidia_smi()
            return self._send(200 if r["ok"] else 503, json.dumps(r))
        if u.path == "/metrics":
            r = read_nvidia_smi()
            if not r["ok"]:
                return self._send(503, "# gpu exporter error: %s\n" % r.get("error", ""), "text/plain")
            g = r["gpu"]
            lines = [
                "# HELP gpu_power_draw_watts GPU power draw (nvidia-smi power.draw)",
                "# TYPE gpu_power_draw_watts gauge",
                "gpu_power_draw_watts %s" % g["power_draw_w"],
                "# HELP gpu_temp_celsius GPU temperature (nvidia-smi temperature.gpu)",
                "# TYPE gpu_temp_celsius gauge",
                "gpu_temp_celsius %s" % g["temperature_gpu_c"],
                "# HELP gpu_utilization_percent GPU utilization",
                "# TYPE gpu_utilization_percent gauge",
                "gpu_utilization_percent %s" % g["utilization_gpu_pct"],
            ]
            return self._send(200, "\n".join(lines) + "\n", "text/plain")
        return self._send(404, json.dumps({"ok": False, "error": "not found", "path": u.path}))

    def log_message(self, *_):  # quiet
        return


def main():
    port = int(os.environ.get("GPU_EXPORTER_PORT", "9839"))
    bind = os.environ.get("GPU_EXPORTER_BIND", "0.0.0.0")
    srv = ThreadingHTTPServer((bind, port), Handler)
    print("gpu_thermal_exporter listening on %s:%d  (auth=%s)" % (
        bind, port, "on" if os.environ.get("GPU_EXPORTER_TOKEN") else "off"))
    boot = read_nvidia_smi()
    print("boot probe:", json.dumps(boot)[:300])
    srv.serve_forever()


if __name__ == "__main__":
    main()
