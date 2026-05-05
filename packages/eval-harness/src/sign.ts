/**
 * Report signing and verification utilities.
 *
 * Uses HMAC-SHA256 with the EVAL_RUNNER_SIGNING_KEY env var (or the
 * provided key) to sign and verify report content hashes.  Matches the
 * Python runner's signing logic exactly.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_KEY = 'eval-runner-dev-key-change-in-prod';

function getSigningKey(): string {
  return process.env['EVAL_RUNNER_SIGNING_KEY'] ?? DEFAULT_KEY;
}

/**
 * Signs a content hash using HMAC-SHA256.
 * Must produce the same output as the Python runner's `_sign_report`.
 */
export function signContentHash(contentHash: string, key?: string): string {
  return createHmac('sha256', key ?? getSigningKey())
    .update(contentHash)
    .digest('hex');
}

/**
 * Verifies a report's HMAC signature in constant time.
 * Returns true if the signature is valid.
 */
export function verifyReportSignature(
  contentHash: string,
  signature: string,
  key?: string,
): boolean {
  const expected = signContentHash(contentHash, key);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Locally verify a full report without round-tripping to the runner.
 */
export function verifyReport(report: {
  content_hash: string;
  signature: string;
}): boolean {
  return verifyReportSignature(report.content_hash, report.signature);
}
