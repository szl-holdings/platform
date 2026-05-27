/**
 * Remediation stage-pipeline wrapper (#5516).
 *
 * Wraps the canonical Sentra remediation lifecycle (ingested → contextualized
 * → recommended → simulated → policy-gated → approved → executing → verifying
 * → resolved/failed) in `@szl-holdings/sequence-pipeline.StagedPipeline` so
 * every per-stage transition emits one `pipeline.stage.v1` Λ-receipt into the
 * evidence ledger.
 *
 * Why a separate wrapper instead of folding StagedPipeline into the route
 * handlers? Each lifecycle transition is its own HTTP request and authn'd
 * principal — the canonical pipeline is *not* executed end-to-end in a single
 * process. The wrapper therefore exposes a per-stage emitter that the route
 * layer calls after committing the stage transition; this keeps the
 * "every-stage-receipted" invariant without breaking the stage-machine guards.
 *
 * The hash function is sha256 of canonical JSON (sorted keys) so two calls
 * with the same inputs/params/outputs produce byte-identical receipts.
 */
import { createHash } from 'node:crypto';
import { ReceiptChain } from '@szl-holdings/szl-receipts';
import {
  PIPELINE_STAGE_RECEIPT_CLASS,
  StagedPipeline,
} from '@szl-holdings/sequence-pipeline';

export const REMEDIATION_PIPELINE_TOOLING = {
  pipeline: 'sentra-remediation@1.0.0',
  hash: 'sha256-canonical-json',
} as const;

export const REMEDIATION_STAGE_NAMES = [
  'ingested',
  'contextualized',
  'recommended',
  'simulated',
  'policy-gated',
  'approved',
  'executing',
  'verifying',
  'resolved',
  'failed',
] as const;
export type RemediationStageName = (typeof REMEDIATION_STAGE_NAMES)[number];

function canonicalJson(value: unknown): string {
  // Stable serialisation: sort object keys so hash is order-insensitive.
  const seen = new WeakSet<object>();
  const replace = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v as object)) return '[circular]';
    seen.add(v as object);
    if (Array.isArray(v)) return v.map(replace);
    const keys = Object.keys(v as Record<string, unknown>).sort();
    const out: Record<string, unknown> = {};
    for (const k of keys) out[k] = replace((v as Record<string, unknown>)[k]);
    return out;
  };
  return JSON.stringify(replace(value));
}

export function hashCanonical(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

const stageChains = new Map<string, ReceiptChain>();
function chainFor(caseId: string): ReceiptChain {
  let c = stageChains.get(caseId);
  if (!c) {
    c = new ReceiptChain({ operatorId: `sentra/remediation/${caseId}` });
    stageChains.set(caseId, c);
  }
  return c;
}

export interface StageReceiptInput {
  readonly caseId: string;
  readonly stageName: RemediationStageName;
  readonly stageOrdinal: number;
  /** What was fed into the stage (e.g. prior case state + body). */
  readonly inputs: unknown;
  /** Tunable parameters that shaped the stage's behaviour. */
  readonly params: unknown;
  /** What the stage produced (e.g. updated case slice). */
  readonly outputs: unknown;
  readonly actor: string;
}

export interface StageReceipt {
  readonly receiptClass: typeof PIPELINE_STAGE_RECEIPT_CLASS;
  readonly chainReceiptId: string;
  readonly inputsHash: string;
  readonly paramsHash: string;
  readonly outputsHash: string;
  readonly stageName: RemediationStageName;
  readonly stageOrdinal: number;
  readonly caseId: string;
  readonly emittedAt: string;
}

/**
 * Append a `pipeline.stage.v1` receipt for a single completed remediation
 * stage. The hashes mirror what `StagedPipeline` would compute if the
 * lifecycle ran in one process, which keeps receipts cross-comparable
 * between live operator flows and offline replay of the same case.
 */
export async function emitRemediationStageReceipt(
  input: StageReceiptInput,
): Promise<StageReceipt> {
  const inputsHash = hashCanonical(input.inputs);
  const paramsHash = hashCanonical(input.params);
  const outputsHash = hashCanonical(input.outputs);
  const emittedAt = new Date().toISOString();
  const receipt = await chainFor(input.caseId).append({
    kind: PIPELINE_STAGE_RECEIPT_CLASS,
    pipelineId: `sentra-remediation:${input.caseId}`,
    stageName: input.stageName,
    stageOrdinal: input.stageOrdinal,
    inputsHash,
    paramsHash,
    outputsHash,
    tooling: REMEDIATION_PIPELINE_TOOLING,
    actor: input.actor,
    emittedAt,
  });
  return {
    receiptClass: PIPELINE_STAGE_RECEIPT_CLASS,
    chainReceiptId: receipt.selfHash,
    inputsHash,
    paramsHash,
    outputsHash,
    stageName: input.stageName,
    stageOrdinal: input.stageOrdinal,
    caseId: input.caseId,
    emittedAt,
  };
}

export function stageOrdinal(name: RemediationStageName): number {
  return REMEDIATION_STAGE_NAMES.indexOf(name);
}

/**
 * Replay-validator: takes a sequence of staged inputs/params/outputs and
 * runs them through StagedPipeline to produce the canonical per-stage
 * artefact list. Used by offline auditors to confirm that the receipts a
 * live remediation case emitted match the deterministic re-computation.
 */
export async function replayStages(
  caseId: string,
  steps: ReadonlyArray<{
    name: RemediationStageName;
    params: Record<string, unknown>;
    transform: (input: unknown) => unknown;
  }>,
  initialInput: unknown,
): Promise<ReturnType<StagedPipeline['run']>> {
  const pipeline = new StagedPipeline({
    pipelineId: `sentra-remediation:${caseId}`,
    tooling: { ...REMEDIATION_PIPELINE_TOOLING },
    hash: hashCanonical,
  });
  return pipeline.run(
    initialInput,
    steps.map((s) => ({
      name: s.name,
      params: s.params,
      run: (input) => s.transform(input),
    })),
  );
}

/** Test-only — clears per-case chains so receipts don't leak between tests. */
export function _resetRemediationChainsForTesting(): void {
  stageChains.clear();
}
