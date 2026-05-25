import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../routes/helios/live-store', () => {
  const scanners = new Map<string, { id: string; enabled: boolean }>([
    ['scanner-cve', { id: 'scanner-cve', enabled: true }],
    ['scanner-vendor', { id: 'scanner-vendor', enabled: true }],
  ]);
  return {
    getScanner: (id: string) => scanners.get(id),
    ingestSignals: vi.fn((_id: string, sigs: unknown[]) => ({ added: sigs.length })),
    recordScannerError: vi.fn(),
  };
});
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { runNvdCveScanner, runVendorRssScanner, __test_internals } from '../helios-scanners';
import * as liveStore from '../../routes/helios/live-store';

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string) => Promise<Response> | Response): void {
  globalThis.fetch = ((url: string) => Promise.resolve(handler(url))) as typeof fetch;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('NVD CVE scanner', () => {
  it('ingests only AI/ML-relevant CVEs and shapes them as threat signals', async () => {
    const body = {
      vulnerabilities: [
        {
          cve: {
            id: 'CVE-2026-0001',
            published: '2026-05-25T00:00:00Z',
            descriptions: [{ lang: 'en', value: 'Prompt injection in a popular LLM serving framework allows arbitrary tool calls.' }],
            metrics: { cvssMetricV31: [{ cvssData: { baseScore: 8.8, baseSeverity: 'HIGH' } }] },
            references: [{ url: 'https://example.invalid/advisory-1' }],
          },
        },
        {
          cve: {
            id: 'CVE-2026-0002',
            published: '2026-05-25T00:00:00Z',
            descriptions: [{ lang: 'en', value: 'Buffer overflow in an unrelated VPN appliance.' }],
            metrics: { cvssMetricV31: [{ cvssData: { baseScore: 7.5, baseSeverity: 'HIGH' } }] },
          },
        },
      ],
    };
    mockFetch(() => new Response(JSON.stringify(body), { status: 200 }));
    const result = await runNvdCveScanner();
    expect(result.added).toBe(1);
    expect(liveStore.ingestSignals).toHaveBeenCalledTimes(1);
    const [scannerId, signals] = (liveStore.ingestSignals as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(scannerId).toBe('scanner-cve');
    expect(signals).toHaveLength(1);
    expect(signals[0].id).toBe('sig-cve-cve-2026-0001');
    expect(signals[0].kind).toBe('threat');
    expect(signals[0].title).toContain('CVE-2026-0001');
    expect(signals[0].sourceUrl).toBe('https://example.invalid/advisory-1');
    expect(signals[0].impactScore).toBeGreaterThan(0.55);
  });

  it('records an error and ingests nothing on HTTP failure', async () => {
    mockFetch(() => new Response('boom', { status: 503 }));
    const result = await runNvdCveScanner();
    expect(result.added).toBe(0);
    expect(liveStore.ingestSignals).not.toHaveBeenCalled();
    expect(liveStore.recordScannerError).toHaveBeenCalledWith('scanner-cve', expect.stringContaining('503'));
  });

  it('records an error when the response has no vulnerabilities at all', async () => {
    mockFetch(() => new Response(JSON.stringify({ vulnerabilities: [] }), { status: 200 }));
    const result = await runNvdCveScanner();
    expect(result.added).toBe(0);
    expect(liveStore.recordScannerError).toHaveBeenCalledWith('scanner-cve', expect.stringContaining('0 vulnerabilities'));
  });
});

describe('Vendor RSS scanner', () => {
  const sampleRss = `<?xml version="1.0"?><rss><channel>
    <item><title>New Claude release</title><link>https://anthropic.example/news/x</link><description><![CDATA[Announcement body.]]></description><pubDate>Sun, 25 May 2026 12:00:00 GMT</pubDate></item>
    <item><title>Another item</title><link>https://anthropic.example/news/y</link><description>Plain body</description><pubDate>Sat, 24 May 2026 12:00:00 GMT</pubDate></item>
  </channel></rss>`;

  it('parses RSS, emits vendor-kind signals, tolerates per-feed failure', async () => {
    let callCount = 0;
    mockFetch(() => {
      callCount += 1;
      if (callCount === 1) return new Response(sampleRss, { status: 200 });
      return new Response('nope', { status: 500 });
    });
    const result = await runVendorRssScanner();
    expect(result.added).toBeGreaterThan(0);
    expect(liveStore.ingestSignals).toHaveBeenCalledTimes(1);
    const [scannerId, signals] = (liveStore.ingestSignals as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(scannerId).toBe('scanner-vendor');
    expect(signals.length).toBe(2);
    expect(signals[0].kind).toBe('vendor');
    expect(signals[0].sourceName).toBeTruthy();
    expect(signals[0].sourceUrl).toContain('https://');
  });

  it('records error when every feed fails', async () => {
    mockFetch(() => new Response('down', { status: 502 }));
    const result = await runVendorRssScanner();
    expect(result.added).toBe(0);
    expect(liveStore.recordScannerError).toHaveBeenCalledWith('scanner-vendor', expect.stringContaining('502'));
  });
});

describe('parseRss helper', () => {
  it('extracts both CDATA and plain-text descriptions', () => {
    const items = __test_internals.parseRss(
      `<rss><channel>
        <item><title>A</title><link>https://a.example/</link><description><![CDATA[<p>Hi</p>]]></description><pubDate>2026-05-25T00:00:00Z</pubDate></item>
        <item><title>B</title><link>https://b.example/</link><description>Plain &amp; nice</description></item>
      </channel></rss>`,
    );
    expect(items).toHaveLength(2);
    expect(items[0].description).toBe('Hi');
    expect(items[1].description).toBe('Plain & nice');
  });
});
