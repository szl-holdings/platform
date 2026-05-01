import dns from 'node:dns/promises';
import https from 'node:https';
import http from 'node:http';
import type { Response } from 'express';
import { sendBadRequest } from './api-response';

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^0\./,
];

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal', '169.254.169.254']);

const ALLOWED_SCHEMES = ['https:'];

/**
 * Optional explicit allowlist mode for enterprise customers.
 *
 * When `WEBHOOK_DELIVERY_ALLOWLIST` is set, webhook delivery URLs must match
 * one of the comma-separated host suffixes (case-insensitive). For example:
 *
 *   WEBHOOK_DELIVERY_ALLOWLIST="hooks.acme.com,events.partner.io"
 *
 * Both an exact host match and a suffix match (`.acme.com`) are accepted so
 * that subdomains under an approved zone are permitted. When unset, only the
 * default blocklist (private IP ranges, loopback, link-local, cloud metadata)
 * is enforced.
 */
function getDeliveryAllowlist(): string[] {
  const raw = process.env.WEBHOOK_DELIVERY_ALLOWLIST;
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowlistedHost(hostname: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true;
  const host = hostname.toLowerCase();
  return allowlist.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

export function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((re) => re.test(ip));
}

export function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower)) return true;
  if (/\d+\.\d+\.\d+\.\d+/.test(hostname)) {
    return isPrivateIp(hostname);
  }
  return false;
}

export function validateExternalUrlSync(
  rawUrl: string,
): { valid: true; url: URL } | { valid: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    return {
      valid: false,
      reason: `URL scheme '${parsed.protocol}' is not allowed — only HTTPS is permitted`,
    };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return {
      valid: false,
      reason: 'URL hostname is blocked — private or internal addresses are not permitted',
    };
  }

  if (parsed.port && !['443', '80', ''].includes(parsed.port)) {
    return { valid: false, reason: `Non-standard port '${parsed.port}' is not permitted` };
  }

  const allowlist = getDeliveryAllowlist();
  if (!isAllowlistedHost(parsed.hostname, allowlist)) {
    return {
      valid: false,
      reason: `URL hostname '${parsed.hostname}' is not on the configured webhook delivery allowlist`,
    };
  }

  return { valid: true, url: parsed };
}

export async function validateExternalUrl(
  rawUrl: string,
): Promise<{ valid: true; url: URL } | { valid: false; reason: string }> {
  const syncResult = validateExternalUrlSync(rawUrl);
  if (!syncResult.valid) return syncResult;

  const { url } = syncResult;

  try {
    const addresses = await dns.resolve(url.hostname, 'A').catch(() => []);
    const addresses6 = await dns.resolve(url.hostname, 'AAAA').catch(() => []);
    const allAddresses = [...addresses, ...addresses6];

    for (const addr of allAddresses) {
      if (isPrivateIp(addr)) {
        return {
          valid: false,
          reason: `URL hostname resolves to a private IP address (${addr}) — SSRF protection block`,
        };
      }
    }
  } catch {
    return { valid: false, reason: 'URL hostname could not be resolved' };
  }

  return { valid: true, url };
}

export async function assertExternalUrl(rawUrl: string, res: Response): Promise<URL | null> {
  const result = await validateExternalUrl(rawUrl);
  if (!result.valid) {
    sendBadRequest(res, `SSRF protection: ${result.reason}`);
    return null;
  }
  return result.url;
}

/**
 * SSRF-safe fetch that eliminates the DNS rebinding TOCTOU gap.
 *
 * Unlike the two-step pattern of validateExternalUrl() + fetch(), this
 * function resolves DNS exactly once, verifies every returned address is
 * public, and then opens the TCP connection directly to the pinned IP.
 * The original hostname is preserved in the HTTP Host header and TLS SNI
 * so the remote server sees a normal request.
 *
 * Throws an Error (never returns a failed-validation result) so callers
 * can distinguish network errors from SSRF guard rejections if needed.
 */
export async function ssrfSafeFetch(
  rawUrl: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  } = {},
): Promise<{ ok: boolean; status: number }> {
  const syncResult = validateExternalUrlSync(rawUrl);
  if (!syncResult.valid) {
    throw new Error(`SSRF guard: ${syncResult.reason}`);
  }

  const { url } = syncResult;

  let resolved: Array<{ address: string; family: number }>;
  try {
    resolved = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new Error('SSRF guard: hostname could not be resolved');
  }

  if (!resolved || resolved.length === 0) {
    throw new Error('SSRF guard: hostname could not be resolved');
  }

  for (const { address } of resolved) {
    if (isPrivateIp(address)) {
      throw new Error(
        `SSRF guard: hostname resolves to a private/internal IP address (${address}) — SSRF protection block`,
      );
    }
  }

  const { address: pinnedIp, family } = resolved[0];

  const port = url.port ? parseInt(url.port, 10) : url.protocol === 'https:' ? 443 : 80;

  const requestPath = (url.pathname || '/') + (url.search || '');

  const requestHeaders: Record<string, string> = {
    ...init.headers,
    Host: url.hostname,
  };

  if (init.body) {
    requestHeaders['Content-Length'] = String(Buffer.byteLength(init.body, 'utf8'));
  }

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: pinnedIp,
      port,
      path: requestPath,
      method: init.method ?? 'POST',
      headers: requestHeaders,
      servername: url.hostname,
      family: family as 4 | 6,
    };

    const transport = url.protocol === 'https:' ? https : http;

    const req = transport.request(options, (res) => {
      res.resume();
      resolve({
        ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode ?? 0,
      });
    });

    req.on('error', reject);

    if (init.signal) {
      init.signal.addEventListener('abort', () => {
        req.destroy(new Error('Request aborted'));
      });
    }

    if (init.body) {
      req.write(init.body);
    }
    req.end();
  });
}
