"""Minimal HTTP surface demonstrating /khipu/sign?mode={ecdsa,pqc,hybrid}.

This mirrors the additive flagship endpoint. It uses only the Python standard
library so it can run anywhere; flagships wire the same logic into their own
FastAPI app. A process-local Signer is generated per mode at startup (demo).
"""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

from .signature import SignatureType, Signer, Verifier, sign_envelope, verify_envelope
from .envelope import DSSEEnvelope

_SIGNERS: dict = {}
_VERIFIERS: dict = {}


def _signer_for(mode: SignatureType) -> Signer:
    if mode not in _SIGNERS:
        s = Signer.generate(mode)
        _SIGNERS[mode] = s
        _VERIFIERS[mode] = Verifier.from_signer(s)
    return _SIGNERS[mode]


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, obj: dict) -> None:
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):  # silence default logging
        pass

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/khipu/sign":
            return self._send(404, {"error": "not found"})
        qs = parse_qs(parsed.query)
        mode_str = (qs.get("mode", ["ecdsa"])[0]).lower()
        try:
            mode = SignatureType(mode_str)
        except ValueError:
            return self._send(400, {"error": f"unknown mode '{mode_str}'"})
        length = int(self.headers.get("Content-Length", "0"))
        payload = self.rfile.read(length) if length else b"{}"
        try:
            signer = _signer_for(mode)
        except RuntimeError as e:
            return self._send(503, {"error": str(e), "mode": mode_str})
        env = sign_envelope(DSSEEnvelope(payload=payload), signer, mode)
        verified = verify_envelope(env, _VERIFIERS[mode], mode)
        self._send(
            200,
            {
                "mode": mode_str,
                "sig_types": env.sig_types(),
                "verified": verified,
                "envelope": json.loads(env.to_json()),
            },
        )


def serve(port: int = 8799) -> None:
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    import sys

    serve(int(sys.argv[1]) if len(sys.argv) > 1 else 8799)
