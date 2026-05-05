import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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

type PatternType = 'signal_combination' | 'policy_threshold' | 'reasoning_strategy' | 'tool_chain' | 'timing_pattern';
type TransferStatus = 'confirmed' | 'monitoring' | 'pending';

interface CrossDomainLesson {
  id: string;
  originDomain: string;
  title: string;
  pattern: string;
  patternType: PatternType;
  confidence: number;
  transferredTo: string[];
  workcellCount: number;
  capturedAt: string;
  transferStatus: TransferStatus;
  outcomeImprovement?: string;
  // ─── ouroboros-horizon@entanglementBits ────────────
  entanglementCouplingBits?: number;
  entanglementSamples?: number;
}

interface AnomalyCorrelation {
  sourceId: string;
  sourceDomain: string;
  anomalyType: string;
  triggeredDomains: string[];
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
  resolved: boolean;
}

interface TransferEffectiveness {
  lesson: string;
  applied: number;
  improved: number;
  rate: number;
}

const PATTERN_COLORS: Record<PatternType, string> = {
  signal_combination: '#8a8a8a',
  policy_threshold: '#c9b787',
  reasoning_strategy: '#a78bfa',
  tool_chain: '#38bdf8',
  timing_pattern: '#22c55e',
};

const PATTERN_LABELS: Record<PatternType, string> = {
  signal_combination: 'Signal Combination',
  policy_threshold: 'Policy Threshold',
  reasoning_strategy: 'Reasoning Strategy',
  tool_chain: 'Tool Chain',
  timing_pattern: 'Timing Pattern',
};

const TRANSFER_STATUS_STYLE: Record<TransferStatus, { color: string; label: string }> = {
  confirmed: { color: '#22c55e', label: 'CONFIRMED' },
  monitoring: { color: '#c9b787', label: 'MONITORING' },
  pending: { color: '#8a8a8a', label: 'PENDING' },
};

const SEV_STYLE = { low: { color: '#8a8a8a' }, medium: { color: '#c9b787' }, high: { color: '#ef4444' } };

const ALL_DOMAINS = ['all', 'maritime', 'legal', 'cyber', 'revenue', 'defense', 'real-estate'];
const ALL_PATTERN_TYPES: Array<'all' | PatternType> = ['all', 'signal_combination', 'policy_threshold', 'reasoning_strategy', 'tool_chain', 'timing_pattern'];

type ActiveTab = 'Lesson Graph' | 'Pattern Library' | 'Anomaly Correlation' | 'Transfer Effectiveness';

interface LessonsMeta {
  total: number;
  filtered: number;
  totalTransfers: number;
  avgTransferRate: number;
  activeDomains: number;
}

interface AnomalyMeta {
  total: number;
  active: number;
}

export function LessonGraph() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('Lesson Graph');
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterPattern, setFilterPattern] = useState<'all' | PatternType>('all');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  const endpoint = `/adaptive/lessons${(filterDomain !== 'all' || filterPattern !== 'all')
    ? `?domain=${filterDomain}&patternType=${filterPattern}`
    : ''}`;

  const { data: lessons, meta: lessonsMeta } = useApiData<CrossDomainLesson[]>(endpoint) as { data: CrossDomainLesson[] | null; meta: LessonsMeta | null; loading: boolean; error: string | null; source: 'api' | 'demo' };
  const { data: allLessons } = useApiData<CrossDomainLesson[]>('/adaptive/lessons');
  const { data: anomalyCorrelations, meta: anomalyMeta } = useApiData<AnomalyCorrelation[]>('/adaptive/lessons/anomaly-correlations') as { data: AnomalyCorrelation[] | null; meta: AnomalyMeta | null; loading: boolean; error: string | null; source: 'api' | 'demo' };
  const { data: transferEffectiveness } = useApiData<TransferEffectiveness[]>('/adaptive/lessons/transfer-effectiveness');

  const filtered = lessons ?? [];
  const totalTransfers = (lessonsMeta as LessonsMeta | null)?.totalTransfers ?? 0;
  const avgTransferRate = (lessonsMeta as LessonsMeta | null)?.avgTransferRate ?? 0;
  const activeDomains = (lessonsMeta as LessonsMeta | null)?.activeDomains ?? 12;
  const activeAnomalies = (anomalyMeta as AnomalyMeta | null)?.active ?? 0;

  const TABS: ActiveTab[] = ['Lesson Graph', 'Pattern Library', 'Anomaly Correlation', 'Transfer Effectiveness'];

  return (
    <Layout>
      <PageHeader
        label="INTELLIGENCE · A11OY.1"
        title="Shared Lesson Graph"
        subtitle="Semantic lessons extracted from successful workcells across all 12+ domains. Cross-domain anomaly correlation, pattern library, and transfer effectiveness tracking — with governance proof on every lesson that changes behavior."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="LESSONS EXTRACTED" value={allLessons?.length ?? 0} sub={`across ${activeDomains} domains`} accent="#c9b787" />
        <KpiCard label="CROSS-DOMAIN TRANSFERS" value={totalTransfers} sub="active lesson applications" accent="#c9b787" />
        <KpiCard label="AVG TRANSFER EFFECTIVENESS" value={`${avgTransferRate}%`} sub="outcome improvement rate" accent="#c9b787" />
        <KpiCard label="ACTIVE CORRELATIONS" value={activeAnomalies} sub="cross-domain anomaly signals" accent="#c9b787" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => (
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

      {activeTab === 'Lesson Graph' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              value={filterDomain}
              onChange={e => setFilterDomain(e.target.value)}
              className="text-xs font-mono px-2 py-1 rounded"
              style={{ background: T.surface, color: T.dim, border: `1px solid ${T.border}` }}
            >
              {ALL_DOMAINS.map(d => <option key={d} value={d}>{d === 'all' ? 'All Origins' : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
            <select
              value={filterPattern}
              onChange={e => setFilterPattern(e.target.value as 'all' | PatternType)}
              className="text-xs font-mono px-2 py-1 rounded"
              style={{ background: T.surface, color: T.dim, border: `1px solid ${T.border}` }}
            >
              {ALL_PATTERN_TYPES.map(p => <option key={p} value={p}>{p === 'all' ? 'All Patterns' : PATTERN_LABELS[p as PatternType]}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map(lesson => {
              const pc = PATTERN_COLORS[lesson.patternType];
              const ts = TRANSFER_STATUS_STYLE[lesson.transferStatus];
              const isExpanded = expandedLesson === lesson.id;
              return (
                <Card key={lesson.id}>
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${T.accent}18`, color: T.accent }}>{lesson.originDomain}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${pc}18`, color: pc }}>{PATTERN_LABELS[lesson.patternType]}</span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: `${ts.color}18`, color: ts.color }}>{ts.label}</span>
                  </div>

                  <div className="text-sm font-semibold mb-2" style={{ color: T.text }}>{lesson.title}</div>

                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>CONFIDENCE</span>
                      <span className="text-[10px] font-mono" style={{ color: T.accent }}>{Math.round(lesson.confidence * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>WORKCELLS</span>
                      <span className="text-[10px] font-mono" style={{ color: T.dim }}>{lesson.workcellCount}</span>
                    </div>
                    {lesson.entanglementCouplingBits !== undefined && (
                      <div className="flex items-center gap-1" title="ouroboros-horizon@entanglementBits — mutual-information coupling between origin and recipient loops (bits)">
                        <span className="text-[9px] font-mono" style={{ color: T.muted }}>Λ-COUPLING</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(167,139,250,0.12)',
                            color: lesson.entanglementCouplingBits >= 0.5 ? '#a78bfa' : T.dim,
                          }}>
                          {lesson.entanglementCouplingBits.toFixed(3)} bits
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>TRANSFERRED TO</span>
                      {lesson.transferredTo.map(d => (
                        <span key={d} className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: T.dim }}>{d}</span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs mb-2" style={{ color: T.dim, lineHeight: 1.7 }}>{lesson.pattern}</p>

                  <button
                    className="text-[10px] font-mono"
                    style={{ color: T.muted }}
                    onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                  >
                    {isExpanded ? '▲ LESS' : '▼ TRANSFER OUTCOMES'}
                  </button>

                  {isExpanded && lesson.outcomeImprovement && (
                    <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                      <div className="text-[9px] font-mono mb-1" style={{ color: '#22c55e' }}>CONFIRMED TRANSFER OUTCOMES</div>
                      <p className="text-xs" style={{ color: '#86efac', lineHeight: 1.7 }}>{lesson.outcomeImprovement}</p>
                    </div>
                  )}
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-xs" style={{ color: T.muted }}>No lessons match current filters</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Pattern Library' && (
        <div>
          <SectionTitle>Auto-Extracted Success Patterns</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim, lineHeight: 1.7 }}>
            What tool chains worked, what reasoning strategies produced good outcomes, what policy configurations correlated with success across the 12+ A11oy domains.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(PATTERN_LABELS).map(([key, label]) => {
              const lessons = (allLessons ?? []).filter(l => l.patternType === key as PatternType);
              const color = PATTERN_COLORS[key as PatternType];
              const avgConf = lessons.length ? Math.round(lessons.reduce((a, l) => a + l.confidence, 0) / lessons.length * 100) : 0;
              return (
                <Card key={key} onClick={() => { setFilterPattern(key as PatternType); setActiveTab('Lesson Graph'); }} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-sm font-semibold" style={{ color: T.text }}>{label}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono" style={{ color: T.muted }}>{lessons.length} patterns extracted</span>
                    <span className="text-[10px] font-mono" style={{ color: T.accent }}>avg {avgConf}% confidence</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {lessons.slice(0, 2).map(l => (
                      <div key={l.id} className="text-[10px] font-mono truncate" style={{ color: T.dim }}>· {l.title}</div>
                    ))}
                    {lessons.length > 2 && <div className="text-[10px] font-mono" style={{ color: T.muted }}>+{lessons.length - 2} more</div>}
                    {lessons.length === 0 && <div className="text-[10px] font-mono" style={{ color: T.muted }}>No patterns yet for this type</div>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'Anomaly Correlation' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Cross-Domain Anomaly Correlation Feed</SectionTitle>
            <span className="text-[10px] font-mono" style={{ color: T.muted }}>Anomaly in one domain triggers awareness in related domains</span>
          </div>
          <div className="flex flex-col gap-3">
            {(anomalyCorrelations ?? []).map(ac => {
              const sev = SEV_STYLE[ac.severity];
              return (
                <Card key={ac.sourceId}>
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${T.accent}18`, color: T.accent }}>{ac.sourceDomain}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${sev.color}18`, color: sev.color }}>{ac.severity.toUpperCase()}</span>
                      <span className="text-[10px] font-mono" style={{ color: T.muted }}>{ac.anomalyType.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: ac.resolved ? 'rgba(34,197,94,0.1)' : 'rgba(201,183,135,0.1)', color: ac.resolved ? '#22c55e' : T.accent }}>
                      {ac.resolved ? 'RESOLVED' : 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: T.dim, lineHeight: 1.7 }}>{ac.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>TRIGGERED AWARENESS IN</span>
                    {ac.triggeredDomains.map(d => (
                      <span key={d} className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: T.dim }}>{d}</span>
                    ))}
                    <span className="text-[9px] font-mono ml-auto" style={{ color: T.muted }}>{new Date(ac.detectedAt).toLocaleString()}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'Transfer Effectiveness' && (
        <div>
          <SectionTitle>Transfer Effectiveness — Did Cross-Domain Lessons Help?</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim, lineHeight: 1.7 }}>
            The meta-feedback loop on the transfer mechanism itself. Measures whether applied cross-domain lessons actually improved outcomes in the receiving domain.
          </p>
          <Card className="mb-4">
            <div className="text-xs font-mono mb-4" style={{ color: T.dim }}>Lessons applied vs. confirmed outcome improvements</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={transferEffectiveness ?? []} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="lesson" tick={{ fill: T.muted, fontSize: 9 }} />
                <YAxis tick={{ fill: T.muted, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111', border: `1px solid ${T.border}`, borderRadius: 6 }} />
                <Bar dataKey="applied" fill={T.surface} name="Applied" />
                <Bar dataKey="improved" fill={T.accent} name="Confirmed Improved" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <div className="flex flex-col gap-2">
            {(transferEffectiveness ?? []).map(t => (
              <div key={t.lesson} className="flex items-center gap-3 p-3 rounded" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="text-xs font-mono w-32 shrink-0" style={{ color: T.dim }}>{t.lesson}</div>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${t.rate}%`, background: t.rate >= 85 ? '#22c55e' : T.accent }} />
                </div>
                <span className="text-xs font-mono w-10 text-right" style={{ color: t.rate >= 85 ? '#22c55e' : T.accent }}>{t.rate}%</span>
                <span className="text-[9px] font-mono" style={{ color: T.muted }}>{t.improved}/{t.applied}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
