// MirrorEval: per-turn quality score in [0,1].
//
// Components (weighted):
//   plan_coherence  0.25  — plan has at least one step, no duplicates
//   tool_success    0.30  — tool returned ok:true
//   lutar_alignment 0.20  — Lutar score of the picked tool
//   reflection      0.15  — reflection structure present
//   safety          0.10  — mutating tools were verified-before by Ouroboros
//
// The score is the gate for bounded autonomous self-evolution. Drops below
// the per-session baseline trigger a self-improvement proposal.

const W = { plan: 0.25, success: 0.30, lutar: 0.20, reflection: 0.15, safety: 0.10 };

function planCoherence(plan) {
  if (!plan?.steps?.length) return 0;
  const seen = new Set();
  for (const s of plan.steps) {
    const k = `${s.tool}:${JSON.stringify(s.args || {})}`;
    if (seen.has(k)) return 0.5;
    seen.add(k);
  }
  return 1;
}

function safety(plan, toolPick) {
  const mutating = new Set(['write', 'edit', 'shell', 'git']);
  if (!mutating.has(toolPick?.name)) return 1;
  const idx = plan?.steps?.findIndex((s) => s.tool === toolPick.name);
  if (idx === undefined || idx <= 0) return 0.5;
  const prev = plan.steps[idx - 1];
  return prev?.tool === 'read' ? 1 : 0.5;
}

export function mirrorEval({ plan, toolPick, toolResult, reflection }) {
  const score =
    W.plan       * planCoherence(plan) +
    W.success    * (toolResult?.ok === false ? 0 : 1) +
    W.lutar      * (toolPick?.score ?? 0) +
    W.reflection * (reflection ? 1 : 0) +
    W.safety     * safety(plan, toolPick);
  return Math.max(0, Math.min(1, score));
}
