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

export default router;
