/**
 * @szl-holdings/sdk — Official TypeScript SDK
 *
 * Wraps the SZL Holdings Public API v1. Handles authentication,
 * pagination, retry logic, and error normalization.
 *
 * Usage:
 *   import { SZLClient } from '@szl-holdings/sdk';
 *
 *   const client = new SZLClient({ apiKey: 'szl_...' });
 *   const portfolio = await client.portfolio.getSummary();
 *   const briefings = await client.briefings.list({ limit: 10 });
 */

export { SZLClient } from './client.js';
export * from './types.js';
export * from './errors.js';
export { ApiKeysResource } from './resources/api-keys.js';
export { PortfolioResource } from './resources/portfolio.js';
export { BriefingsResource } from './resources/briefings.js';
export { AlertsResource } from './resources/alerts.js';
export { WebhooksResource } from './resources/webhooks.js';
export { TreasuryResource } from './resources/treasury.js';
export { EsignatureResource } from './resources/esignature.js';
export { CourtFilingsResource } from './resources/court-filings.js';
export { PluginsResource } from './resources/plugins.js';
