"""Boot amaru's FastAPI app under uvicorn.

Filename is historical ("dualstack" referred to an earlier IPv6 dualstack socket
binding). That approach bound an `('::', PORT)` socket with `IPV6_V6ONLY=0`
and handed it to uvicorn via ``fd=`` — uvicorn started cleanly, but Replit's
platform port-readiness probe never registered the listener and the workflow
was repeatedly marked "failed" with a misleading "didn't open port" message
(task #5260). Letting uvicorn bind a plain IPv4 socket on 0.0.0.0 makes the
listener visible to the probe and keeps loopback connectivity intact.
"""

from __future__ import annotations

import os
import socket
import sys
import time

import uvicorn

PORT = int(os.environ.get("PORT", "6810"))


def _port_already_bound(port: int) -> bool:
    """Return True if something is already serving on 127.0.0.1:port.

    Defensive guard for the legacy dev path where ``api-server/start.sh`` used
    to co-launch amaru inline. With the standalone artifact workflow now
    canonical (autoStart=true in artifact.toml) this should never trigger, but
    if an operator manually re-enables the inline co-launch we want this
    workflow to idle rather than crash-loop on ``Address already in use``.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.connect(("127.0.0.1", port))
        return True
    except (ConnectionRefusedError, socket.timeout, OSError):
        return False
    finally:
        s.close()


if _port_already_bound(PORT):
    print(
        f"[amaru] port {PORT} already bound by another process — idling.",
        flush=True,
    )
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        sys.exit(0)


uvicorn.run("amaru.app:app", host="0.0.0.0", port=PORT)
