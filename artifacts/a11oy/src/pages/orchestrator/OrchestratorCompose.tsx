import { useState } from 'react';
import { useLocation } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle } from '../../components/ui';
import { useApiData } from '../../hooks/useApiData';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const API_BASE = `${BASE}/api/a11oy`;
const link = (path: string) => `${BASE}${path}`;

const GOLD = '#c9b787';
const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
};

// Canonical fallback articles used when the API is unreachable
const CANONICAL_CONSTITUTION_ARTICLES = [
  { id: 'I',    title: 'Attribution is Non-Optional',          description: 'Every consequential action carries an unbroken attribution chain.' },
  { id: 'II',   title: 'Human Authority on Material Decisions', description: 'No agent executes a material decision without human approval.' },
  { id: 'III',  title: 'Bounded Capability',                   description: 'Every agent operates inside enforced capability compartments.' },
  { id: 'IV',   title: 'Truthful Self-Report',                 description: 'Agents report state, confidence, and provenance truthfully.' },
  { id: 'V',    title: 'Right to Audit',                       description: 'Customers and auditors hold standing audit access.' },
  { id: 'VI',   title: 'Pre-Deployment Alignment Review',      description: 'No new agent class goes to production without passing the Review Gate.' },
  { id: 'VII',  title: 'Coordinated Disclosure',               description: 'Vulnerabilities are disclosed through the CAVD process.' },
  { id: 'VIII', title: 'Mutability with a Public Trail',       description: 'This Constitution is versioned and every amendment is publicly recorded.' },
  { id: 'IX',   title: 'Adversarial Covenants',                description: 'The adversary swarm may only operate inside the sandboxed digital twin.' },
];

interface ConstitutionArticle {
  id: string;
  title: string;
  description: string;
  version?: string;
  promptId?: number;
}

interface AvailableConnector {
  connectorId: string;
  displayName: string;
  domain: string;
  riskLevel: string;
  isEnabled?: boolean;
}

interface AvailableEvaluator {
  evaluatorId: string;
  displayName: string;
  passThreshold: number;
  dimensions: string[];
  liveStats?: { avgScore: number; passRate: number | null; totalTraces: number };
}

const STEPS = ['Identity', 'Constitution', 'Connectors', 'Evaluators', 'Approval Rules', 'Optimization', 'Review'];

interface FormState {
  slug: string;
  name: string;
  description: string;
  industry: string;
  uiShellTemplate: string;
  selectedArticles: string[];
  selectedConnectors: string[];
  selectedEvaluator: string;
  approvalRules: { riskTier: string; requiresApprover: string }[];
  rewardSignals: string;
  calibrationMetric: string;
}

const DEFAULT_FORM: FormState = {
  slug: '',
  name: '',
  description: '',
  industry: '',
  uiShellTemplate: 'standard',
  selectedArticles: ['I', 'II'],
  selectedConnectors: [],
  selectedEvaluator: 'mirroreval-standard',
  approvalRules: [
    { riskTier: 'critical', requiresApprover: '' },
    { riskTier: 'high', requiresApprover: '' },
    { riskTier: 'medium', requiresApprover: '' },
  ],
  rewardSignals: 'acceptance_rate, decision_accuracy',
  calibrationMetric: 'outcome_accuracy',
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function OrchestratorCompose() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  // Fetch available connectors, evaluators, and constitution articles from the API
  const { data: connectorsData, loading: connectorsLoading } = useApiData<{ connectors: AvailableConnector[] }>(
    '/orchestrator/available-connectors',
  );
  const { data: evaluatorsData, loading: evaluatorsLoading } = useApiData<{ evaluators: AvailableEvaluator[] }>(
    '/orchestrator/available-evaluators',
  );
  const { data: constitutionData, loading: constitutionLoading } = useApiData<{ articles: ConstitutionArticle[] }>(
    '/orchestrator/available-constitution-articles',
  );

  // Use API data; fall back to canonical lists if the API is unavailable
  const availableConnectors: AvailableConnector[] = connectorsData?.connectors ?? [];
  const availableEvaluators: AvailableEvaluator[] = evaluatorsData?.evaluators ?? [];
  const availableArticles: ConstitutionArticle[] = constitutionData?.articles ?? CANONICAL_CONSTITUTION_ARTICLES;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleArticle(id: string) {
    setForm(prev => ({
      ...prev,
      selectedArticles: prev.selectedArticles.includes(id)
        ? prev.selectedArticles.filter(a => a !== id)
        : [...prev.selectedArticles, id],
    }));
  }

  function toggleConnector(id: string) {
    setForm(prev => ({
      ...prev,
      selectedConnectors: prev.selectedConnectors.includes(id)
        ? prev.selectedConnectors.filter(c => c !== id)
        : [...prev.selectedConnectors, id],
    }));
  }

  function updateApprovalRule(tier: string, approver: string) {
    setForm(prev => ({
      ...prev,
      approvalRules: prev.approvalRules.map(r => r.riskTier === tier ? { ...r, requiresApprover: approver } : r),
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    // Resolve the selected evaluator from the API-fetched list
    const evaluator = availableEvaluators.find(e => e.evaluatorId === form.selectedEvaluator)
      ?? availableEvaluators[0]
      ?? { evaluatorId: 'mirroreval-standard', displayName: 'MirrorEval Standard', passThreshold: 0.85, dimensions: ['groundedness', 'policy_compliance'] };

    const computedSlug = form.slug || slugify(form.name);

    // Map selected connector IDs to full connector objects from the API-fetched list
    const dataSources = form.selectedConnectors.map(id => {
      const c = availableConnectors.find(x => x.connectorId === id)
        ?? { connectorId: id, displayName: id, riskLevel: 'medium', domain: 'custom' };
      return { connectorId: c.connectorId, displayName: c.displayName, riskLevel: c.riskLevel, allowedTools: [], blockedTools: [] };
    });

    const packBody = {
      slug: computedSlug,
      name: form.name,
      description: form.description,
      industry: form.industry,
      uiShellTemplate: form.uiShellTemplate,
      constitution: form.selectedArticles.map(id => ({ articleId: id, version: 'v4.2.0' })),
      dataSources,
      evaluators: [{
        evaluatorId: evaluator.evaluatorId,
        displayName: evaluator.displayName,
        passThreshold: evaluator.passThreshold,
        dimensions: evaluator.dimensions,
      }],
      approvalRules: form.approvalRules
        .filter(r => r.requiresApprover)
        .map(r => ({ riskTier: r.riskTier, requiresApprover: r.requiresApprover })),
      selfOptimization: {
        rewardSignals: form.rewardSignals.split(',').map(s => s.trim()).filter(Boolean),
        lockedParameters: [],
      },
      learningLoop: {
        calibrationMetric: form.calibrationMetric,
        driftThresholdPct: 2.0,
        recalibrationTrigger: 'auto',
      },
    };

    try {
      const resp = await fetch(`${API_BASE}/orchestrator/packs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packBody),
        credentials: 'include',
      });

      const body = await resp.json().catch(() => ({})) as {
        ok?: boolean; data?: { slug?: string }; error?: string; code?: string;
        details?: { errors?: string[] };
      };

      if (!resp.ok || !body.ok) {
        const msg = body.error ?? 'Request failed';
        const detail = body.details?.errors ? ': ' + body.details.errors.join('; ') : '';
        setSubmitError(msg + detail);
      } else {
        setCreatedSlug(body.data?.slug ?? computedSlug);
        setSubmitted(true);
      }
    } catch {
      setSubmitError('Network error — the API server may not be reachable. Check that the API workflow is running and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Layout>
        <PageHeader label="VERTICAL ORCHESTRATOR · COMPOSE" title="Pack Draft Created" status="LIVE" />
        <Card>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✓</div>
            <div className="text-lg font-semibold mb-2" style={{ color: '#22c55e' }}>Draft pack created</div>
            <div className="text-sm mb-6" style={{ color: T.textDim }}>
              Pack <span style={{ color: GOLD, fontFamily: 'monospace' }}>{createdSlug}</span> is now in draft state.
              Request activation in the Catalog to route it through the Approval Queue — no code path activates a pack without human approval.
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href={link('/orchestrator/catalog')}
                className="text-sm font-mono px-4 py-2 rounded"
                style={{ color: '#0a0a0a', backgroundColor: GOLD, textDecoration: 'none', fontWeight: 600 }}
              >
                View Catalog →
              </a>
              <button
                onClick={() => { setSubmitted(false); setStep(0); setForm(DEFAULT_FORM); }}
                className="text-sm font-mono px-4 py-2 rounded"
                style={{ color: T.textDim, backgroundColor: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer' }}
              >
                Compose Another
              </button>
            </div>
          </div>
        </Card>
      </Layout>
    );
  }

  const canNext = step === 0
    ? (form.name.length > 2 && form.industry.length > 1)
    : step === 1
    ? form.selectedArticles.length > 0
    : true;

  return (
    <Layout>
      <PageHeader
        label="VERTICAL ORCHESTRATOR · COMPOSE"
        title="Compose a New Domain Pack"
        subtitle="Walk through each governance dimension. On submit, A11oy materializes a typed DomainPack and routes it to the Approval Queue for human activation."
        status="LIVE"
      />

      <div className="flex gap-1 mb-6 flex-wrap">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => i < step ? setStep(i) : undefined}
            className="text-xs font-mono px-3 py-1.5 rounded"
            style={{
              backgroundColor: i === step ? 'rgba(201,183,135,0.12)' : i < step ? 'rgba(34,197,94,0.08)' : T.surface,
              color: i === step ? GOLD : i < step ? '#22c55e' : T.textMuted,
              border: `1px solid ${i === step ? 'rgba(201,183,135,0.3)' : i < step ? 'rgba(34,197,94,0.2)' : T.border}`,
              cursor: i < step ? 'pointer' : 'default',
            }}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Step 0: Identity */}
      {step === 0 && (
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <SectionTitle>Identity</SectionTitle>
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <label className="text-xs font-mono block mb-1.5" style={{ color: T.textDim }}>VERTICAL NAME *</label>
                <input
                  value={form.name}
                  onChange={e => { update('name', e.target.value); update('slug', slugify(e.target.value)); }}
                  placeholder="e.g. Insurance Claims Triage"
                  className="w-full text-sm px-3 py-2 rounded"
                  style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.text, outline: 'none' }}
                />
              </div>
              <div>
                <label className="text-xs font-mono block mb-1.5" style={{ color: T.textDim }}>SLUG (auto-generated)</label>
                <div className="text-sm px-3 py-2 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, color: T.textDim }}>
                  {form.slug || slugify(form.name) || 'auto-generated'}
                </div>
              </div>
              <div>
                <label className="text-xs font-mono block mb-1.5" style={{ color: T.textDim }}>INDUSTRY *</label>
                <input
                  value={form.industry}
                  onChange={e => update('industry', e.target.value)}
                  placeholder="e.g. Insurance, Healthcare, Financial Services"
                  className="w-full text-sm px-3 py-2 rounded"
                  style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.text, outline: 'none' }}
                />
              </div>
              <div>
                <label className="text-xs font-mono block mb-1.5" style={{ color: T.textDim }}>DESCRIPTION</label>
                <textarea
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Describe the vertical's purpose, key workflows, and decision types it governs."
                  rows={3}
                  className="w-full text-sm px-3 py-2 rounded"
                  style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.text, outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div>
                <label className="text-xs font-mono block mb-1.5" style={{ color: T.textDim }}>UI SHELL TEMPLATE</label>
                <select
                  value={form.uiShellTemplate}
                  onChange={e => update('uiShellTemplate', e.target.value)}
                  className="text-sm px-3 py-2 rounded"
                  style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.text, outline: 'none' }}
                >
                  {['standard', 'defense', 'legal', 'maritime', 'real-estate', 'custom'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 1: Constitution */}
      {step === 1 && (
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <SectionTitle>Constitution Articles</SectionTitle>
            <p className="text-xs mb-4" style={{ color: T.textDim }}>
              Select the Constitution articles that govern this vertical. At least one is required.
              Articles I and II (Attribution and Human Authority) are strongly recommended for all packs.
            </p>
            {constitutionLoading ? (
              <div className="text-xs" style={{ color: T.textDim }}>Loading Constitution articles…</div>
            ) : (
              <div className="flex flex-col gap-2">
                {availableArticles.map(a => {
                  const selected = form.selectedArticles.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleArticle(a.id)}
                      className="text-left rounded p-3"
                      style={{
                        backgroundColor: selected ? 'rgba(201,183,135,0.08)' : T.surface,
                        border: `1px solid ${selected ? 'rgba(201,183,135,0.3)' : T.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono w-6 flex-shrink-0" style={{ color: selected ? GOLD : T.textMuted }}>§{a.id}</span>
                        <div>
                          <div className="text-sm font-medium" style={{ color: selected ? T.text : T.textDim }}>{a.title}</div>
                          <div className="text-xs" style={{ color: T.textMuted }}>{a.description}</div>
                        </div>
                        {selected && <span className="ml-auto text-xs" style={{ color: GOLD }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Connectors — fetched from ConnectorFirewall API */}
      {step === 2 && (
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <SectionTitle>Data Sources via ConnectorFirewall</SectionTitle>
            <p className="text-xs mb-4" style={{ color: T.textDim }}>
              Register which ConnectorFirewall-gated data sources this vertical will use.
              This list is sourced from the live connector registry — no new connector code is written here.
            </p>
            {connectorsLoading ? (
              <div className="text-xs animate-pulse" style={{ color: T.textDim }}>Loading connectors from registry…</div>
            ) : availableConnectors.length === 0 ? (
              <div className="p-3 rounded text-xs" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
                No active connectors registered in the ConnectorFirewall yet. The pack will operate on operator-supplied signals only. You can add connectors later via the Governance Wiring page.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {availableConnectors.map(c => {
                  const selected = form.selectedConnectors.includes(c.connectorId);
                  return (
                    <button
                      key={c.connectorId}
                      type="button"
                      onClick={() => toggleConnector(c.connectorId)}
                      className="text-left rounded p-3"
                      style={{
                        backgroundColor: selected ? 'rgba(201,183,135,0.08)' : T.surface,
                        border: `1px solid ${selected ? 'rgba(201,183,135,0.3)' : T.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: selected ? T.text : T.textDim }}>{c.displayName}</div>
                          <div className="text-xs" style={{ color: T.textMuted }}>{c.domain} · risk: {c.riskLevel}</div>
                        </div>
                        {selected && <span className="text-xs" style={{ color: GOLD }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {form.selectedConnectors.length === 0 && !connectorsLoading && availableConnectors.length > 0 && (
              <div className="mt-3 text-xs p-2 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.05)', border: `1px solid ${T.border}`, color: T.textMuted }}>
                No connectors selected — this pack will operate on signals passed directly by operators.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 3: Evaluators — fetched from eval harness API */}
      {step === 3 && (
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <SectionTitle>Evaluators</SectionTitle>
            <p className="text-xs mb-4" style={{ color: T.textDim }}>
              Choose the MirrorEval evaluator configuration. Canonical tiers are shown first;
              live evaluators derived from recent ai_traces are shown below.
            </p>
            {evaluatorsLoading ? (
              <div className="text-xs animate-pulse" style={{ color: T.textDim }}>Loading evaluator configurations…</div>
            ) : (
              <div className="flex flex-col gap-2">
                {availableEvaluators.map(e => {
                  const selected = form.selectedEvaluator === e.evaluatorId;
                  return (
                    <button
                      key={e.evaluatorId}
                      type="button"
                      onClick={() => update('selectedEvaluator', e.evaluatorId)}
                      className="text-left rounded p-3"
                      style={{
                        backgroundColor: selected ? 'rgba(201,183,135,0.08)' : T.surface,
                        border: `1px solid ${selected ? 'rgba(201,183,135,0.3)' : T.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: selected ? T.text : T.textDim }}>{e.displayName}</div>
                          <div className="text-xs mt-1" style={{ color: T.textMuted }}>
                            Pass threshold: {Math.round(e.passThreshold * 100)}% · {e.dimensions.length} dimensions
                            {e.liveStats && e.liveStats.passRate != null && (
                              <span className="ml-2" style={{ color: GOLD }}>
                                · live pass rate: {(e.liveStats.passRate * 100).toFixed(1)}% (n={e.liveStats.totalTraces})
                              </span>
                            )}
                          </div>
                        </div>
                        {selected && <span className="text-xs" style={{ color: GOLD }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 4: Approval Rules */}
      {step === 4 && (
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <SectionTitle>Approval Gate Rules</SectionTitle>
            <p className="text-xs mb-4" style={{ color: T.textDim }}>
              Define who must approve decisions at each risk tier. All rules go through the existing Approval Queue — no separate approval system is created.
            </p>
            <div className="flex flex-col gap-3">
              {form.approvalRules.map(rule => (
                <div key={rule.riskTier}>
                  <label className="text-xs font-mono block mb-1.5 uppercase" style={{ color: T.textDim }}>
                    {rule.riskTier} RISK — Required Approver
                  </label>
                  <input
                    value={rule.requiresApprover}
                    onChange={e => updateApprovalRule(rule.riskTier, e.target.value)}
                    placeholder="e.g. Chief Underwriting Officer"
                    className="w-full text-sm px-3 py-2 rounded"
                    style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.text, outline: 'none' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Step 5: Optimization */}
      {step === 5 && (
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <SectionTitle>Self-Optimization & Learning Loop</SectionTitle>
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <label className="text-xs font-mono block mb-1.5" style={{ color: T.textDim }}>REWARD SIGNALS (comma-separated)</label>
                <input
                  value={form.rewardSignals}
                  onChange={e => update('rewardSignals', e.target.value)}
                  placeholder="acceptance_rate, decision_accuracy, operator_override_rate"
                  className="w-full text-sm px-3 py-2 rounded"
                  style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.text, outline: 'none' }}
                />
                <div className="text-xs mt-1" style={{ color: T.textMuted }}>These signals drive the reinforcement learning optimization loop. Human operators can lock any parameter at any time.</div>
              </div>
              <div>
                <label className="text-xs font-mono block mb-1.5" style={{ color: T.textDim }}>CALIBRATION METRIC</label>
                <input
                  value={form.calibrationMetric}
                  onChange={e => update('calibrationMetric', e.target.value)}
                  placeholder="e.g. outcome_accuracy, claim_resolution_accuracy"
                  className="w-full text-sm px-3 py-2 rounded"
                  style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.text, outline: 'none' }}
                />
                <div className="text-xs mt-1" style={{ color: T.textMuted }}>The primary metric the Learning Loop calibrates against to detect domain drift.</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 6: Review */}
      {step === 6 && (
        <div className="space-y-4">
          <Card>
            <div style={{ padding: '1.5rem' }}>
              <SectionTitle>Review Pack</SectionTitle>
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '0.5rem' }}>
                  <span style={{ color: T.textDim }}>Name</span>
                  <span style={{ color: T.text }}>{form.name}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '0.5rem' }}>
                  <span style={{ color: T.textDim }}>Slug</span>
                  <span style={{ color: GOLD, fontFamily: 'monospace' }}>{form.slug || slugify(form.name)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '0.5rem' }}>
                  <span style={{ color: T.textDim }}>Industry</span>
                  <span style={{ color: T.text }}>{form.industry}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '0.5rem' }}>
                  <span style={{ color: T.textDim }}>Constitution articles</span>
                  <span style={{ color: T.text }}>{form.selectedArticles.map(a => `§${a}`).join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '0.5rem' }}>
                  <span style={{ color: T.textDim }}>Connectors</span>
                  <span style={{ color: T.text }}>{form.selectedConnectors.length > 0 ? form.selectedConnectors.join(', ') : 'none'}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '0.5rem' }}>
                  <span style={{ color: T.textDim }}>Evaluator</span>
                  <span style={{ color: T.text }}>
                    {availableEvaluators.find(e => e.evaluatorId === form.selectedEvaluator)?.displayName ?? form.selectedEvaluator}
                  </span>
                </div>
                <div className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '0.5rem' }}>
                  <span style={{ color: T.textDim }}>Approval rules</span>
                  <span style={{ color: T.text }}>{form.approvalRules.filter(r => r.requiresApprover).length} configured</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="p-3 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: `1px solid rgba(201,183,135,0.15)`, color: T.textDim }}>
            Submitting creates a draft DomainPack in the registry. No governance is active until a human approves the pack via the Approval Queue. You can edit the pack in the Governance Wiring view after creation.
          </div>

          {submitError && (
            <div className="p-3 rounded text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.2)`, color: '#ef4444' }}>
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-sm font-mono px-5 py-2.5 rounded font-semibold"
              style={{
                color: submitting ? T.textMuted : '#0a0a0a',
                backgroundColor: submitting ? T.surface : GOLD,
                border: `1px solid ${submitting ? T.border : GOLD}`,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Creating Draft…' : 'Create Draft Pack →'}
            </button>
            <button
              onClick={() => setStep(5)}
              className="text-sm font-mono px-4 py-2.5 rounded"
              style={{ color: T.textDim, backgroundColor: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer' }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 6 && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => canNext && setStep(s => s + 1)}
            disabled={!canNext}
            className="text-sm font-mono px-4 py-2 rounded"
            style={{
              color: canNext ? '#0a0a0a' : T.textMuted,
              backgroundColor: canNext ? GOLD : T.surface,
              border: `1px solid ${canNext ? GOLD : T.border}`,
              cursor: canNext ? 'pointer' : 'not-allowed',
            }}
          >
            Next →
          </button>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="text-sm font-mono px-4 py-2 rounded"
              style={{ color: T.textDim, backgroundColor: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer' }}
            >
              ← Back
            </button>
          )}
        </div>
      )}
    </Layout>
  );
}
