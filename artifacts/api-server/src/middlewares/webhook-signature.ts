/**
 * webhook-signature.ts — Shared inbound webhook signature verification.
 *
 * Supported schemes:
 *  • hmac-sha256    — Raw HMAC-SHA256 comparison; signature may be hex or "sha256=<hex>"
 *  • github         — GitHub-style "sha256=<hex>" in X-Hub-Signature-256 header
 *  • stripe-style   — Stripe-style "t=<ts>,v1=<hex>"; enforces timestamp tolerance
 *
 * Usage (as Express middleware):
 *   router.post('/webhooks/example',
 *     webhookSignatureMiddleware({ scheme: 'hmac-sha256', secretEnvVar: 'EXAMPLE_WEBHOOK_SECRET', headerName: 'x-example-sig' }),
 *     handler,
 *   );
 *
 * The middleware returns HTTP 401 when:
 *  - The secret env var is not set (unless allowWhenUnconfigured is true)
 *  - The signature header is absent
 *  - The computed HMAC does not match the provided signature
 *  - (stripe-style) The timestamp is outside the tolerance window
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler } from 'express';
import { logger } from '../lib/logger';

function getRawBody(req: Request): string {
  const raw = (req as Request & { rawBody?: Buffer }).rawBody;
  return raw ? raw.toString('utf8') : JSON.stringify(req.body);
}

/**
 * verifyHmacSha256 — timing-safe HMAC-SHA256 comparison.
 *
 * `signature` may be a plain hex string or prefixed with "sha256=".
 * Returns false on any error (wrong lengths, non-hex input, etc.).
 */
export function verifyHmacSha256(
  payload: string | Buffer,
  secret: string,
  signature: string,
): boolean {
  try {
    const raw = typeof payload === 'string' ? payload : payload.toString('utf8');
    const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const sigBuf = Buffer.from(sig, 'hex');
    if (expectedBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}

/**
 * verifyGitHubStyle — validates a GitHub-style webhook signature.
 *
 * Header format: "sha256=<hex>"  (X-Hub-Signature-256)
 */
export function verifyGitHubStyle(
  rawBody: string | Buffer,
  secret: string,
  signature: string | undefined,
): boolean {
  if (!signature) return false;
  return verifyHmacSha256(rawBody, secret, signature);
}

/**
 * verifyStripeStyle — validates a Stripe-style webhook signature.
 *
 * Header format: "t=<unix-seconds>,v1=<hex>"  (Stripe-Signature)
 * Rejects events whose timestamp is more than `toleranceSeconds` old (default 300 s).
 */
export function verifyStripeStyle(
  rawBody: string | Buffer,
  secret: string,
  signature: string | undefined,
  toleranceSeconds = 300,
): boolean {
  if (!signature) return false;
  try {
    const parts = Object.fromEntries(
      signature.split(',').map((p) => {
        const idx = p.indexOf('=');
        return idx === -1 ? [p, ''] : [p.slice(0, idx), p.slice(idx + 1)];
      }),
    );
    const timestamp = parts['t'];
    const v1 = parts['v1'];
    if (!timestamp || !v1) return false;
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;
    const raw = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    return verifyHmacSha256(`${timestamp}.${raw}`, secret, v1);
  } catch {
    return false;
  }
}

export type WebhookScheme = 'hmac-sha256' | 'github' | 'stripe-style';

export interface WebhookSignatureOptions {
  scheme: WebhookScheme;
  secretEnvVar: string;
  headerName?: string;
  toleranceSeconds?: number;
  /**
   * When true, a missing secret env var allows the request through
   * (useful for demo / dev mode where the provider is not configured).
   * Default: false — missing secret → 401.
   */
  allowWhenUnconfigured?: boolean;
}

/**
 * webhookSignatureMiddleware — Express middleware factory for inbound webhook
 * signature enforcement.
 *
 * Callers that already use an SDK-level verifier (e.g. `stripe.webhooks.constructEvent`)
 * may skip this middleware and instead import the primitives directly:
 *   verifyHmacSha256 / verifyGitHubStyle / verifyStripeStyle
 *
 * Every new inbound webhook POST route MUST either:
 *   (a) use `webhookSignatureMiddleware`, OR
 *   (b) call one of the exported verify helpers explicitly and return 401 on failure.
 */
export function webhookSignatureMiddleware(options: WebhookSignatureOptions): RequestHandler {
  const {
    scheme,
    secretEnvVar,
    headerName = 'x-signature-sha256',
    toleranceSeconds = 300,
    allowWhenUnconfigured = false,
  } = options;

  return (req, res, next) => {
    const secret = process.env[secretEnvVar];

    if (!secret) {
      if (allowWhenUnconfigured) {
        logger.debug(
          `[webhook-sig] ${secretEnvVar} not set — allowing request (unconfigured/demo mode)`,
        );
        return next();
      }
      logger.warn(`[webhook-sig] ${secretEnvVar} is not configured — rejecting request`);
      res.status(401).json({ error: 'Webhook endpoint not configured' });
      return;
    }

    const rawBody = getRawBody(req);
    const sigHeader = req.headers[headerName.toLowerCase()] as string | undefined;

    let valid = false;
    switch (scheme) {
      case 'github':
        valid = verifyGitHubStyle(rawBody, secret, sigHeader);
        break;
      case 'stripe-style':
        valid = verifyStripeStyle(rawBody, secret, sigHeader, toleranceSeconds);
        break;
      case 'hmac-sha256':
      default:
        valid = !!sigHeader && verifyHmacSha256(rawBody, secret, sigHeader);
        break;
    }

    if (!valid) {
      logger.warn({ path: req.path, scheme }, '[webhook-sig] Invalid or missing signature — 401');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    next();
  };
}
