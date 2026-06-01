/**
 * Tests for the webhook delivery SSRF guard (P1-C / KG020b).
 *
 * The DNS resolver is injected so cases are deterministic and run with no
 * network. Each case asserts a concrete decision and reason.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertWebhookUrlAllowed,
  validateWebhookUrl,
  WebhookSsrfError,
} from './webhook-ssrf-guard.js';

// Resolver that maps a hostname to fixed addresses for the test.
const resolverFor = (map: Record<string, string[]>) => async (host: string) => {
  if (host in map) return map[host];
  throw new Error(`unexpected host in test: ${host}`);
};

afterEach(() => {
  delete process.env.WEBHOOK_HOST_ALLOWLIST;
});

describe('validateWebhookUrl — scheme and shape', () => {
  it('rejects non-https schemes by default', async () => {
    const r = await validateWebhookUrl('http://hooks.example.com/x', {
      resolveHost: resolverFor({ 'hooks.example.com': ['93.184.216.34'] }),
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('scheme');
  });

  it('rejects URLs with embedded credentials', async () => {
    const r = await validateWebhookUrl('https://user:pass@hooks.example.com/x', {
      resolveHost: resolverFor({ 'hooks.example.com': ['93.184.216.34'] }),
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('credentials');
  });

  it('rejects a malformed URL', async () => {
    const r = await validateWebhookUrl('not a url');
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('malformed');
  });
});

describe('validateWebhookUrl — internal/private ranges (no allowlist)', () => {
  it('refuses the cloud metadata address', async () => {
    const r = await validateWebhookUrl('https://metadata.internal/latest', {
      resolveHost: resolverFor({ 'metadata.internal': ['169.254.169.254'] }),
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('blocked range');
  });

  it('refuses loopback', async () => {
    const r = await validateWebhookUrl('https://localhost/hook', {
      resolveHost: resolverFor({ localhost: ['127.0.0.1'] }),
    });
    expect(r.ok).toBe(false);
  });

  it('refuses RFC-1918 private addresses', async () => {
    for (const ip of ['10.0.0.5', '172.16.4.9', '192.168.1.20']) {
      const r = await validateWebhookUrl('https://svc.internal/hook', {
        resolveHost: resolverFor({ 'svc.internal': [ip] }),
      });
      expect(r.ok, `expected ${ip} blocked`).toBe(false);
    }
  });

  it('refuses a host whose A record resolves to loopback (DNS rebinding)', async () => {
    const r = await validateWebhookUrl('https://evil.example.com/hook', {
      resolveHost: resolverFor({ 'evil.example.com': ['127.0.0.1'] }),
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('127.0.0.1');
  });

  it('refuses IPv6 loopback and unique-local', async () => {
    const r1 = await validateWebhookUrl('https://[::1]/hook');
    expect(r1.ok).toBe(false);
    const r2 = await validateWebhookUrl('https://[fd00::1]/hook');
    expect(r2.ok).toBe(false);
  });

  it('allows a public address when no allowlist is set', async () => {
    const r = await validateWebhookUrl('https://hooks.example.com/x', {
      resolveHost: resolverFor({ 'hooks.example.com': ['93.184.216.34'] }),
    });
    expect(r.ok).toBe(true);
    expect(r.addresses).toEqual(['93.184.216.34']);
  });
});

describe('validateWebhookUrl — explicit allowlist (default-deny)', () => {
  it('refuses a host not on WEBHOOK_HOST_ALLOWLIST even if public', async () => {
    process.env.WEBHOOK_HOST_ALLOWLIST = 'hooks.partner.com';
    const r = await validateWebhookUrl('https://hooks.example.com/x', {
      resolveHost: resolverFor({ 'hooks.example.com': ['93.184.216.34'] }),
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('WEBHOOK_HOST_ALLOWLIST');
  });

  it('allows an exact allowlisted host', async () => {
    process.env.WEBHOOK_HOST_ALLOWLIST = 'hooks.partner.com, other.com';
    const r = await validateWebhookUrl('https://hooks.partner.com/x', {
      resolveHost: resolverFor({ 'hooks.partner.com': ['93.184.216.34'] }),
    });
    expect(r.ok).toBe(true);
  });

  it('allows a subdomain via a ".suffix" allowlist entry', async () => {
    process.env.WEBHOOK_HOST_ALLOWLIST = '.partner.com';
    const r = await validateWebhookUrl('https://eu.hooks.partner.com/x', {
      resolveHost: resolverFor({ 'eu.hooks.partner.com': ['93.184.216.34'] }),
    });
    expect(r.ok).toBe(true);
  });

  it('still blocks an allowlisted host that resolves to an internal IP', async () => {
    process.env.WEBHOOK_HOST_ALLOWLIST = 'hooks.partner.com';
    const r = await validateWebhookUrl('https://hooks.partner.com/x', {
      resolveHost: resolverFor({ 'hooks.partner.com': ['10.1.2.3'] }),
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('blocked range');
  });
});

describe('assertWebhookUrlAllowed', () => {
  it('throws WebhookSsrfError for a refused destination', async () => {
    await expect(
      assertWebhookUrlAllowed('https://svc.internal/hook', {
        resolveHost: resolverFor({ 'svc.internal': ['10.0.0.9'] }),
      }),
    ).rejects.toBeInstanceOf(WebhookSsrfError);
  });

  it('returns the validated addresses for an allowed destination', async () => {
    const addrs = await assertWebhookUrlAllowed('https://hooks.example.com/x', {
      resolveHost: resolverFor({ 'hooks.example.com': ['93.184.216.34'] }),
    });
    expect(addrs).toEqual(['93.184.216.34']);
  });
});
