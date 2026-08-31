import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusPill } from '../components/ui';

const API = '/api/a11oy';

interface ModelProfile {
  id: string; name: string; provider: string; providerLabel: string; role: string;
  routingModes: string[]; costPer1kTokens: number; avgLatencyMs: number;
  maxContextTokens: number; callsTotal: number; callsToday: number;
  tokensUsedToday: number; costToday: number; failureRate: number;
  fallbackEvents: number; status: string; demoMode: boolean; healthScore: number;
  domains: string[];
}

interface RoutingRule { mode: string; model: string; reason: string; }
interface HealthEntry { id: string; name: string; provider: string; status: string; healthScore: number; latencyMs: number; failureRate: number; demoMode: boolean; }

interface ModelsData { models: ModelProfile[]; routingPolicy: RoutingRule[]; }
interface HealthData { providers: HealthEntry[]; activeProvider: string; fallbackChain: string[]; lastHealthCheck: string; }

interface InferenceRecipe {
  id: string;
  name: string;
  model: string;
  provider: string;
  task: string;
  taskCategory: string;
  domain: string;
  governanceTier: 'standard' | 'elevated' | 'sovereign';
  covenantPolicy: string[];
  proofChain: boolean;
  shadowCouncil: boolean;
  description: string;
  examplePrompt: string;
  tags: string[];
}

const GOVERNANCE_TIER_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  standard:  { bg: 'rgba(94,94,94,0.15)',   color: '#8a8a8a', label: 'Standard' },
  elevated:  { bg: 'rgba(201,183,135,0.15)', color: '#c9b787', label: 'Elevated' },
  sovereign: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', label: 'Sovereign' },
};

const INFERENCE_RECIPES: InferenceRecipe[] = [
  {
    id: 'rec-maritime-risk',
    name: 'Maritime Risk Assessment',
    model: 'GPT-5.1',
    provider: 'OpenAI',
    task: 'Deep Reasoning',
    taskCategory: 'deep_reasoning',
    domain: 'Maritime',
    governanceTier: 'elevated',
    covenantPolicy: ['sanctions-screening-required', 'flag-state-approval', 'human-review-on-high-risk'],
    proofChain: true,
    shadowCouncil: true,
    description: 'Run GPT-5.1 for deep multi-factor risk reasoning on maritime signals — voyage economics, AIS anomalies, flag state compliance — with Covenant Policy gate and Proof Chain logging on every inference.',
    examplePrompt: 'Assess voyage risk for VLCC en route through Strait of Hormuz given current geopolitical signals, cargo manifest, and flag state profile.',
    tags: ['maritime', 'risk', 'compliance', 'sanctions'],
  },
  {
    id: 'rec-legal-analysis',
    name: 'Legal Document Analysis',
    model: 'Claude 4 Opus',
    provider: 'Anthropic',
    task: 'Long Context Analysis',
    taskCategory: 'long_context',
    domain: 'Legal',
    governanceTier: 'sovereign',
    covenantPolicy: ['privilege-preservation', 'pii-redaction-enforced', 'attorney-approval-required', 'no-external-disclosure'],
    proofChain: true,
    shadowCouncil: true,
    description: 'Deploy Claude 4 Opus for privileged legal document analysis with Constitutional AI alignment, Shadow Council adversarial review, and attorney-in-loop approval gate before any conclusion is surfaced.',
    examplePrompt: 'Extract material obligations, breach conditions, and renewal triggers from a 200-page master service agreement. Flag regulatory exposure.',
    tags: ['legal', 'contracts', 'privilege', 'compliance'],
  },
  {
    id: 'rec-security-triage',
    name: 'Security Threat Triage',
    model: 'o4-mini',
    provider: 'OpenAI',
    task: 'Fast Triage',
    taskCategory: 'fast_triage',
    domain: 'Security',
    governanceTier: 'elevated',
    covenantPolicy: ['threat-intel-classification', 'incident-escalation-gate', 'mitre-mapping-required'],
    proofChain: true,
    shadowCouncil: false,
    description: 'Run o4-mini for sub-500ms security alert triage — MITRE ATT&CK classification, false positive scoring, and escalation routing — with Covenant Policy enforcement and Proof Chain attribution.',
    examplePrompt: 'Triage 47 security alerts from SIEM. Classify by MITRE ATT&CK, score false positive probability, recommend escalation for each.',
    tags: ['security', 'triage', 'MITRE', 'SOC'],
  },
  {
    id: 'rec-sovereign-inference',
    name: 'Sovereign On-Premise Inference',
    model: 'Llama 4 Maverick',
    provider: 'Meta',
    task: 'General Reasoning',
    taskCategory: 'deep_reasoning',
    domain: 'All Domains',
    governanceTier: 'sovereign',
    covenantPolicy: ['air-gapped-execution', 'no-external-api-calls', 'data-residency-enforced', 'sovereign-audit-trail'],
    proofChain: true,
    shadowCouncil: true,
    description: 'Deploy Llama 4 Maverick in air-gapped sovereign mode — no external API calls, full data residency, on-premise Proof Chain — for regulated industries requiring complete infrastructure sovereignty.',
    examplePrompt: 'Analyze classified intelligence signal corpus with no data leaving the secure enclave. Generate risk assessment with full attribution.',
    tags: ['sovereign', 'air-gapped', 'classified', 'defense'],
  },
  {
    id: 'rec-financial-modeling',
    name: 'Portfolio Financial Modeling',
    model: 'DeepSeek V4-Pro',
    provider: 'DeepSeek',
    task: 'Mathematical Reasoning',
    taskCategory: 'deep_reasoning',
    domain: 'Financial',
    governanceTier: 'elevated',
    covenantPolicy: ['financial-model-approval', 'materiality-threshold-gate', 'cfo-sign-off-required'],
    proofChain: true,
    shadowCouncil: true,
    description: 'Run DeepSeek V4-Pro (236B MoE, 22B active) for complex portfolio analytics and voyage economics — exceptional at mathematical reasoning — with CFO-approval gate on material recommendations.',
    examplePrompt: 'Model Q3 voyage economics for 12-vessel fleet under current bunker prices, freight rates, and port congestion. Identify optimization opportunities.',
    tags: ['financial', 'modeling', 'portfolio', 'economics'],
  },
  {
    id: 'rec-code-modernization',
    name: 'Legacy Code Modernization',
    model: 'Qwen2.5-Coder',
    provider: 'Qwen',
    task: 'Code Analysis',
    taskCategory: 'code_analysis',
    domain: 'Engineering',
    governanceTier: 'standard',
    covenantPolicy: ['test-coverage-required', 'breaking-change-approval', 'proof-chain-logging'],
    proofChain: true,
    shadowCouncil: false,
    description: 'Deploy Qwen2.5-Coder for high-throughput legacy code analysis and modernization — COBOL-to-TypeScript, Oracle-to-PostgreSQL — with Proof Chain recording every transformation for audit.',
    examplePrompt: 'Analyze 50,000 lines of COBOL. Extract business logic, identify migration blockers, generate TypeScript equivalents with test coverage.',
    tags: ['engineering', 'migration', 'COBOL', 'modernization'],
  },
  {
    id: 'rec-board-packet',
    name: 'Board Packet Synthesis',
    model: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    task: 'Document Synthesis',
    taskCategory: 'board_packet',
    domain: 'Executive',
    governanceTier: 'sovereign',
    covenantPolicy: ['board-confidentiality', 'material-nonpublic-gate', 'legal-counsel-review', 'distribution-restricted'],
    proofChain: true,
    shadowCouncil: true,
    description: 'Run Claude 4 Sonnet for board-level document synthesis — 10-Ks, investor presentations, governance packets — with Shadow Council review for factual accuracy and legal counsel approval gate.',
    examplePrompt: 'Synthesize Q4 board packet from: audited financials, 10 operating reports, 3 legal briefs. Flag material risks for board attention.',
    tags: ['executive', 'board', 'governance', 'synthesis'],
  },
  {
    id: 'rec-research-synthesis',
    name: 'Deep Research Synthesis',
    model: 'KIMI-K2.5',
    provider: 'Moonshot',
    task: 'Long Context Research',
    taskCategory: 'long_context',
    domain: 'Research',
    governanceTier: 'standard',
    covenantPolicy: ['source-attribution-required', 'hallucination-check-enabled', 'proof-chain-logging'],
    proofChain: true,
    shadowCouncil: true,
    description: 'Deploy KIMI-K2.5 (massive long-context specialist) for deep research synthesis across large document corpora — regulatory filings, academic literature, market intelligence — with Shadow Council hallucination check.',
    examplePrompt: 'Synthesize 500 regulatory filings across 5 jurisdictions to identify compliance gaps and cross-border obligations for maritime operations.',
    tags: ['research', 'synthesis', 'regulatory', 'long-context'],
  },
  {
    id: 'rec-real-estate-scoring',
    name: 'Real Estate Risk Scoring',
    model: 'Gemini 2.5 Pro',
    provider: 'Google',
    task: 'Multi-Modal Analysis',
    taskCategory: 'document_analysis',
    domain: 'Real Estate',
    governanceTier: 'elevated',
    covenantPolicy: ['appraisal-approval-gate', 'climate-risk-disclosure', 'human-review-on-material'],
    proofChain: true,
    shadowCouncil: false,
    description: 'Run Gemini 2.5 Pro for multi-modal real estate portfolio analysis — satellite imagery, valuation documents, climate risk models, zoning maps — with Proof Chain attribution on every scoring output.',
    examplePrompt: 'Score 120 commercial properties for climate risk, flood exposure, and rezoning probability. Flag top-10 risk concentrations.',
    tags: ['real-estate', 'climate-risk', 'portfolio', 'valuation'],
  },
  {
    id: 'rec-eval-judge',
    name: 'Governance Eval Judge',
    model: 'GPT-5.1',
    provider: 'OpenAI',
    task: 'Eval Judge',
    taskCategory: 'eval_judge',
    domain: 'Platform',
    governanceTier: 'elevated',
    covenantPolicy: ['eval-chain-of-custody', 'benchmark-reproducibility', 'governance-audit-required'],
    proofChain: true,
    shadowCouncil: false,
    description: 'Deploy GPT-5.1 as governance eval judge — continuously scoring agent outputs against quality benchmarks, policy compliance, and factual accuracy — with full Proof Chain attribution for MirrorEval.',
    examplePrompt: 'Judge 1,000 agent outputs for factual accuracy, policy compliance, and reasoning quality. Generate benchmark report with confidence intervals.',
    tags: ['eval', 'benchmark', 'governance', 'judge'],
  },
  {
    id: 'rec-batch-classification',
    name: 'High-Volume Entity Classification',
    model: 'GPT-4.1 nano',
    provider: 'OpenAI',
    task: 'Fast Triage',
    taskCategory: 'fast_triage',
    domain: 'All Domains',
    governanceTier: 'standard',
    covenantPolicy: ['throughput-optimization', 'proof-chain-logging', 'anomaly-flag-escalation'],
    proofChain: true,
    shadowCouncil: false,
    description: 'Run GPT-4.1 nano for maximum-throughput entity classification — vessel names, legal entities, counterparty screening, signal tagging — with Proof Chain attribution at minimal cost.',
    examplePrompt: 'Classify 50,000 vessel names against sanctions lists, flag state registers, and beneficial ownership databases. Return risk scores with confidence.',
    tags: ['classification', 'throughput', 'screening', 'entities'],
  },
  {
    id: 'rec-proof-reconstruction',
    name: 'Decision Proof Reconstruction',
    model: 'o3',
    provider: 'OpenAI',
    task: 'Proof Reconstruction',
    taskCategory: 'proof_reconstruction',
    domain: 'Platform',
    governanceTier: 'sovereign',
    covenantPolicy: ['tamper-verification', 'chain-of-custody', 'regulator-ready-output', 'legal-admissibility'],
    proofChain: true,
    shadowCouncil: false,
    description: 'Deploy o3 for decision proof reconstruction — reconstructing the complete causal chain from evidence → inference → approval → action for regulatory or legal proceedings. Outputs are regulator-ready.',
    examplePrompt: 'Reconstruct the complete proof chain for Decision ID 0xd4a7...b2f3 — every signal, model call, approval event, and outcome — in regulator-ready format.',
    tags: ['proof', 'reconstruction', 'regulatory', 'legal-admissibility'],
  },
];

const ALL_DOMAINS = ['All', ...Array.from(new Set(INFERENCE_RECIPES.map(r => r.domain))).sort()];
const ALL_TASKS = ['All', ...Array.from(new Set(INFERENCE_RECIPES.map(r => r.task))).sort()];
const ALL_TIERS = ['All', 'standard', 'elevated', 'sovereign'];

const STATUS_MAP: Record<string, 'LIVE' | 'ROADMAP'> = {
  active: 'LIVE', roadmap: 'ROADMAP',
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#c9b787', deepseek: '#c9b787', nvidia: '#c9b787', mock: '#8a8a8a', local: '#5e5e5e',
};

const MODE_LABELS: Record<string, string> = {
  fast_triage: 'Fast Triage',
  deep_reasoning: 'Deep Reasoning',
  long_context: 'Long Context',
  code_analysis: 'Code Analysis',
  document_analysis: 'Document Analysis',
  eval_judge: 'Eval Judge',
  board_packet: 'Board Packet',
  proof_reconstruction: 'Proof Reconstruction',
};

function RecipeCard({ recipe }: { recipe: InferenceRecipe }) {
  const [expanded, setExpanded] = useState(false);
  const tier = GOVERNANCE_TIER_STYLES[recipe.governanceTier];

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      className="rounded-lg border p-4 cursor-pointer transition-colors"
      style={{
        backgroundColor: 'var(--color-a11oy-card)',
        borderColor: expanded ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-1 truncate" style={{ color: 'var(--color-a11oy-text)' }}>{recipe.name}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono" style={{ color: '#c9b787' }}>{recipe.model}</span>
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{recipe.task}</span>
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{recipe.domain}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ backgroundColor: tier.bg, color: tier.color }}
          >
            {tier.label}
          </span>
        </div>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>
        {recipe.description}
      </p>

      <div className="flex items-center gap-3 mb-3">
        {recipe.proofChain && (
          <span className="text-xs font-mono px-1.5 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787' }}>
            ⛓ Proof Chain
          </span>
        )}
        {recipe.shadowCouncil && (
          <span className="text-xs font-mono px-1.5 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: 'rgba(167,139,250,0.08)', color: '#a78bfa' }}>
            ⚔ Shadow Council
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-3" onClick={e => e.stopPropagation()}>
          <div>
            <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.55rem' }}>
              Covenant Policy Gates
            </div>
            <div className="flex flex-wrap gap-1">
              {recipe.covenantPolicy.map(policy => (
                <span key={policy} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', color: 'var(--color-a11oy-text-ghost)', border: '1px solid rgba(201,183,135,0.12)' }}>
                  {policy}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md p-3 text-xs font-mono" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-a11oy-border)' }}>
            <div className="mb-1" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Example prompt
            </div>
            <div style={{ color: '#c9b787', lineHeight: 1.6 }}>{recipe.examplePrompt}</div>
          </div>

          <div className="flex flex-wrap gap-1">
            {recipe.tags.map(tag => (
              <span key={tag} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
        {expanded ? '↑ collapse' : '↓ expand recipe'}
      </div>
    </div>
  );
}

export function ModelRouter() {
  const [models, setModels] = useState<ModelsData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeDomain, setRecipeDomain] = useState('All');
  const [recipeTask, setRecipeTask] = useState('All');
  const [recipeTier, setRecipeTier] = useState('All');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/models`).then(r => r.json()),
      fetch(`${API}/models/health`).then(r => r.json()),
    ])
      .then(([m, h]) => {
        if (m.ok) setModels(m.data);
        if (h.ok) setHealth(h.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeModels = models?.models.filter(m => m.status === 'active') ?? [];
  const totalCallsToday = models?.models.reduce((s, m) => s + m.callsToday, 0) ?? 0;
  const avgLatency = activeModels.length ? Math.round(activeModels.reduce((s, m) => s + m.avgLatencyMs, 0) / activeModels.length) : 0;

  const SEED_COST_TODAY = (() => {
    const perRecipeCost: Record<string, number> = {
      'deep_reasoning': 0.048, 'long_context': 0.062, 'fast_triage': 0.004,
      'code_analysis': 0.018, 'document_analysis': 0.031, 'eval_judge': 0.044,
      'board_packet': 0.057, 'proof_reconstruction': 0.071,
    };
    const dailyCallsPerCategory: Record<string, number> = {
      'deep_reasoning': 14, 'long_context': 6, 'fast_triage': 47,
      'code_analysis': 9, 'document_analysis': 11, 'eval_judge': 23,
      'board_packet': 4, 'proof_reconstruction': 3,
    };
    return INFERENCE_RECIPES.reduce((sum, r) => {
      const cost = perRecipeCost[r.taskCategory] ?? 0.02;
      const calls = dailyCallsPerCategory[r.taskCategory] ?? 8;
      return sum + cost * calls;
    }, 0);
  })();

  const displayCost = models?.models.reduce((s, m) => s + m.costToday, 0)
    ?? SEED_COST_TODAY;

  const filteredRecipes = INFERENCE_RECIPES.filter(r => {
    const matchSearch = recipeSearch === '' || [r.name, r.description, r.model, r.domain, r.task, ...r.tags].join(' ').toLowerCase().includes(recipeSearch.toLowerCase());
    const matchDomain = recipeDomain === 'All' || r.domain === recipeDomain;
    const matchTask = recipeTask === 'All' || r.task === recipeTask;
    const matchTier = recipeTier === 'All' || r.governanceTier === recipeTier;
    return matchSearch && matchDomain && matchTask && matchTier;
  });

  return (
    <Layout>
      <PageHeader
        label="MODEL ROUTER"
        title="Inference Routing Layer"
        subtitle="Provider-agnostic model routing — task type, domain, token budget, and latency requirements determine which model handles each inference. No single-model dependency."
        status="LIVE"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading model router…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <KpiCard label="MODELS REGISTERED" value={String(models?.models.length ?? 0)} sub={`${activeModels.length} active, ${(models?.models.length ?? 0) - activeModels.length} roadmap`} accent="#c9b787" />
            <KpiCard label="INFERENCES TODAY" value={totalCallsToday.toLocaleString()} sub="Routed today" accent="#c9b787" />
            <KpiCard label="AVG LATENCY" value={`${avgLatency}ms`} sub="Active models" accent="#b08d52" />
            <KpiCard label="COST TODAY" value={`$${displayCost.toFixed(2)}`} sub={`${INFERENCE_RECIPES.length} active recipe routes`} accent="#c9b787" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            <div>
              <SectionTitle>Model Profiles</SectionTitle>
              <div className="flex flex-col gap-3">
                {models?.models.map(m => (
                  <Card key={m.id}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{m.name}</div>
                        <div className="text-xs" style={{ color: PROVIDER_COLORS[m.provider] ?? '#5e5e5e' }}>{m.providerLabel}</div>
                      </div>
                      <StatusPill status={STATUS_MAP[m.status] ?? 'LIVE'} />
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.role}</p>
                    <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>latency</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.avgLatencyMs}ms</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>today</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.callsToday}</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>fail rate</div><div style={{ color: '#c9b787' }}>{(m.failureRate * 100).toFixed(1)}%</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>health</div><div style={{ color: m.healthScore >= 95 ? '#c9b787' : m.healthScore >= 80 ? '#c9b787' : '#5e5e5e' }}>{m.healthScore}</div></div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.routingModes.map(mode => (
                        <span key={mode} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                          {MODE_LABELS[mode] ?? mode}
                        </span>
                      ))}
                    </div>
                    {m.fallbackEvents > 0 && (
                      <div className="mt-1.5 text-xs" style={{ color: '#c9b787' }}>⚠ {m.fallbackEvents} fallback event{m.fallbackEvents > 1 ? 's' : ''}</div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Routing Policy</SectionTitle>
              <div className="flex flex-col gap-2 mb-6">
                {models?.routingPolicy.map(rule => (
                  <Card key={rule.mode}>
                    <div className="text-xs font-mono mb-0.5" style={{ color: 'var(--color-a11oy-gold)' }}>
                      MODE: {MODE_LABELS[rule.mode] ?? rule.mode}
                    </div>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                      → <span style={{ color: '#c9b787' }}>{rule.model}</span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{rule.reason}</div>
                  </Card>
                ))}
              </div>

              {health && (
                <>
                  <SectionTitle>Provider Health</SectionTitle>
                  <Card>
                    <div className="text-xs mb-3 flex items-center gap-2">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Active provider:</span>
                      <span className="font-mono" style={{ color: PROVIDER_COLORS[health.activeProvider] ?? '#5e5e5e' }}>{health.activeProvider}</span>
                      <span className="text-xs px-1 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>active</span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Fallback chain: {health.fallbackChain.map((p, i) => (
                        <span key={p}>
                          <span style={{ color: PROVIDER_COLORS[p] ?? '#5e5e5e' }}>{p}</span>
                          {i < health.fallbackChain.length - 1 && <span style={{ color: 'var(--color-a11oy-text-ghost)' }}> → </span>}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-2 mt-3">
                      {health.providers.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span style={{ color: PROVIDER_COLORS[p.provider] ?? '#5e5e5e' }}>{p.name}</span>
                          <div className="flex items-center gap-2">
                            <span style={{ color: p.healthScore >= 90 ? '#c9b787' : p.healthScore >= 70 ? '#c9b787' : '#5e5e5e' }}>{p.healthScore > 0 ? `${p.healthScore}%` : 'unavailable'}</span>
                            <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.latencyMs}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Last check: {new Date(health.lastHealthCheck).toLocaleTimeString('en-US')}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* GOVERNED INFERENCE RECIPES */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-1">
              <SectionTitle>Governed Agent Change Management</SectionTitle>
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
                Inspired by vLLM Recipes — governed by A11oy
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.6, maxWidth: '64ch' }}>
              Composable model + task + domain + governance configurations. Each recipe specifies which model handles which task in which domain, with the Covenant Policy gates and Proof Chain logging required for that use case. Search, filter, and expand to see the full configuration.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search recipes…"
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  className="text-xs rounded-md px-3 py-1.5 font-mono"
                  style={{
                    backgroundColor: 'var(--color-a11oy-card)',
                    border: '1px solid var(--color-a11oy-border)',
                    color: 'var(--color-a11oy-text)',
                    outline: 'none',
                    width: 180,
                  }}
                />
              </div>

              <select
                value={recipeDomain}
                onChange={e => setRecipeDomain(e.target.value)}
                className="text-xs rounded-md px-2 py-1.5 font-mono"
                style={{
                  backgroundColor: 'var(--color-a11oy-card)',
                  border: '1px solid var(--color-a11oy-border)',
                  color: 'var(--color-a11oy-text-sub)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {ALL_DOMAINS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Domains' : d}</option>)}
              </select>

              <select
                value={recipeTask}
                onChange={e => setRecipeTask(e.target.value)}
                className="text-xs rounded-md px-2 py-1.5 font-mono"
                style={{
                  backgroundColor: 'var(--color-a11oy-card)',
                  border: '1px solid var(--color-a11oy-border)',
                  color: 'var(--color-a11oy-text-sub)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {ALL_TASKS.map(t => <option key={t} value={t}>{t === 'All' ? 'All Tasks' : t}</option>)}
              </select>

              <select
                value={recipeTier}
                onChange={e => setRecipeTier(e.target.value)}
                className="text-xs rounded-md px-2 py-1.5 font-mono"
                style={{
                  backgroundColor: 'var(--color-a11oy-card)',
                  border: '1px solid var(--color-a11oy-border)',
                  color: 'var(--color-a11oy-text-sub)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {ALL_TIERS.map(t => <option key={t} value={t}>{t === 'All' ? 'All Tiers' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>

              {(recipeSearch || recipeDomain !== 'All' || recipeTask !== 'All' || recipeTier !== 'All') && (
                <button
                  onClick={() => { setRecipeSearch(''); setRecipeDomain('All'); setRecipeTask('All'); setRecipeTier('All'); }}
                  className="text-xs px-2 py-1.5 rounded font-mono"
                  style={{ color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}

              <span className="text-xs font-mono self-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {Object.entries(GOVERNANCE_TIER_STYLES).map(([key, style]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: style.bg, color: style.color }}>
                    {style.label}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    {key === 'standard' ? 'Proof Chain only' : key === 'elevated' ? 'Proof Chain + approval gate' : 'Air-gapped · No external calls'}
                  </span>
                </div>
              ))}
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="text-xs text-center py-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                No recipes match your filters.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredRecipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
              <span className="font-mono" style={{ color: '#a78bfa' }}>Governed Agent Change Management</span> — inspired by vLLM's recipe model for composable deployment configurations,
              extended with A11oy's Covenant Policy enforcement, Proof Chain attribution, and Shadow Council adversarial review.
              Each recipe is a governance-first configuration: the model, the task, the domain, and the full compliance layer — one composable unit.
            </div>
          </div>

          <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Governed Environment — all inference routing is illustrative. Provider keys are read from environment variables in production; no real model API calls are made in this environment.
          </div>
        </>
      )}
    </Layout>
  );
}
