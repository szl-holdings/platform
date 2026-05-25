/**
 * Runtime Configuration — operator-tunable parameters backed by Postgres.
 *
 * Usage:
 *   const maxRequests = await getConfig('rate_limit_global_max', 200);
 *   const label      = await getConfig('site_banner_text', '');
 *
 * Values are stored as text in `runtime_config` and cast to the appropriate
 * type based on `value_type`. Reads resolve from an in-memory TTL cache so
 * hot paths stay < 1 ms. Admin writes call `invalidateConfigCache(key)` to
 * bust the relevant entry immediately.
 */

import { db, runtimeConfigTable, type RuntimeConfig } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { onCacheInvalidation, publishCacheInvalidation } from './cache-invalidation-bus';
import { logger } from './logger';
import { dispatchExternalAlert } from './notification-dispatch';

/**
 * Per-key dedup window for corruption alerts. A hot path that reads a bad
 * config row hundreds of times per second should not flood the ops channel —
 * we only re-page when the raw value changes or the window expires.
 */
const CORRUPTION_ALERT_DEDUP_MS = 15 * 60 * 1000;
const corruptionAlertState = new Map<string, { raw: string; firedAt: number }>();

function alertCorruptedConfig(key: string, valueType: string, raw: string): void {
  const now = Date.now();
  const prev = corruptionAlertState.get(key);
  if (prev && prev.raw === raw && now - prev.firedAt < CORRUPTION_ALERT_DEDUP_MS) {
    return;
  }
  corruptionAlertState.set(key, { raw, firedAt: now });

  void dispatchExternalAlert({
    appName: 'Runtime Config',
    title: `Corrupted runtime config: ${key}`,
    message:
      `Runtime config row "${key}" (value_type=${valueType}) has a malformed value ` +
      `that cannot be cast. Raw value: ${JSON.stringify(raw)}. ` +
      `The default is being used until the row is fixed.`,
    severity: 'warning',
    actionUrl: '/command/operations/runtime-config',
  }).catch((err) => {
    logger.warn({ err, key }, '[runtime-config] Failed to dispatch corruption alert');
  });
}

/** Test helper: clear the dedup state so each test starts fresh. */
export function __resetCorruptionAlertDedupForTests(): void {
  corruptionAlertState.clear();
}

const DEFAULT_CACHE_TTL_MS = 60_000;

/**
 * Live-tunable cache TTL. Initialised to the code default; updated from the
 * `config_cache_ttl_ms` DB row during boot and whenever that key is
 * invalidated so operators can change the TTL without a restart.
 */
let cacheTtlMs = DEFAULT_CACHE_TTL_MS;

/**
 * Read `config_cache_ttl_ms` directly from the DB (bypasses the cache to
 * avoid a chicken-and-egg situation) and update the module-level TTL.
 */
async function refreshCacheTtl(): Promise<void> {
  try {
    const [row] = await db
      .select()
      .from(runtimeConfigTable)
      .where(eq(runtimeConfigTable.key, 'config_cache_ttl_ms'))
      .limit(1);
    if (row) {
      const parsed = parseInt(row.value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        cacheTtlMs = parsed;
      }
    }
  } catch {
    // Non-fatal — keep current TTL
  }
}

interface CacheEntry {
  value: RuntimeConfig | null;
  expiresAt: number;
}

const configCache = new Map<string, CacheEntry>();

async function getCachedRow(key: string): Promise<RuntimeConfig | null> {
  const entry = configCache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.value;
  const [row] = await db
    .select()
    .from(runtimeConfigTable)
    .where(eq(runtimeConfigTable.key, key))
    .limit(1);
  const value: RuntimeConfig | null = row ?? null;
  configCache.set(key, { value, expiresAt: Date.now() + cacheTtlMs });
  return value;
}

/**
 * Cast a stored string value to the requested type.
 *
 * Contract (changed in task #4902):
 *   On cast failure (e.g. valueType=`number` but the text isn't a finite
 *   number, or valueType=`json` but the text doesn't parse) we now return
 *   the caller's `defaultValue` AND emit a structured warning. Previously
 *   this function silently returned `0` for malformed numbers and `null`
 *   for malformed JSON, which masked data-corruption bugs — e.g. a rate
 *   limit accidentally set to "twohundred" would become `0` and block all
 *   traffic. Falling back to the default keeps the system running while
 *   the log line surfaces the corruption to operators.
 */
function castValue(raw: string, type: string, key: string, defaultValue: unknown): unknown {
  switch (type) {
    case 'number': {
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
      logger.warn(
        { key, valueType: type, raw, defaultValue },
        '[runtime-config] malformed number value — falling back to default',
      );
      alertCorruptedConfig(key, type, raw);
      return defaultValue;
    }
    case 'boolean':
      return raw === 'true' || raw === '1';
    case 'json': {
      try {
        return JSON.parse(raw);
      } catch (err) {
        logger.warn(
          { key, valueType: type, raw, err, defaultValue },
          '[runtime-config] malformed JSON value — falling back to default',
        );
        alertCorruptedConfig(key, type, raw);
        return defaultValue;
      }
    }
    default:
      return raw;
  }
}

/**
 * Retrieve a runtime config value, casting it to the registered type.
 * Falls back to `defaultValue` when the key is absent from the database
 * or when evaluation fails (fail-safe, never throws).
 *
 * @example
 *   const max = await getConfig('rate_limit_global_max', 200); // → number
 *   const label = await getConfig('site_banner_text', '');     // → string
 */
export async function getConfig<T = string>(key: string, defaultValue: T): Promise<T> {
  try {
    const row = await getCachedRow(key);
    if (!row) return defaultValue;
    return castValue(row.value, row.valueType, key, defaultValue) as T;
  } catch (err) {
    logger.warn({ err, key }, '[runtime-config] getConfig failed — returning default');
    return defaultValue;
  }
}

/**
 * Retrieve the raw config row (including metadata) for a given key.
 * Returns null when the key does not exist.
 */
export async function getConfigRow(key: string): Promise<RuntimeConfig | null> {
  try {
    return await getCachedRow(key);
  } catch (err) {
    logger.warn({ err, key }, '[runtime-config] getConfigRow failed');
    return null;
  }
}

/**
 * Immediately evict a key from the in-memory cache, then notify all
 * other workers via the cross-process invalidation bus so their caches
 * stay in sync without waiting for the TTL to expire.
 *
 * If the invalidated key is `config_cache_ttl_ms`, also refreshes the
 * live TTL so the new value takes effect without a restart.
 */
export function invalidateConfigCache(key: string): void {
  invalidateConfigCacheLocal(key);
  void publishCacheInvalidation({ scope: 'config', key });
}

/** Internal: evict locally without re-publishing (used by bus subscriber). */
function invalidateConfigCacheLocal(key: string): void {
  configCache.delete(key);
  if (key === 'config_cache_ttl_ms') {
    void refreshCacheTtl();
  }
}

/**
 * Evict all entries from the config cache and notify peer workers to
 * do the same. Useful after bulk updates.
 */
export function invalidateAllConfigCache(): void {
  invalidateAllConfigCacheLocal();
  void publishCacheInvalidation({ scope: 'config-all' });
}

/** Internal: clear locally without re-publishing (used by bus subscriber). */
function invalidateAllConfigCacheLocal(): void {
  configCache.clear();
}

// Subscribe once at module load: notifications from peer workers clear
// our local cache without re-publishing.
onCacheInvalidation((event) => {
  if (event.scope === 'config') {
    invalidateConfigCacheLocal(event.key);
  } else if (event.scope === 'config-all') {
    invalidateAllConfigCacheLocal();
  }
});

/**
 * Default operational parameters seeded into the database.
 * Used by `ensureRuntimeConfigDefaults()` at startup to guarantee that every
 * known key has a live row so `getConfig()` can always resolve from cache.
 */
export const RUNTIME_CONFIG_DEFAULTS = [
  {
    key: 'rate_limit_global_max',
    value: '200',
    valueType: 'number' as const,
    description: 'Global rate limiter: max requests per 15-minute window per user/org',
    defaultValue: '200',
    category: 'rate_limits',
  },
  {
    key: 'rate_limit_write_max',
    value: '100',
    valueType: 'number' as const,
    description: 'Write rate limiter: max write requests per 15-minute window',
    defaultValue: '100',
    category: 'rate_limits',
  },
  {
    key: 'rate_limit_ai_inference_max',
    value: '30',
    valueType: 'number' as const,
    description: 'AI inference rate limiter: max calls per 15-minute window',
    defaultValue: '30',
    category: 'rate_limits',
  },
  {
    key: 'circuit_breaker_threshold',
    value: '50',
    valueType: 'number' as const,
    description: 'Circuit breaker: error-rate percentage (0-100) that opens the breaker',
    defaultValue: '50',
    category: 'circuit_breaker',
  },
  {
    key: 'circuit_breaker_reset_ms',
    value: '30000',
    valueType: 'number' as const,
    description: 'Circuit breaker: cooldown milliseconds before half-open probe',
    defaultValue: '30000',
    category: 'circuit_breaker',
  },
  {
    key: 'slo_latency_p99_ms',
    value: '2000',
    valueType: 'number' as const,
    description: 'SLO target: p99 response latency budget in milliseconds',
    defaultValue: '2000',
    category: 'slo',
  },
  {
    key: 'slo_error_rate_pct',
    value: '1',
    valueType: 'number' as const,
    description: 'SLO target: max acceptable error rate percentage (0-100)',
    defaultValue: '1',
    category: 'slo',
  },
  {
    key: 'job_cleanup_interval_ms',
    value: '3600000',
    valueType: 'number' as const,
    description: 'Scheduled job: interval for cleanup/pruning jobs in milliseconds',
    defaultValue: '3600000',
    category: 'jobs',
  },
  {
    key: 'job_health_check_interval_ms',
    value: '60000',
    valueType: 'number' as const,
    description: 'Scheduled job: health-probe polling interval in milliseconds',
    defaultValue: '60000',
    category: 'jobs',
  },
  {
    key: 'load_shed_lag_threshold_ms',
    value: '200',
    valueType: 'number' as const,
    description: 'Adaptive load shedder: event-loop lag threshold to start shedding traffic',
    defaultValue: '200',
    category: 'load_shedder',
  },
  {
    key: 'load_shed_pool_pct_threshold',
    value: '90',
    valueType: 'number' as const,
    description: 'Adaptive load shedder: DB pool saturation % that triggers shedding',
    defaultValue: '90',
    category: 'load_shedder',
  },
  {
    key: 'flag_cache_ttl_ms',
    value: '30000',
    valueType: 'number' as const,
    description: 'Feature flag in-memory cache TTL in milliseconds',
    defaultValue: '30000',
    category: 'feature_flags',
  },
  {
    key: 'config_cache_ttl_ms',
    value: '60000',
    valueType: 'number' as const,
    description: 'Runtime config in-memory cache TTL in milliseconds',
    defaultValue: '60000',
    category: 'runtime_config',
  },
] as const;

export type RuntimeConfigKey = (typeof RUNTIME_CONFIG_DEFAULTS)[number]['key'];

/**
 * Upsert all known default entries into the database at startup.
 * Uses ON CONFLICT DO NOTHING so existing operator overrides are preserved.
 */
export async function ensureRuntimeConfigDefaults(): Promise<void> {
  try {
    await db
      .insert(runtimeConfigTable)
      .values(RUNTIME_CONFIG_DEFAULTS.map((d) => ({ ...d, valueType: d.valueType })))
      .onConflictDoNothing();
    logger.info(
      { count: RUNTIME_CONFIG_DEFAULTS.length },
      '[runtime-config] Defaults ensured',
    );
    // Load the live TTL from DB so subsequent cache writes use the operator value.
    await refreshCacheTtl();
  } catch (err) {
    logger.warn({ err }, '[runtime-config] Failed to ensure defaults — config may be missing');
  }
}
