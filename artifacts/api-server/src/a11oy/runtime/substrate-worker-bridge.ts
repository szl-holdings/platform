import { randomUUID } from 'node:crypto';
import { logger } from '../../lib/logger.js';

export type StageMode = 'live' | 'dry-run' | 'replay' | 'counterfactual';

export interface StageClaimRequest {
  protocolVersion: '1.0';
  messageId: string;
  timestamp: string;
  type: 'stage.claim';
  workerId: string;
  runId: string;
  workflowId: string;
  stageId: string;
  stageType: string;
  stageConfig: Record<string, unknown>;
  input: unknown;
  budgetConfig: {
    escalateAt: number;
    requireHumanBelow: number;
  };
  traceId: string;
  mode?: StageMode;
}

export interface StageResultEnvelope {
  type: 'stage.result';
  workerId: string;
  runId: string;
  stageId: string;
  output: unknown;
  confidence: number;
  durationMs: number;
  otelSpanId?: string;
  evidenceIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface StageErrorEnvelope {
  type: 'stage.error';
  workerId: string;
  runId: string;
  stageId: string;
  errorCode: string;
  errorMessage: string;
  retryable: boolean;
  durationMs: number;
}

export interface WorkerHealthResponse {
  status: 'ok' | 'degraded' | 'down';
  workerId: string;
  activeClaims: number;
  maxConcurrency: number;
  draining: boolean;
  uptimeSeconds: number;
}

export interface WorkerReadinessResponse {
  ready: boolean;
  reason?: string | null;
}

export interface WorkerBridgeStatus {
  configured: boolean;
  workerUrl: string | null;
  healthy: boolean;
  ready: boolean;
  capabilities: string[];
  activeClaims: number;
  safetyGates: {
    liveInferenceAllowed: boolean;
    devModelGateOpen: boolean;
    syntheticRetrievalGateOpen: boolean;
    demoMode: boolean;
  };
  livePythonStagesPermitted: boolean;
  lastHealthCheck: string | null;
  lastError: string | null;
}

function isFallbackGateOpen(stageType: string): boolean {
  if (stageType === 'Retrieve') {
    return process.env.SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC === '1';
  }
  if (stageType === 'Reason' || stageType === 'Embed') {
    return process.env.SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL === '1';
  }
  // Routing/ranking utility stages use dry-run mode in non-live contexts and
  // never require a live inference engine — open gate so bridge helpers work
  // in dev/test environments when worker is running but not fully configured.
  if (stageType === 'model_route' || stageType === 'evidence_rank') {
    return true;
  }
  return false;
}

function validateResultEnvelope(body: Record<string, unknown>): string | null {
  if (body.type !== 'stage.result') {
    return `Expected type 'stage.result', got '${body.type}'`;
  }
  if (typeof body.workerId !== 'string' || !body.workerId) {
    return `Missing or invalid 'workerId'`;
  }
  if (typeof body.runId !== 'string' || !body.runId) {
    return `Missing or invalid 'runId'`;
  }
  if (typeof body.stageId !== 'string' || !body.stageId) {
    return `Missing or invalid 'stageId'`;
  }
  if (typeof body.confidence !== 'number' || body.confidence < 0 || body.confidence > 1) {
    return `Missing or invalid 'confidence' (must be number 0..1), got ${body.confidence}`;
  }
  if (typeof body.durationMs !== 'number' || body.durationMs < 0) {
    return `Missing or invalid 'durationMs', got ${body.durationMs}`;
  }
  if (body.output === undefined) {
    return `Missing 'output' field`;
  }
  if (!Array.isArray(body.evidenceIds)) {
    return `Missing or invalid 'evidenceIds' (must be array)`;
  }
  const meta = body.metadata as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== 'object') {
    return `Missing 'metadata' object`;
  }
  if (typeof meta.provenance !== 'string' || !meta.provenance) {
    return `Missing or invalid 'metadata.provenance'`;
  }
  if (!Array.isArray(meta.models) || meta.models.length === 0) {
    return `Missing or invalid 'metadata.models' (must be non-empty array)`;
  }
  if (typeof meta.mode !== 'string') {
    return `Missing 'metadata.mode'`;
  }
  if (typeof meta.replayHash !== 'string') {
    return `Missing 'metadata.replayHash'`;
  }
  // metadata.failureReason is optional — only present on partial/degraded results
  return null;
}

const PROTOCOL_VERSION = '1.0' as const;
const HEALTH_CHECK_INTERVAL_MS = 30_000;
const CLAIM_TIMEOUT_MS = 60_000;

let cachedHealth: WorkerHealthResponse | null = null;
let cachedReadiness: WorkerReadinessResponse | null = null;
let lastHealthCheck: string | null = null;
let lastHealthError: string | null = null;
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;

function getWorkerUrl(): string | null {
  return process.env.SUBSTRATE_PYTHON_WORKER_URL || null;
}

function isDemoMode(): boolean {
  return process.env.A11OY_DEMO_MODE !== 'false';
}

function isDevModelAllowed(): boolean {
  return process.env.SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL === '1';
}

function isSyntheticRetrievalAllowed(): boolean {
  return process.env.SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC === '1';
}

function isLiveInferenceAllowed(): boolean {
  return !isDemoMode() && !!getWorkerUrl();
}

function isHealthy(): boolean {
  return cachedHealth?.status === 'ok' || cachedHealth?.status === 'degraded';
}

function isReady(): boolean {
  return cachedReadiness?.ready ?? false;
}

/** Whether SUBSTRATE_PYTHON_WORKER_URL is configured (worker URL is present). */
export function isWorkerConfigured(): boolean {
  return !!getWorkerUrl();
}

/** Whether the last health check reported the worker as ready (readiness probe passed). */
export function isWorkerReady(): boolean {
  return isReady();
}

export async function checkWorkerHealth(): Promise<{ healthy: boolean; ready: boolean }> {
  const url = getWorkerUrl();
  if (!url) {
    return { healthy: false, ready: false };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const [healthResp, readyResp] = await Promise.allSettled([
      fetch(`${url}/health`, { signal: controller.signal }),
      fetch(`${url}/ready`, { signal: controller.signal }),
    ]);

    clearTimeout(timeout);

    if (healthResp.status === 'fulfilled' && healthResp.value.ok) {
      const data = (await healthResp.value.json()) as WorkerHealthResponse;
      cachedHealth = data;
    } else {
      cachedHealth = null;
    }

    if (readyResp.status === 'fulfilled') {
      const data = (await readyResp.value.json()) as WorkerReadinessResponse;
      cachedReadiness = data;
    } else {
      cachedReadiness = null;
    }

    lastHealthCheck = new Date().toISOString();
    lastHealthError = null;

    return { healthy: isHealthy(), ready: isReady() };
  } catch (e) {
    lastHealthError = e instanceof Error ? e.message : String(e);
    logger.warn({ err: e }, '[substrate-bridge] worker health check failed');
    cachedHealth = null;
    cachedReadiness = null;
    return { healthy: false, ready: false };
  }
}

export async function dispatchStageClaim(opts: {
  runId: string;
  workflowId: string;
  stageId: string;
  stageType: string;
  stageConfig: Record<string, unknown>;
  input: unknown;
  traceId: string;
  mode: StageMode;
  budgetConfig?: { escalateAt: number; requireHumanBelow: number };
  traceparent?: string;
}): Promise<{ ok: true; result: StageResultEnvelope } | { ok: false; error: string; errorType: string }> {
  const url = getWorkerUrl();
  const demo = isDemoMode();
  const isLiveMode = opts.mode === 'live';

  if (!url) {
    if (isLiveMode) {
      return {
        ok: false,
        error: 'SUBSTRATE_PYTHON_WORKER_URL is not configured. Live Python stages cannot be simulated.',
        errorType: 'fail_closed',
      };
    }
    if (!isFallbackGateOpen(opts.stageType)) {
      return {
        ok: false,
        error: `Deterministic fallback for stage type '${opts.stageType}' requires the appropriate env gate (SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC or SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL) to be set.`,
        errorType: 'gate_closed',
      };
    }
    return buildDeterministicFallback(opts);
  }

  const health = cachedHealth ? { healthy: isHealthy(), ready: isReady() } : await checkWorkerHealth();
  if (!health.healthy || !health.ready) {
    if (isLiveMode) {
      return {
        ok: false,
        error: `Python worker is not ready (healthy=${health.healthy}, ready=${health.ready}). Live mode requires a healthy worker.`,
        errorType: 'fail_closed',
      };
    }
    if (!isFallbackGateOpen(opts.stageType)) {
      return {
        ok: false,
        error: `Worker unhealthy and deterministic fallback for '${opts.stageType}' is not permitted without the appropriate env gate.`,
        errorType: 'gate_closed',
      };
    }
    return buildDeterministicFallback(opts);
  }

  if (isLiveMode && demo) {
    return {
      ok: false,
      error: 'Live Python stages are not permitted in demo mode. Set A11OY_DEMO_MODE=false for live execution.',
      errorType: 'fail_closed',
    };
  }

  const request: StageClaimRequest = {
    protocolVersion: PROTOCOL_VERSION,
    messageId: randomUUID(),
    timestamp: new Date().toISOString(),
    type: 'stage.claim',
    workerId: 'ts-bridge-v1',
    runId: opts.runId,
    workflowId: opts.workflowId,
    stageId: opts.stageId,
    stageType: opts.stageType,
    stageConfig: opts.stageConfig,
    input: opts.input,
    budgetConfig: opts.budgetConfig ?? { escalateAt: 0.7, requireHumanBelow: 0.4 },
    traceId: opts.traceId,
    mode: opts.mode,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLAIM_TIMEOUT_MS);
    const resp = await fetch(`${url}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Protocol-Version': PROTOCOL_VERSION,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      if (isLiveMode) {
        return {
          ok: false,
          error: `Worker returned ${resp.status}: ${body}`,
          errorType: 'fail_closed',
        };
      }
      if (!isFallbackGateOpen(opts.stageType)) {
        return {
          ok: false,
          error: `Worker returned ${resp.status} and deterministic fallback for '${opts.stageType}' is not permitted without env gate.`,
          errorType: 'gate_closed',
        };
      }
      return buildDeterministicFallback(opts);
    }

    const body = (await resp.json()) as StageResultEnvelope | StageErrorEnvelope;

    if (body.type === 'stage.error') {
      const errBody = body as StageErrorEnvelope;
      if (isLiveMode) {
        return {
          ok: false,
          error: `Worker error [${errBody.errorCode}]: ${errBody.errorMessage}`,
          errorType: 'fail_closed',
        };
      }
      if (!isFallbackGateOpen(opts.stageType)) {
        return {
          ok: false,
          error: `Worker error [${errBody.errorCode}] and deterministic fallback for '${opts.stageType}' is not permitted without env gate.`,
          errorType: 'gate_closed',
        };
      }
      return buildDeterministicFallback(opts);
    }

    const envValidation = validateResultEnvelope(body);
    if (envValidation) {
      logger.warn({ validation: envValidation, stageId: opts.stageId }, '[substrate-bridge] result envelope validation failed');
      if (isLiveMode) {
        return {
          ok: false,
          error: `Worker returned an invalid result envelope: ${envValidation}`,
          errorType: 'fail_closed',
        };
      }
      if (!isFallbackGateOpen(opts.stageType)) {
        return {
          ok: false,
          error: `Envelope validation failed and deterministic fallback for '${opts.stageType}' is not permitted without env gate.`,
          errorType: 'gate_closed',
        };
      }
      return buildDeterministicFallback(opts);
    }

    return { ok: true, result: body as StageResultEnvelope };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error({ err: e }, '[substrate-bridge] stage.claim dispatch failed');
    if (isLiveMode) {
      return {
        ok: false,
        error: `Worker dispatch failed: ${msg}`,
        errorType: 'fail_closed',
      };
    }
    if (!isFallbackGateOpen(opts.stageType)) {
      return {
        ok: false,
        error: `Worker dispatch failed and deterministic fallback for '${opts.stageType}' is not permitted without env gate: ${msg}`,
        errorType: 'gate_closed',
      };
    }
    return buildDeterministicFallback(opts);
  }
}

function buildDeterministicFallback(
  opts: { stageId: string; stageType: string; runId: string; mode: StageMode },
): { ok: true; result: StageResultEnvelope } {
  const result: StageResultEnvelope = {
    type: 'stage.result',
    workerId: 'deterministic-fallback',
    runId: opts.runId,
    stageId: opts.stageId,
    output: {
      note: `Deterministic fallback for ${opts.stageType} in ${opts.mode} mode. No live Python worker available.`,
      stageType: opts.stageType,
      mode: opts.mode,
    },
    confidence: 0.0,
    durationMs: 0,
    evidenceIds: [],
    metadata: {
      provenance: `deterministic-fallback:${opts.stageType}`,
      models: ['cpu-dev-deterministic'],
      mode: opts.mode,
      replayHash: `fallback-${opts.stageType}-${Date.now()}`,
    },
  };
  return { ok: true, result };
}

export function getBridgeStatus(): WorkerBridgeStatus {
  const url = getWorkerUrl();
  const demo = isDemoMode();
  const configured = !!url;
  const healthy = isHealthy();
  const ready = isReady();

  return {
    configured,
    workerUrl: url ? url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@') : null,
    healthy,
    ready,
    capabilities: cachedHealth ? [`maxConcurrency:${cachedHealth.maxConcurrency}`] : [],
    activeClaims: cachedHealth?.activeClaims ?? 0,
    safetyGates: {
      liveInferenceAllowed: isLiveInferenceAllowed(),
      devModelGateOpen: isDevModelAllowed(),
      syntheticRetrievalGateOpen: isSyntheticRetrievalAllowed(),
      demoMode: demo,
    },
    livePythonStagesPermitted: configured && healthy && ready && !demo,
    lastHealthCheck,
    lastError: lastHealthError,
  };
}

export function startHealthCheckLoop(): void {
  if (healthCheckTimer) return;
  const url = getWorkerUrl();
  if (!url) return;

  checkWorkerHealth().catch(() => {});
  healthCheckTimer = setInterval(() => {
    checkWorkerHealth().catch(() => {});
  }, HEALTH_CHECK_INTERVAL_MS);
}

export function stopHealthCheckLoop(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

// ── Typed helpers for Python-owned logic ──────────────────────────────────────
// These keep the bridge genuinely thin: callers get a typed result without
// needing to construct raw StageClaimRequests or know the stageType strings.
// All model selection, evidence ranking, and batching happen in Python.

export interface ModelRouteResult {
  provider: string;
  model: string;
  isDemo: boolean;
  reason: string;
  failedGates: string[];
}

export interface EvidenceItem {
  id: string;
  text: string;
  score?: number;
  [key: string]: unknown;
}

export interface EvidenceRankResult {
  ranked: Array<{ id: string; score: number; rank: number; text: string }>;
  methodUsed: string;
  query: string;
}

/**
 * Ask the Python worker to select the model/provider for a given role.
 * Python model_router.py is the source of truth; this replaces TS-side
 * provider resolution for callers that want Python-governed selection.
 *
 * Falls back to a local default when the worker is unavailable (non-live modes).
 */
export async function routeModelViaPython(opts: {
  runId: string;
  traceId: string;
  role?: 'reasoning' | 'fast' | 'long_context';
  model?: string;
  mode?: StageMode;
}): Promise<{ ok: true; result: ModelRouteResult } | { ok: false; error: string }> {
  const result = await dispatchStageClaim({
    runId: opts.runId,
    workflowId: `model-route-${opts.runId}`,
    stageId: `model-route-${randomUUID()}`,
    stageType: 'model_route',
    stageConfig: { stageKind: 'model_route' },
    input: { role: opts.role ?? 'reasoning', model: opts.model },
    traceId: opts.traceId,
    mode: opts.mode ?? 'dry-run',
  });

  if (!result.ok) return result;

  const out = result.result.output as Record<string, unknown>;
  return {
    ok: true,
    result: {
      provider: String(out.provider ?? 'mock'),
      model: String(out.model ?? 'mock-v1'),
      isDemo: Boolean(out.is_demo ?? true),
      reason: String(out.reason ?? ''),
      failedGates: Array.isArray(out.failed_gates) ? (out.failed_gates as string[]) : [],
    },
  };
}

/**
 * Ask the Python worker to rank evidence items by relevance to a query.
 * Python evidence_ranker.py uses TF-IDF / BM25 / cross-encoder progressively.
 * TS callers should not implement their own ranking — call this instead.
 */
export async function rankEvidenceViaPython(opts: {
  runId: string;
  traceId: string;
  query: string;
  evidence: EvidenceItem[];
  topK?: number;
  method?: 'auto' | 'tfidf' | 'bm25' | 'cross-encoder';
  mode?: StageMode;
}): Promise<{ ok: true; result: EvidenceRankResult } | { ok: false; error: string }> {
  const result = await dispatchStageClaim({
    runId: opts.runId,
    workflowId: `evidence-rank-${opts.runId}`,
    stageId: `evidence-rank-${randomUUID()}`,
    stageType: 'evidence_rank',
    stageConfig: { stageKind: 'evidence_rank' },
    input: {
      query: opts.query,
      evidence: opts.evidence,
      top_k: opts.topK ?? 10,
      method: opts.method ?? 'auto',
    },
    traceId: opts.traceId,
    mode: opts.mode ?? 'dry-run',
  });

  if (!result.ok) return result;

  const out = result.result.output as Record<string, unknown>;
  return {
    ok: true,
    result: {
      ranked: Array.isArray(out.ranked)
        ? (out.ranked as EvidenceRankResult['ranked'])
        : [],
      methodUsed: String(out.method_used ?? 'unknown'),
      query: String(out.query ?? opts.query),
    },
  };
}
