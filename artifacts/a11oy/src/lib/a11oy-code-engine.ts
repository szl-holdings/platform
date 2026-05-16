// Web adapter for @szl/a11oy-code (tools/a11oy-code/src/index.mjs).
//
// The CLI engine in tools/a11oy-code is Node-only: it touches node:fs, node:os,
// node:child_process, and node:readline. This module ports the *same* governance
// loop — Ouroboros plan revision, Lutar tool routing, MirrorEval per-turn
// scoring, deterministic local router stub — into the browser so the in-A11oy
// /code panel runs the exact same plan/tool/reflection pipeline that ships in
// the public npm package. The proof ledger uses localStorage as the in-browser
// equivalent of the CLI's hash-chained ~/.a11oy-code/proof.jsonl file, with the
// same {prev,hash} chaining and the same entry kinds.
//
// Keep this file in lock-step with tools/a11oy-code/src/codex/{ouroboros,
// lutar,mirroreval}.mjs and tools/a11oy-code/src/providers/router.mjs.

export type ToolName =
  | 'read' | 'write' | 'edit' | 'shell' | 'git'
  | 'web_search' | 'hf_search' | 'thesis_lookup' | 'formula_lookup'
  | 'proof_query' | 'subagent' | 'finish';

export interface PlanStep { tool: ToolName; args?: Record<string, unknown>; why?: string }
export interface Plan {
  goal: string;
  steps: PlanStep[];
  provider?: string;
  model?: string;
  lutar_router_score?: number;
  revised_by?: string;
  revised_at?: string;
}
export interface ToolPick { name: ToolName; args: Record<string, unknown>; score: number; why?: string }
export interface ToolResult { ok: boolean; [k: string]: unknown }
export interface Reflection { ok: boolean; done: boolean; summary: string; next: string | null }
export interface Turn {
  user: string;
  plan: Plan;
  tool: ToolPick;
  result: ToolResult;
  reflection: Reflection;
  score: number;
}
export interface Session {
  id: string;
  history: Turn[];
  startedAt: string;
  opts: { provider?: string; model?: string; autonomy?: boolean };
}

export interface ProofEntry {
  ts: string;
  prev: string;
  hash: string;
  kind: string;
  session?: string;
  [k: string]: unknown;
}

// ---- Lutar (mirrors src/codex/lutar.mjs) ---------------------------------
const TOOL_AXES: Record<ToolName, { precision: number; recall: number; latency: number; blast: number; cost: number }> = {
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
const W_LUTAR = { precision: 0.30, recall: 0.20, latency: 0.15, blast: 0.25, cost: 0.10 };

export function lutarScore(name: ToolName): number {
  const a = TOOL_AXES[name];
  if (!a) return 0.5;
  return W_LUTAR.precision * a.precision +
         W_LUTAR.recall    * a.recall +
         W_LUTAR.latency   * (1 - a.latency) +
         W_LUTAR.blast     * (1 - a.blast) +
         W_LUTAR.cost      * (1 - a.cost);
}

export function lutarPick(plan: Plan): ToolPick {
  const step = plan.steps?.[0];
  if (!step) return { name: 'finish', args: {}, score: lutarScore('finish') };
  return { name: step.tool, args: step.args || {}, score: lutarScore(step.tool), why: step.why };
}

// ---- Ouroboros (mirrors src/codex/ouroboros.mjs) -------------------------
const COST: Record<ToolName, number> = {
  read: 1, write: 4, edit: 4, shell: 5, git: 3, web_search: 2, hf_search: 2,
  thesis_lookup: 1, formula_lookup: 1, proof_query: 1, subagent: 6, finish: 0,
};
const MUTATING = new Set<ToolName>(['write', 'edit', 'shell', 'git']);

export function ouroboros(plan: Plan, history: Turn[] = []): Plan {
  if (!plan?.steps) return plan;
  const recent = new Set(history.slice(-3).map(h => `${h.tool?.name}:${JSON.stringify(h.tool?.args || {})}`));
  const filtered = plan.steps.filter(s => !recent.has(`${s.tool}:${JSON.stringify(s.args || {})}`));
  const finishes = filtered.filter(s => s.tool === 'finish');
  const work = filtered.filter(s => s.tool !== 'finish').sort((a, b) => (COST[a.tool] ?? 3) - (COST[b.tool] ?? 3));
  const sorted = [...work, ...finishes];
  const withVerify: PlanStep[] = [];
  for (const s of sorted) {
    if (MUTATING.has(s.tool) && !withVerify.some(p => p.tool === 'read' && (p.args as { path?: string })?.path === (s.args as { path?: string })?.path)) {
      withVerify.push({ tool: 'read', args: { path: (s.args as { path?: string })?.path }, why: 'ouroboros: verify before mutating' });
    }
    withVerify.push(s);
  }
  return { ...plan, steps: withVerify, revised_by: 'ouroboros', revised_at: new Date().toISOString() };
}

// ---- MirrorEval (mirrors src/codex/mirroreval.mjs) -----------------------
const W_EVAL = { plan: 0.25, success: 0.30, lutar: 0.20, reflection: 0.15, safety: 0.10 };
function planCoherence(plan: Plan): number {
  if (!plan?.steps?.length) return 0;
  const seen = new Set<string>();
  for (const s of plan.steps) {
    const k = `${s.tool}:${JSON.stringify(s.args || {})}`;
    if (seen.has(k)) return 0.5;
    seen.add(k);
  }
  return 1;
}
function safety(plan: Plan, pick: ToolPick): number {
  if (!MUTATING.has(pick.name)) return 1;
  const idx = plan.steps?.findIndex(s => s.tool === pick.name);
  if (idx === undefined || idx <= 0) return 0.5;
  return plan.steps[idx - 1]?.tool === 'read' ? 1 : 0.5;
}
export function mirrorEval(p: { plan: Plan; toolPick: ToolPick; toolResult: ToolResult; reflection: Reflection | null }): number {
  const score =
    W_EVAL.plan       * planCoherence(p.plan) +
    W_EVAL.success    * (p.toolResult?.ok === false ? 0 : 1) +
    W_EVAL.lutar      * (p.toolPick?.score ?? 0) +
    W_EVAL.reflection * (p.reflection ? 1 : 0) +
    W_EVAL.safety     * safety(p.plan, p.toolPick);
  return Math.max(0, Math.min(1, score));
}

// ---- Router (mirrors src/providers/router.mjs heuristic plan) ------------
function extractPath(txt: string): string {
  const m = txt.match(/[\w./-]+\.(?:ts|tsx|js|jsx|mjs|py|md|json)\b/);
  return m ? m[0] : '.';
}
export function heuristicPlan(userText: string): Plan {
  const txt = (userText || '').toLowerCase();
  const steps: PlanStep[] = [];
  if (/\b(read|show|view|cat|inspect)\b/.test(txt))             steps.push({ tool: 'read', args: { path: extractPath(txt) }, why: 'user asked to read' });
  if (/\b(refactor|rename|change|edit|modify|fix)\b/.test(txt)) steps.push({ tool: 'edit', args: { path: extractPath(txt) }, why: 'user asked to edit' });
  if (/\b(test|run|build|install|exec)\b/.test(txt))            steps.push({ tool: 'shell', args: { cmd: 'wc -l package.json' }, why: 'sizing up' });
  if (/\b(commit|stage|push|diff|log)\b/.test(txt))             steps.push({ tool: 'git', args: { sub: 'status' }, why: 'user asked about git' });
  if (/\b(search|find|google|look up)\b/.test(txt))             steps.push({ tool: 'web_search', args: { q: userText }, why: 'user asked to search' });
  if (/\b(thesis|doctrine|principle)\b/.test(txt))              steps.push({ tool: 'thesis_lookup', args: { q: userText }, why: 'thesis lookup' });
  if (/\b(formula|lutar|ouroboros)\b/.test(txt))                steps.push({ tool: 'formula_lookup', args: { q: userText }, why: 'formula lookup' });
  if (/\b(proof|ledger|audit)\b/.test(txt))                     steps.push({ tool: 'proof_query', args: { limit: 20 }, why: 'proof query' });
  if (steps.length === 0) steps.push({ tool: 'read', args: { path: '.' }, why: 'orient by reading working directory' });
  steps.push({ tool: 'finish', args: {}, why: 'wrap up' });
  return { goal: userText, steps };
}

export const router = {
  async plan(userText: string, _history: Turn[]): Promise<Plan> {
    const plan = heuristicPlan(userText);
    plan.provider = 'local-stub';
    plan.model = 'a11oy-code-web';
    plan.lutar_router_score = lutarScore('formula_lookup');
    return plan;
  },
  async reflect(plan: Plan, pick: ToolPick, result: ToolResult): Promise<Reflection> {
    const ok = result?.ok !== false;
    const done = pick?.name === 'finish';
    return {
      ok, done,
      summary: ok ? `${pick?.name} succeeded` : `${pick?.name} failed: ${String(result?.error ?? 'unknown')}`,
      next: done ? null : 'continue',
    };
  },
};

// ---- Tools — browser-safe versions ---------------------------------------
// In the browser there is no real filesystem. The CLI tools operate on
// process.cwd(); the web panel operates on a small in-memory virtual
// workspace seeded from the editor. read/write/edit operate on that map.
// shell/git return informative governance stubs (the CLI's allowlist would
// be meaningless without a real shell). Lookups mirror the CLI defaults.
export interface VirtualFS {
  files: Record<string, string>;
}

export async function runTool(
  name: ToolName,
  args: Record<string, unknown>,
  ctx: { fs: VirtualFS; ledger: ProofLedger },
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'read': {
        const path = String(args.path ?? '.');
        if (path === '.' || path === '/') {
          return { ok: true, kind: 'dir', entries: Object.keys(ctx.fs.files) };
        }
        const content = ctx.fs.files[path];
        if (content === undefined) return { ok: false, error: `not found: ${path}` };
        return { ok: true, kind: 'file', content: content.slice(0, 64 * 1024) };
      }
      case 'write': {
        const path = String(args.path ?? '');
        if (!path) return { ok: false, error: 'path required' };
        const content = String(args.content ?? '');
        ctx.fs.files[path] = content;
        return { ok: true, bytes: content.length };
      }
      case 'edit': {
        const path = String(args.path ?? '');
        const cur = ctx.fs.files[path];
        if (cur === undefined) return { ok: false, error: `not found: ${path}` };
        const oldStr = args.old_string as string | undefined;
        const newStr = (args.new_string as string | undefined) ?? '';
        if (oldStr && !cur.includes(oldStr)) return { ok: false, error: 'old_string not found' };
        const next = oldStr ? cur.replace(oldStr, newStr) : cur;
        ctx.fs.files[path] = next;
        return { ok: true, bytes: next.length };
      }
      case 'shell':
        return { ok: true, stdout: `[browser-stub] would run: ${String(args.cmd ?? '')}`, note: 'shell is governed in CLI; in-browser is a stub' };
      case 'git':
        return { ok: true, stdout: `[browser-stub] git ${String(args.sub ?? 'status')}`, note: 'git is read-only in CLI; in-browser is a stub' };
      case 'web_search':
        return { ok: true, q: args.q, results: [], note: 'offline stub — wire WEB_SEARCH_API_KEY to enable' };
      case 'hf_search':
        return { ok: true, q: args.q, results: [], note: 'offline stub — set HF_TOKEN to enable' };
      case 'thesis_lookup':
        return { ok: true, q: args.q, hits: [{ title: 'Ouroboros (v6)', section: 'self-revision' }] };
      case 'formula_lookup':
        return { ok: true, q: args.q, hits: ['lutarInvariant5', 'mirrorEval', 'ouroboros'] };
      case 'proof_query':
        return { ok: true, entries: ctx.ledger.read({ limit: Number(args.limit ?? 20) }) };
      case 'subagent':
        return { ok: true, task: args.task, note: 'sub-agent stub — wire to lib/a11oy-agent for full execution' };
      case 'finish':
        return { ok: true, done: true };
      default:
        return { ok: false, error: `unknown tool: ${String(name)}` };
    }
  } catch (err) {
    return { ok: false, error: String((err as Error)?.message ?? err) };
  }
}

// ---- Proof ledger (browser equivalent of src/proof.mjs) ------------------
// JSON entries persisted to localStorage, hash-chained the same way the CLI
// chains its JSONL file. The hash is a hex-encoded sha256 prefix over the
// previous hash and the JSON-stringified payload.
const LEDGER_KEY = 'a11oy-code:proof-ledger';

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }
  // Fallback (SSR / very old browsers): non-cryptographic, still chained.
  let h = 0;
  for (let i = 0; i < input.length; i++) { h = ((h << 5) - h + input.charCodeAt(i)) | 0; }
  return (h >>> 0).toString(16).padStart(16, '0');
}

export class ProofLedger {
  private entries: ProofEntry[] = [];
  private listeners = new Set<(entries: ProofEntry[]) => void>();
  private storage: Storage | null;

  constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : null;
    if (this.storage) {
      try {
        const raw = this.storage.getItem(LEDGER_KEY);
        if (raw) this.entries = JSON.parse(raw) as ProofEntry[];
      } catch { /* ignore corrupt cache */ }
    }
  }

  async append(entry: Omit<ProofEntry, 'ts' | 'prev' | 'hash'>): Promise<ProofEntry> {
    const prev = this.entries.length ? this.entries[this.entries.length - 1].hash : 'GENESIS';
    const payload = { ts: new Date().toISOString(), prev, ...entry };
    const hash = await sha256Hex(prev + JSON.stringify(payload));
    const full: ProofEntry = { ...payload, hash } as ProofEntry;
    this.entries.push(full);
    if (this.entries.length > 500) this.entries = this.entries.slice(-500);
    this.persist();
    for (const l of this.listeners) l(this.snapshot());
    return full;
  }

  read(filter: { session?: string; kind?: string; limit?: number } = {}): ProofEntry[] {
    const limit = filter.limit ?? 200;
    const out: ProofEntry[] = [];
    for (let i = this.entries.length - 1; i >= 0 && out.length < limit; i--) {
      const e = this.entries[i];
      if (filter.session && e.session !== filter.session) continue;
      if (filter.kind && e.kind !== filter.kind) continue;
      out.push(e);
    }
    return out.reverse();
  }

  snapshot(): ProofEntry[] { return [...this.entries]; }

  subscribe(fn: (entries: ProofEntry[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => { this.listeners.delete(fn); };
  }

  private persist() {
    if (!this.storage) return;
    try { this.storage.setItem(LEDGER_KEY, JSON.stringify(this.entries)); } catch { /* quota */ }
  }
}

// Module-level shared ledger so the in-A11oy /code panel and any embedders
// in the same tab observe the same hash chain — the browser equivalent of
// the CLI's single ~/.a11oy-code/proof.jsonl file.
export const proof = new ProofLedger();

// ---- Session / turn loop --------------------------------------------------
export function newSessionId(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newSession(opts: Session['opts'] = {}): Session {
  return { id: newSessionId(), history: [], startedAt: new Date().toISOString(), opts };
}

export async function runTurn(
  session: Session,
  userText: string,
  ctx: { fs: VirtualFS; ledger?: ProofLedger },
): Promise<Turn> {
  const ledger = ctx.ledger ?? proof;

  let plan = await router.plan(userText, session.history);
  await ledger.append({ kind: 'plan', plan, session: session.id });

  plan = ouroboros(plan, session.history);
  await ledger.append({ kind: 'plan_revised', plan, session: session.id });

  const pick = lutarPick(plan);
  await ledger.append({ kind: 'tool_pick', tool: pick.name, score: pick.score, session: session.id });

  const result = await runTool(pick.name, pick.args, { fs: ctx.fs, ledger });
  await ledger.append({ kind: 'tool_result', tool: pick.name, ok: result.ok !== false, session: session.id });

  const reflection = await router.reflect(plan, pick, result);
  const score = mirrorEval({ plan, toolPick: pick, toolResult: result, reflection });
  await ledger.append({ kind: 'mirroreval', score, session: session.id });

  const turn: Turn = { user: userText, plan, tool: pick, result, reflection, score };
  session.history.push(turn);
  return turn;
}

export async function startSession(opts: Session['opts'] = {}): Promise<Session> {
  const session = newSession(opts);
  await proof.append({ kind: 'session_start', session: session.id, opts });
  return session;
}
