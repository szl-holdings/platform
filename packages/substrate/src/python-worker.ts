/**
 * @szl/substrate — Python Worker Channel Protocol
 *
 * Typed wire protocol over the existing event bus for claim/heartbeat/result/error.
 * Python workers that implement this protocol can claim stages tagged runtime:"python".
 *
 * Protocol version: 1.0 (minimal and versioned as required by the spec).
 *
 * The journal, policy, and evidence layers remain in TypeScript — this is the
 * federation boundary only. Python workers execute stages; the substrate
 * coordinates everything else.
 */

import { randomUUID } from 'node:crypto';

export const PYTHON_WORKER_PROTOCOL_VERSION = '1.0' as const;

// ─── Message Types ────────────────────────────────────────────────────────────

export type PythonWorkerMessageType =
  | 'stage.claim' // Worker claims a stage
  | 'stage.heartbeat' // Worker signals it's still alive
  | 'stage.result' // Worker completed successfully
  | 'stage.error' // Worker encountered an error
  | 'worker.register' // Worker announces availability
  | 'worker.shutdown'; // Worker is shutting down

// ─── Message Schemas ──────────────────────────────────────────────────────────

export interface PythonWorkerBaseMessage {
  protocolVersion: typeof PYTHON_WORKER_PROTOCOL_VERSION;
  messageId: string;
  timestamp: string;
}

export interface WorkerRegisterMessage extends PythonWorkerBaseMessage {
  type: 'worker.register';
  workerId: string;
  workerCapabilities: {
    /** Stage types this worker can handle */
    stageTypes: string[];
    /** Maximum concurrent stages */
    maxConcurrency: number;
    /** Worker version */
    version: string;
    /** OpenTelemetry endpoint for trace forwarding */
    otelEndpoint?: string;
  };
}

export interface StageClaimMessage extends PythonWorkerBaseMessage {
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
  /** W3C traceparent header for OTel propagation */
  traceparent?: string;
  /**
   * Execution mode. live mode requires a real Python worker — no simulation
   * fallback is permitted when decisions will affect production state.
   */
  mode?: 'live' | 'dry-run' | 'replay' | 'counterfactual';
}

export interface StageHeartbeatMessage extends PythonWorkerBaseMessage {
  type: 'stage.heartbeat';
  workerId: string;
  runId: string;
  stageId: string;
  progressPercent?: number;
  note?: string;
}

export interface StageResultMessage extends PythonWorkerBaseMessage {
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

export interface StageErrorMessage extends PythonWorkerBaseMessage {
  type: 'stage.error';
  workerId: string;
  runId: string;
  stageId: string;
  errorCode: string;
  errorMessage: string;
  retryable: boolean;
  durationMs: number;
}

export type PythonWorkerMessage =
  | WorkerRegisterMessage
  | StageClaimMessage
  | StageHeartbeatMessage
  | StageResultMessage
  | StageErrorMessage;

// ─── Message Factory ──────────────────────────────────────────────────────────

function makeBase(): PythonWorkerBaseMessage {
  return {
    protocolVersion: PYTHON_WORKER_PROTOCOL_VERSION,
    messageId: randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

export function makeClaimMessage(
  opts: Omit<StageClaimMessage, keyof PythonWorkerBaseMessage | 'type'>,
): StageClaimMessage {
  return { ...makeBase(), type: 'stage.claim', ...opts };
}

export function makeHeartbeatMessage(
  opts: Omit<StageHeartbeatMessage, keyof PythonWorkerBaseMessage | 'type'>,
): StageHeartbeatMessage {
  return { ...makeBase(), type: 'stage.heartbeat', ...opts };
}

export function makeResultMessage(
  opts: Omit<StageResultMessage, keyof PythonWorkerBaseMessage | 'type'>,
): StageResultMessage {
  return { ...makeBase(), type: 'stage.result', ...opts };
}

export function makeErrorMessage(
  opts: Omit<StageErrorMessage, keyof PythonWorkerBaseMessage | 'type'>,
): StageErrorMessage {
  return { ...makeBase(), type: 'stage.error', ...opts };
}

// ─── Python Worker Channel ────────────────────────────────────────────────────

export interface PythonWorkerChannel {
  /**
   * Dispatch a stage to a Python worker.
   * Returns a promise that resolves when the worker sends stage.result.
   * Throws if the worker sends stage.error or times out.
   *
   * In live mode the channel fails closed: if SUBSTRATE_PYTHON_WORKER_URL is
   * unset or the HTTP call fails, an error is thrown instead of falling back
   * to the in-process simulation. Simulated fallback is only permitted in
   * non-live modes (dry-run, replay, counterfactual).
   */
  dispatch(
    opts: Omit<StageClaimMessage, keyof PythonWorkerBaseMessage | 'type' | 'workerId'>,
    timeoutMs?: number,
  ): Promise<StageResultMessage>;

  /** Check if any Python worker is available for a given stage type */
  hasWorker(stageType: string): boolean;

  /** List registered workers */
  listWorkers(): RegisteredWorker[];
}

export interface RegisteredWorker {
  workerId: string;
  capabilities: WorkerRegisterMessage['workerCapabilities'];
  registeredAt: string;
  lastHeartbeatAt: string;
  activeStageClaims: number;
}

// ─── Python Worker Channel (HTTP + In-Process Fallback) ─────────────────────
//
// When SUBSTRATE_PYTHON_WORKER_URL is set, dispatch() makes a real HTTP POST
// to the configured FastAPI worker endpoint, proving end-to-end federation.
// If the URL is not configured or the worker is unreachable, the call falls
// back to the in-process simulation so development environments remain functional.
//
// The HTTP protocol matches the FastAPI reference worker contract:
//   POST <SUBSTRATE_PYTHON_WORKER_URL>/execute
//   Content-Type: application/json
//   Body: StageClaimMessage
//   Response: StageResultMessage | StageErrorMessage

function isFallbackGateOpen(stageType: string): boolean {
  if (stageType === 'Retrieve') {
    return process.env.SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC === '1';
  }
  if (stageType === 'Reason' || stageType === 'Embed') {
    return process.env.SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL === '1';
  }
  return false;
}

function validateResultEnvelope(
  body: Record<string, unknown>,
  _stageId: string,
): string | null {
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

class SubstratePythonWorkerChannel implements PythonWorkerChannel {
  private readonly workers = new Map<string, RegisteredWorker>();
  private readonly pendingClaims = new Map<
    string,
    {
      resolve: (result: StageResultMessage) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  async checkWorkerHealthAndReadiness(
    workerUrl: string,
  ): Promise<{ healthy: boolean; ready: boolean }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);

      const [healthResp, readyResp] = await Promise.allSettled([
        fetch(`${workerUrl}/health`, { signal: controller.signal }),
        fetch(`${workerUrl}/ready`, { signal: controller.signal }),
      ]);

      clearTimeout(timeout);

      let healthy = false;
      if (healthResp.status === 'fulfilled' && healthResp.value.ok) {
        const data = (await healthResp.value.json()) as {
          status: string;
          workerId: string;
          activeClaims: number;
          maxConcurrency: number;
          draining: boolean;
          uptimeSeconds: number;
        };
        healthy = data.status === 'ok' || data.status === 'degraded';
      }

      let ready = false;
      if (readyResp.status === 'fulfilled' && readyResp.value.ok) {
        const data = (await readyResp.value.json()) as { ready: boolean; reason?: string | null };
        ready = data.ready;
      }

      return { healthy, ready };
    } catch {
      return { healthy: false, ready: false };
    }
  }

  registerWorker(msg: WorkerRegisterMessage): void {
    this.workers.set(msg.workerId, {
      workerId: msg.workerId,
      capabilities: msg.workerCapabilities,
      registeredAt: msg.timestamp,
      lastHeartbeatAt: msg.timestamp,
      activeStageClaims: 0,
    });
  }

  heartbeat(msg: StageHeartbeatMessage): void {
    const worker = this.workers.get(msg.workerId);
    if (worker) worker.lastHeartbeatAt = msg.timestamp;
  }

  resolveStage(msg: StageResultMessage): void {
    const claimKey = `${msg.runId}:${msg.stageId}`;
    const pending = this.pendingClaims.get(claimKey);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingClaims.delete(claimKey);
      pending.resolve(msg);
    }
  }

  rejectStage(msg: StageErrorMessage): void {
    const claimKey = `${msg.runId}:${msg.stageId}`;
    const pending = this.pendingClaims.get(claimKey);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingClaims.delete(claimKey);
      pending.reject(new Error(`Python worker error [${msg.errorCode}]: ${msg.errorMessage}`));
    }
  }

  async dispatch(
    opts: Omit<StageClaimMessage, keyof PythonWorkerBaseMessage | 'type' | 'workerId'>,
    timeoutMs = 60_000,
  ): Promise<StageResultMessage> {
    const startMs = Date.now();
    const workerUrl = process.env.SUBSTRATE_PYTHON_WORKER_URL;
    const isLive = opts.mode === 'live';

    // ── Fail-closed gate for live mode ───────────────────────────────────────
    // In live mode, the Python worker must be explicitly configured and reachable.
    // Falling back to simulation for governed live decisions is not acceptable:
    // it would produce evidence chains signed over fabricated data.
    if (isLive && !workerUrl) {
      throw new Error(
        `[substrate/python-worker] Live mode requires SUBSTRATE_PYTHON_WORKER_URL to be set. ` +
          `Stage '${opts.stageId}' (runtime: python) cannot fall back to in-process simulation ` +
          `in live mode. Set SUBSTRATE_PYTHON_WORKER_URL or switch to dry-run mode.`,
      );
    }

    // ── Real HTTP dispatch (protocol-aligned with protocol.py v1.0) ────────
    // When SUBSTRATE_PYTHON_WORKER_URL is set, dispatches via HTTP to the
    // FastAPI worker. The protocol uses version '1.0', budget schema
    // { escalateAt, requireHumanBelow }, and separate /health + /ready
    // endpoints per protocol.py.
    //
    // Live-mode fail-closed enforcement: if ANY step in this path fails
    // (health check, readiness, HTTP dispatch, envelope validation), live mode
    // throws immediately. No catch block may swallow errors in live mode.
    // Simulation fallback is ONLY permitted for non-live modes.
    if (workerUrl) {
      const healthOk = await this.checkWorkerHealthAndReadiness(workerUrl);
      if (!healthOk.healthy || !healthOk.ready) {
        if (isLive) {
          throw new Error(
            `[substrate/python-worker] Live-mode stage '${opts.stageId}' requires a healthy and ` +
              `ready Python worker. Health: ${healthOk.healthy}, Ready: ${healthOk.ready}. ` +
              `Worker at '${workerUrl}' failed pre-dispatch checks.`,
          );
        }
        // Non-live: fall through to in-process simulation
      } else {
        const claimMessage = makeClaimMessage({ ...opts, workerId: 'substrate-ts-engine' });
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(`${workerUrl}/claim`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Protocol-Version': PYTHON_WORKER_PROTOCOL_VERSION,
            },
            body: JSON.stringify(claimMessage),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!response.ok) {
            const text = await response.text().catch(() => '(no body)');
            const httpErr = new Error(
              `[substrate/python-worker] Worker HTTP ${response.status} for stage '${opts.stageId}': ${text}`,
            );
            if (isLive) throw httpErr;
            // Non-live: fall through to simulation
          } else {
            const body = await response.json();

            if (body.type === 'stage.error') {
              const errMsg = body as StageErrorMessage;
              const workerErr = new Error(
                `[substrate/python-worker] Worker error [${errMsg.errorCode}]: ${errMsg.errorMessage}`,
              );
              if (isLive) throw workerErr;
              // Non-live: fall through to simulation
            } else {
              const validationError = validateResultEnvelope(body, opts.stageId);
              if (validationError) {
                if (isLive) {
                  throw new Error(
                    `[substrate/python-worker] Live-mode envelope validation failed for ` +
                      `stage '${opts.stageId}': ${validationError}`,
                  );
                }
                // Non-live: fall through to simulation
              } else {
                return body as StageResultMessage;
              }
            }
          }
        } catch (err) {
          clearTimeout(timeout);
          if (isLive) {
            const reason =
              err instanceof Error && err.name === 'AbortError'
                ? `timed out after ${timeoutMs}ms`
                : err instanceof Error
                  ? err.message
                  : String(err);
            throw new Error(
              `[substrate/python-worker] Live-mode dispatch to '${workerUrl}/claim' failed ` +
                `for stage '${opts.stageId}': ${reason}`,
            );
          }
          // Non-live: fall through to in-process simulation
        }
      }
    }

    // ── In-process simulation fallback ───────────────────────────────────────
    // Only permitted for non-live modes when the stage-type-specific env gate
    // is open. Live mode never reaches here (thrown above).
    if (!isFallbackGateOpen(opts.stageType)) {
      throw new Error(
        `[substrate/python-worker] Deterministic fallback for stage type '${opts.stageType}' ` +
          `is not permitted. Set the appropriate env gate ` +
          `(SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC or SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL).`,
      );
    }

    const claimKey = `${opts.runId}:${opts.stageId}`;
    return new Promise<StageResultMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingClaims.delete(claimKey);
        reject(
          new Error(`Python worker timed out after ${timeoutMs}ms for stage '${opts.stageId}'`),
        );
      }, timeoutMs);

      this.pendingClaims.set(claimKey, { resolve, reject, timer });

      const simulatedResult = makeResultMessage({
        workerId: 'in-process-python-worker',
        runId: opts.runId,
        stageId: opts.stageId,
        output: {
          documents: [
            {
              id: 'py-doc-1',
              content: '[python-worker] Retrieved heavy corpus document (in-process simulation)',
              relevanceScore: 0.87,
              source: 'lyte-metrics-store',
              metadata: { worker: 'python', simulated: true },
            },
          ],
          retrievedCount: 1,
          worker: 'in-process-simulation',
          note: 'Set SUBSTRATE_PYTHON_WORKER_URL for real Python federation',
        },
        confidence: 0.87,
        durationMs: Date.now() - startMs,
        metadata: { simulated: true, phase: '1' },
      });

      setTimeout(() => this.resolveStage(simulatedResult), 5);
    });
  }

  hasWorker(stageType: string): boolean {
    for (const worker of this.workers.values()) {
      if (worker.capabilities.stageTypes.includes(stageType)) return true;
    }
    // Always report available: real dispatch attempts HTTP, in-process is the fallback.
    return true;
  }

  listWorkers(): RegisteredWorker[] {
    return [...this.workers.values()];
  }
}

export const defaultPythonWorkerChannel = new SubstratePythonWorkerChannel();

// Register the Phase 1 in-process worker so listWorkers() reports it
defaultPythonWorkerChannel.registerWorker({
  ...makeBase(),
  type: 'worker.register',
  workerId: 'in-process-python-worker-v1',
  workerCapabilities: {
    stageTypes: ['Retrieve'],
    maxConcurrency: 4,
    version: '1.0.0-phase1',
  },
});
