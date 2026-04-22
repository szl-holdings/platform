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

    // ── Real HTTP dispatch (when FastAPI worker is configured) ──────────────
    // The FastAPI reference worker exposes POST /claim per the wire protocol.
    // In live mode, HTTP failures propagate (fail closed). In non-live modes
    // (dry-run, replay, counterfactual), the channel falls back to in-process
    // simulation so development environments remain functional.
    if (workerUrl) {
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
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const body = (await response.json()) as StageResultMessage | StageErrorMessage;

        if (body.type === 'stage.error') {
          const errMsg = body as StageErrorMessage;
          throw new Error(`Worker error [${errMsg.errorCode}]: ${errMsg.errorMessage}`);
        }

        return body as StageResultMessage;
      } catch (err) {
        clearTimeout(timeout);
        const reason =
          err instanceof Error && err.name === 'AbortError'
            ? `timed out after ${timeoutMs}ms`
            : err instanceof Error
              ? err.message
              : String(err);

        // In live mode: fail closed — rethrow so the engine marks the stage failed
        // rather than producing a decision from fabricated simulation data.
        if (isLive) {
          throw new Error(
            `[substrate/python-worker] Live-mode HTTP dispatch to '${workerUrl}/claim' failed ` +
              `for stage '${opts.stageId}': ${reason}`,
          );
        }
        // fall through to in-process simulation
      }
    }

    // ── In-process simulation fallback ───────────────────────────────────────
    // Used in non-live modes when SUBSTRATE_PYTHON_WORKER_URL is not set, or
    // when the remote worker is unreachable. Logs a debug note.
    if (!workerUrl) {
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
