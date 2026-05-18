import { ReceiptChain, type ReceiptStorage, type LambdaReceipt, type AuditClosureReceipt } from '@szl-holdings/szl-receipts';
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

import { HttpClient } from './http.js';
import { LambdaGate, type LambdaGateOptions } from './lambda-gate.js';
import { builtInDefaultProvider } from './default-policy-provider.js';
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

export interface SZLReceiptsConfig {
  enabled: boolean;
  operatorId: string;
  /** Optional path to a JSONL file. If omitted, receipts live in-memory only. */
  storagePath?: string;
  /**
   * Invoked when a receipt fails to append (e.g. disk full). Receipt errors
   * never block the SDK call path, but they are surfaced here so operators
   * can detect audit gaps. If omitted, errors are logged via `console.warn`.
   */
  onError?: (err: unknown, context: { path: string; method: string }) => void;
}

export interface SZLClientOptionsWithReceipts extends SZLClientOptions {
  receipts?: SZLReceiptsConfig;
  /**
   * Λ-gate that refuses destructive calls (webhooks.delete, apiKeys.revoke,
   * treasury.transfer, esignature.send) when the runtime invariant is below
   * threshold and the caller did not supply an `approvalToken`.
   */
  lambdaGate?: LambdaGateOptions | false;
}

class JsonlFileStorage implements ReceiptStorage {
  constructor(private readonly path: string) {
    mkdirSync(dirname(path), { recursive: true });
  }
  append(receipt: LambdaReceipt): void {
    appendFileSync(this.path, JSON.stringify(receipt) + '\n', 'utf8');
  }
  readAll(): LambdaReceipt[] {
    if (!existsSync(this.path)) return [];
    const text = readFileSync(this.path, 'utf8');
    return text
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l) as LambdaReceipt);
  }
}

/**
 * Public surface exposed via `client.receipts`. Methods are deliberately
 * thin pass-throughs to the underlying `ReceiptChain`.
 */
export interface ReceiptsHandle {
  readonly enabled: boolean;
  merkleRoot(): Promise<string>;
  readAll(): Promise<LambdaReceipt[]>;
  close(): Promise<AuditClosureReceipt>;
}

class DisabledReceipts implements ReceiptsHandle {
  readonly enabled = false;
  async merkleRoot(): Promise<string> {
    throw new Error('SZLClient: receipts are disabled. Pass { receipts: { enabled: true, operatorId } } to enable.');
  }
  async readAll(): Promise<LambdaReceipt[]> {
    return [];
  }
  async close(): Promise<AuditClosureReceipt> {
    throw new Error('SZLClient: receipts are disabled. Pass { receipts: { enabled: true, operatorId } } to enable.');
  }
}

class EnabledReceipts implements ReceiptsHandle {
  readonly enabled = true;
  constructor(public readonly chain: ReceiptChain) {}
  merkleRoot(): Promise<string> { return this.chain.merkleRoot(); }
  readAll(): Promise<LambdaReceipt[]> { return this.chain.readAll(); }
  close(): Promise<AuditClosureReceipt> { return this.chain.close(); }
}

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
 * // Opt into receipts:
 * const audited = new SZLClient({
 *   apiKey: process.env.SZL_API_KEY!,
 *   receipts: { enabled: true, operatorId: 'me@szlholdings.com' },
 * });
 * await audited.portfolio.getSummary();
 * const root = await audited.receipts.merkleRoot();
 * const closure = await audited.receipts.close();
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
  readonly receipts: ReceiptsHandle;
  readonly lambdaGate?: LambdaGate;

  constructor(options: SZLClientOptionsWithReceipts) {
    if (!options.apiKey) throw new Error('SZLClient requires an apiKey');
    if (!options.apiKey.startsWith('szl_')) {
      throw new Error('SZL API keys must start with "szl_". Generate one at https://szlholdings.com/developers');
    }

    this.http = new HttpClient(options);

    if (options.receipts?.enabled) {
      if (!options.receipts.operatorId) {
        throw new Error('SZLClient: receipts.operatorId is required when receipts.enabled is true');
      }
      const storage = options.receipts.storagePath
        ? new JsonlFileStorage(options.receipts.storagePath)
        : undefined;
      const chain = new ReceiptChain({
        operatorId: options.receipts.operatorId,
        ...(storage ? { storage } : {}),
      });
      this.receipts = new EnabledReceipts(chain);
      const onError =
        options.receipts.onError ??
        ((err: unknown, ctx: { path: string; method: string }) => {
          // Default: warn but don't break the call. Audit gap is observable.
          console.warn(`[szl-sdk] receipt append failed for ${ctx.method} ${ctx.path}:`, err);
        });
      // Wire the same chain into the HTTP transport so .stream<T>() can
      // append per-chunk receipts onto the same audit log as ordinary calls.
      this.http.setStreamChain(chain, options.receipts.operatorId);
      this.http.setObserver(async (record) => {
        try {
          await chain.append({
            endpoint: record.path,
            method: record.method,
            params: record.body ?? { method: record.method, path: record.path },
            result: record.result,
            metadata: {
              status: record.status,
              idempotencyKey: record.idempotencyKey,
              ...(record.gateDecision ? { gateDecision: record.gateDecision } : {}),
            },
          });
        } catch (err) {
          onError(err, { path: record.path, method: record.method });
        }
      });
    } else {
      this.receipts = new DisabledReceipts();
    }

    // Default-on governance: if the caller does not supply a gate, install a
    // conservative one whose invariant is 0. That refuses every destructive
    // call unless an explicit `approvalToken` is supplied, satisfying the
    // "refuse risky calls automatically unless approved" contract. Callers
    // can opt out with `lambdaGate: false` or replace the provider with a
    // real evaluator (e.g. one wired to @workspace/ouroboros-invariant).
    if (options.lambdaGate === false) {
      this.lambdaGate = undefined;
    } else if (options.lambdaGate) {
      this.lambdaGate = new LambdaGate(options.lambdaGate);
    } else {
      // Built-in provider routes admission through @szl-holdings/policy-engine
      // (block → invariant=0) and @workspace/ouroboros-invariant
      // (lutarInvariant against conservative default axes). Yields Λ=0 out of
      // the box so destructive calls refuse until either a real provider or
      // an approvalToken is supplied.
      this.lambdaGate = new LambdaGate({ threshold: 0.5, provider: builtInDefaultProvider() });
    }

    this.apiKeys = new ApiKeysResource(this.http, this.lambdaGate);
    this.portfolio = new PortfolioResource(this.http);
    this.briefings = new BriefingsResource(this.http);
    this.alerts = new AlertsResource(this.http);
    this.webhooks = new WebhooksResource(this.http, this.lambdaGate);
    this.treasury = new TreasuryResource(this.http, this.lambdaGate);
    this.esignature = new EsignatureResource(this.http, this.lambdaGate);
    this.courtFilings = new CourtFilingsResource(this.http);
    this.plugins = new PluginsResource(this.http);
  }

  /** Returns the OpenAPI spec URL for this client's base. */
  get openApiSpecUrl(): string {
    const base = (this.http as unknown as { baseUrl: string }).baseUrl;
    return `${base}/v1/openapi.json`;
  }
}
