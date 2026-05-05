// Lutar tool routing + step confidence.
//
// We try to load the canonical Lutar invariant from `@szl-holdings/formulas`
// (in-monorepo). When running outside the monorepo (i.e. after `npm i -g`),
// we fall back to a self-contained pure-function copy so the public install
// stays self-sufficient. The fallback is intentionally simple and conservative
// so that any drift from canonical is on the safe side.

let canonical = null;
try {
  canonical = await import('@szl-holdings/formulas').then((m) => m.lutarInvariant5).catch(() => null);
} catch (_) { canonical = null; }

// Fallback: weighted axes, all in [0,1].
//   axes: { precision, recall, latency, blast, cost }
//   weights default to (0.30, 0.20, 0.15, 0.25, 0.10)
function fallbackLutar(axes, weights) {
  const w = { precision: 0.30, recall: 0.20, latency: 0.15, blast: 0.25, cost: 0.10, ...(weights || {}) };
  const blastInv = 1 - (axes.blast ?? 0);
  const costInv  = 1 - (axes.cost  ?? 0);
  const latInv   = 1 - (axes.latency ?? 0);
  return (
    w.precision * (axes.precision ?? 0) +
    w.recall    * (axes.recall    ?? 0) +
    w.latency   * latInv +
    w.blast     * blastInv +
    w.cost      * costInv
  );
}

const TOOL_AXES = {
  read:           { precision: 0.95, recall: 0.85, latency: 0.10, blast: 0.00, cost: 0.05 },
  write:          { precision: 0.80, recall: 0.50, latency: 0.20, blast: 0.55, cost: 0.10 },
  edit:           { precision: 0.90, recall: 0.60, latency: 0.20, blast: 0.40, cost: 0.10 },
  shell:          { precision: 0.70, recall: 0.50, latency: 0.40, blast: 0.70, cost: 0.20 },
  git:            { precision: 0.85, recall: 0.70, latency: 0.20, blast: 0.40, cost: 0.10 },
  web_search:     { precision: 0.65, recall: 0.80, latency: 0.50, blast: 0.05, cost: 0.30 },
  hf_search:      { precision: 0.70, recall: 0.75, latency: 0.40, blast: 0.05, cost: 0.30 },
  thesis_lookup:  { precision: 0.90, recall: 0.80, latency: 0.15, blast: 0.00, cost: 0.05 },
  formula_lookup: { precision: 0.95, recall: 0.85, latency: 0.10, blast: 0.00, cost: 0.05 },
  proof_query:    { precision: 0.95, recall: 0.90, latency: 0.10, blast: 0.00, cost: 0.05 },
  subagent:       { precision: 0.70, recall: 0.70, latency: 0.80, blast: 0.50, cost: 0.80 },
  finish:         { precision: 1.00, recall: 0.00, latency: 0.00, blast: 0.00, cost: 0.00 },
};

export function lutarScore(toolName) {
  const axes = TOOL_AXES[toolName] || { precision: 0.5, recall: 0.5, latency: 0.5, blast: 0.5, cost: 0.5 };
  if (canonical) {
    try { return canonical(axes); } catch (_) { /* fall through */ }
  }
  return fallbackLutar(axes);
}

// Pick the next tool to run based on the plan's first step, scoring it via Lutar.
export function lutarPick(plan, registeredTools) {
  const step = plan?.steps?.[0];
  if (!step) return { name: 'finish', args: {}, score: lutarScore('finish') };
  const known = registeredTools.find((t) => t.name === step.tool);
  if (!known) return { name: 'finish', args: {}, score: lutarScore('finish'), why: `unknown tool: ${step.tool}` };
  return { name: step.tool, args: step.args || {}, score: lutarScore(step.tool), why: step.why || '' };
}

export const _internal = { fallbackLutar, TOOL_AXES };
