# SZL readiness matrix — local exact-source screenshot

| Field | Value |
| --- | --- |
| Filename | `szl-readiness-matrix-2026-10-02.jpg` |
| Route | `http://127.0.0.1:19873/dashboard.html` |
| Surface | SZL Production-Readiness Matrix |
| Captured at (UTC) | `2026-10-02T22:10:24.326488+00:00` |
| Captured by | Codex readiness-contract agent |
| Environment | `local-exact-head`, Windows, Python Playwright 1.63.0, headless Microsoft Edge |
| Source revision | `453c7f8b018322a1b599bd5eddfdc274e50515b3` |
| Viewport | `1366x900`, device scale 1 |
| Screenshot SHA-256 | `5a98f8286ba994d4c99350be3d3d53f168a08f8e00210d3ec69f71bd8c32af1f` |
| Screenshot bytes | `97569` |
| Workcell | `SZL-READINESS-20261002` |
| Proof level | 3 — local UI source proof only |

The serving command was `python -m http.server 19873 --bind 127.0.0.1`, run
from `platform/agents/readiness` at the stated source revision. The exact
capture command was `python -c $szlCaptureScript` from the repository root,
with this PowerShell literal as `$szlCaptureScript`:

```python
from playwright.sync_api import sync_playwright
from datetime import datetime, timezone
from pathlib import Path
import hashlib

route = 'http://127.0.0.1:19873/dashboard.html'
output = Path('docs/assets/screenshots/current/szl-readiness-matrix-2026-10-02.jpg')
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless=True)
    page = browser.new_page(viewport={'width': 1366, 'height': 900}, device_scale_factor=1)
    response = page.goto(route, wait_until='domcontentloaded', timeout=30000)
    page.wait_for_function("document.querySelectorAll('#rows tr').length === 8 && document.getElementById('status').textContent && document.getElementById('status').textContent !== 'fetching…'", timeout=90000)
    state = page.locator('#status').inner_text()
    print('http', response.status, 'status', state)
    print('first_row', page.locator('#rows tr').first.inner_text().replace('\n', ' | '))
    print('unverified_rows', page.locator('#rows .pill.UNVERIFIED').count())
    if response.status != 200 or page.locator('#rows .pill.UNVERIFIED').count() == 0:
        raise RuntimeError('live receipt state is not available; refusing an error-state screenshot')
    page.screenshot(path=str(output), full_page=True, type='jpeg', quality=85)
    browser.close()
print('captured_at_utc', datetime.now(timezone.utc).isoformat())
print('screenshot_sha256', hashlib.sha256(output.read_bytes()).hexdigest())
print('screenshot_bytes', output.stat().st_size)
```

The browser fetched real public `SZLHOLDINGS/readiness-runs` data (dataset
listing HTTP 200, eight receipt rows). All eight were displayed as
`UNVERIFIED`; the first row was an unsigned historical receipt. This is proof
of the browser's fail-closed presentation at the stated source, not proof that
the dataset writer, any flagship, or the runtime probes are healthy.
