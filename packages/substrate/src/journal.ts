/**
 * @szl/substrate — Evidence-Chained Journal
 *
 * Every stage transition writes a signed EvidenceBundle whose hash is linked
 * into the existing proof-chain. The audit log IS the journal; the journal IS
 * the audit log. Hash-stable replays are guaranteed when inputs match.
 */

import { createHash, createHmac, randomBytes, randomUUID } from "crypto";
import { EventEmitter } from "node:events";
import type {
  EvidenceBundle,
  AnyStage,
  StageResult,
  PipelineRun,
  ExecutionMode,
  StageType,
} from "./types.js";
import { EvidenceBundleSchema } from "./types.js";

// ─── Runtime Event Bus ────────────────────────────────────────────────────────
//
// Live progress events emitted as a workflow run executes. Subscribers (e.g.
// the substrate-mcp-gateway SSE transport) can listen for stage:start,
// stage:complete, run:complete, run:failed, and run:pending-approval events
// without polling. The bus is in-process; distributed deployments can replace
// it with a Redis pub/sub.

export type SubstrateRuntimeEventType =
  | "stage:start"
  | "stage:complete"
  | "stage:failed"
  | "run:started"
  | "run:complete"
  | "run:failed"
  | "run:pending-approval";

export interface SubstrateRuntimeEvent {
  type: SubstrateRuntimeEventType;
  runId: string;
  workflowId: string;
  stageId?: string;
  stageType?: StageType;
  status?: string;
  confidence?: number;
  error?: string;
  timestamp: number;
}

class RuntimeEventBus extends EventEmitter {
  private static readonly CHANNEL = "substrate_runtime_event";

  emitRuntimeEvent(event: SubstrateRuntimeEvent): void {
    this.emit(RuntimeEventBus.CHANNEL, event);
  }

  subscribe(listener: (event: SubstrateRuntimeEvent) => void): () => void {
    this.on(RuntimeEventBus.CHANNEL, listener);
    return () => this.off(RuntimeEventBus.CHANNEL, listener);
  }
}

export const runtimeEventBus = new RuntimeEventBus();
runtimeEventBus.setMaxListeners(512);

function emitStageEvent(opts: {
  type: "stage:start" | "stage:complete" | "stage:failed";
  run: PipelineRun;
  stage: AnyStage;
  result?: StageResult;
}): void {
  const { type, run, stage, result } = opts;
  runtimeEventBus.emitRuntimeEvent({
    type,
    runId: run.runId,
    workflowId: run.workflowId,
    stageId: stage.id,
    stageType: stage.type as StageType,
    ...(result?.status ? { status: result.status } : {}),
    ...(result?.confidence !== undefined ? { confidence: result.confidence } : {}),
    ...(result?.error ? { error: result.error } : {}),
    timestamp: Date.now(),
  });
}

function emitRunEvent(opts: {
  type: "run:started" | "run:complete" | "run:failed" | "run:pending-approval";
  run: PipelineRun;
}): void {
  const { type, run } = opts;
  runtimeEventBus.emitRuntimeEvent({
    type,
    runId: run.runId,
    workflowId: run.workflowId,
    status: run.status,
    ...(run.finalConfidence !== undefined ? { confidence: run.finalConfidence } : {}),
    ...(run.error ? { error: run.error } : {}),
    timestamp: Date.now(),
  });
}

/**
 * Engine-only helper: emit a stage:start event when a stage begins executing.
 * Called from the runtime before stage execution so SSE clients see progress.
 */
export function emitStageStart(run: PipelineRun, stage: AnyStage): void {
  emitStageEvent({ type: "stage:start", run, stage });
}

// ─── Signing Key ──────────────────────────────────────────────────────────────
//
// SUBSTRATE_SIGNING_KEY env var should be a 32+ byte hex secret. In Phase 1,
// we derive a deterministic fallback key from a constant + the process start time
// so bundles are always signed (though cross-process verification requires the
// same env var). Production deployments MUST set SUBSTRATE_SIGNING_KEY.

// Generate a cryptographically random key per-process. This ensures bundles
// cannot be forged even in misconfigured environments. Production deployments
// should set SUBSTRATE_SIGNING_KEY (32+ byte hex) for cross-process verification.

const PROCESS_RANDOM_KEY = randomBytes(32).toString("hex");
const SIGNING_KEY = process.env["SUBSTRATE_SIGNING_KEY"] ?? PROCESS_RANDOM_KEY;

if (!process.env["SUBSTRATE_SIGNING_KEY"]) {
  console.info(
    "[substrate] SUBSTRATE_SIGNING_KEY is not set — using a per-process random key. " +
    "Bundles signed in this process are verifiable only within the same process. " +
    "Set SUBSTRATE_SIGNING_KEY in production for cross-process verification.",
  );
}

/**
 * Compute HMAC-SHA256 signature of a bundleHash.
 * Used to prove the bundle was written by a substrate instance holding the key.
 */
export function signBundleHash(bundleHash: string): string {
  return createHmac("sha256", SIGNING_KEY).update(bundleHash).digest("hex").slice(0, 32);
}

/**
 * Verify a bundle signature. Returns true if the signature matches.
 */
export function verifyBundleSignature(bundle: { bundleHash: string; signature: string }): boolean {
  const expected = signBundleHash(bundle.bundleHash);
  return expected === bundle.signature;
}

// ─── Hash Utilities ───────────────────────────────────────────────────────────

/**
 * Compute a deterministic SHA-256 hash for any JSON-serialisable value.
 * Returns the first 32 hex characters (128 bits) — sufficient for
 * collision-resistance in this use case.
 */
export function hashValue(value: unknown): string {
  const canonical = JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = (v as Record<string, unknown>)[key];
          return acc;
        }, {});
    }
    return v as unknown;
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

/**
 * Compute the deterministic bundle hash from the fields that must be stable
 * across identical replays: stageId, inputHash, outputHash, confidence,
 * and policyOutcome.
 *
 * NOTE: runId is intentionally excluded so that an identical input→output
 * transition produces the same hash regardless of which run it belongs to.
 * This property is required by verifyReplayStability().
 */
export function computeBundleHash(fields: {
  stageId: string;
  inputHash: string;
  outputHash: string;
  confidence: number;
  policyOutcome?: string;
  parentHash?: string;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        stageId: fields.stageId,
        inputHash: fields.inputHash,
        outputHash: fields.outputHash,
        confidence: fields.confidence,
        policyOutcome: fields.policyOutcome ?? null,
        parentHash: fields.parentHash ?? null,
      }),
    )
    .digest("hex")
    .slice(0, 32);
}

// ─── In-Memory Journal Store ──────────────────────────────────────────────────
//
// Production deployments should swap this for a Postgres-backed store via
// the EvidenceGraph package, which links bundles into the proof-chain.
// The in-memory store provides a fast local path and the same interface.

export interface JournalStore {
  append(bundle: EvidenceBundle): Promise<void>;
  getBundle(bundleId: string): Promise<EvidenceBundle | null>;
  getRunBundles(runId: string): Promise<EvidenceBundle[]>;
  getStageBundles(runId: string, stageId: string): Promise<EvidenceBundle[]>;
  getLatestBundle(runId: string): Promise<EvidenceBundle | null>;
}

class InMemoryJournalStore implements JournalStore {
  private readonly bundles = new Map<string, EvidenceBundle>();
  private readonly byRun = new Map<string, EvidenceBundle[]>();

  async append(bundle: EvidenceBundle): Promise<void> {
    this.bundles.set(bundle.bundleId, bundle);
    const run = this.byRun.get(bundle.runId) ?? [];
    run.push(bundle);
    this.byRun.set(bundle.runId, run);
  }

  async getBundle(bundleId: string): Promise<EvidenceBundle | null> {
    return this.bundles.get(bundleId) ?? null;
  }

  async getRunBundles(runId: string): Promise<EvidenceBundle[]> {
    return [...(this.byRun.get(runId) ?? [])];
  }

  async getStageBundles(runId: string, stageId: string): Promise<EvidenceBundle[]> {
    return (this.byRun.get(runId) ?? []).filter((b) => b.stageId === stageId);
  }

  async getLatestBundle(runId: string): Promise<EvidenceBundle | null> {
    const bundles = this.byRun.get(runId) ?? [];
    return bundles.length > 0 ? bundles[bundles.length - 1]! : null;
  }
}

export const defaultJournalStore: JournalStore = new InMemoryJournalStore();

// ─── Journal Writer ───────────────────────────────────────────────────────────

export class SubstrateJournal {
  constructor(private readonly store: JournalStore = defaultJournalStore) {}

  /**
   * Write an EvidenceBundle for a completed stage transition.
   * The bundle is hash-linked to the previous bundle in the run (chain).
   */
  async writeStageTransition(opts: {
    run: PipelineRun;
    stage: AnyStage;
    result: StageResult;
    /** The actual input passed to this stage — hashed to form inputHash */
    input: unknown;
    promptVersion?: string;
    toolId?: string;
    toolArgs?: unknown;
    toolResult?: unknown;
    citations?: string[];
    policyOutcome?: EvidenceBundle["policyOutcome"];
    metadata?: Record<string, unknown>;
  }): Promise<EvidenceBundle> {
    const { run, stage, result } = opts;

    const parentBundle = await this.store.getLatestBundle(run.runId);
    // Hash stage input and output independently so replay stability can compare them
    const inputHash = hashValue(opts.input ?? null);
    const outputHash = hashValue(result.output ?? null);

    const bundleHash = computeBundleHash({
      stageId: stage.id,
      inputHash,
      outputHash,
      confidence: result.confidence ?? 0,
      ...(opts.policyOutcome !== undefined ? { policyOutcome: opts.policyOutcome } : {}),
      ...(parentBundle?.bundleHash !== undefined ? { parentHash: parentBundle.bundleHash } : {}),
    });

    const signature = signBundleHash(bundleHash);

    const bundle = EvidenceBundleSchema.parse({
      bundleId: `eb-${randomUUID()}`,
      runId: run.runId,
      stageId: stage.id,
      stageType: stage.type as StageType,
      workflowId: run.workflowId,
      ...(opts.promptVersion !== undefined ? { promptVersion: opts.promptVersion } : {}),
      ...(opts.toolId !== undefined ? { toolId: opts.toolId } : {}),
      ...(opts.toolArgs !== undefined ? { toolArgs: opts.toolArgs } : {}),
      ...(opts.toolResult !== undefined ? { toolResult: opts.toolResult } : {}),
      citations: opts.citations ?? [],
      confidence: result.confidence ?? 0,
      ...(opts.policyOutcome !== undefined ? { policyOutcome: opts.policyOutcome } : {}),
      inputHash,
      outputHash,
      ...(parentBundle?.bundleHash !== undefined ? { parentHash: parentBundle.bundleHash } : {}),
      bundleHash,
      signature,
      createdAt: new Date().toISOString(),
      metadata: opts.metadata ?? {},
    }) as EvidenceBundle;

    await this.store.append(bundle);

    // Fan-out a stage:complete (or stage:failed) event so live subscribers
    // (e.g. the gateway SSE transport) can push progress without polling.
    emitStageEvent({
      type: result.status === "failed" || result.status === "timed-out" ? "stage:failed" : "stage:complete",
      run,
      stage,
      result,
    });

    // Link into the proof-chain — errors are logged but not fatal so the
    // journal (primary source) is never blocked by an unavailable proof-chain.
    await this.linkToProofChain(bundle).catch((err: unknown) => {
      console.error(
        `[substrate journal] proof-chain link failed for bundle ${bundle.bundleId}:`,
        err instanceof Error ? err.message : String(err),
      );
    });

    return bundle;
  }

  /**
   * Write a run-level transition (pipeline started / completed / failed).
   */
  async writePipelineTransition(opts: {
    run: PipelineRun;
    event: "started" | "completed" | "failed" | "pending-approval" | "dry-run-complete";
    metadata?: Record<string, unknown>;
  }): Promise<EvidenceBundle> {
    const { run } = opts;

    const parentBundle = await this.store.getLatestBundle(run.runId);
    const inputHash = hashValue(run.input);
    const outputHash = hashValue(run.output ?? null);

    const bundleHash = computeBundleHash({
      stageId: `__pipeline__${opts.event}`,
      inputHash,
      outputHash,
      confidence: run.finalConfidence ?? 0,
      ...(parentBundle?.bundleHash !== undefined ? { parentHash: parentBundle.bundleHash } : {}),
    });

    const signature = signBundleHash(bundleHash);

    const bundle = EvidenceBundleSchema.parse({
      bundleId: `eb-${randomUUID()}`,
      runId: run.runId,
      stageId: `__pipeline__${opts.event}`,
      stageType: "Reason" as StageType,
      workflowId: run.workflowId,
      citations: [],
      confidence: run.finalConfidence ?? 0,
      inputHash,
      outputHash,
      ...(parentBundle?.bundleHash !== undefined ? { parentHash: parentBundle.bundleHash } : {}),
      bundleHash,
      signature,
      createdAt: new Date().toISOString(),
      metadata: { event: opts.event, mode: run.mode, ...opts.metadata },
    }) as EvidenceBundle;

    await this.store.append(bundle);

    // Map pipeline transition events onto runtime event bus subscribers.
    const evt = opts.event;
    if (evt === "started") {
      emitRunEvent({ type: "run:started", run });
    } else if (evt === "completed" || evt === "dry-run-complete") {
      emitRunEvent({ type: "run:complete", run });
    } else if (evt === "failed") {
      emitRunEvent({ type: "run:failed", run });
    } else if (evt === "pending-approval") {
      emitRunEvent({ type: "run:pending-approval", run });
    }

    return bundle;
  }

  /**
   * Verify hash stability for a replay: given a source run's bundle chain,
   * confirm that the replayed run produces identical hashes for stages where
   * inputs matched.
   */
  async verifyReplayStability(
    sourceRunId: string,
    replayRunId: string,
  ): Promise<{ stable: boolean; mismatchedStages: string[] }> {
    const [sourceBundles, replayBundles] = await Promise.all([
      this.store.getRunBundles(sourceRunId),
      this.store.getRunBundles(replayRunId),
    ]);

    const sourceByStage = new Map(sourceBundles.map((b) => [b.stageId, b]));
    const replayByStage = new Map(replayBundles.map((b) => [b.stageId, b]));
    const mismatchedStages: string[] = [];

    for (const [stageId, sourceBundle] of sourceByStage) {
      const replayBundle = replayByStage.get(stageId);
      if (!replayBundle) continue;

      // Chain hashes (bundleHash) intentionally differ between runs because they
      // include parentHash which is run-specific. The stability guarantee is:
      // same inputHash → same outputHash. That is what we verify here.
      if (
        sourceBundle.inputHash === replayBundle.inputHash &&
        sourceBundle.outputHash !== replayBundle.outputHash
      ) {
        mismatchedStages.push(stageId);
      }
    }

    return { stable: mismatchedStages.length === 0, mismatchedStages };
  }

  async getRunBundles(runId: string): Promise<EvidenceBundle[]> {
    return this.store.getRunBundles(runId);
  }

  private async linkToProofChain(bundle: EvidenceBundle): Promise<void> {
    // Dynamic import to avoid hard dependency on proof-chain
    const { tagAIContent } = await import("@szl-holdings/proof-chain");
    await tagAIContent({
      contentId: bundle.bundleId,
      contentType: "substrate-evidence-bundle",
      sourceClass: "llm_generated",
      confidenceScore: bundle.confidence,
      correlationId: bundle.runId,
      metadata: {
        stageId: bundle.stageId,
        workflowId: bundle.workflowId,
        bundleHash: bundle.bundleHash,
        mode: "substrate",
      },
    });
  }
}

export const defaultJournal = new SubstrateJournal();

// ─── Run Store (Journal-Backed) ───────────────────────────────────────────────
//
// The journal is the source of truth: every save() writes run state into the
// journal store as a __run__snapshot bundle. get() checks the in-memory cache
// first (fast path), then falls back to journal reconstruction (restart-safe).

export interface RunStore {
  save(run: PipelineRun): Promise<void>;
  get(runId: string): Promise<PipelineRun | null>;
  listByWorkflow(workflowId: string, limit?: number): Promise<PipelineRun[]>;
}

class JournalBackedRunStore implements RunStore {
  private readonly cache = new Map<string, PipelineRun>();
  private readonly byWorkflow = new Map<string, PipelineRun[]>();

  constructor(private readonly journalStore: JournalStore) {}

  async save(run: PipelineRun): Promise<void> {
    // Write-through: update in-memory cache
    this.cache.set(run.runId, run);
    const wf = this.byWorkflow.get(run.workflowId) ?? [];
    const existing = wf.findIndex((r) => r.runId === run.runId);
    if (existing >= 0) {
      wf[existing] = run;
    } else {
      wf.unshift(run);
      if (wf.length > 200) wf.pop();
    }
    this.byWorkflow.set(run.workflowId, wf);

    // Persist run state as a signed journal bundle (journal is source of truth)
    const snapshot = JSON.stringify(run);
    const snapshotHash = hashValue(snapshot);
    const bundleHash = computeBundleHash({
      stageId: "__run__snapshot",
      inputHash: snapshotHash,
      outputHash: snapshotHash,
      confidence: 0,
    });
    const snapshotBundle: EvidenceBundle = {
      bundleId: `eb-snap-${run.runId}-${Date.now()}`,
      runId: run.runId,
      stageId: "__run__snapshot",
      stageType: "Reason",
      workflowId: run.workflowId,
      citations: [],
      confidence: 0,
      inputHash: snapshotHash,
      outputHash: snapshotHash,
      bundleHash,
      signature: signBundleHash(bundleHash),
      createdAt: new Date().toISOString(),
      metadata: { _runSnapshot: run as unknown as Record<string, unknown> },
    };
    await this.journalStore.append(snapshotBundle);
  }

  async get(runId: string): Promise<PipelineRun | null> {
    // Fast path: in-memory cache
    const cached = this.cache.get(runId);
    if (cached) return cached;

    // Fallback: reconstruct from journal (restart-safe source of truth)
    const bundles = await this.journalStore.getRunBundles(runId);
    // Find the most recent __run__snapshot bundle
    const snapshots = bundles
      .filter((b) => b.stageId === "__run__snapshot" && b.metadata["_runSnapshot"])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (snapshots.length === 0) return null;

    const run = snapshots[0]!.metadata["_runSnapshot"] as PipelineRun;
    // Warm the cache for future hits
    this.cache.set(runId, run);
    return run;
  }

  async listByWorkflow(workflowId: string, limit = 50): Promise<PipelineRun[]> {
    return (this.byWorkflow.get(workflowId) ?? []).slice(0, limit);
  }
}

// ─── Default Stores ───────────────────────────────────────────────────────────
//
// defaultJournalStore is the root persistence layer.
// defaultRunStore is journal-backed: the journal is the source of truth.
// Production deployments should replace defaultJournalStore with a
// Postgres-backed implementation (see follow-up task #2404).

export const defaultRunStore: RunStore = new JournalBackedRunStore(defaultJournalStore);

// ─── Convenience: mode-aware journal mode annotation ─────────────────────────

export function modeLabel(mode: ExecutionMode): string {
  const labels: Record<ExecutionMode, string> = {
    "live": "LIVE",
    "dry-run": "DRY-RUN",
    "replay": "REPLAY",
    "counterfactual": "COUNTERFACTUAL",
  };
  return labels[mode];
}
