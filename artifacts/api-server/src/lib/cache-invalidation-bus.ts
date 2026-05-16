/**
 * Cross-process cache invalidation bus.
 *
 * The API server runs as multiple worker processes (and, in some
 * deployments, multiple containers) — each worker keeps its own in-memory
 * TTL cache for feature flags and runtime config. When an operator toggles
 * a flag or updates a config value, the route handler that served the
 * write only invalidates *its own* worker's cache. Other workers would
 * otherwise serve stale values until their TTL expires (30s for flags,
 * 60s for runtime config), which can be unacceptable for kill-switches
 * and rate-limit changes.
 *
 * This bus piggy-backs on Postgres LISTEN/NOTIFY (the database is already
 * the source of truth — no extra infrastructure required):
 *
 *   - Every worker calls `startCacheInvalidationBus()` at boot. That opens
 *     a *dedicated* pg connection (LISTEN locks the connection for the
 *     lifetime of the subscription, so we cannot share it with the main
 *     pool) and subscribes to a single channel.
 *   - When a write route invalidates its local cache it also calls
 *     `publishCacheInvalidation(...)`, which fires a `pg_notify(...)`.
 *   - All workers — including the publisher — receive the notification
 *     and dispatch it to local handlers registered via
 *     `onCacheInvalidation(...)`. Self-delivery is harmless: clearing an
 *     already-clear key is a no-op.
 *
 * The bus degrades gracefully:
 *   - If `startCacheInvalidationBus()` cannot connect (e.g. DB is down at
 *     boot) it retries with exponential backoff and logs a warning. Local
 *     invalidation continues to work; cross-worker propagation falls back
 *     to the existing TTL.
 *   - If `publishCacheInvalidation(...)` fails (broken pipe, etc.) it
 *     logs and resolves; the local invalidation that was already done by
 *     the caller still applies, and the TTL safety net catches the rest.
 *   - Reconnection is automatic on `error` / `end` events.
 */

import { EventEmitter } from 'node:events';
import { logger } from './logger';

export type InvalidationEvent =
  | { scope: 'flag'; key: string }
  | { scope: 'config'; key: string }
  | { scope: 'config-all' };

const CHANNEL = 'szl_cache_invalidate';
const MAX_BACKOFF_MS = 30_000;

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

interface BusState {
  started: boolean;
  stopping: boolean;
  client: PgLikeClient | null;
  reconnectTimer: NodeJS.Timeout | null;
  attempt: number;
}

const state: BusState = {
  started: false,
  stopping: false,
  client: null,
  reconnectTimer: null,
  attempt: 0,
};

interface PgLikeClient {
  connect(): Promise<void>;
  end(): Promise<void>;
  query(sql: string, params?: unknown[]): Promise<unknown>;
  on(event: 'notification', cb: (msg: { channel: string; payload?: string }) => void): void;
  on(event: 'error' | 'end', cb: (err?: Error) => void): void;
  removeAllListeners(): void;
}

/**
 * Register a handler invoked for every cross-process invalidation event
 * received on this worker. Returns an unsubscribe function.
 *
 * Handlers MUST NOT republish (would create an infinite loop). They
 * should only mutate local state (e.g. clear an in-memory cache entry).
 */
export function onCacheInvalidation(handler: (event: InvalidationEvent) => void): () => void {
  emitter.on('event', handler);
  return () => emitter.off('event', handler);
}

/**
 * Publish an invalidation event to all workers (including this one).
 *
 * Fire-and-forget by default — the caller has already invalidated its
 * own local cache; this call is purely about notifying *other* workers.
 * Returns a promise so tests / callers that want to await the
 * round-trip can do so, but callers in production code SHOULD NOT block
 * on this: they should call it without `await`.
 */
export async function publishCacheInvalidation(event: InvalidationEvent): Promise<void> {
  if (!state.client) {
    // Bus not connected — local invalidation already happened in the
    // caller, and the TTL on other workers will catch up. Surface a
    // single debug-level breadcrumb for ops.
    logger.debug({ event }, '[cache-bus] publish skipped — bus not connected');
    return;
  }
  try {
    await state.client.query('SELECT pg_notify($1, $2)', [CHANNEL, JSON.stringify(event)]);
  } catch (err) {
    logger.warn({ err, event }, '[cache-bus] pg_notify failed — relying on TTL fallback');
  }
}

/**
 * Test-only hook used by integration tests to swap in an in-memory client
 * so two simulated workers can exchange notifications without a live DB.
 *
 * The injected client must implement the {@link PgLikeClient} surface
 * used here (notification + error events, query, connect, end). Calling
 * this with `null` resets the bus to its uninitialised state.
 */
export function __setClientForTests(client: PgLikeClient | null): void {
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
  state.client = client;
  state.started = !!client;
  state.stopping = false;
  state.attempt = 0;
}

/**
 * Idempotently start the bus. Safe to call multiple times — subsequent
 * calls return immediately. `databaseUrl` defaults to the standard
 * `DATABASE_URL` env var.
 */
export async function startCacheInvalidationBus(databaseUrl?: string): Promise<void> {
  if (state.started) return;
  state.started = true;
  state.stopping = false;
  await connect(databaseUrl);
}

/**
 * Stop the bus and release the dedicated pg connection. Used by tests
 * and graceful shutdown paths.
 */
export async function stopCacheInvalidationBus(): Promise<void> {
  state.stopping = true;
  state.started = false;
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
  const c = state.client;
  state.client = null;
  if (c) {
    try {
      c.removeAllListeners();
      await c.end();
    } catch {
      // ignore
    }
  }
  emitter.removeAllListeners('event');
}

async function connect(databaseUrl?: string): Promise<void> {
  if (state.stopping) return;
  try {
    // Lazy-import to avoid pulling pg into test environments that mock
    // the bus wholesale.
    const { PgClient } = (await import('@szl-holdings/db')) as unknown as {
      PgClient: new (opts: { connectionString: string | undefined }) => PgLikeClient;
    };
    const client = new PgClient({ connectionString: databaseUrl ?? process.env.DATABASE_URL });
    await client.connect();
    client.on('notification', (msg) => {
      if (msg.channel !== CHANNEL || !msg.payload) return;
      try {
        const event = JSON.parse(msg.payload) as InvalidationEvent;
        emitter.emit('event', event);
      } catch (err) {
        logger.warn({ err, payload: msg.payload }, '[cache-bus] malformed notification payload');
      }
    });
    client.on('error', (err) => {
      logger.warn({ err }, '[cache-bus] dedicated client error — reconnecting');
      void reconnect(databaseUrl);
    });
    client.on('end', () => {
      if (!state.stopping) {
        logger.warn('[cache-bus] dedicated client closed — reconnecting');
        void reconnect(databaseUrl);
      }
    });
    await client.query(`LISTEN ${CHANNEL}`);
    state.client = client;
    state.attempt = 0;
    logger.info(
      { channel: CHANNEL },
      '[cache-bus] connected — listening for cross-process cache invalidations',
    );
  } catch (err) {
    const backoff = Math.min(MAX_BACKOFF_MS, 500 * 2 ** state.attempt);
    state.attempt += 1;
    logger.warn(
      { err, backoff, attempt: state.attempt },
      '[cache-bus] connect failed — will retry; meanwhile cross-process invalidation falls back to TTL',
    );
    state.reconnectTimer = setTimeout(() => void connect(databaseUrl), backoff);
  }
}

async function reconnect(databaseUrl?: string): Promise<void> {
  if (state.stopping) return;
  const c = state.client;
  state.client = null;
  if (c) {
    try {
      c.removeAllListeners();
      await c.end();
    } catch {
      // ignore
    }
  }
  await connect(databaseUrl);
}
