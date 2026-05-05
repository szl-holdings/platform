import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HubSpotAdapter,
  HUBSPOT_STILL_MOCK,
  getHubspotFallbackCount,
  __resetHubspotFallbackCountForTests,
} from './hubspot.js';

const ORIGINAL_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const ORIGINAL_FETCH = globalThis.fetch;

function mockFetchOk(body: unknown) {
  globalThis.fetch = vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ) as unknown as typeof fetch;
}

function mockFetchFail(status: number) {
  globalThis.fetch = vi.fn(async () =>
    new Response('boom', { status }),
  ) as unknown as typeof fetch;
}

describe('HUBSPOT_STILL_MOCK sentinel', () => {
  it('is false now that listContacts/listDeals are wired to live API', () => {
    expect(HUBSPOT_STILL_MOCK).toBe(false);
  });
});

describe('HubSpotAdapter (offline / no token)', () => {
  beforeEach(() => {
    delete process.env.HUBSPOT_ACCESS_TOKEN;
  });
  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
    else process.env.HUBSPOT_ACCESS_TOKEN = ORIGINAL_TOKEN;
  });

  it('listContacts returns mock fixtures when isLive=false', async () => {
    const a = new HubSpotAdapter();
    const out = await a.listContacts();
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe('hs_001');
    expect(out[0].email).toBe('john.smith@acme.com');
  });

  it('listDeals returns mock fixtures when isLive=false', async () => {
    const a = new HubSpotAdapter();
    const out = await a.listDeals();
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe('deal_001');
    expect(out[0].amount).toBe(75000);
  });
});

describe('HubSpotAdapter (live mapping)', () => {
  beforeEach(() => {
    process.env.HUBSPOT_ACCESS_TOKEN = 'fake-token-for-test';
  });
  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
    else process.env.HUBSPOT_ACCESS_TOKEN = ORIGINAL_TOKEN;
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it('listContacts maps HubSpot v3 response into typed shape', async () => {
    mockFetchOk({
      results: [
        {
          id: '101',
          properties: {
            email: 'a@b.com',
            firstname: 'Ada',
            lastname: 'Lovelace',
            company: 'Analytical Engines',
            lifecyclestage: 'customer',
            lastmodifieddate: '2026-04-01T00:00:00Z',
          },
        },
        { id: '102', properties: {} },
      ],
    });
    const out = await new HubSpotAdapter().listContacts();
    expect(out).toEqual([
      {
        id: '101',
        email: 'a@b.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        company: 'Analytical Engines',
        lifecycleStage: 'customer',
        lastActivity: '2026-04-01T00:00:00Z',
      },
      {
        id: '102',
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        lifecycleStage: 'unknown',
        lastActivity: '',
      },
    ]);
  });

  it('listContacts hits the documented v3 endpoint with auth header', async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    await new HubSpotAdapter().listContacts();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://api.hubapi.com/crm/v3/objects/contacts');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer fake-token-for-test',
    );
  });

  it('listDeals maps deals + first associated contact', async () => {
    mockFetchOk({
      results: [
        {
          id: '900',
          properties: {
            dealname: 'Big Deal',
            dealstage: 'closedwon',
            amount: '12345.67',
            closedate: '2026-06-30',
          },
          associations: { contacts: { results: [{ id: 'c-1' }, { id: 'c-2' }] } },
        },
      ],
    });
    const out = await new HubSpotAdapter().listDeals();
    expect(out).toEqual([
      {
        id: '900',
        name: 'Big Deal',
        stage: 'closedwon',
        amount: 12345.67,
        closeDate: '2026-06-30',
        contactId: 'c-1',
      },
    ]);
  });

  it('listDeals tolerates missing properties and missing associations', async () => {
    mockFetchOk({ results: [{ id: '901', properties: {} }] });
    const out = await new HubSpotAdapter().listDeals();
    expect(out[0]).toEqual({
      id: '901',
      name: '',
      stage: 'unknown',
      amount: 0,
      closeDate: '',
      contactId: '',
    });
  });
});

describe('HubSpotAdapter (fallback on API failure)', () => {
  beforeEach(() => {
    process.env.HUBSPOT_ACCESS_TOKEN = 'fake-token-for-test';
    __resetHubspotFallbackCountForTests();
  });
  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) delete process.env.HUBSPOT_ACCESS_TOKEN;
    else process.env.HUBSPOT_ACCESS_TOKEN = ORIGINAL_TOKEN;
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it('listContacts falls back to mock fixtures, logs error, and bumps fallback counter on 5xx', async () => {
    mockFetchFail(503);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = getHubspotFallbackCount();
    const out = await new HubSpotAdapter().listContacts();
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe('hs_001');
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(errSpy.mock.calls[0][0]).toMatch(/listContacts.*falling back to mock/);
    expect(getHubspotFallbackCount()).toBe(before + 1);
  });

  it('listContacts re-throws on 401 auth failure (no silent mock fallback, no counter bump)', async () => {
    mockFetchFail(401);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = getHubspotFallbackCount();
    await expect(new HubSpotAdapter().listContacts()).rejects.toMatchObject({
      isAuthError: true,
      status: 401,
    });
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(errSpy.mock.calls[0][0]).toMatch(/AUTH FAILURE/);
    expect(getHubspotFallbackCount()).toBe(before);
  });

  it('listDeals re-throws on 403 auth failure (no silent mock fallback, no counter bump)', async () => {
    mockFetchFail(403);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = getHubspotFallbackCount();
    await expect(new HubSpotAdapter().listDeals()).rejects.toMatchObject({
      isAuthError: true,
      status: 403,
    });
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(errSpy.mock.calls[0][0]).toMatch(/AUTH FAILURE/);
    expect(getHubspotFallbackCount()).toBe(before);
  });

  it('listDeals falls back, logs, and bumps counter on network error', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('ECONNRESET');
    }) as unknown as typeof fetch;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = getHubspotFallbackCount();
    const out = await new HubSpotAdapter().listDeals();
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe('deal_001');
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(errSpy.mock.calls[0][0]).toMatch(/listDeals.*ECONNRESET/);
    expect(getHubspotFallbackCount()).toBe(before + 1);
  });
});
