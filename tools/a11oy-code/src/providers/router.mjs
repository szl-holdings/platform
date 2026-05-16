// Multi-provider model router.
//
// In production the router consults A11oy's 5-gate governance and the live
// frontier registry (services/frontier-ingest, see #4803) to pick a model.
// In the public install we ship a deterministic local stub so `a11oy-code`
// is fully usable for plan rehearsal, in-the-loop coding sessions, CI
// integration, and offline demos.
//
// Real provider clients are loaded lazily and only if their API keys are
// present in the environment; otherwise we fall back to the stub. This keeps
// the install zero-config and avoids leaking secrets into the public ledger.
//
// Live-registry contract
// ----------------------
// When `A11OY_FRONTIER_REGISTRY_URL` is set, the router fetches that URL on
// cold start and on a refresh interval (default 10 min, override via
// `A11OY_FRONTIER_REGISTRY_REFRESH_MS`). Optional bearer auth via
// `A11OY_FRONTIER_REGISTRY_TOKEN`. The endpoint must return JSON in one of:
//
//   { "models":   [{ id, provider, envKey?, weight? }, ...] }
//   { "registry": [{ id, provider, envKey?, weight? }, ...] }
//   { "promoted": [{ artifact: { id, provider, ... }, ... }, ...] }   // raw frontier-ingest shape
//
// Models with kind !== 'model' are filtered out. Refresh failures fall back
// silently to the bundled registry — `a11oy-code` is never blocked by an
// unreachable governance plane.

import { lutarScore } from '../codex/lutar.mjs';

const PROVIDER_ENV_KEYS = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GOOGLE_API_KEY',
  google: 'GOOGLE_API_KEY',
  kimi: 'MOONSHOT_API_KEY',
  moonshot: 'MOONSHOT_API_KEY',
  hf: 'HF_TOKEN',
  huggingface: 'HF_TOKEN',
  nvidia: 'NVIDIA_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
};

const BUNDLED_REGISTRY = [
  { id: 'claude-4.5',     provider: 'anthropic', envKey: 'ANTHROPIC_API_KEY', weight: 1.00, source: 'bundled' },
  { id: 'gpt-5.5',        provider: 'openai',    envKey: 'OPENAI_API_KEY',    weight: 0.95, source: 'bundled' },
  { id: 'gemini-2.5-pro', provider: 'gemini',    envKey: 'GOOGLE_API_KEY',    weight: 0.90, source: 'bundled' },
  { id: 'kimi-k2',        provider: 'kimi',      envKey: 'MOONSHOT_API_KEY',  weight: 0.85, source: 'bundled' },
  { id: 'hf-router',      provider: 'hf',        envKey: 'HF_TOKEN',          weight: 0.70, source: 'bundled' },
];

// `REGISTRY` is mutated in place so external consumers (e.g. evolve/applier
// nudging routing weights) keep a stable reference across refreshes.
const REGISTRY = BUNDLED_REGISTRY.map((r) => ({ ...r }));

let lastRefreshAt = 0;
let lastRefreshOk = false;
let lastRefreshError = null;
let inFlight = null;
let coldStartTriggered = false;

function defaultRefreshIntervalMs() {
  const raw = Number(process.env.A11OY_FRONTIER_REGISTRY_REFRESH_MS);
  if (Number.isFinite(raw) && raw >= 1000) return raw;
  return 10 * 60 * 1000;
}

function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  // Frontier-ingest PromotionEvent shape.
  if (raw.artifact && typeof raw.artifact === 'object') {
    const a = raw.artifact;
    if (a.kind && a.kind !== 'model') return null;
    const provider = String(a.provider || '').toLowerCase();
    const id = String(a.externalId || a.id || '').trim();
    if (!id || !provider) return null;
    return {
      id,
      provider,
      envKey: PROVIDER_ENV_KEYS[provider] ?? null,
      weight: typeof raw.weight === 'number' ? raw.weight : 0.5,
      source: 'frontier',
    };
  }
  const id = String(raw.id || raw.modelId || raw.model || '').trim();
  const provider = String(raw.provider || '').toLowerCase();
  if (!id || !provider) return null;
  if (raw.kind && raw.kind !== 'model') return null;
  return {
    id,
    provider,
    envKey: typeof raw.envKey === 'string' && raw.envKey.length > 0
      ? raw.envKey
      : (PROVIDER_ENV_KEYS[provider] ?? null),
    weight: typeof raw.weight === 'number' ? raw.weight : 0.5,
    source: 'frontier',
  };
}

function extractEntries(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const buckets = [
    payload.models,
    payload.registry,
    payload.promoted,
    payload?.stores?.operator_model_registry,
    payload?.data?.models,
    payload?.data?.registry,
    payload?.data?.promoted,
  ];
  for (const b of buckets) {
    if (Array.isArray(b)) {
      const out = [];
      for (const r of b) {
        const n = normalizeEntry(r);
        if (n) out.push(n);
      }
      if (out.length > 0) return out;
    }
  }
  return [];
}

function mergeIntoRegistry(entries) {
  // Index by `${provider}:${id}` so frontier entries overwrite bundled ones with
  // the same identity (preserving the array reference for external consumers).
  const byKey = new Map();
  for (const r of REGISTRY) byKey.set(`${r.provider}:${r.id}`, r);

  for (const e of entries) {
    const key = `${e.provider}:${e.id}`;
    const existing = byKey.get(key);
    if (existing) {
      // In-place update — preserve any operator-applied weight nudges by only
      // overwriting weight when the frontier entry carries a numeric weight
      // distinct from our default 0.5 placeholder.
      existing.provider = e.provider;
      existing.envKey = e.envKey ?? existing.envKey;
      if (typeof e.weight === 'number' && e.weight !== 0.5) existing.weight = e.weight;
      existing.source = e.source;
    } else {
      const fresh = { ...e };
      REGISTRY.push(fresh);
      byKey.set(key, fresh);
    }
  }
}

async function fetchRegistryPayload(url, token, signal) {
  const headers = { accept: 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Refresh the in-memory registry from the frontier-ingest service.
 * Returns `{ ok, count, error? }`. Never throws — failures fall back to the
 * bundled registry and are recorded in `router.registryStatus()`.
 */
export async function refreshRegistry(opts = {}) {
  const url = opts.url ?? process.env.A11OY_FRONTIER_REGISTRY_URL;
  if (!url) {
    lastRefreshAt = Date.now();
    lastRefreshOk = false;
    lastRefreshError = 'no-url-configured';
    return { ok: false, count: 0, error: 'no-url-configured' };
  }
  if (inFlight) return inFlight;
  const token = opts.token ?? process.env.A11OY_FRONTIER_REGISTRY_TOKEN;
  const timeoutMs = Number(opts.timeoutMs ?? process.env.A11OY_FRONTIER_REGISTRY_TIMEOUT_MS ?? 5000);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000);
  inFlight = (async () => {
    try {
      const payload = await fetchRegistryPayload(url, token, ac.signal);
      const entries = extractEntries(payload);
      mergeIntoRegistry(entries);
      lastRefreshAt = Date.now();
      lastRefreshOk = true;
      lastRefreshError = null;
      return { ok: true, count: entries.length };
    } catch (err) {
      lastRefreshAt = Date.now();
      lastRefreshOk = false;
      lastRefreshError = String(err?.message || err);
      return { ok: false, count: 0, error: lastRefreshError };
    } finally {
      clearTimeout(timer);
      inFlight = null;
    }
  })();
  return inFlight;
}

function maybeColdStartRefresh() {
  if (coldStartTriggered) return;
  coldStartTriggered = true;
  if (!process.env.A11OY_FRONTIER_REGISTRY_URL) return;
  // Fire-and-forget — never block the first plan() call on a network round-trip.
  refreshRegistry().catch(() => {});
}

function maybeIntervalRefresh() {
  if (!process.env.A11OY_FRONTIER_REGISTRY_URL) return;
  if (Date.now() - lastRefreshAt < defaultRefreshIntervalMs()) return;
  refreshRegistry().catch(() => {});
}

function pickModel(opts) {
  if (opts?.provider && opts?.model) return { provider: opts.provider, model: opts.model };
  // Prefer a provider whose key is present; fall back to the highest-weight registry entry.
  const sorted = REGISTRY.slice().sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  const available = sorted.filter((r) => r.envKey && process.env[r.envKey]);
  const choice = (available[0] || sorted[0] || REGISTRY[0]);
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
    maybeColdStartRefresh();
    maybeIntervalRefresh();
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
  refreshRegistry,
  registryStatus() {
    return {
      lastRefreshAt: lastRefreshAt || null,
      lastRefreshOk,
      lastRefreshError,
      size: REGISTRY.length,
      url: process.env.A11OY_FRONTIER_REGISTRY_URL || null,
    };
  },
  /** Test helper — restores the registry to its bundled defaults. */
  _resetForTest() {
    REGISTRY.length = 0;
    for (const r of BUNDLED_REGISTRY) REGISTRY.push({ ...r });
    lastRefreshAt = 0;
    lastRefreshOk = false;
    lastRefreshError = null;
    inFlight = null;
    coldStartTriggered = false;
  },
};
