import { logger } from './logger';

export type ProbeStatus = 'ok' | 'degraded' | 'error' | 'not_configured';

export interface ProbeResult {
  status: ProbeStatus;
  latencyMs?: number;
  details?: string;
}

export interface QueueProbeResult extends ProbeResult {
  depth?: number;
  pending?: number;
  running?: number;
}

export interface DetailedHealthSnapshot {
  database: ProbeResult;
  auth: ProbeResult;
  ai: ProbeResult;
  queue: QueueProbeResult;
  cachedAt: number;
}

const CACHE_TTL_MS = 15_000;
const SLOW_THRESHOLD_MS = 500;
const DB_TIMEOUT_MS = 3_000;
const AI_TIMEOUT_MS = 4_000;

let _cache: DetailedHealthSnapshot | null = null;
let _inflight: Promise<DetailedHealthSnapshot> | null = null;

async function probeDatabase(): Promise<ProbeResult> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return { status: 'not_configured' };

  const start = Date.now();
  try {
    const { db } = await import('@szl-holdings/db');
    const { sql } = await import('drizzle-orm');
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), DB_TIMEOUT_MS),
      ),
    ]);
    const latencyMs = Date.now() - start;
    const status: ProbeStatus = latencyMs > SLOW_THRESHOLD_MS ? 'degraded' : 'ok';
    return { status, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ err: msg, latencyMs }, '[health-probe] database probe failed');
    return { status: 'error', latencyMs, details: msg.slice(0, 120) };
  }
}

async function probeAuth(): Promise<ProbeResult> {
  const dbUrl = process.env.DATABASE_URL;
  const hasSecret = !!process.env.SESSION_SECRET;

  if (!dbUrl && !hasSecret) {
    return { status: 'not_configured', details: 'DATABASE_URL and SESSION_SECRET not set' };
  }

  if (!dbUrl) {
    return { status: 'not_configured', details: 'DATABASE_URL not set; session store unavailable' };
  }

  const start = Date.now();
  try {
    const { randomBytes } = await import('crypto');
    const { getSessionUser } = await import('./auth.js');
    const probeToken = randomBytes(32).toString('hex');
    await Promise.race([
      getSessionUser(probeToken),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3_000)),
    ]);
    const latencyMs = Date.now() - start;
    const status: ProbeStatus = latencyMs > SLOW_THRESHOLD_MS ? 'degraded' : 'ok';
    return {
      status,
      latencyMs,
      details: 'session store query succeeded (probe token not found, expected)',
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ err: msg, latencyMs }, '[health-probe] auth probe failed');
    return {
      status: 'error',
      latencyMs,
      details: msg === 'timeout' ? 'session store query timed out' : msg.slice(0, 120),
    };
  }
}

const OPENAI_DEFAULT_BASE = 'https://api.openai.com/v1';

async function probeAI(): Promise<ProbeResult> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? process.env.OPENAI_BASE_URL;
  const openAiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  const apiKey =
    openAiKey ??
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ??
    process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

  if (!baseUrl && !apiKey) {
    return { status: 'not_configured', details: 'No AI provider credentials found' };
  }

  const resolvedBase = baseUrl ?? (openAiKey ? OPENAI_DEFAULT_BASE : null);
  const probeUrl = resolvedBase ? `${resolvedBase.replace(/\/$/, '')}/models` : null;
  if (!probeUrl) {
    return {
      status: 'not_configured',
      details: 'API key present but no probeable endpoint (Anthropic/Gemini key-only mode)',
    };
  }

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const resp = await fetch(probeUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const latencyMs = Date.now() - start;
    clearTimeout(timer);

    if (resp.status === 401 || resp.status === 403) {
      return { status: 'error', latencyMs, details: `auth rejected (HTTP ${resp.status})` };
    }
    if (resp.status >= 500) {
      return { status: 'error', latencyMs, details: `provider error (HTTP ${resp.status})` };
    }

    const status: ProbeStatus = latencyMs > SLOW_THRESHOLD_MS ? 'degraded' : 'ok';
    return { status, latencyMs };
  } catch (err) {
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes('abort') || msg.includes('timeout');
    logger.warn({ err: msg, latencyMs }, '[health-probe] AI provider probe failed');
    return {
      status: 'error',
      latencyMs,
      details: isTimeout ? 'probe timed out' : msg.slice(0, 120),
    };
  }
}

const NOT_CONFIGURED_PATTERNS = [
  /not.*init/i,
  /not.*configur/i,
  /cannot.*init/i,
  /queue.*not.*start/i,
  /queue.*unavailabl/i,
];

function isNotConfiguredError(msg: string): boolean {
  return NOT_CONFIGURED_PATTERNS.some((re) => re.test(msg));
}

async function probeQueue(): Promise<QueueProbeResult> {
  const start = Date.now();
  try {
    const { durableJobQueue } = await import('@szl-holdings/forge-runtime');
    const stats = await durableJobQueue.getStats();
    const depth = stats.pending + stats.running;
    const latencyMs = Date.now() - start;
    const status: ProbeStatus =
      depth > 50 ? 'degraded' : latencyMs > SLOW_THRESHOLD_MS ? 'degraded' : 'ok';
    return {
      status,
      latencyMs,
      depth,
      pending: stats.pending,
      running: stats.running,
      details: `pending=${stats.pending} running=${stats.running} completed=${stats.completed} failed=${stats.failed}`,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    // Only classify as not_configured when the queue was explicitly never set
    // up (e.g. missing env vars, no init call). All other failures are errors.
    const status: ProbeStatus = isNotConfiguredError(msg) ? 'not_configured' : 'error';
    return { status, latencyMs, depth: 0, details: msg.slice(0, 120) };
  }
}

async function runAllProbes(): Promise<DetailedHealthSnapshot> {
  const [database, auth, ai, queue] = await Promise.all([
    probeDatabase(),
    probeAuth(),
    probeAI(),
    probeQueue(),
  ]);
  return { database, auth, ai, queue, cachedAt: Date.now() };
}

export async function getDetailedHealth(): Promise<DetailedHealthSnapshot> {
  if (_cache && Date.now() - _cache.cachedAt < CACHE_TTL_MS) {
    return _cache;
  }

  if (_inflight) return _inflight;

  _inflight = runAllProbes()
    .then((result) => {
      _cache = result;
      _inflight = null;
      return result;
    })
    .catch((err) => {
      _inflight = null;
      logger.error({ err }, '[health-probes] probe cycle failed unexpectedly');
      throw err;
    });

  return _inflight;
}

export function getCacheAge(): number | null {
  return _cache ? Date.now() - _cache.cachedAt : null;
}
