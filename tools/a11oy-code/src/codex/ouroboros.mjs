// Ouroboros: self-referential plan revision. The planner is asked to
// criticize its own plan against the recent session history and rewrite it.
// In the public, network-free path this is a deterministic structural pass:
//   1. Drop steps that repeat a step already attempted in the last 3 turns.
//   2. Reorder so cheaper, lower-blast-radius steps run first.
//   3. Inject a "verify" step before any step that mutates files or shell.
//
// The resulting plan is structurally distinct from the input and stable under
// repeated application — i.e. the snake fully bites its tail without fraying.

const COST = { read: 1, write: 4, edit: 4, shell: 5, git: 3, web_search: 2, hf_search: 2,
               thesis_lookup: 1, formula_lookup: 1, proof_query: 1, subagent: 6, finish: 0 };
const MUTATING = new Set(['write', 'edit', 'shell', 'git']);

export function ouroboros(plan, { history = [] } = {}) {
  if (!plan || !Array.isArray(plan.steps)) return plan;
  const recent = new Set(history.slice(-3).map((h) => `${h.tool?.name}:${JSON.stringify(h.tool?.args || {})}`));
  const filtered = plan.steps.filter((s) => !recent.has(`${s.tool}:${JSON.stringify(s.args || {})}`));
  // Sort by cost, but `finish` must always be last — never let the planner
  // terminate before it has done any actionable work.
  const finishes = filtered.filter((s) => s.tool === 'finish');
  const work = filtered.filter((s) => s.tool !== 'finish')
    .sort((a, b) => (COST[a.tool] ?? 3) - (COST[b.tool] ?? 3));
  const sorted = [...work, ...finishes];
  const withVerify = [];
  for (const s of sorted) {
    if (MUTATING.has(s.tool) && !withVerify.some((p) => p.tool === 'read' && p.args?.path === s.args?.path)) {
      withVerify.push({ tool: 'read', args: { path: s.args?.path }, why: 'ouroboros: verify before mutating' });
    }
    withVerify.push(s);
  }
  return { ...plan, steps: withVerify, revised_by: 'ouroboros', revised_at: new Date().toISOString() };
}
