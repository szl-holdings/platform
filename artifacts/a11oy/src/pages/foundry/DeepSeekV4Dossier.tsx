import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusPill } from '../../components/ui';

const API = '/api/foundry/deepseek-v4';
const GOLD = '#c9b787';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

type Tab = 'dossier' | 'benchmarks' | 'router' | 'context';

interface Variant {
  id: string; label: string; totalParams: string; activatedParams: string;
  contextLength: number; precision: string; lead: boolean;
}
interface ReasoningMode {
  id: string; label: string; a11oyAutonomy: string; characteristics: string;
  typicalUse: string; responseFormat: string; riskTier: string; contextRecommendation?: string;
}
interface DossierData {
  family: string; publisher: string; license: string;
  variants: Variant[];
  architecture: {
    type: string;
    attention: { name: string; a11oyLens: string; summary: string; proCost1M: { flopsVsV32: number; kvCacheVsV32: number } };
    residual: { name: string; summary: string };
    optimizer: { name: string; summary: string };
    precisionBudget: { label: string; moe: string; otherParams: string; a11oyLens: string };
    preTrainingTokens: string;
  };
  postTraining: { pipeline: string; a11oyLens: string; stages: { id: string; label: string; method: string }[] };
  reasoningModes: ReasoningMode[];
}

interface BenchRow extends Record<string, string | number | null | { covenantLift: number; proofDepth: number; refusalRateUnderPolicy: number; costPerGovernedDecisionUsd: number }> {
  metric: string; category: string;
  a11oy: { covenantLift: number; proofDepth: number; refusalRateUnderPolicy: number; costPerGovernedDecisionUsd: number };
}
interface BenchPayload {
  board: 'frontier' | 'modes';
  rows: BenchRow[];
  a11oyColumns: { id: string; label: string; unit: string; description: string }[];
}

interface Envelope {
  envelopeId: string; variant: string; mode: string; autonomy: string; riskTier: string;
  promptPreview: string; responsePreview: string; responseFormat: string;
  precisionBudget: string; contextBudgetTokens: number;
  metrics: { latencyMs: number; thinkingTokens: number; answerTokens: number; costUsd: number };
  covenant: { policy: string; decision: string; rationale: string };
  trustCenterRef: string | null; createdAt: string;
}

interface Recipe {
  id: string; label: string; summary: string;
  targetTokens: number; recommendedVariant: string; recommendedMode: string;
}
interface IngestResult {
  ingestId: string;
  recipe: Recipe;
  requestedTokens: number;
  utilization: number;
  contextBudgetTokens: number;
  hybridAttention: { kvCacheGiB: number; flopsRelativeToDeepSeekV32: number };
  trustCenterRef: string | null;
  createdAt: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

// ─── Dossier tab ────────────────────────────────────────────────────────────

function DossierTab({ data }: { data: DossierData }) {
  const lead = data.variants.find(v => v.lead) ?? data.variants[0];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Lead Variant" value={lead.label} sub={`${lead.activatedParams} act / ${lead.totalParams} total`} accent={GOLD} />
        <KpiCard label="Context" value={`${(lead.contextLength / 1_000_000).toFixed(0)}M`} sub="tokens" />
        <KpiCard label="Precision" value={lead.precision} sub="MoE FP4 · Dense FP8" />
        <KpiCard label="License" value={data.license} sub={data.publisher} />
      </div>

      <Card>
        <SectionTitle>Hybrid Governance Attention</SectionTitle>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          {data.architecture.attention.summary}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="rounded p-2 border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>1M FLOPs vs V3.2</div>
            <div className="text-lg font-semibold" style={{ color: GOLD }}>{Math.round(data.architecture.attention.proCost1M.flopsVsV32 * 100)}%</div>
          </div>
          <div className="rounded p-2 border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>KV Cache vs V3.2</div>
            <div className="text-lg font-semibold" style={{ color: GOLD }}>{Math.round(data.architecture.attention.proCost1M.kvCacheVsV32 * 100)}%</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Manifold-Constrained Hyper-Connections (mHC)</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            {data.architecture.residual.summary}
          </p>
        </Card>
        <Card>
          <SectionTitle>Precision Budget · {data.architecture.precisionBudget.label}</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            {data.architecture.precisionBudget.a11oyLens}
          </p>
          <div className="flex gap-2 mt-3 text-xs font-mono">
            <span className="px-2 py-1 rounded" style={{ background: 'rgba(201,183,135,0.10)', color: GOLD }}>MoE → {data.architecture.precisionBudget.moe}</span>
            <span className="px-2 py-1 rounded" style={{ background: 'rgba(245,245,245,0.06)', color: 'var(--color-a11oy-text-sub)' }}>Dense → {data.architecture.precisionBudget.otherParams}</span>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>Expert Cultivation → On-Policy Distillation</SectionTitle>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>{data.postTraining.a11oyLens}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {data.postTraining.stages.map(s => (
            <div key={s.id} className="rounded p-3 border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>STAGE</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{s.label}</div>
              <div className="text-xs mt-1" style={{ color: GOLD }}>{s.method}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Three Reasoning Modes → Autonomy Modes</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                <th className="text-left py-2 pr-3 font-mono">Mode</th>
                <th className="text-left py-2 pr-3 font-mono">A11oy Autonomy</th>
                <th className="text-left py-2 pr-3 font-mono">Risk Tier</th>
                <th className="text-left py-2 pr-3 font-mono">Typical Use</th>
                <th className="text-left py-2 pr-3 font-mono">Response Format</th>
              </tr>
            </thead>
            <tbody>
              {data.reasoningModes.map(m => (
                <tr key={m.id} className="border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <td className="py-2 pr-3 font-semibold" style={{ color: GOLD }}>{m.label}</td>
                  <td className="py-2 pr-3" style={{ color: 'var(--color-a11oy-text)' }}>{m.a11oyAutonomy}</td>
                  <td className="py-2 pr-3"><StatusPill status={m.riskTier === 'critical' ? 'WARN' : m.riskTier === 'elevated' ? 'GATED' : 'LIVE'} /></td>
                  <td className="py-2 pr-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.typicalUse}</td>
                  <td className="py-2 pr-3 font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.responseFormat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle>Variants</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.variants.map(v => (
            <div key={v.id} className="rounded p-3 border flex items-center justify-between"
              style={{ borderColor: v.lead ? 'rgba(201,183,135,0.4)' : 'var(--color-a11oy-border)', background: v.lead ? 'rgba(201,183,135,0.04)' : 'transparent' }}>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{v.label}</div>
                <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  {v.activatedParams} act · {v.totalParams} total · {(v.contextLength / 1_000_000).toFixed(0)}M ctx · {v.precision}
                </div>
              </div>
              {v.lead && <StatusPill status="LIVE" />}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Benchmarks tab ─────────────────────────────────────────────────────────

function BenchmarksTab() {
  const [board, setBoard] = useState<'frontier' | 'modes'>('frontier');
  const [data, setData] = useState<BenchPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setData(null); setErr(null);
    fetchJson<BenchPayload>(`${API}/benchmarks?board=${board}`).then(setData).catch(e => setErr((e as Error).message));
  }, [board]);

  if (err) return <Card><div className="text-sm" style={{ color: '#f87171' }}>Failed to load benchmarks: {err}</div></Card>;
  if (!data) return <Card><div className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)' }}>Loading benchmarks…</div></Card>;

  const opponentKeys = Object.keys(data.rows[0] ?? {}).filter(k => k !== 'metric' && k !== 'category' && k !== 'a11oy');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['frontier', 'modes'] as const).map(b => (
          <button key={b} onClick={() => setBoard(b)}
            className="px-3 py-1.5 rounded text-xs font-mono"
            style={{
              background: board === b ? 'rgba(201,183,135,0.15)' : 'transparent',
              color: board === b ? GOLD : 'var(--color-a11oy-text-sub)',
              border: `1px solid ${board === b ? 'rgba(201,183,135,0.4)' : 'var(--color-a11oy-border)'}`,
            }}>
            {b === 'frontier' ? 'Pro-Max vs Frontier' : 'Modes Comparison'}
          </button>
        ))}
      </div>

      <Card>
        <SectionTitle>A11oy-added columns</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {data.a11oyColumns.map(c => (
            <div key={c.id} className="rounded p-2 border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <span className="font-mono" style={{ color: GOLD }}>{c.label}</span>{' '}
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>({c.unit})</span>
              <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.description}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                <th className="text-left py-2 pr-3 font-mono sticky left-0" style={{ background: 'var(--color-a11oy-card)' }}>Metric</th>
                {opponentKeys.map(k => (
                  <th key={k} className="text-right py-2 px-2 font-mono whitespace-nowrap"
                    style={{ color: k.includes('V4') || k.includes('DS-V4') ? GOLD : undefined }}>{k}</th>
                ))}
                <th className="text-right py-2 px-2 font-mono">Covenant Lift</th>
                <th className="text-right py-2 px-2 font-mono">Proof Depth</th>
                <th className="text-right py-2 px-2 font-mono">Refusal %</th>
                <th className="text-right py-2 px-2 font-mono">$/Decision</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className="border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <td className="py-1.5 pr-3 sticky left-0" style={{ background: 'var(--color-a11oy-card)' }}>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text)' }}>{row.metric}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{row.category}</div>
                  </td>
                  {opponentKeys.map(k => {
                    const v = row[k] as number | null;
                    return <td key={k} className="py-1.5 px-2 text-right font-mono"
                      style={{ color: k.includes('V4') || k.includes('DS-V4') ? GOLD : 'var(--color-a11oy-text-sub)' }}>
                      {v == null ? '—' : v}
                    </td>;
                  })}
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: GOLD }}>+{row.a11oy.covenantLift}</td>
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{row.a11oy.proofDepth}</td>
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{row.a11oy.refusalRateUnderPolicy}%</td>
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>${row.a11oy.costPerGovernedDecisionUsd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Router tab ─────────────────────────────────────────────────────────────

function RouterTab({ dossier }: { dossier: DossierData }) {
  const [prompt, setPrompt] = useState('Reconcile the policy diff between covenant v3.1 and v3.2 over the maritime fleet decisions of the last 30 days, then propose three remediation steps.');
  const [variant, setVariant] = useState<'deepseek-v4-pro' | 'deepseek-v4-flash'>('deepseek-v4-pro');
  const [mode, setMode] = useState<'auto' | 'non-think' | 'think-high' | 'think-max'>('auto');
  const [policy, setPolicy] = useState('default');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);

  const loadProofs = useCallback(() => {
    fetchJson<{ envelopes: Envelope[] }>(`${API}/proofs`).then(d => setEnvelopes(d.envelopes)).catch(() => {});
  }, []);
  useEffect(() => { loadProofs(); }, [loadProofs]);

  const run = useCallback(async () => {
    setRunning(true); setError(null);
    try {
      const body = {
        prompt: prompt.trim(),
        variant,
        ...(mode === 'auto' ? {} : { mode }),
        policy,
      };
      const res = await fetchJson<{ envelope: Envelope }>(`${API}/route`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      setEnvelopes(prev => [res.envelope, ...prev].slice(0, 50));
    } catch (e) { setError((e as Error).message); }
    finally { setRunning(false); }
  }, [prompt, variant, mode, policy]);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Reasoning Mode Router</SectionTitle>
        <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          Pin a mode or let the router pick one from prompt heuristics. Every routed call emits a Proof Envelope
          to the Trust Center proof chain.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Variant</div>
            <select value={variant} onChange={e => setVariant(e.target.value as typeof variant)} className="w-full p-2 rounded text-xs"
              style={{ background: 'var(--color-a11oy-card)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
              <option value="deepseek-v4-pro">DeepSeek-V4-Pro (1.6T/49B)</option>
              <option value="deepseek-v4-flash">DeepSeek-V4-Flash (284B/13B)</option>
            </select>
          </div>
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Mode</div>
            <select value={mode} onChange={e => setMode(e.target.value as typeof mode)} className="w-full p-2 rounded text-xs"
              style={{ background: 'var(--color-a11oy-card)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
              <option value="auto">Auto (heuristic)</option>
              {dossier.reasoningModes.map(m => <option key={m.id} value={m.id}>{m.label} → {m.a11oyAutonomy}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Policy</div>
            <select value={policy} onChange={e => setPolicy(e.target.value)} className="w-full p-2 rounded text-xs"
              style={{ background: 'var(--color-a11oy-card)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
              <option value="default">default — permit</option>
              <option value="strict">strict — permit-with-trace</option>
              <option value="refuse">refuse — block</option>
            </select>
          </div>
        </div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
          className="w-full p-3 rounded text-xs font-mono"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
        <div className="flex items-center gap-3 mt-3">
          <button onClick={run} disabled={running || !prompt.trim()}
            className="px-3 py-1.5 rounded text-xs font-semibold"
            style={{ background: running ? 'rgba(201,183,135,0.3)' : GOLD, color: '#0a0a0a', cursor: running ? 'wait' : 'pointer' }}>
            {running ? 'Routing…' : 'Route through A11oy →'}
          </button>
          {error && <span className="text-xs" style={{ color: '#f87171' }}>{error}</span>}
        </div>
      </Card>

      <Card>
        <SectionTitle>Proof Envelopes ({envelopes.length})</SectionTitle>
        {envelopes.length === 0 ? (
          <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No envelopes yet — run a prompt to mint one.</div>
        ) : (
          <div className="space-y-2">
            {envelopes.map(env => (
              <div key={env.envelopeId} className="rounded p-3 border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span style={{ color: GOLD }}>{env.mode}</span>
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>→</span>
                    <span style={{ color: 'var(--color-a11oy-text)' }}>{env.autonomy}</span>
                    <StatusPill status={env.covenant.decision === 'refuse' ? 'ERROR' : env.covenant.decision === 'permit-with-trace' ? 'WARN' : 'LIVE'} />
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    {new Date(env.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-xs mt-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{env.responsePreview}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs font-mono">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>latency <span style={{ color: 'var(--color-a11oy-text)' }}>{env.metrics.latencyMs}ms</span></span>
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>think <span style={{ color: 'var(--color-a11oy-text)' }}>{env.metrics.thinkingTokens}t</span></span>
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>answer <span style={{ color: 'var(--color-a11oy-text)' }}>{env.metrics.answerTokens}t</span></span>
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>cost <span style={{ color: GOLD }}>${env.metrics.costUsd.toFixed(5)}</span></span>
                </div>
                <div className="text-xs mt-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  Covenant: <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{env.covenant.rationale}</span>
                </div>
                {env.trustCenterRef && (
                  <div className="text-xs mt-1 font-mono" style={{ color: GOLD }}>
                    Trust Center: <Link href={b('/trust-center')}>{env.trustCenterRef}</Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Long context tab ──────────────────────────────────────────────────────

function ContextTab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ingest, setIngest] = useState<IngestResult | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [tokens, setTokens] = useState<number>(500_000);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchJson<{ recipes: Recipe[] }>(`${API}/long-context/recipes`)
      .then(d => { setRecipes(d.recipes); setSelected(d.recipes[0]?.id ?? ''); setTokens(d.recipes[0]?.targetTokens ?? 500_000); })
      .catch(e => setErr((e as Error).message));
  }, []);

  const submit = useCallback(async () => {
    setBusy(true); setIngest(null);
    try {
      const r = await fetchJson<{ ingest: IngestResult }>(`${API}/long-context/ingest`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recipeId: selected, estimatedTokens: tokens }),
      });
      setIngest(r.ingest);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }, [selected, tokens]);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>1M-Context Doctrine</SectionTitle>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          The hybrid attention budget (27% FLOPs · 10% KV cache at 1M) is what makes the 1M window affordable inside
          a governed pipeline. A11oy uses it to replay entire Covenant corpora, fleet event windows, and compliance
          packs in a single shot — each ingest is logged into Trust Center.
        </p>
      </Card>

      <Card>
        <SectionTitle>Ingest Recipes</SectionTitle>
        {err && <div className="text-xs mb-2" style={{ color: '#f87171' }}>{err}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recipes.map(r => (
            <button key={r.id} onClick={() => { setSelected(r.id); setTokens(r.targetTokens); }}
              className="rounded p-3 border text-left transition-colors"
              style={{
                borderColor: selected === r.id ? 'rgba(201,183,135,0.5)' : 'var(--color-a11oy-border)',
                background: selected === r.id ? 'rgba(201,183,135,0.05)' : 'transparent',
                cursor: 'pointer',
              }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{r.label}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{r.summary}</div>
              <div className="text-xs mt-2 font-mono" style={{ color: GOLD }}>
                ~{(r.targetTokens / 1000).toFixed(0)}K · {r.recommendedVariant} · {r.recommendedMode}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Submit Ingest</SectionTitle>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Estimated Tokens</div>
            <input type="number" value={tokens} min={1000} max={1_000_000} step={1000}
              onChange={e => setTokens(Math.max(1000, Math.min(1_000_000, Number(e.target.value) || 1000)))}
              className="p-2 rounded text-xs font-mono w-40"
              style={{ background: 'var(--color-a11oy-card)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
          </div>
          <button onClick={submit} disabled={busy || !selected}
            className="px-3 py-2 rounded text-xs font-semibold"
            style={{ background: busy ? 'rgba(201,183,135,0.3)' : GOLD, color: '#0a0a0a', cursor: busy ? 'wait' : 'pointer' }}>
            {busy ? 'Ingesting…' : 'Ingest into 1M context →'}
          </button>
        </div>
        {ingest && (
          <div className="mt-4 rounded p-3 border" style={{ borderColor: 'rgba(201,183,135,0.3)', background: 'rgba(201,183,135,0.04)' }}>
            <div className="text-xs font-mono mb-2" style={{ color: GOLD }}>INGEST {ingest.ingestId.slice(0, 8)}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>tokens <span style={{ color: 'var(--color-a11oy-text)' }}>{ingest.requestedTokens.toLocaleString()}</span></span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>budget util <span style={{ color: 'var(--color-a11oy-text)' }}>{(ingest.utilization * 100).toFixed(1)}%</span></span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>kv-cache <span style={{ color: 'var(--color-a11oy-text)' }}>{ingest.hybridAttention.kvCacheGiB} GiB</span></span>
              <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>flops/V3.2 <span style={{ color: 'var(--color-a11oy-text)' }}>{(ingest.hybridAttention.flopsRelativeToDeepSeekV32 * 100).toFixed(1)}%</span></span>
            </div>
            {ingest.trustCenterRef && (
              <div className="text-xs mt-2 font-mono" style={{ color: GOLD }}>
                Trust Center: <Link href={b('/trust-center')}>{ingest.trustCenterRef}</Link>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Page shell ────────────────────────────────────────────────────────────

export default function DeepSeekV4Dossier() {
  const [tab, setTab] = useState<Tab>('dossier');
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<DossierData>(`${API}/models`).then(setDossier).catch(e => setErr((e as Error).message));
  }, []);

  const tabs: { id: Tab; label: string }[] = useMemo(() => ([
    { id: 'dossier', label: 'Dossier' },
    { id: 'benchmarks', label: 'Benchmarks Board' },
    { id: 'router', label: 'Reasoning Mode Router' },
    { id: 'context', label: '1M-Context Doctrine' },
  ]), []);

  return (
    <Layout>
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <PageHeader
          label="A11OY · FOUNDRY"
          title="DeepSeek-V4 — Million-Token Governed Intelligence"
          subtitle="Lead model in the A11oy Foundry. Hybrid attention, mHC residuals, three reasoning modes mapped to Autonomy Modes, MoE FP4 + dense FP8, 1M token context. MIT-licensed."
          status="LIVE"
        >
          <div className="flex gap-2">
            <Link href={b('/trust-center')} className="px-2 py-1 rounded text-xs font-mono"
              style={{ background: 'rgba(201,183,135,0.1)', color: GOLD, border: '1px solid rgba(201,183,135,0.25)' }}>
              Trust Center →
            </Link>
            <Link href={b('/hub/foundry')} className="px-2 py-1 rounded text-xs font-mono"
              style={{ background: 'rgba(245,245,245,0.06)', color: 'var(--color-a11oy-text-sub)', border: '1px solid var(--color-a11oy-border)' }}>
              Alloy Foundry →
            </Link>
          </div>
        </PageHeader>

        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--color-a11oy-border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-3 py-2 text-xs font-mono"
              style={{
                background: 'transparent',
                color: tab === t.id ? GOLD : 'var(--color-a11oy-text-sub)',
                borderBottom: `2px solid ${tab === t.id ? GOLD : 'transparent'}`,
                cursor: 'pointer',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {err && <Card><div className="text-sm" style={{ color: '#f87171' }}>Failed to load dossier: {err}</div></Card>}
        {!dossier && !err && <Card><div className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)' }}>Loading dossier…</div></Card>}

        {dossier && tab === 'dossier' && <DossierTab data={dossier} />}
        {dossier && tab === 'benchmarks' && <BenchmarksTab />}
        {dossier && tab === 'router' && <RouterTab dossier={dossier} />}
        {dossier && tab === 'context' && <ContextTab />}
      </div>
    </Layout>
  );
}
