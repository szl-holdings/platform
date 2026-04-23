/**
 * ConnectorRunner — invokes a connector with retry, dead-letter, and
 * observability hooks. The hooks are injected so the runner stays free of
 * any database / express / drizzle imports and can be unit tested in pure
 * memory.
 */

import { z } from 'zod';
import { captureFields, detectDrift, type DriftBaseline, type DriftThresholds } from './drift';
import type {
  Connector,
  ConnectorContext,
  OntologyWrite,
  SyncResult,
  SyncStatus,
} from './types';

export interface RunnerHooks {
  /** Persist an audit event. Returns the new event id. */
  appendAudit: (event: {
    connectorId: string;
    status: SyncStatus;
    summary: Record<string, unknown>;
  }) => Promise<string>;
  /** Register a single entity in the ontology. */
  registerEntity: (write: OntologyWrite) => Promise<void>;
  /** Load the drift baseline for this connector, if any. */
  loadBaseline: (connectorId: string) => Promise<DriftBaseline | null>;
  /** Persist a new drift baseline. */
  saveBaseline: (baseline: DriftBaseline) => Promise<void>;
  /** Page the operator runtime — called when shouldEscalate() is true. */
  escalate: (result: SyncResult) => Promise<void>;
}

export interface RunOptions {
  thresholds?: DriftThresholds;
  lastSyncAt?: string | null;
  /** Force-skip the actual fetch (used when the connector is paused). */
  dryRun?: boolean;
}

const SLEEP_BACKOFF_MS = [200, 800, 2400];

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new Error('aborted'));
      });
    }
  });
}

export class ConnectorRunner {
  constructor(private readonly hooks: RunnerHooks) {}

  async run<TRecord>(
    connector: Connector<TRecord>,
    options: RunOptions = {},
  ): Promise<SyncResult> {
    const startedAt = new Date();
    const startedAtIso = startedAt.toISOString();

    if (options.dryRun) {
      const finishedAt = new Date();
      const result: SyncResult = {
        connectorId: connector.id,
        status: 'skipped',
        startedAt: startedAtIso,
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        attempts: 0,
        recordsFetched: 0,
        recordsTransformed: 0,
        recordsRejected: 0,
        entitiesRegistered: 0,
        ledgerEventId: null,
        drift: null,
        errorMessage: null,
      };
      result.ledgerEventId = await this.hooks.appendAudit({
        connectorId: connector.id,
        status: 'skipped',
        summary: { reason: 'dryRun' },
      });
      return result;
    }

    const maxRetries = connector.schedule.maxRetries ?? 3;
    const timeoutMs = connector.schedule.timeoutMs ?? 15_000;
    let attempts = 0;
    let lastError: unknown = null;
    let records: TRecord[] = [];

    while (attempts <= maxRetries) {
      attempts += 1;
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), timeoutMs);
      const ctx: ConnectorContext = {
        signal: ac.signal,
        attempt: attempts,
        lastSyncAt: options.lastSyncAt ?? null,
      };
      try {
        records = await connector.fetch(ctx);
        clearTimeout(t);
        lastError = null;
        break;
      } catch (err) {
        clearTimeout(t);
        lastError = err;
        if (attempts > maxRetries) break;
        const idx = Math.min(attempts - 1, SLEEP_BACKOFF_MS.length - 1);
        const backoffMs = SLEEP_BACKOFF_MS[idx] ?? 2400;
        try {
          await sleep(backoffMs);
        } catch {
          break;
        }
      }
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const errorMessage = lastError instanceof Error ? lastError.message : lastError ? String(lastError) : null;

    if (lastError) {
      const result: SyncResult = {
        connectorId: connector.id,
        status: 'dead-letter',
        startedAt: startedAtIso,
        finishedAt: finishedAt.toISOString(),
        durationMs,
        attempts,
        recordsFetched: 0,
        recordsTransformed: 0,
        recordsRejected: 0,
        entitiesRegistered: 0,
        ledgerEventId: null,
        drift: null,
        errorMessage,
      };
      result.ledgerEventId = await this.hooks.appendAudit({
        connectorId: connector.id,
        status: 'dead-letter',
        summary: { attempts, errorMessage },
      });
      await this.hooks.escalate(result);
      return result;
    }

    // Validate every record against the connector's schema.
    let rejected = 0;
    const validRecords: TRecord[] = [];
    for (const r of records) {
      const parsed = (connector.recordSchema as z.ZodType<TRecord>).safeParse(r);
      if (parsed.success) validRecords.push(parsed.data);
      else rejected += 1;
    }

    // Drift detection — uses the *raw* field shape, not the parsed shape, so
    // upstream additions are surfaced even if the schema rejects them.
    const baseline = await this.hooks.loadBaseline(connector.id);
    const drift = detectDrift(connector.id, records as unknown[], baseline);
    if (!baseline && validRecords.length > 0) {
      await this.hooks.saveBaseline({
        connectorId: connector.id,
        recordCount: records.length,
        fieldNames: captureFields(records as unknown[]),
        capturedAt: startedAtIso,
      });
    }

    // Transform + register.
    let registered = 0;
    for (const r of validRecords) {
      try {
        const write = connector.transform(r);
        await this.hooks.registerEntity(write);
        registered += 1;
      } catch {
        rejected += 1;
      }
    }

    const status: SyncStatus = attempts > 1 ? 'retried' : 'ok';
    const result: SyncResult = {
      connectorId: connector.id,
      status,
      startedAt: startedAtIso,
      finishedAt: finishedAt.toISOString(),
      durationMs,
      attempts,
      recordsFetched: records.length,
      recordsTransformed: validRecords.length,
      recordsRejected: rejected,
      entitiesRegistered: registered,
      ledgerEventId: null,
      drift,
      errorMessage: null,
    };
    result.ledgerEventId = await this.hooks.appendAudit({
      connectorId: connector.id,
      status,
      summary: {
        attempts,
        recordsFetched: records.length,
        recordsTransformed: validRecords.length,
        recordsRejected: rejected,
        entitiesRegistered: registered,
        driftSeverity: drift.severity,
      },
    });
    if (drift.severity === 'critical' || drift.severity === 'warn') {
      await this.hooks.escalate(result);
    }
    return result;
  }
}
