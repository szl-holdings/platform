import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { useApiData } from '../hooks/useApiData';

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  gold: '#b08d52',
};

const API_BASE = '/api/a11oy';

interface JuryRecord {
  juryId: string;
  recommendationId: string;
  domain: string;
  title: string;
  summary: string;
  grounding: number;
  actionability: number;
  policyCompliance: number;
  reversibility: number;
  confidence: number;
  composite: number;
  passed: boolean;
  evaluatedAt: string;
}

interface CandidateCase {
  id: string;
  workcellId: string;
  domain: string;
  category: string;
  input: string;
  actualOutput: string;
  outcome: string;
  confidence: number;
  capturedAt: string;
  riskCategory: string;
  status: 'pending_review' | 'promoted' | 'rejected';
  decidedAt?: string;
  proofHash?: string;
  // ─── eval-os JuryRecord (5-axis, real engine) ─────────
  jury?: JuryRecord;
  codexReceiptId?: string;
}

const JURY_AXES: Array<{ k: keyof Pick<JuryRecord, 'grounding' | 'actionability' | 'policyCompliance' | 'reversibility' | 'confidence'>; short: string; long: string }> = [
  { k: 'grounding',         short: 'GRD', long: 'Grounding (evidence support)' },
  { k: 'actionability',     short: 'ACT', long: 'Actionability' },
  { k: 'policyCompliance',  short: 'POL', long: 'Policy Compliance' },
  { k: 'reversibility',     short: 'REV', long: 'Reversibility' },
  { k: 'confidence',        short: 'CAL', long: 'Confidence Calibration' },
];

function JuryAxisBar({ jury }: { jury: JuryRecord }) {
  return (
    <div className="my-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="text-[9px] font-mono" style={{ color: T.muted }}>JURY · eval-os@JuryRecord (5-axis)</span>
        <span className="text-[9px] font-mono" style={{ color: jury.passed ? '#22c55e' : '#f97316' }}>
          composite {jury.composite.toFixed(3)} · {jury.passed ? 'PASS' : 'HOLD'}
        </span>
        <span className="text-[8px] font-mono ml-auto" style={{ color: T.muted }}>{jury.juryId}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {JURY_AXES.map(({ k, short, long }) => {
          const v = jury[k];
          return (
            <div key={k} className="flex items-center gap-2" title={long}>
              <span className="text-[9px] font-mono w-8" style={{ color: T.muted }}>{short}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full" style={{ width: `${v * 100}%`, background: v >= 0.85 ? '#22c55e' : v >= 0.7 ? T.accent : '#f97316' }} />
              </div>
              <span className="text-[9px] font-mono w-8 text-right" style={{ color: T.dim }}>{v.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RegressionAlert {
  domain: string;
  skill: string;
  currentScore: number;
  avg30d: number;
  delta: number;
  riskCategory: string;
  detectedAt: string;
}

interface EvalOverview {
  evalGrowth: Array<{ week: string; total: number; promoted: number; candidate: number }>;
  coverageRadar: Array<{ category: string; current: number; target: number }>;
  goldenSetSize: number;
  candidateQueueSize: number;
  regressionAlertCount: number;
  behavioralProbeCount: number;
}

interface CounterfactualResult {
  scenario: string;
  domain: string;
  casesRun: number;
  opusWins: number;
  sonetWins: number;
  modelRouterImpact: string;
}

interface BehavioralProbe {
  id: string;
  source: string;
  probe: string;
  generatedFrom: string;
  status: string;
  passRate: number;
}

interface RegressionPayload {
  regressions: RegressionAlert[];
  regressionTimeSeries: unknown[];
}

const TAB_LABELS = ['Eval Growth', 'Regression Alerts', 'Candidate Cases', 'Counterfactual Batch', 'Behavioral Probes', 'Coverage Map'] as const;
type Tab = typeof TAB_LABELS[number];

export function EvalEvolution() {
  const [activeTab, setActiveTab] = useState<Tab>('Eval Growth');

  const { data: overview } = useApiData<EvalOverview>('/adaptive/eval/overview');
  const { data: apiCandidates } = useApiData<CandidateCase[]>('/adaptive/eval/candidates');
  const { data: regressionPayload } = useApiData<RegressionPayload>('/adaptive/eval/regressions');
  const { data: counterfactuals } = useApiData<CounterfactualResult[]>('/adaptive/eval/counterfactuals');
  const { data: probes } = useApiData<BehavioralProbe[]>('/adaptive/eval/probes');

  const [candidates, setCandidates] = useState<CandidateCase[]>([]);
  const [decideError, setDecideError] = useState<string | null>(null);

  useEffect(() => {
    if (apiCandidates) setCandidates(apiCandidates);
  }, [apiCandidates]);

  const pendingCases = candidates.filter(c => c.status === 'pending_review').length;
  const promotedCases = candidates.filter(c => c.status === 'promoted').length;
  const regressionAlerts = regressionPayload?.regressions ?? [];
  const regressionTimeSeries = regressionPayload?.regressionTimeSeries ?? [];

  const decideCase = async (id: string, decision: 'promoted' | 'rejected') => {
    setDecideError(null);
    try {
      const res = await fetch(`${API_BASE}/adaptive/eval/candidates/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        throw new Error(`eval-os jury-write failed (${res.status}) — case NOT ${decision}`);
      }
      const json = await res.json() as { ok: boolean; data: CandidateCase; error?: string };
      if (!json.ok || !json.data) {
        throw new Error(json.error ?? 'Engine refused decision (no JuryRecord persisted)');
      }
      setCandidates(prev => prev.map(c => c.id === id ? json.data : c));
    } catch (e) {
      setDecideError(e instanceof Error ? e.message : 'Decision failed — JuryRecord not written');
    }
  };

  const promoteCase = (id: string) => decideCase(id, 'promoted');
  const rejectCase = (id: string) => decideCase(id, 'rejected');

  return (
    <Layout>
      <PageHeader
        label="EVALUATION · A11OY.1"
        title="Eval Evolution Dashboard"
        subtitle="The eval set grows from production. Auto-generated cases from workcell completions, regression detection against 30-day rolling averages, counterfactual batch results, and Petri-inspired behavioral probes."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="GOLDEN SET SIZE" value={overview?.goldenSetSize ?? 31} sub="promoted cases" accent="#c9b787" />
        <KpiCard label="CANDIDATE QUEUE" value={pendingCases} sub="pending operator review" accent="#c9b787" />
        <KpiCard label="REGRESSION ALERTS" value={regressionAlerts.length} sub="degraded skills" accent="#c9b787" />
        <KpiCard label="BEHAVIORAL PROBES" value={probes?.length ?? 0} sub="auto-generated" accent="#c9b787" />
      </div>

      {regressionAlerts.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border" style={{ background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.3)' }}>
          <div className="text-xs font-semibold mb-2" style={{ color: '#f97316' }}>⚠ Regression Alerts — Action Required</div>
          {regressionAlerts.map(alert => (
            <div key={alert.domain + alert.skill} className="flex items-center justify-between gap-3 py-1 flex-wrap">
              <span className="text-xs" style={{ color: T.dim }}>
                <span style={{ color: T.accent }}>{alert.domain}</span> · {alert.skill.replace('_', ' ')} dropped {Math.abs(alert.delta)}pp below 30-day avg
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                {alert.currentScore}% vs avg {alert.avg30d}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {TAB_LABELS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="text-[11px] font-mono px-3 py-1.5 rounded"
            style={{
              background: activeTab === tab ? `${T.accent}22` : T.surface,
              color: activeTab === tab ? T.accent : T.dim,
              border: `1px solid ${activeTab === tab ? T.accent + '44' : T.border}`,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Eval Growth' && (
        <div className="flex flex-col gap-6">
          <Card>
            <div className="text-xs font-mono mb-4" style={{ color: T.dim }}>Golden set growth — auto-generated candidates vs. operator-promoted cases</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={overview?.evalGrowth ?? []} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="week" tick={{ fill: T.muted, fontSize: 10 }} />
                <YAxis tick={{ fill: T.muted, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111', border: `1px solid ${T.border}`, borderRadius: 6 }} />
                <Line type="monotone" dataKey="total" stroke={T.accent} dot={false} strokeWidth={2} name="Total (promoted)" />
                <Line type="monotone" dataKey="candidate" stroke="#8a8a8a" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Candidate queue" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: T.dim }}>
                <span className="w-4 h-0.5 inline-block" style={{ background: T.accent }} />Promoted (golden)
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: T.dim }}>
                <span className="w-4 h-0.5 inline-block border-t-2 border-dashed" style={{ borderColor: '#8a8a8a' }} />Candidate queue
              </span>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Regression Alerts' && (
        <div className="flex flex-col gap-4">
          <SectionTitle>Skill Regression Detection — 30-Day Rolling Average</SectionTitle>
          <Card>
            <div className="text-xs font-mono mb-4" style={{ color: T.dim }}>MirrorEval scores by domain over last 7 days.</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={regressionTimeSeries as Array<Record<string, unknown>>} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="day" tick={{ fill: T.muted, fontSize: 10 }} />
                <YAxis domain={[70, 100]} tick={{ fill: T.muted, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111', border: `1px solid ${T.border}`, borderRadius: 6 }} />
                <Line type="monotone" dataKey="maritime" stroke="#8a8a8a" dot={false} strokeWidth={1.5} name="Maritime" />
                <Line type="monotone" dataKey="legal" stroke={T.accent} dot={false} strokeWidth={1.5} name="Legal" />
                <Line type="monotone" dataKey="revenue" stroke="#ef4444" dot={false} strokeWidth={2} name="Revenue ⚠" />
                <Line type="monotone" dataKey="defense" stroke="#22c55e" dot={false} strokeWidth={1.5} name="Defense" />
                <Line type="monotone" dataKey="realEstate" stroke="#a78bfa" dot={false} strokeWidth={1.5} name="Real Estate" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          {regressionAlerts.map(alert => (
            <Card key={alert.domain + alert.skill}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded mr-2" style={{ background: `${T.accent}18`, color: T.accent }}>{alert.domain}</span>
                  <span className="text-xs font-semibold" style={{ color: T.text }}>{alert.skill.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>REGRESSION</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                {[
                  { label: 'CURRENT', value: `${alert.currentScore}%`, color: '#ef4444' },
                  { label: '30-DAY AVG', value: `${alert.avg30d}%`, color: T.accent },
                  { label: 'DELTA', value: `${alert.delta}pp`, color: '#ef4444' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-2 rounded" style={{ background: T.surface }}>
                    <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>{label}</div>
                    <div className="text-sm font-semibold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-mono" style={{ color: T.muted }}>
                Risk category: {alert.riskCategory} · Detected {new Date(alert.detectedAt).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'Candidate Cases' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Auto-Generated Candidate Cases ({candidates.length})</SectionTitle>
            <span className="text-[10px] font-mono" style={{ color: T.muted }}>{pendingCases} pending · {promotedCases} promoted</span>
          </div>
          {decideError && (
            <div className="mb-3 p-2 rounded text-[11px] font-mono"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              ⨯ {decideError}
            </div>
          )}
          <div className="flex flex-col gap-3">
            {candidates.map(c => (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${T.accent}18`, color: T.accent }}>{c.domain}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: T.dim }}>{c.category.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.muted }}>{c.riskCategory}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{
                      background: c.status === 'promoted' ? 'rgba(34,197,94,0.1)' : c.status === 'rejected' ? 'rgba(239,68,68,0.1)' : `${T.accent}18`,
                      color: c.status === 'promoted' ? '#22c55e' : c.status === 'rejected' ? '#ef4444' : T.accent,
                    }}>
                      {c.status === 'pending_review' ? 'PENDING REVIEW' : c.status.toUpperCase()}
                    </span>
                    {c.codexReceiptId && (
                      <span className="text-[8px] font-mono" style={{ color: T.muted }} title="codex-kernel chainHash receipt">
                        codex {c.codexReceiptId.slice(0, 14)}…
                      </span>
                    )}
                    {!c.codexReceiptId && c.proofHash && (
                      <span className="text-[8px] font-mono" style={{ color: T.muted }}>{c.proofHash.slice(0, 18)}…</span>
                    )}
                  </div>
                </div>
                {c.jury && <JuryAxisBar jury={c.jury} />}
                <div className="mb-2">
                  <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>INPUT</div>
                  <p className="text-xs" style={{ color: T.dim, lineHeight: 1.6 }}>{c.input}</p>
                </div>
                <div className="mb-3">
                  <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>ACTUAL OUTPUT</div>
                  <p className="text-xs" style={{ color: T.dim, lineHeight: 1.6 }}>{c.actualOutput}</p>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>confidence {Math.round(c.confidence * 100)}%</span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>· outcome: {c.outcome}</span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>· {c.workcellId}</span>
                  </div>
                  {c.status === 'pending_review' && (
                    <div className="flex gap-2">
                      <button onClick={() => rejectCase(c.id)} className="text-[10px] font-mono px-2 py-1 rounded border" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                        REJECT
                      </button>
                      <button onClick={() => promoteCase(c.id)} className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: `${T.accent}22`, color: T.accent, border: `1px solid ${T.accent}44` }}>
                        PROMOTE TO GOLDEN SET
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Counterfactual Batch' && (
        <div>
          <SectionTitle>Counterfactual Batch Results</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim, lineHeight: 1.7 }}>
            "What would have happened with model X instead of model Y?" Batch jobs rerun historical decisions with alternative models or policies. Results feed directly into model router confidence scores.
          </p>
          <div className="flex flex-col gap-3">
            {(counterfactuals ?? []).map((r, i) => (
              <Card key={i}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${T.accent}18`, color: T.accent }}>{r.domain}</span>
                  <span className="text-xs font-semibold" style={{ color: T.text }}>{r.scenario}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  {[
                    { label: 'CASES RUN', value: r.casesRun, color: T.text },
                    { label: 'VARIANT A WINS', value: r.opusWins, color: T.accent },
                    { label: 'VARIANT B WINS', value: r.sonetWins, color: T.dim },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded" style={{ background: T.surface }}>
                      <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>{label}</div>
                      <div className="text-sm font-semibold" style={{ color }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs" style={{ color: '#22c55e', lineHeight: 1.6 }}>
                  <span style={{ color: T.muted }}>Model Router Impact: </span>{r.modelRouterImpact}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Behavioral Probes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Auto-Generated Behavioral Probes — Petri Framework</SectionTitle>
          </div>
          <div className="mb-4 p-3 rounded-lg border" style={{ background: 'rgba(201,183,135,0.06)', borderColor: 'rgba(201,183,135,0.2)' }}>
            <div className="text-xs" style={{ color: T.dim, lineHeight: 1.7 }}>
              Inspired by Anthropic's Petri (Probing Examples for Targeted Behavioral Audit). When MirrorEval flags a failure pattern in production, the system auto-generates a targeted probe for that behavioral condition. Probes run on every eval cycle to catch regressions in that specific failure mode.
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {(probes ?? []).map(probe => (
              <Card key={probe.id}>
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div>
                    <div className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-block mb-1" style={{ background: `${T.accent}18`, color: T.accent }}>{probe.source.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] font-mono" style={{ color: T.muted }}>From: {probe.generatedFrom}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>ACTIVE</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: probe.passRate >= 90 ? '#22c55e' : T.accent }}>{probe.passRate}% pass</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: T.dim, lineHeight: 1.7 }}>{probe.probe}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Coverage Map' && (
        <div>
          <SectionTitle>Eval Coverage Map — by Category</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>Coverage vs. target across skill categories. Below-target categories trigger auto-candidate generation from matching production workcells.</p>
          <Card>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={overview?.coverageRadar ?? []}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="category" tick={{ fill: T.muted, fontSize: 9 }} />
                <Radar name="Current" dataKey="current" stroke={T.accent} fill={T.accent} fillOpacity={0.2} />
                <Radar name="Target" dataKey="target" stroke="#22c55e" fill="#22c55e" fillOpacity={0.05} strokeDasharray="4 2" />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2">
              <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: T.dim }}>
                <span className="w-3 h-0.5 inline-block" style={{ background: T.accent }} />Current coverage
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: T.dim }}>
                <span className="w-3 h-0.5 inline-block" style={{ background: '#22c55e' }} />Target
              </span>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
