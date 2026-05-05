// Bounded autonomous self-evolution.
//
// Per-turn MirrorEval scores feed into a proposer. Proposals are classified
// by blast radius: safe-class auto-applies (with armed rollback), boundary-
// and doctrine-class queue. A global kill-switch and a 24h hard cap bound
// the autonomy.

import { classify } from './classifier.mjs';
import { proof } from '../proof.mjs';
import * as store from './store.mjs';
import * as applier from './applier.mjs';

const BASELINE = 0.70;
const ROLLBACK_WINDOW = 10;

export function killed() { return store.status().killSwitch === true; }
export function status() { return store.status(); }
// Re-export so the agent loop can feed each turn's MirrorEval into the
// armed-rollback monitor.
export const observeScore = store.observeScore;
export const BASELINE_SCORE = BASELINE;

export function proposeFromTurn({ plan, toolPick, toolResult, reflection, score }) {
  if (score >= BASELINE) return null;
  // What do we propose to tweak? Prefer the cheapest high-signal lever.
  if (toolResult?.ok === false) {
    return { kind: 'tool_description_tweak', target: toolPick.name, reason: `tool failure: ${toolResult.error}`, magnitude: 0.05 };
  }
  if ((toolPick?.score ?? 0) < 0.5) {
    return { kind: 'routing_weight_nudge', target: toolPick.name, reason: 'low Lutar score', magnitude: 0.05 };
  }
  if (!reflection?.ok) {
    return { kind: 'prompt_micro_edit', target: 'reflection', reason: 'reflection flagged not-ok', magnitude: 0.05 };
  }
  return { kind: 'retry_policy_tune', target: 'global', reason: `score ${score.toFixed(2)} below baseline`, magnitude: 0.05 };
}

export function handleProposal(proposal, { session }) {
  const cls = classify(proposal);
  const id = `prop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const enriched = { id, ...proposal, blastRadius: cls, session: session?.id };

  if (cls !== 'safe') {
    proof.append({ kind: 'evolve_queue', cls, proposal: enriched });
    store.queue(enriched);
    return { applied: false, queued: true, id, cls };
  }

  if (!store.canAutoApplyNow()) {
    proof.append({ kind: 'evolve_capped', proposal: enriched });
    store.queue(enriched);
    return { applied: false, queued: true, capped: true, id, cls };
  }

  // Auto-apply: actually mutate the runtime lever, take a snapshot for
  // rollback, and arm the post-apply MirrorEval window.
  const result = applier.apply(enriched);
  if (!result.applied) {
    proof.append({ kind: 'evolve_auto_apply_failed', proposal: enriched, reason: result.reason });
    return { applied: false, reason: result.reason, id, cls };
  }
  store.recordAutoApply({ ...enriched, snapshot: result.before, after: result.after }, { rollbackWindow: ROLLBACK_WINDOW, baseline: BASELINE });
  proof.append({ kind: 'evolve_auto_apply', proposal: enriched, after: result.after });
  return { applied: true, id, cls, after: result.after };
}

// Public revert hook used by armed rollback and `a11oy-code evolve revert`.
export function revertProposal(record) {
  const out = applier.revert(record, record.snapshot);
  proof.append({ kind: 'evolve_runtime_revert', id: record.id, kind_p: record.kind, ok: out.reverted });
  return out;
}
