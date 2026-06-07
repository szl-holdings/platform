import { HttpClient } from './http.js';
import type { SZLClientOptions } from './types.js';
import { ApiKeysResource } from './resources/api-keys.js';
import { PortfolioResource } from './resources/portfolio.js';
import { BriefingsResource } from './resources/briefings.js';
import { AlertsResource } from './resources/alerts.js';
import { WebhooksResource } from './resources/webhooks.js';
import { TreasuryResource } from './resources/treasury.js';
import { EsignatureResource } from './resources/esignature.js';
import { CourtFilingsResource } from './resources/court-filings.js';
import { PluginsResource } from './resources/plugins.js';

/**
 * SZLClient — Main entry point for the SZL Holdings SDK.
 *
 * @example
 * ```typescript
 * import { SZLClient } from '@szl-holdings/sdk';
 *
 * const client = new SZLClient({ apiKey: process.env.SZL_API_KEY! });
 *
 * // Get portfolio summary
 * const portfolio = await client.portfolio.getSummary();
 *
 * // List briefings
 * const briefings = await client.briefings.list({ limit: 5 });
 *
 * // Subscribe to webhooks
 * const endpoint = await client.webhooks.create({
 *   url: 'https://myapp.com/webhooks/szl',
 *   eventTypes: ['alert.raised', 'deal.created'],
 * });
 * ```
 */
export class SZLClient {
  private readonly http: HttpClient;

  readonly apiKeys: ApiKeysResource;
  readonly portfolio: PortfolioResource;
  readonly briefings: BriefingsResource;
  readonly alerts: AlertsResource;
  readonly webhooks: WebhooksResource;
  readonly treasury: TreasuryResource;
  readonly esignature: EsignatureResource;
  readonly courtFilings: CourtFilingsResource;
  readonly plugins: PluginsResource;

  constructor(options: SZLClientOptions) {
    if (!options.apiKey) throw new Error('SZLClient requires an apiKey');
    if (!options.apiKey.startsWith('szl_')) {
      throw new Error('SZL API keys must start with "szl_". Generate one at https://szlholdings.com/developers');
    }

    this.http = new HttpClient(options);

    this.apiKeys = new ApiKeysResource(this.http);
    this.portfolio = new PortfolioResource(this.http);
    this.briefings = new BriefingsResource(this.http);
    this.alerts = new AlertsResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.treasury = new TreasuryResource(this.http);
    this.esignature = new EsignatureResource(this.http);
    this.courtFilings = new CourtFilingsResource(this.http);
    this.plugins = new PluginsResource(this.http);
  }

  /** Returns the OpenAPI spec URL for this client's base. */
  get openApiSpecUrl(): string {
    const base = (this.http as unknown as { baseUrl: string }).baseUrl;
    return `${base}/v1/openapi.json`;
  }
}
