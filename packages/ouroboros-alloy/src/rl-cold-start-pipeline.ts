/**
 * Primitive 70 — RL cold-start pipeline
 *
 * Inspired by DeepSeek R1's pipeline (cold-start data → RL → SFT →
 * RL again) and MiMo's three-stage data mixture. The architectural
 * insight: pure RL on a cold base produces capability but bad
 * readability; you need a structured pipeline of stages with
 * receipts at each stage gate. Lifted: a pipeline runner that
 * refuses to advance a stage until the prior stage's gate predicate
 * passes, recording the receipt at each step.
 */

export interface PipelineStage<S> {
  name: string;
  apply: (state: S) => S;
  gate: (state: S) => { ok: boolean; rationale: string };
}

export interface StageReceipt<S> {
  stage: string;
  ok: boolean;
  rationale: string;
  stateBefore: S;
  stateAfter: S;
}

export interface RunReceipt<S> {
  stages: StageReceipt<S>[];
  finalState: S;
  completed: boolean;
  rationale: string;
}

export function runPipeline<S>(
  initial: S,
  stages: PipelineStage<S>[]
): RunReceipt<S> {
  if (stages.length === 0) {
    throw new Error("pipeline must have at least 1 stage");
  }
  const receipts: StageReceipt<S>[] = [];
  let state = initial;
  for (const stage of stages) {
    const before = state;
    const after = stage.apply(state);
    const g = stage.gate(after);
    receipts.push({
      stage: stage.name,
      ok: g.ok,
      rationale: g.rationale,
      stateBefore: before,
      stateAfter: after,
    });
    if (!g.ok) {
      return {
        stages: receipts,
        finalState: after,
        completed: false,
        rationale: `pipeline halted at stage "${stage.name}": ${g.rationale}`,
      };
    }
    state = after;
  }
  return {
    stages: receipts,
    finalState: state,
    completed: true,
    rationale: `pipeline completed all ${stages.length} stage(s)`,
  };
}
