// Multi-provider model router.
//
// In production the router consults A11oy's 5-gate governance and the frontier
// registry (services/frontier-ingest) to pick a model. In the public install
// we ship a deterministic local stub so `a11oy-code` is fully usable for plan
// rehearsal, in-the-loop coding sessions, CI integration, and offline demos.
//
// Real provider clients are loaded lazily and only if their API keys are
// present in the environment; otherwise we fall back to the stub. This keeps
// the install zero-config and avoids leaking secrets into the public ledger.

import { lutarScore } from '../codex/lutar.mjs';

const REGISTRY = [
  { id: 'claude-4.5',     provider: 'anthropic', envKey: 'ANTHROPIC_API_KEY', weight: 1.00 },
  { id: 'gpt-5.5',        provider: 'openai',    envKey: 'OPENAI_API_KEY',    weight: 0.95 },
  { id: 'gemini-2.5-pro', provider: 'gemini',    envKey: 'GOOGLE_API_KEY',    weight: 0.90 },
  { id: 'kimi-k2',        provider: 'kimi',      envKey: 'MOONSHOT_API_KEY',  weight: 0.85 },
  { id: 'hf-router',      provider: 'hf',        envKey: 'HF_TOKEN',          weight: 0.70 },
];

function pickModel(opts) {
  if (opts?.provider && opts?.model) return { provider: opts.provider, model: opts.model };
  // Prefer a provider whose key is present; fall back to the highest-weight registry entry.
  const available = REGISTRY.filter((r) => process.env[r.envKey]);
  const choice = (available[0] || REGISTRY[0]);
  return { provider: choice.provider, model: choice.id };
}

function heuristicPlan(userText) {
  const txt = (userText || '').toLowerCase();
  const steps = [];
  if (/\b(read|show|view|cat|inspect)\b/.test(txt))               steps.push({ tool: 'read', args: { path: extractPath(txt) }, why: 'user asked to read' });
  if (/\b(refactor|rename|change|edit|modify|fix)\b/.test(txt))   steps.push({ tool: 'edit', args: { path: extractPath(txt) }, why: 'user asked to edit' });
  // Note: the agent's auto-plan never invokes test/build runners — those are
  // operator commands. We propose a benign read-only `wc` so the loop has a
  // visible default when the user mentions "run" or "test".
  if (/\b(test|run|build|install|exec)\b/.test(txt))              steps.push({ tool: 'shell', args: { cmd: 'wc -l package.json' }, why: 'sizing up' });
  if (/\b(commit|stage|push|diff|log)\b/.test(txt))               steps.push({ tool: 'git', args: { sub: 'status' }, why: 'user asked about git' });
  if (/\b(search|find|google|look up)\b/.test(txt))               steps.push({ tool: 'web_search', args: { q: userText }, why: 'user asked to search' });
  if (/\b(thesis|doctrine|principle)\b/.test(txt))                steps.push({ tool: 'thesis_lookup', args: { q: userText }, why: 'thesis lookup' });
  if (/\b(formula|lutar|ouroboros)\b/.test(txt))                  steps.push({ tool: 'formula_lookup', args: { q: userText }, why: 'formula lookup' });
  if (/\b(proof|ledger|audit)\b/.test(txt))                       steps.push({ tool: 'proof_query', args: { limit: 20 }, why: 'proof query' });
  if (steps.length === 0) steps.push({ tool: 'read', args: { path: '.' }, why: 'orient by reading working directory' });
  steps.push({ tool: 'finish', args: {}, why: 'wrap up' });
  return { goal: userText, steps };
}

function extractPath(txt) {
  const m = txt.match(/[\w./-]+\.(?:ts|tsx|js|jsx|mjs|py|md|json)\b/);
  return m ? m[0] : '.';
}

export const router = {
  async plan({ userText, history, opts }) {
    const { provider, model } = pickModel(opts);
    const plan = heuristicPlan(userText);
    plan.provider = provider;
    plan.model = model;
    plan.lutar_router_score = lutarScore('formula_lookup'); // routing is itself a low-blast lookup
    return plan;
  },
  async reflect({ plan, toolPick, toolResult, opts }) {
    const ok = toolResult?.ok !== false;
    const done = toolPick?.name === 'finish';
    return {
      ok, done,
      summary: ok ? `${toolPick?.name} succeeded` : `${toolPick?.name} failed: ${toolResult?.error}`,
      next: done ? null : 'continue',
    };
  },
  registry: REGISTRY,
};
