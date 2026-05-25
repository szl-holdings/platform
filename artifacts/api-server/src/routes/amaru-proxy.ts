import { Router } from 'express';

/**
 * Amaru sidecar proxy.
 *
 * The Amaru organ (services/amaru, the "Andean ouroboros" — R0513 OVERWATCH
 * read-only sensor + HUKLLA halt authority + chakana wiring) runs as a
 * FastAPI sidecar on port 6810 (see artifacts workflow
 * "artifacts/api-server: amaru" and services/amaru/README.md).
 *
 * This thin proxy lets browser artifacts (sentra, a11oy, etc.) reach the
 * read-only panels through the api-server's authenticated, same-origin
 * surface without a CORS dance or hardcoded sidecar URL.
 *
 * Doctrine: R0513 watches. It does not write. Halt authority belongs to
 * HUKLLA. This proxy is GET-only by design — exposing POST handlers here
 * would let a UI cycle violate the read-only invariant of the organ.
 */

const AMARU_BASE =
  process.env.AMARU_BASE_URL ??
  `http://127.0.0.1:${process.env.AMARU_PORT ?? '6810'}`;

const router: Router = Router();

async function proxyGet(path: string, res: import('express').Response) {
  try {
    const upstream = await fetch(`${AMARU_BASE}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    res.status(upstream.status);
    res.setHeader('content-type', contentType);
    res.setHeader('cache-control', 'no-store');
    res.send(text);
  } catch (err) {
    res.status(502).json({
      error: 'amaru_unreachable',
      message:
        err instanceof Error ? err.message : 'Amaru sidecar did not respond within 8s',
      upstream: AMARU_BASE + path,
    });
  }
}

router.get('/amaru/overwatch/snapshot', (_req, res) => {
  void proxyGet('/overwatch/snapshot', res);
});

router.get('/amaru/state', (_req, res) => {
  void proxyGet('/state', res);
});

router.get('/amaru/healthz', (_req, res) => {
  void proxyGet('/healthz', res);
});

// Read-only Amaru kernel surfaces — exposed for Conduit tabs to render real
// upstream evidence (Round 5 / T003). All are GET-only; the upstream FastAPI
// organ (services/amaru) is read-only by design.

// SSE pass-through for /amaru/events. The sidecar emits `amaru.chakra` and
// `amaru.scheduler` envelopes — the same topic names Amaru publishes to the
// yawar-bus — every time a kernel evaluates. Streaming this through lets
// Conduit's /brain panel react in ~ms instead of waiting for its 2s poll.
//
// We use fetch's streaming body and pipe each chunk straight to the express
// response, set SSE-friendly headers, and abort the upstream request when
// the browser disconnects. Polling on /state and /tripwires is retained
// client-side as a fallback for when this stream is unavailable.
router.get('/amaru/events', async (req, res) => {
  const upstreamUrl = `${AMARU_BASE}/events`;
  const controller = new AbortController();
  req.on('close', () => controller.abort());

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: { Accept: 'text/event-stream' },
      signal: controller.signal,
    });

    if (!upstream.ok || !upstream.body) {
      res.status(upstream.status || 502).json({
        error: 'amaru_events_unavailable',
        status: upstream.status,
        upstream: upstreamUrl,
      });
      return;
    }

    res.status(200);
    res.setHeader('content-type', 'text/event-stream');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.setHeader('x-accel-buffering', 'no');
    res.flushHeaders?.();

    const reader = upstream.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) res.write(Buffer.from(value));
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
      res.end();
    }
  } catch (err) {
    if (controller.signal.aborted) {
      // Client disconnected — silent.
      return;
    }
    if (!res.headersSent) {
      res.status(502).json({
        error: 'amaru_unreachable',
        message:
          err instanceof Error ? err.message : 'Amaru sidecar SSE did not respond',
        upstream: upstreamUrl,
      });
    } else {
      res.end();
    }
  }
});

router.get('/amaru/receipts', (req, res) => {
  const limit = typeof req.query.limit === 'string' ? `?limit=${encodeURIComponent(req.query.limit)}` : '';
  void proxyGet(`/receipts${limit}`, res);
});

router.get('/amaru/tripwires', (_req, res) => {
  void proxyGet('/tripwires', res);
});

router.get('/amaru/scheduler/wiring', (_req, res) => {
  void proxyGet('/scheduler/wiring', res);
});

export default router;
