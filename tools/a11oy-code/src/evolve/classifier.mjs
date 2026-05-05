// Blast-radius classifier for self-evolution proposals.
//
// safe-class:      tool description tweak, prompt micro-edit, routing weight
//                  nudge within ±10%, retry-policy tune.
// boundary-class:  new tool added, new model promoted, planner heuristic
//                  structural change, formula parameter outside ±10%.
// doctrine-class:  system prompt rewrite, formula deprecation, governance
//                  gate change.

const SAFE_KINDS = new Set(['tool_description_tweak', 'prompt_micro_edit', 'routing_weight_nudge', 'retry_policy_tune']);
const BOUNDARY_KINDS = new Set(['add_tool', 'promote_model', 'planner_heuristic_change', 'formula_param_change']);
const DOCTRINE_KINDS = new Set(['system_prompt_rewrite', 'formula_deprecation', 'governance_gate_change']);

const SAFE_MAX_MAGNITUDE = 0.10;

export function classify(proposal) {
  if (!proposal || !proposal.kind) return 'doctrine';
  if (DOCTRINE_KINDS.has(proposal.kind)) return 'doctrine';
  if (BOUNDARY_KINDS.has(proposal.kind)) return 'boundary';
  if (SAFE_KINDS.has(proposal.kind)) {
    if (typeof proposal.magnitude === 'number' && Math.abs(proposal.magnitude) > SAFE_MAX_MAGNITUDE) return 'boundary';
    return 'safe';
  }
  // Unknown kind — fail closed.
  return 'doctrine';
}

export const _internal = { SAFE_KINDS, BOUNDARY_KINDS, DOCTRINE_KINDS, SAFE_MAX_MAGNITUDE };
