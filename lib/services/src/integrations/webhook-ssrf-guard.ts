/**
 * Webhook delivery SSRF guard (P1-C / KG020b).
 *
 * User-supplied webhook delivery URLs are an SSRF vector: a tenant can point a
 * webhook at an internal address (cloud metadata endpoint, loopback admin
 * port, RFC-1918 service) and coerce the platform into making a request on
 * their behalf. This module validates a destination URL BEFORE any outbound
 * delivery and refuses anything that is not safe.
 *
 * Two independent controls, both enforced:
 *   1. Scheme + host allowlist. WEBHOOK_HOST_ALLOWLIST is a comma-separated
 *      list of permitted hosts (exact host, or a ".example.com" suffix to
 *      allow subdomains). When the allowlist is set, every host NOT on it is
 *      rejected (default-deny). When it is unset, hosts are allowed only if
 *      they also pass control 2 — there is no implicit "allow the internet".
 *      Callers that want strict deploys set the env var; the default already
 *      blocks the dangerous internal ranges.
 *   2. Resolved-IP range block. The host is DNS-resolved and every resolved
 *      address is checked against private, loopback, link-local, CGNAT,
 *      unique-local, and cloud-metadata ranges. This defeats DNS-rebinding and
 *      hostnames that map to internal IPs even when an allowlist is not set.
 *
 * The validated address set is returned so the caller can pin the connection
 * to the exact IP that was checked (closing the resolve→connect TOCTOU gap).
 */
import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

export interface WebhookUrlValidationOptions {
  /** Comma-separated allowlist; defaults to process.env.WEBHOOK_HOST_ALLOWLIST. */
  allowlist?: string;
  /** Permitted URL schemes. Defaults to https only. */
  allowedSchemes?: string[];
  /**
   * DNS resolver, injectable for tests. Returns the resolved IPs for a host.
   * Defaults to node:dns lookup (all addresses).
   */
  resolveHost?: (host: string) => Promise<string[]>;
  /** Allow http:// in addition to https. Off by default. */
  allowInsecureHttp?: boolean;
}

export interface WebhookUrlValidationResult {
  ok: boolean;
  /** Reason the URL was rejected; undefined when ok. */
  reason?: string;
  /** Resolved IPs that passed the range check (for connection pinning). */
  addresses?: string[];
}

export class WebhookSsrfError extends Error {
  constructor(
    message: string,
    readonly url: string,
  ) {
    super(message);
    this.name = 'WebhookSsrfError';
  }
}

const DEFAULT_SCHEMES = ['https:'];

async function defaultResolve(host: string): Promise<string[]> {
  const records = await lookup(host, { all: true });
  return records.map((r) => r.address);
}

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length > 0);
}

/**
 * True if `host` matches an allowlist entry. An entry beginning with "." (e.g.
 * ".hooks.example.com") matches that suffix and any subdomain of it; otherwise
 * the match is exact.
 */
function hostAllowed(host: string, allowlist: string[]): boolean {
  const h = host.toLowerCase();
  for (const entry of allowlist) {
    if (entry.startsWith('.')) {
      if (h === entry.slice(1) || h.endsWith(entry)) return true;
    } else if (h === entry) {
      return true;
    }
  }
  return false;
}

/** Parse an IPv4 dotted-quad into its 32-bit unsigned integer, or null. */
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let acc = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    acc = acc * 256 + n;
  }
  return acc >>> 0;
}

/** True for IPv4 addresses that must never be a webhook destination. */
function isBlockedIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true; // unparseable → treat as unsafe
  const inRange = (cidrBase: string, bits: number): boolean => {
    const base = ipv4ToInt(cidrBase);
    if (base === null) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (n & mask) === (base & mask);
  };
  return (
    inRange('0.0.0.0', 8) || // "this" network
    inRange('10.0.0.0', 8) || // private
    inRange('100.64.0.0', 10) || // CGNAT
    inRange('127.0.0.0', 8) || // loopback
    inRange('169.254.0.0', 16) || // link-local incl. 169.254.169.254 metadata
    inRange('172.16.0.0', 12) || // private
    inRange('192.0.0.0', 24) || // IETF protocol assignments
    inRange('192.168.0.0', 16) || // private
    inRange('198.18.0.0', 15) || // benchmarking
    inRange('224.0.0.0', 4) || // multicast
    inRange('240.0.0.0', 4) // reserved
  );
}

/** True for IPv6 addresses that must never be a webhook destination. */
function isBlockedIPv6(ip: string): boolean {
  const a = ip.toLowerCase().split('%')[0]; // strip zone id
  if (a === '::1' || a === '::') return true; // loopback / unspecified
  if (a.startsWith('fe80') || a.startsWith('fe9') || a.startsWith('fea') || a.startsWith('feb'))
    return true; // link-local fe80::/10
  if (a.startsWith('fc') || a.startsWith('fd')) return true; // unique-local fc00::/7
  if (a.startsWith('ff')) return true; // multicast
  // IPv4-mapped (::ffff:a.b.c.d) — extract and reuse the IPv4 check.
  const mapped = a.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIPv4(mapped[1]);
  return false;
}

function isBlockedIp(ip: string): boolean {
  const fam = isIP(ip);
  if (fam === 4) return isBlockedIPv4(ip);
  if (fam === 6) return isBlockedIPv6(ip);
  return true; // not a valid IP literal → unsafe
}

/**
 * Validate a webhook destination URL. Resolves DNS and checks every control.
 * Returns a structured result; never throws for a rejected URL (use
 * {@link assertWebhookUrlAllowed} when you want a throw).
 */
export async function validateWebhookUrl(
  rawUrl: string,
  options: WebhookUrlValidationOptions = {},
): Promise<WebhookUrlValidationResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'malformed URL' };
  }

  const schemes = options.allowedSchemes ?? (options.allowInsecureHttp ? ['https:', 'http:'] : DEFAULT_SCHEMES);
  if (!schemes.includes(url.protocol)) {
    return { ok: false, reason: `scheme not allowed: ${url.protocol}` };
  }

  // Credentials in the URL are a common SSRF / smuggling trick.
  if (url.username || url.password) {
    return { ok: false, reason: 'embedded credentials not allowed' };
  }

  const host = url.hostname.replace(/^\[|\]$/g, ''); // unwrap bracketed IPv6
  if (!host) {
    return { ok: false, reason: 'empty host' };
  }

  const allowlist = parseAllowlist(options.allowlist ?? process.env.WEBHOOK_HOST_ALLOWLIST);

  // If an explicit allowlist is configured, the host must be on it (default-deny).
  if (allowlist.length > 0 && !hostAllowed(host, allowlist)) {
    return { ok: false, reason: `host not on WEBHOOK_HOST_ALLOWLIST: ${host}` };
  }

  // Resolve and range-check. A literal IP is checked directly; a hostname is
  // resolved and every returned address must pass.
  let addresses: string[];
  if (isIP(host)) {
    addresses = [host];
  } else {
    const resolve = options.resolveHost ?? defaultResolve;
    try {
      addresses = await resolve(host);
    } catch {
      return { ok: false, reason: `DNS resolution failed for host: ${host}` };
    }
    if (addresses.length === 0) {
      return { ok: false, reason: `no addresses resolved for host: ${host}` };
    }
  }

  for (const addr of addresses) {
    if (isBlockedIp(addr)) {
      return { ok: false, reason: `resolved address in blocked range: ${addr}` };
    }
  }

  return { ok: true, addresses };
}

/**
 * Throwing variant of {@link validateWebhookUrl}. Call this immediately before
 * outbound webhook delivery so a disallowed destination aborts the request.
 */
export async function assertWebhookUrlAllowed(
  rawUrl: string,
  options: WebhookUrlValidationOptions = {},
): Promise<string[]> {
  const result = await validateWebhookUrl(rawUrl, options);
  if (!result.ok) {
    throw new WebhookSsrfError(`webhook delivery refused: ${result.reason}`, rawUrl);
  }
  return result.addresses ?? [];
}
