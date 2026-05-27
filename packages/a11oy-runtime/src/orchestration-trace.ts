/**
 * Orchestration trace — sequence-pipeline-shaped audit of an A11oy
 * brand-orchestration run (drift → evaluate → approve → publish).
 *
 * Re-expressed from CRISPResso2's pipeline-as-evidence-ledger shape
 * (docs/research/perception-bio-synthesis-2026.md §2). Each stage emits
 * one hashed artefact via `@szl-holdings/sequence-pipeline`; the
 * runtime additionally captures the per-stage Λ verdict id so the
 * reliquary can join the sequence-pipeline trace to the receipt chain.
 *
 * The runner is intentionally generic over the stage payloads — it
 * does not care whether the drift signal is a brand-color-shift, a
 * recommender anomaly, or a peak-detector burst. The pipeline
 * topology is fixed; the per-stage runners are caller-supplied.
 */

import { createHash } from 'node:crypto';
import {
  StagedPipeline,
  type PipelineResult,
  type StageArtefact,
  type StageDefinition,
} from '@szl-holdings/sequence-pipeline';
import { evaluate, type EvaluateInput, type EvaluateResult, type Verdict } from './evaluate.js';

export type OrchestrationStageName = 'drift' | 'evaluate' | 'approve' | 'publish';

export interface OrchestrationStages<TDrift, TPublish> {
  /** Detect the inbound drift signal (e.g. brand-color shift, peak burst). */
  drift(): Promise<TDrift> | TDrift;
  /** Build the {@link EvaluateInput} from the drift signal. */
  evaluate(drift: TDrift): Promise<EvaluateInput> | EvaluateInput;
  /** Reviewer/operator decision over the Λ verdict. */
  approve(verdict: EvaluateResult): Promise<Verdict> | Verdict;
  /** Publish the approved action (or no-op on deny/escalate). */
  publish(verdict: EvaluateResult, decision: Verdict): Promise<TPublish> | TPublish;
}

export interface OrchestrationTrace<TPublish> {
  readonly pipelineId: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly stages: readonly StageArtefact<OrchestrationStageName>[];
  readonly verdict: EvaluateResult;
  readonly decision: Verdict;
  readonly published: TPublish | null;
  /** Λ receipt id from the evaluate stage (joins to yawar_events). */
  readonly lambdaReceiptId: string;
}

function sha256Hex(value: unknown): string {
  const json = JSON.stringify(value, (_, v) => (v === undefined ? null : v)) ?? 'null';
  return createHash('sha256').update(json).digest('hex');
}

function uuid(): string {
  // Local UUIDv4; mirrors evaluate.ts so the runtime stays edge-deployable.
  const b = new Uint8Array(16);
  for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const RING_CAPACITY = 64;
const _ring: OrchestrationTrace<unknown>[] = [];

function pushTrace(trace: OrchestrationTrace<unknown>): void {
  _ring.push(trace);
  if (_ring.length > RING_CAPACITY) _ring.splice(0, _ring.length - RING_CAPACITY);
}

export function getRecentOrchestrationTraces(limit = 32): readonly OrchestrationTrace<unknown>[] {
  const slice = _ring.slice(Math.max(0, _ring.length - limit));
  return slice.slice().reverse();
}

export function clearOrchestrationTracesForTest(): void {
  _ring.length = 0;
}

export interface RunOrchestrationOptions {
  /** Pipeline id; auto-generated when omitted. */
  readonly pipelineId?: string;
  /** Tooling tag carried into every stage artefact. */
  readonly tooling?: Readonly<Record<string, string>>;
}

/**
 * Run the canonical drift → evaluate → approve → publish loop and emit
 * a {@link OrchestrationTrace} containing one hashed {@link StageArtefact}
 * per stage plus the Λ receipt id. Trace is appended to an in-memory
 * ring buffer so the reliquary can list recent runs.
 *
 * The publish stage is intentionally a no-op when the reviewer's
 * decision is not `allow` — denied/escalated runs still emit the full
 * four-stage trace (the absence of a published artefact is itself
 * evidence and must be observable).
 */
export async function runOrchestration<TDrift, TPublish>(
  stages: OrchestrationStages<TDrift, TPublish>,
  options: RunOrchestrationOptions = {},
): Promise<OrchestrationTrace<TPublish>> {
  const startedAt = new Date().toISOString();
  const pipelineId = options.pipelineId ?? uuid();
  const tooling: Readonly<Record<string, string>> = options.tooling ?? {
    runtime: '@szl/a11oy-runtime',
    pipeline: '@szl-holdings/sequence-pipeline',
  };

  let verdict: EvaluateResult | undefined;
  let decision: Verdict | undefined;
  let published: TPublish | null = null;

  const driftStage: StageDefinition<OrchestrationStageName, void, TDrift> = {
    name: 'drift',
    params: { stage: 'drift' },
    run: async () => stages.drift(),
  };
  const evaluateStage: StageDefinition<OrchestrationStageName, TDrift, EvaluateResult> = {
    name: 'evaluate',
    params: { stage: 'evaluate' },
    run: async (drift) => {
      const input = await stages.evaluate(drift);
      verdict = await evaluate(input);
      return verdict;
    },
  };
  const approveStage: StageDefinition<OrchestrationStageName, EvaluateResult, Verdict> = {
    name: 'approve',
    params: { stage: 'approve' },
    run: async (v) => {
      decision = await stages.approve(v);
      return decision;
    },
  };
  const publishStage: StageDefinition<OrchestrationStageName, Verdict, TPublish | null> = {
    name: 'publish',
    params: { stage: 'publish' },
    run: async (d) => {
      if (d !== 'allow' || !verdict) {
        published = null;
        return null;
      }
      published = await stages.publish(verdict, d);
      return published;
    },
  };

  const pipeline = new StagedPipeline({ pipelineId, tooling, hash: sha256Hex });
  const result = (await pipeline.run<OrchestrationStageName, void, TPublish | null>(
    undefined,
    [driftStage, evaluateStage, approveStage, publishStage] as readonly StageDefinition<
      OrchestrationStageName,
      unknown,
      unknown
    >[],
  )) as PipelineResult<OrchestrationStageName, TPublish | null>;

  if (!verdict) {
    throw new Error('runOrchestration: evaluate stage did not produce a verdict');
  }
  if (!decision) {
    throw new Error('runOrchestration: approve stage did not produce a decision');
  }

  const trace: OrchestrationTrace<TPublish> = {
    pipelineId,
    startedAt,
    finishedAt: new Date().toISOString(),
    stages: result.stages,
    verdict,
    decision,
    published,
    lambdaReceiptId: verdict.receipt.receiptId,
  };
  pushTrace(trace as OrchestrationTrace<unknown>);
  return trace;
}
