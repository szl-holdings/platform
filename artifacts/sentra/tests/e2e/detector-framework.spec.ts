/**
 * Sentra detector framework — round-trip e2e.
 *
 * Asserts that an engineer can:
 *   1. Discover the canonical TS detector in `GET /api/sentra/detectors`.
 *   2. Trigger a run with inline inputs that should fire a finding.
 *   3. See the resulting finding appear under
 *      `GET /api/sentra/findings?detectorId=...` with the same
 *      `chainReceiptId` carried on both the run and the finding.
 *
 * Auth notes
 * - `GET /sentra/detectors`, `GET /sentra/detector-runs`, and
 *   `GET /sentra/findings` are read-only and unauthenticated.
 * - `POST /sentra/detectors/:id/run` is gated by `authMiddleware`,
 *   matching every other mutating sentra route. The test attaches the
 *   internal agent token when present (CI / local dev) and skips the
 *   write half when no token is configured rather than asserting on a
 *   fake session.
 */
import { expect, test } from '@playwright/test';

const API_BASE = process.env.SENTRA_API_BASE ?? '';
const SENTRA_BASE = process.env.SENTRA_WEB_BASE ?? '/';
const DETECTOR_ID = 'ts-example/heuristic-port-scan';
const INTERNAL_TOKEN =
  process.env.SENTRA_E2E_INTERNAL_TOKEN ?? process.env.INTERNAL_AGENT_TOKEN ?? '';

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (INTERNAL_TOKEN) h['x-internal-token'] = INTERNAL_TOKEN;
  return h;
}

async function apiGet(
  request: import('@playwright/test').APIRequestContext,
  path: string,
) {
  return request.fetch(`${API_BASE}/api${path}`, { method: 'GET' });
}

async function apiPost(
  request: import('@playwright/test').APIRequestContext,
  path: string,
  body: unknown,
) {
  return request.fetch(`${API_BASE}/api${path}`, {
    method: 'POST',
    headers: authHeaders(),
    data: JSON.stringify(body),
  });
}

/**
 * Inline `network.flows` payload designed to trip the canonical
 * heuristic-port-scan threshold (default `distinctPortsMin=12`):
 * one srcIp touching 20 distinct destination ports.
 */
function portScanInputs() {
  const flows = Array.from({ length: 20 }, (_, i) => ({
    srcIp: '10.0.0.42',
    dstIp: '10.0.0.99',
    dstPort: 1000 + i,
    ts: new Date().toISOString(),
  }));
  return { 'network.flows': flows };
}

test.describe('Sentra Detector Framework — round-trip', () => {
  test('canonical TS detector is registered at boot', async ({ request }) => {
    const res = await apiGet(request, '/sentra/detectors');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const ids: string[] = (body.detectors ?? []).map((d: { id: string }) => d.id);
    expect(ids).toContain(DETECTOR_ID);
  });

  test('run emits a finding and links it to the run via chain receipt', async ({
    request,
  }) => {
    const runRes = await apiPost(
      request,
      `/sentra/detectors/${DETECTOR_ID}/run`,
      { triggeredBy: 'e2e', inputs: portScanInputs() },
    );

    // The run endpoint is auth-gated. In environments without an
    // internal token we still want the test to be a useful safety net
    // on the listing routes, so we soft-skip the write assertions
    // rather than fail spuriously.
    if (runRes.status() === 401 || runRes.status() === 403) {
      test.skip(true, 'No internal token configured for the run endpoint.');
      return;
    }

    expect(runRes.status(), await runRes.text()).toBeLessThan(300);
    const runBody = await runRes.json();
    expect(runBody.status).toBe('ok');
    expect(runBody.runId).toBeTruthy();
    expect(runBody.chainReceiptId).toMatch(/^[0-9a-f]{64}$/);
    expect(Array.isArray(runBody.findings)).toBeTruthy();
    expect(runBody.findings.length).toBeGreaterThanOrEqual(1);
    const emitted = runBody.findings[0];
    expect(emitted.detectorId).toBe(DETECTOR_ID);
    expect(['critical', 'high', 'medium', 'low', 'info']).toContain(
      emitted.severity,
    );

    // Confirm the finding is discoverable through the same surface
    // that the alerts page reads, and that the chain receipt matches.
    const findingsRes = await apiGet(
      request,
      `/sentra/findings?detectorId=${encodeURIComponent(DETECTOR_ID)}&limit=25`,
    );
    expect(findingsRes.ok()).toBeTruthy();
    const findingsBody = await findingsRes.json();
    const match = (findingsBody.findings ?? []).find(
      (f: { runId: string }) => f.runId === runBody.runId,
    );
    expect(match, 'finding from this run should be visible in findings list').toBeTruthy();
    expect(match.chainReceiptId).toBe(runBody.chainReceiptId);

    // And confirm the run row carries the same receipt id.
    const runsRes = await apiGet(
      request,
      `/sentra/detector-runs?detectorId=${encodeURIComponent(DETECTOR_ID)}&limit=10`,
    );
    expect(runsRes.ok()).toBeTruthy();
    const runsBody = await runsRes.json();
    const runRow = (runsBody.runs ?? []).find(
      (r: { id: string }) => r.id === runBody.runId,
    );
    expect(runRow).toBeTruthy();
    expect(runRow.chainReceiptId).toBe(runBody.chainReceiptId);
  });

  test('detector framework page renders detector + finding from the API', async ({
    page,
    request,
  }) => {
    // Best-effort: try to seed a finding through the run endpoint so
    // the page has something to render. Soft-skip the seed if the
    // environment has no internal token — the detector card alone is
    // still a meaningful UI assertion.
    const runRes = await apiPost(
      request,
      `/sentra/detectors/${DETECTOR_ID}/run`,
      { triggeredBy: 'e2e-ui', inputs: portScanInputs() },
    );
    let seededFindingId: string | null = null;
    if (runRes.ok()) {
      const body = await runRes.json();
      if (Array.isArray(body.findings) && body.findings.length > 0) {
        seededFindingId = body.findings[0].id as string;
      }
    }

    await page.goto(`${SENTRA_BASE.replace(/\/$/, '')}/detector-framework`);
    await expect(page.getByTestId('detector-framework-page')).toBeVisible();
    // Detector card from the canonical registry must render.
    await expect(page.getByTestId(`df-detector-${DETECTOR_ID}`)).toBeVisible();

    if (seededFindingId) {
      const findingLocator = page.getByTestId(`df-finding-${seededFindingId}`);
      await expect(findingLocator).toBeVisible();
      // Chain receipt must be carried into the rendered DOM so an
      // operator can audit the row back to its ReceiptChain entry.
      const chainAttr = await findingLocator.getAttribute('data-chain-receipt');
      expect(chainAttr).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test('findings endpoint accepts filters without error', async ({ request }) => {
    const res = await apiGet(
      request,
      `/sentra/findings?detectorId=${encodeURIComponent(DETECTOR_ID)}&status=open&limit=10`,
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.findings)).toBeTruthy();
  });
});
