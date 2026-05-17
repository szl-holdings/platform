import { ReceiptChain, type AuditClosureReceipt, type LambdaReceipt } from '@szl-holdings/szl-receipts';

import type { SZLClientOptions } from '../types.js';
import type { ApiKey, CreatedApiKey, PaginatedResponse, TreasuryAccount, TreasuryBalance, TreasurySummary, WebhookEndpoint, EsignatureRequest, CourtFiling, Plugin } from '../types.js';
import type { PortfolioResource, PortfolioSummary } from '../resources/portfolio.js';
import type { BriefingsResource, Briefing } from '../resources/briefings.js';
import type { AlertsResource, Alert } from '../resources/alerts.js';
import type { ApiKeysResource } from '../resources/api-keys.js';
import type { WebhooksResource } from '../resources/webhooks.js';
import type { TreasuryResource } from '../resources/treasury.js';
import type { EsignatureResource } from '../resources/esignature.js';
import type { CourtFilingsResource } from '../resources/court-filings.js';
import type { PluginsResource } from '../resources/plugins.js';
import type { ReceiptsHandle } from '../client.js';

/**
 * Canned response map. Each entry is `(args) => responseBody`. Callers supply
 * only what their test needs — every method has a sensible default that lets
 * a flow run end-to-end so tests can focus on asserting receipts.
 *
 * Keys mirror the public method paths exposed by `SZLClient`, e.g.
 * `'portfolio.getSummary'` or `'briefings.list'`.
 */
export type SZLMockResponses = {
  [methodPath: string]: (...args: unknown[]) => unknown;
};

export interface SZLMockClientOptions extends Partial<SZLClientOptions> {
  /** Operator identity recorded in every emitted receipt. */
  operatorId?: string;
  /** Per-method canned responses. Omitted methods fall back to defaults. */
  responses?: SZLMockResponses;
}

class MockEnabledReceipts implements ReceiptsHandle {
  readonly enabled = true;
  constructor(public readonly chain: ReceiptChain) {}
  merkleRoot(): Promise<string> { return this.chain.merkleRoot(); }
  readAll(): Promise<LambdaReceipt[]> { return this.chain.readAll(); }
  close(): Promise<AuditClosureReceipt> { return this.chain.close(); }
}

function emptyPage<T>(): PaginatedResponse<T> {
  return { data: [], pagination: { page: 1, limit: 0, offset: 0, hasMore: false } };
}

const NOW = '1970-01-01T00:00:00.000Z';

const DEFAULTS: SZLMockResponses = {
  'apiKeys.create': () => ({
    id: 1, name: 'mock', prefix: 'szl_mock', scopes: [], isActive: true,
    lastUsedAt: null, expiresAt: null, createdAt: NOW,
    key: 'szl_mock_full_key', warning: 'mock',
  } satisfies CreatedApiKey),
  'apiKeys.list': () => [] as ApiKey[],
  'apiKeys.revoke': () => undefined,
  'apiKeys.rotate': () => ({
    id: 1, name: 'mock', prefix: 'szl_mock', scopes: [], isActive: true,
    lastUsedAt: null, expiresAt: null, createdAt: NOW,
    key: 'szl_mock_full_key', warning: 'mock',
  } satisfies CreatedApiKey),
  'portfolio.getSummary': () => ({ summary: 'mock', note: 'mock', version: '0' } satisfies PortfolioSummary),
  'briefings.list': () => emptyPage<Briefing>(),
  'briefings.get': (id: unknown) => ({ id: id as string | number, title: 'mock', summary: 'mock', createdAt: NOW } satisfies Briefing),
  'alerts.list': () => emptyPage<Alert>(),
  'webhooks.list': () => [] as WebhookEndpoint[],
  'webhooks.create': () => ({
    id: 'wh_mock', url: 'https://mock', eventTypes: '*' as const,
    active: true, createdAt: 0, failureCount: 0,
  } satisfies WebhookEndpoint),
  'webhooks.get': (id: unknown) => ({
    id: String(id), url: 'https://mock', eventTypes: '*' as const,
    active: true, createdAt: 0, failureCount: 0,
  } satisfies WebhookEndpoint),
  'webhooks.update': (id: unknown) => ({
    id: String(id), url: 'https://mock', eventTypes: '*' as const,
    active: true, createdAt: 0, failureCount: 0,
  } satisfies WebhookEndpoint),
  'webhooks.delete': () => undefined,
  'webhooks.ping': () => ({ delivered: true, statusCode: 200 }),
  'webhooks.listDeliveries': () => emptyPage(),
  'webhooks.listEventTypes': () => ({ eventTypes: [] as string[] }),
  'treasury.addAccount': () => ({
    id: 1, orgId: 1, provider: 'mock', label: 'mock', currency: 'USD',
    currencyType: 'fiat' as const, createdAt: NOW,
  } satisfies TreasuryAccount),
  'treasury.listAccounts': () => [] as TreasuryAccount[],
  'treasury.getBalances': () => ({ accounts: [] as TreasuryBalance[], totalUsd: '0', lastRefreshed: NOW }),
  'treasury.refreshBalances': () => ({ refreshed: true, snapshotsCreated: 0, refreshedAt: NOW }),
  'treasury.getSummary': () => ({
    fiat: { totalUsd: '0', accounts: 0 },
    stablecoin: { totalUsd: '0', accounts: 0 },
    combined: { totalUsd: '0' },
    lastRefreshed: NOW,
  } satisfies TreasurySummary),
  'treasury.listTransactions': () => emptyPage(),
  'esignature.send': () => ({
    id: 1, orgId: 1, provider: 'mock', documentTitle: 'mock',
    status: 'sent', signatories: [], createdAt: NOW,
  } satisfies EsignatureRequest),
  'esignature.list': () => [] as EsignatureRequest[],
  'esignature.get': (id: unknown) => ({
    id: id as number, orgId: 1, provider: 'mock', documentTitle: 'mock',
    status: 'sent', signatories: [], createdAt: NOW, events: [] as unknown[],
  }),
  'esignature.void': () => undefined,
  'courtFilings.prepare': () => ({
    id: 1, orgId: 1, filingType: 'mock', jurisdiction: 'mock',
    documentTitle: 'mock', status: 'draft', electronicFilingSystem: 'mock',
    electronicallySupportedJurisdiction: false, createdAt: NOW,
  } satisfies CourtFiling),
  'courtFilings.list': () => emptyPage<CourtFiling>(),
  'courtFilings.get': (id: unknown) => ({
    id: id as number, orgId: 1, filingType: 'mock', jurisdiction: 'mock',
    documentTitle: 'mock', status: 'draft', electronicFilingSystem: 'mock',
    electronicallySupportedJurisdiction: false, createdAt: NOW,
    timeline: [] as unknown[],
  }),
  'courtFilings.submit': (id: unknown) => ({
    id: id as number, orgId: 1, filingType: 'mock', jurisdiction: 'mock',
    documentTitle: 'mock', status: 'submitted', electronicFilingSystem: 'mock',
    electronicallySupportedJurisdiction: false, createdAt: NOW,
  } satisfies CourtFiling),
  'courtFilings.listJurisdictions': () => ({ jurisdictions: [] as unknown[] }),
  'plugins.list': () => [] as Plugin[],
  'plugins.get': (id: unknown) => ({
    id: id as number, slug: 'mock', name: 'mock', version: '0', category: 'mock',
    capabilities: [], governanceInherited: false, proofChainEnabled: false,
    isPublished: false, createdAt: NOW, installationCount: 0,
  }),
  'plugins.install': () => ({ installed: true }),
  'plugins.listInstallations': () => [] as unknown[],
  'plugins.getCapabilities': () => ({ capabilities: [] as unknown[], contract: null }),
};

/**
 * Resource proxy: every method call hits the canned response map and emits
 * an `R1` (request) `LambdaReceipt` on the shared chain. Endpoints are
 * recorded as `MOCK <namespace>.<method>` so test assertions like "expect 5
 * R1 receipts in this flow" can filter by `r.method === 'MOCK'`.
 */
class MockResource {
  constructor(
    private readonly namespace: string,
    private readonly responses: SZLMockResponses,
    private readonly chain: ReceiptChain,
    private readonly tenantId: string,
  ) {
    return new Proxy(this, {
      get: (target, prop: string) => {
        if (prop in target || typeof prop !== 'string') {
          return (target as unknown as Record<string, unknown>)[prop];
        }
        return async (...args: unknown[]) => target.invoke(prop, args);
      },
    });
  }

  private async invoke(method: string, args: unknown[]): Promise<unknown> {
    const key = `${this.namespace}.${method}`;
    const handler = this.responses[key] ?? DEFAULTS[key];
    if (!handler) {
      throw new Error(`SZLMockClient: no canned response for "${key}". Pass it via { responses: { '${key}': () => ... } }.`);
    }
    const result = await handler(...args);
    await this.chain.append({
      endpoint: key,
      method: 'MOCK',
      params: args.length === 1 ? args[0] : args,
      result,
      metadata: { tenantId: this.tenantId, mock: true },
    });
    return result;
  }
}

/**
 * SZLMockClient — drop-in test double for {@link SZLClient}.
 *
 * Exposes the same public surface (`apiKeys`, `portfolio`, `briefings`,
 * `alerts`, `webhooks`, `treasury`, `esignature`, `courtFilings`,
 * `plugins`, `receipts`) but never touches the network. Every method call
 * appends a `LambdaReceipt` to the same {@link ReceiptChain} the real
 * client uses, so tests can assert on the receipt chain — e.g. "exactly
 * 5 receipts of type MOCK in this flow" — to verify governance behavior.
 *
 * @example
 * ```ts
 * const client = new SZLMockClient({
 *   responses: {
 *     'portfolio.getSummary': () => ({ summary: 'ok', note: '', version: '1' }),
 *   },
 * });
 * await client.portfolio.getSummary();
 * const all = await client.receipts.readAll();
 * expect(all).toHaveLength(1);
 * expect(all[0].endpoint).toBe('portfolio.getSummary');
 * ```
 */
export class SZLMockClient {
  readonly apiKeys: ApiKeysResource;
  readonly portfolio: PortfolioResource;
  readonly briefings: BriefingsResource;
  readonly alerts: AlertsResource;
  readonly webhooks: WebhooksResource;
  readonly treasury: TreasuryResource;
  readonly esignature: EsignatureResource;
  readonly courtFilings: CourtFilingsResource;
  readonly plugins: PluginsResource;
  readonly receipts: ReceiptsHandle;
  /** Direct access to the underlying chain for advanced assertions. */
  readonly chain: ReceiptChain;

  constructor(options: SZLMockClientOptions = {}) {
    this.chain = new ReceiptChain({ operatorId: options.operatorId ?? 'mock@szl' });
    this.receipts = new MockEnabledReceipts(this.chain);
    const responses = options.responses ?? {};
    const tenantId = 'mock';
    const make = <T>(ns: string): T =>
      new MockResource(ns, responses, this.chain, tenantId) as unknown as T;
    this.apiKeys = make<ApiKeysResource>('apiKeys');
    this.portfolio = make<PortfolioResource>('portfolio');
    this.briefings = make<BriefingsResource>('briefings');
    this.alerts = make<AlertsResource>('alerts');
    this.webhooks = make<WebhooksResource>('webhooks');
    this.treasury = make<TreasuryResource>('treasury');
    this.esignature = make<EsignatureResource>('esignature');
    this.courtFilings = make<CourtFilingsResource>('courtFilings');
    this.plugins = make<PluginsResource>('plugins');
  }

  /** Mirrors {@link SZLClient.openApiSpecUrl}. Returns a deterministic mock URL. */
  get openApiSpecUrl(): string {
    return 'https://mock.szlholdings.local/api/v1/openapi.json';
  }
}
