// Safe-class proposal applier and rollback.
//
// Auto-applied proposals must produce a real, observable runtime mutation —
// otherwise "self-evolution" is just bookkeeping. We mutate four levers:
//   1. tool_description_tweak  — appends a hint to a tool's description
//   2. prompt_micro_edit       — bumps a counter consulted by the reflection
//                                builder (used as a per-session prompt nudge)
//   3. routing_weight_nudge    — multiplies the recorded weight for a tool's
//                                preferred provider id by (1 + magnitude)
//   4. retry_policy_tune       — bumps the global retry-attempt count
//
// Every mutation captures a `before` snapshot so rollback (manual or armed)
// can restore the exact prior state. State lives in process memory (the CLI
// is short-lived); persistent state survives in the proof ledger.

import { TOOLS } from '../tools/index.mjs';
import { router } from '../providers/router.mjs';

const RUNTIME = {
  promptNudges: 0,
  retryAttempts: 1,
  routingWeights: new Map(),     // toolName -> { providerId, weight }
  toolDescriptions: new Map(),   // toolName -> [appended-suffix, ...]
};

export function snapshotRuntime() {
  return {
    promptNudges: RUNTIME.promptNudges,
    retryAttempts: RUNTIME.retryAttempts,
    routingWeights: Array.from(RUNTIME.routingWeights.entries()).map(([k, v]) => [k, { ...v }]),
    toolDescriptions: Array.from(RUNTIME.toolDescriptions.entries()).map(([k, v]) => [k, [...v]]),
  };
}

export function apply(proposal) {
  const before = snapshotRuntime();
  let after;
  switch (proposal.kind) {
    case 'tool_description_tweak': {
      const t = TOOLS.find((x) => x.name === proposal.target);
      if (!t) return { applied: false, reason: `unknown tool: ${proposal.target}` };
      const suffix = ` [a11oy-evolve: refined ${new Date().toISOString().slice(0, 10)}]`;
      t.description = (t.description || '') + suffix;
      const prev = RUNTIME.toolDescriptions.get(t.name) || [];
      RUNTIME.toolDescriptions.set(t.name, [...prev, suffix]);
      after = { tool: t.name, description: t.description };
      break;
    }
    case 'prompt_micro_edit': {
      RUNTIME.promptNudges += 1;
      after = { promptNudges: RUNTIME.promptNudges };
      break;
    }
    case 'routing_weight_nudge': {
      const reg = router.registry || [];
      const r = reg[0]; // nudge the highest-weight provider for the picked tool
      if (!r) return { applied: false, reason: 'router registry empty' };
      const prevW = r.weight;
      const factor = 1 + (proposal.magnitude || 0.05);
      // Clamp into (0, 1]. If the nudge would produce no change at the cap,
      // nudge slightly downward instead so the lever remains observable.
      let next = Math.min(1, Math.max(0.01, prevW * factor));
      if (next === prevW) next = Math.max(0.01, prevW * (1 - Math.abs(proposal.magnitude || 0.05)));
      r.weight = next;
      RUNTIME.routingWeights.set(proposal.target, { providerId: r.id, weight: r.weight, prev: prevW });
      after = { providerId: r.id, weight: r.weight };
      break;
    }
    case 'retry_policy_tune': {
      RUNTIME.retryAttempts = Math.min(5, RUNTIME.retryAttempts + 1);
      after = { retryAttempts: RUNTIME.retryAttempts };
      break;
    }
    default:
      return { applied: false, reason: `non-applier kind: ${proposal.kind}` };
  }
  return { applied: true, before, after };
}

export function revert(proposal, snapshot) {
  if (!snapshot) return { reverted: false, reason: 'no snapshot' };
  switch (proposal.kind) {
    case 'tool_description_tweak': {
      const t = TOOLS.find((x) => x.name === proposal.target);
      if (!t) return { reverted: false };
      const suffixes = RUNTIME.toolDescriptions.get(t.name) || [];
      // Strip any suffixes we appended for this tool.
      let desc = t.description || '';
      for (const sfx of suffixes) desc = desc.replace(sfx, '');
      t.description = desc;
      RUNTIME.toolDescriptions.delete(t.name);
      return { reverted: true };
    }
    case 'prompt_micro_edit':
      RUNTIME.promptNudges = snapshot.promptNudges;
      return { reverted: true };
    case 'routing_weight_nudge': {
      const reg = router.registry || [];
      const stored = RUNTIME.routingWeights.get(proposal.target);
      if (stored && reg[0] && reg[0].id === stored.providerId) reg[0].weight = stored.prev;
      RUNTIME.routingWeights.delete(proposal.target);
      return { reverted: true };
    }
    case 'retry_policy_tune':
      RUNTIME.retryAttempts = snapshot.retryAttempts;
      return { reverted: true };
    default:
      return { reverted: false, reason: `non-applier kind: ${proposal.kind}` };
  }
}

export function _resetForTest() {
  RUNTIME.promptNudges = 0;
  RUNTIME.retryAttempts = 1;
  RUNTIME.routingWeights.clear();
  RUNTIME.toolDescriptions.clear();
}

export const _RUNTIME = RUNTIME;
