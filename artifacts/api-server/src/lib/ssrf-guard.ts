import dns from 'dns/promises';
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
