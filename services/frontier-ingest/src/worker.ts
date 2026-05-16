import { classify } from './classifier.js';
import { FRONTIER_SOURCES, type SourceDescriptor } from './sources.js';
import {
  alreadySeen,
  alreadySeenShared,
  isCapReached,
  markPullComplete,
  markPullStart,
  markSeen,
  rateLimitAllows,
  recordCost,
  recordDiscarded,
  recordDiscovered,
  recordPromoted,
  recordQueued,
} from './store.js';
import { applyPromotion } from './adapters.js';
import type { EvidencePack, FrontierArtifact } from './types.js';

export interface WorkerOptions {
  intervalMs?: number;
  fetchImpl?: typeof fetch;
  sources?: SourceDescriptor[];
  /**
   * If provided, used in place of HTTP for a source — useful for tests and
   * for synthetic provider events ("Anthropic publishes new model X").
   */
  syntheticFeeds?: Record<string, unknown>;
}

let timer: ReturnType<typeof setInterval> | undefined;
let running = false;

export async function pullSource(
  source: SourceDescriptor,
  opts: WorkerOptions = {},
): Promise<{ artifacts: FrontierArtifact[]; evidence: EvidencePack[]; costUsd: number }> {
  const evidence: EvidencePack[] = [];
  if (isCapReached()) return { artifacts: [], evidence, costUsd: 0 };

  // Per-source rate-limit gate: respect the source's declared ratePerHour.
  // Synthetic feeds (used in tests / operator on-demand pulls) bypass the
  // gate so they're always observable; real HTTP pulls are throttled.
  const synthetic = opts.syntheticFeeds?.[source.name];
  if (synthetic === undefined && !rateLimitAllows(source.name, source.ratePerHour)) {
    return { artifacts: [], evidence, costUsd: 0 };
  }

  markPullStart(source.provider, source.name);

  let raw: unknown;
  if (synthetic !== undefined) {
    raw = synthetic;
  } else {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = source.authEnv ? process.env[source.authEnv] : undefined;
    if (source.authEnv === 'AI_INTEGRATIONS_ANTHROPIC_API_KEY' && token) {
      headers['x-api-key'] = token;
      headers['anthropic-version'] = '2023-06-01';
    } else if (source.authEnv === 'AI_INTEGRATIONS_GEMINI_API_KEY' && token) {
      // Google uses ?key= query param; constructed below
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = source.endpoint;
    if (source.authEnv === 'AI_INTEGRATIONS_GEMINI_API_KEY' && token) {
      url += url.includes('?') ? `&key=${token}` : `?key=${token}`;
    }

    const fetchImpl = opts.fetchImpl ?? fetch;
    try {
      const resp = await fetchImpl(url, { headers, signal: AbortSignal.timeout(15_000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      raw = source.format === 'json' ? await resp.json() : await resp.text();
    } catch {
      raw = null;
    }
  }

  // Discovery → fallback chain: if the primary returns no usable data and a
  // fallback is declared, try the next descriptor in the chain. This keeps
  // provider news flowing even when an authed JSON API is unavailable.
  let artifacts: FrontierArtifact[] = raw ? source.parser(raw, source) : [];
  if (artifacts.length === 0 && source.fallbacks?.length) {
    for (const fb of source.fallbacks) {
      const fbResult = await pullSource(fb, opts);
      if (fbResult.artifacts.length > 0) {
        artifacts = fbResult.artifacts;
        evidence.push(...fbResult.evidence);
        break;
      }
    }
  }

  const cost = source.costPerCallUsd;
  recordCost(source.provider, cost);

  for (const a of artifacts) {
    // Cross-process dedup: when DATABASE_URL is set, also consult
    // `frontier_seen` so a Temporal-worker pull and an api-server
    // on-demand pull can't both queue the same artifact.
    if (alreadySeen(a.id) || (await alreadySeenShared(a.id))) continue;
    markSeen(a.id);
    recordDiscovered(a);

    const result = await classify(a);
    const pack: EvidencePack = {
      artifact: a,
      score: result.score,
      decision: result.decision,
      promotionTarget: result.promotionTarget,
      evaluatedAt: new Date().toISOString(),
    };
    evidence.push(pack);

    if (result.decision === 'auto-promote') {
      recordPromoted(pack);
      applyPromotion(pack);
    } else if (result.decision === 'queue') {
      recordQueued(pack);
    } else {
      recordDiscarded(pack);
    }
  }

  markPullComplete(source.provider, source.name, artifacts.length, cost);
  return { artifacts, evidence, costUsd: cost };
}

export async function pullAll(opts: WorkerOptions = {}): Promise<void> {
  const sources = opts.sources ?? FRONTIER_SOURCES;
  for (const s of sources) {
    if (isCapReached()) break;
    try {
      await pullSource(s, opts);
    } catch {
      // best-effort
    }
  }
}

/**
 * Start the in-process scheduler. This is intentionally a development /
 * fallback path — in production, the durable Temporal workflow
 * (`frontierIngestWorkflow` in `platform/temporal/workflows/`) is the
 * authoritative scheduler with retries, per-source timeouts, and
 * `continueAsNew` history bounding.
 *
 * Callers must opt-in by either passing `force: true` (operator on-demand
 * via the API) or setting `FRONTIER_INGEST_DEV_WORKER=true` in env. When
 * Temporal is unavailable in dev, this allows the discovery pipeline to
 * still run end-to-end so operators can validate behavior.
 */
export function startWorker(opts: WorkerOptions & { force?: boolean } = {}): void {
  if (running) return;
  const allowed = opts.force === true || process.env.FRONTIER_INGEST_DEV_WORKER === 'true';
  if (!allowed) {
    // Refuse to start the in-process loop unless explicitly opted-in.
    // Production must drive this through Temporal.
    return;
  }
  running = true;
  const interval = opts.intervalMs ?? Number(process.env.FRONTIER_INTERVAL_MS ?? 6 * 60 * 60 * 1000);
  // initial pull, fire-and-forget
  void pullAll(opts);
  timer = setInterval(() => {
    void pullAll(opts);
  }, interval);
  if (timer.unref) timer.unref();
}

export function stopWorker(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
  running = false;
}

export function isWorkerRunning(): boolean {
  return running;
}
