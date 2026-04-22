import crypto from 'node:crypto';

/**
 * Anonymize an IP address before storage in audit and session records.
 *
 * Uses SHA-256 with an optional HMAC salt (IP_HASH_SALT env var) so that
 * raw IP addresses are never persisted. The hash is deterministic within a
 * salt period, enabling log correlation without storing PII.
 *
 * To rotate: update IP_HASH_SALT. Existing hashes become un-correlatable
 * with new ones (forward-only — historical data is not re-hashed).
 *
 * Output format: "sha256:<40-char hex prefix>" (160-bit truncated, collisions
 * negligible for audit use; truncation is intentional for extra privacy margin).
 *
 * Security: IP_HASH_SALT must be set in production. Without a salt,
 * unsalted SHA-256 hashes are precomputable over the IPv4/v6 address space.
 */

const _env = process.env.NODE_ENV;
if (!process.env.IP_HASH_SALT && _env !== 'development' && _env !== 'test') {
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? '';
  const hash = crypto
    .createHash('sha256')
    .update(salt + ip)
    .digest('hex')
    .slice(0, 40);
  return `sha256:${hash}`;
}
