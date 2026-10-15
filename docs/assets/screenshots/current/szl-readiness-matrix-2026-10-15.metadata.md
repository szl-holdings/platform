# SZL readiness matrix — exact-source local rendered proof

This witness uses **synthetic unsigned receipt fixtures** and makes zero external
network requests. It proves local rendering and refusal to display claimed GREEN
values as verified. It does not prove a signer, provider, deployment or readiness.

- Source: `d70282985d7b4358cf405fbedc74628bb9475bbf`
- Route: `http://127.0.0.1:35885/dashboard.html`
- Viewport: `1366x900`, device scale 1
- Capture: `2026-10-15T11:46:37.375806+00:00`
- Environment: Linux managed cloud checkout, Python 3.12.14, Playwright 1.62.0, Chromium 151.0.7922.34
- Page SHA-256: `f32cbe730d9c70a7f5e978d6bf5cc60e51968f7e26d4c955de7032ef773a5cfb`
- Screenshot: `szl-readiness-matrix-2026-10-15.png`
- Screenshot SHA-256: `008e14f510d177410892146dcc25aa922b0e063aa00ea50cbce780faab9ae98e`
- Screenshot bytes: `111499`
- Workcell: `SZL-ORG-PR-20261015`
- Agent: Codex / PixelProof role
- Result: PASS, eight UNVERIFIED rows, zero GREEN rows, no page errors or request violations
- Requests: one loopback GET; 16 synthetic Hub-shaped GETs fulfilled locally; zero external traffic

The actual application is served by a loopback HTTP server from its exact source
bytes. Non-GET and unknown requests, service workers and WebSockets are blocked.
The 2026-10-15 timestamps in the fixtures are synthetic claims, not live telemetry.
The historical October 2 witness is retained unchanged.

Command:

```sh
/workspace/.venvs/a11oy-production/bin/python /workspace/org-pr-audit-20261015/platform/capture_readiness_dashboard.py
```

Reproduction script (run from a clean checkout of the source above; the local
Chromium installation path is environment-specific):

```python
"""Local rendered-UI proof with explicit synthetic receipts and zero Hub traffic."""
from __future__ import annotations

import base64
import hashlib
import http.server
import json
import subprocess
import threading
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path('/workspace/platform')
PROOF = Path('/workspace/org-pr-audit-20261015/platform')
PAGE = ROOT / 'platform/agents/readiness/dashboard.html'
OUTPUT = ROOT / 'docs/assets/screenshots/current/szl-readiness-matrix-2026-10-15.png'
source = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True):
    raise RuntimeError('Capture requires a clean exact-source checkout')
page_bytes = PAGE.read_bytes()


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/dashboard.html':
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(page_bytes)))
        self.end_headers()
        self.wfile.write(page_bytes)

    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
route = f'http://127.0.0.1:{server.server_port}/dashboard.html'
agents = ['readiness-reliability', 'readiness-security', 'readiness-observability',
          'readiness-operability', 'readiness-compliance', 'readiness-docs',
          'readiness-dr', 'readiness-audit-rift']
fixtures = {}
for agent in agents:
    receipt_path = f'receipts/{agent}/2026-10-15/synthetic-ui-fixture.json'
    fixtures[f'https://huggingface.co/api/datasets/SZLHOLDINGS/readiness-runs/tree/main/receipts/{agent}?recursive=true'] = [
        {'type': 'file', 'path': receipt_path}]
    body = {'schema': 'szl.readiness.receipt/v1', 'agent': agent,
            'emitted_at_utc': '2026-10-15T00:00:00Z',
            'payload': {'flagships': [{'verdict': 'GREEN'}], 'synthetic_ui_fixture': True}}
    fixtures[f'https://huggingface.co/datasets/SZLHOLDINGS/readiness-runs/resolve/main/{receipt_path}'] = {
        'signed': False, 'signatures': [],
        'payload': base64.b64encode(json.dumps(body).encode()).decode()}
requests, violations, page_errors = [], [], []


def intercept(request_route):
    request = request_route.request
    requests.append({'method': request.method, 'url': request.url})
    if request.method != 'GET':
        violations.append(request.url)
        request_route.abort()
    elif request.url == route:
        request_route.continue_()
    elif request.url in fixtures:
        request_route.fulfill(status=200, content_type='application/json',
                              headers={'Access-Control-Allow-Origin': '*'},
                              body=json.dumps(fixtures[request.url]))
    else:
        violations.append(request.url)
        request_route.abort()


try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path='/home/agent/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome')
        context = browser.new_context(viewport={'width': 1366, 'height': 900},
                                      device_scale_factor=1, service_workers='block')
        context.route('**/*', intercept)
        def block_socket(socket):
            violations.append(socket.url)
            socket.close()
        context.route_web_socket('**/*', block_socket)
        page = context.new_page()
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        response = page.goto(route, wait_until='domcontentloaded', timeout=15000)
        page.wait_for_function("document.querySelectorAll('#rows tr').length === 8 && document.getElementById('status').textContent === 'loaded · signer unverified'")
        assert response.status == 200
        assert page.locator('#rows .UNVERIFIED').count() == 8
        assert page.locator('#rows .GREEN').count() == 0
        assert page.locator('#rows .badge').all_text_contents() == ['unsigned'] * 8
        assert len(requests) == 17 and not violations and not page_errors
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        assert PAGE.read_bytes() == page_bytes
        page.screenshot(path=str(OUTPUT), full_page=True)
        browser.close()
finally:
    server.shutdown()
    server.server_close()

report = {'status': 'PASS', 'evidence_class': 'SIMULATED_LOCAL_RENDERED_UI',
          'source_revision': source, 'route': route, 'viewport': '1366x900',
          'captured_at': datetime.now(timezone.utc).isoformat(),
          'page_sha256': hashlib.sha256(page_bytes).hexdigest(),
          'screenshot': str(OUTPUT.relative_to(ROOT)),
          'screenshot_sha256': hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
          'screenshot_bytes': OUTPUT.stat().st_size, 'requests': requests,
          'external_network_requests': 0, 'violations': violations, 'page_errors': page_errors,
          'unverified_rows': 8, 'green_rows': 0,
          'boundary': 'Synthetic unsigned receipt claims only; no provider, signature, deployment or readiness proof.'}
(PROOF / 'dashboard-browser-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ['status', 'source_revision', 'screenshot_sha256']}))
```
