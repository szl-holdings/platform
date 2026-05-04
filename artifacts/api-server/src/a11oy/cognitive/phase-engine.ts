import { COGNITIVE_PHASES, newId } from './types.js';
import type { CognitivePhase, PhaseResult } from './types.js';

export interface PhaseConfig {
  timeoutMs?: number;
  maxRetries?: number;
  skipOnFailure?: boolean;
}

export interface PhaseHandlerContext {
  requestId: string;
  tenantId: string;
  phase: CognitivePhase;
  phaseIndex: number;
  input: Record<string, unknown>;
  proofChainId?: string;
}

export type PhaseHandler = (ctx: PhaseHandlerContext) => Promise<Record<string, unknown>>;

// ---------------------------------------------------------------------------
// In-memory phase run result store (max 4 000 records with 10% eviction)
// ---------------------------------------------------------------------------
const PHASE_STORE = new Map<string, PhaseResult>();
const MAX_PHASE_RECORDS = 4000;

function storePhaseResult(result: PhaseResult): void {
  if (PHASE_STORE.size >= MAX_PHASE_RECORDS) {
    const oldest = Array.from(PHASE_STORE.entries())
      .sort(([, a], [, b]) => (a.startedAt ?? '').localeCompare(b.startedAt ?? ''))
      .slice(0, Math.floor(MAX_PHASE_RECORDS * 0.1));
    for (const [k] of oldest) PHASE_STORE.delete(k);
  }
  PHASE_STORE.set(result.phaseRunId, result);
}

export function getPhaseRunResult(phaseRunId: string, tenantId: string): PhaseResult | undefined {
  const result = PHASE_STORE.get(phaseRunId);
  if (!result) return undefined;
  if (result.tenantId !== tenantId) return undefined;
  return result;
}

// ---------------------------------------------------------------------------
// Timeouts and retry config
// ---------------------------------------------------------------------------
const DEFAULT_TIMEOUT_MS: Record<CognitivePhase, number> = {
  INGEST: 5000,
  NORMALIZE: 8000,
  RETRIEVE: 15000,
  PLAN: 10000,
  REASON: 30000,
  APPROVE: 120000,
  EXECUTE: 60000,
  VERIFY: 15000,
  AUDIT: 10000,
  DELIVER: 5000,
};

const DEFAULT_MAX_RETRIES: Record<CognitivePhase, number> = {
  INGEST: 1,
  NORMALIZE: 1,
  RETRIEVE: 2,
  PLAN: 1,
  REASON: 1,
  APPROVE: 0,
  EXECUTE: 1,
  VERIFY: 1,
  AUDIT: 0,
  DELIVER: 1,
};

function classifyFailure(err: unknown): { failureClass: import('./types.js').PhaseFailureClass; failureDetail: string } {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('timeout') || msg.includes('TIMEOUT')) {
      return { failureClass: 'timeout', failureDetail: msg };
    }
    if (msg.includes('policy') || msg.includes('POLICY') || msg.includes('covenant')) {
      return { failureClass: 'policy_block', failureDetail: msg };
    }
    if (msg.includes('guard') || msg.includes('GUARD') || msg.includes('guardrail')) {
      return { failureClass: 'guard_rejection', failureDetail: msg };
    }
    if (msg.includes('model') || msg.includes('MODEL') || msg.includes('api_error')) {
      return { failureClass: 'model_error', failureDetail: msg };
    }
    return { failureClass: 'upstream_error', failureDetail: msg };
  }
  return { failureClass: 'upstream_error', failureDetail: String(err) };
}

async function runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`TIMEOUT after ${timeoutMs}ms`)), timeoutMs);
    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function runPhase(opts: {
  requestId: string;
  tenantId: string;
  phase: CognitivePhase;
  phaseIndex: number;
  handler: PhaseHandler;
  input: Record<string, unknown>;
  config?: PhaseConfig;
  proofChainId?: string;
}): Promise<PhaseResult> {
  const { requestId, tenantId, phase, phaseIndex, handler, input, config = {}, proofChainId } = opts;

  const phaseRunId = newId('pr');
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS[phase];
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES[phase];

  let lastErr: unknown;
  let retryCount = 0;
  const startedAt = new Date().toISOString();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) retryCount++;
    const phaseStart = Date.now();

    try {
      const output = await runWithTimeout(
        () => handler({ requestId, tenantId, phase, phaseIndex, input, proofChainId }),
        timeoutMs,
      );

      const completedAt = new Date().toISOString();
      const latencyMs = Date.now() - phaseStart;

      const result: PhaseResult = {
        phaseRunId,
        requestId,
        tenantId,
        phase,
        phaseIndex,
        status: 'completed',
        latencyMs,
        retryCount,
        failureClass: 'none',
        startedAt,
        completedAt,
        telemetry: { output, latencyMs, attempt },
      };
      storePhaseResult(result);
      return result;
    } catch (err) {
      lastErr = err;
      const isFinalAttempt = attempt === maxRetries;
      if (!isFinalAttempt) {
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    }
  }

  const { failureClass, failureDetail } = classifyFailure(lastErr);
  const completedAt = new Date().toISOString();

  const failedResult: PhaseResult = {
    phaseRunId,
    requestId,
    tenantId,
    phase,
    phaseIndex,
    status: failureClass === 'timeout' ? 'timeout' : 'failed',
    latencyMs: undefined,
    retryCount,
    failureClass,
    failureDetail,
    startedAt,
    completedAt,
    telemetry: { error: String(lastErr) },
  };
  storePhaseResult(failedResult);
  return failedResult;
}

function makeSkippedPhase(requestId: string, tenantId: string, phase: CognitivePhase, phaseIndex: number): PhaseResult {
  return {
    phaseRunId: newId('pr'),
    requestId,
    tenantId,
    phase,
    phaseIndex,
    status: 'skipped',
    latencyMs: 0,
    retryCount: 0,
    failureClass: 'none',
    telemetry: { skippedReason: 'halt_on_failure' },
  };
}

const NO_OP_HANDLER: PhaseHandler = async (_ctx) => ({});

export async function executePhaseSequence(opts: {
  requestId: string;
  tenantId: string;
  proofChainId?: string;
  handlers?: Partial<Record<CognitivePhase, PhaseHandler>>;
  configs?: Partial<Record<CognitivePhase, PhaseConfig>>;
  initialInput?: Record<string, unknown>;
  haltOnFailure?: boolean;
}): Promise<{
  phases: PhaseResult[];
  totalLatencyMs: number;
  succeeded: boolean;
  failedPhase?: CognitivePhase;
}> {
  const {
    requestId,
    tenantId,
    proofChainId,
    handlers = {},
    configs = {},
    initialInput = {},
    haltOnFailure = false,
  } = opts;

  const phases: PhaseResult[] = [];
  let cumulativeInput = { ...initialInput };
  let succeeded = true;
  let failedPhase: CognitivePhase | undefined;
  const sequenceStart = Date.now();

  for (let i = 0; i < COGNITIVE_PHASES.length; i++) {
    const phase = COGNITIVE_PHASES[i]!;
    const handler = handlers[phase] ?? NO_OP_HANDLER;
    const config = configs[phase];

    const result = await runPhase({
      requestId,
      tenantId,
      phase,
      phaseIndex: i,
      handler,
      input: cumulativeInput,
      config,
      proofChainId,
    });

    phases.push(result);

    if (result.status === 'failed' || result.status === 'timeout') {
      succeeded = false;
      failedPhase = phase;
      if (haltOnFailure) {
        // Mark all remaining phases as skipped for full observability
        for (let j = i + 1; j < COGNITIVE_PHASES.length; j++) {
          phases.push(makeSkippedPhase(requestId, tenantId, COGNITIVE_PHASES[j]!, j));
        }
        break;
      }
    }

    if (result.telemetry.output && typeof result.telemetry.output === 'object') {
      cumulativeInput = { ...cumulativeInput, ...(result.telemetry.output as Record<string, unknown>) };
    }
  }

  return {
    phases,
    totalLatencyMs: Date.now() - sequenceStart,
    succeeded,
    failedPhase,
  };
}

export { COGNITIVE_PHASES };
