/**
 * Unified Command — Open Evaluation Hub
 * Cross-platform hub: browse every benchmark, drill leaderboards,
 * side-by-side comparison, submit scores, dispute queue.
 */

import {
  BenchmarkCard,
  EvalBadge,
  LeaderboardTable,
  type LeaderboardEntry,
  ResultDetailDrawer,
  type EvalResultDetail,
  SubmitScoreForm,
  type SubmitScorePayload,
  ScoreChip,
} from '@szl-holdings/design-system';
import {
  BarChart3,
  GitPullRequest,
  Globe,
  Search,
  Trophy,
  Upload,
  XCircle,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const BORDER_SUBTLE = 'hsla(0,0%,100%,0.04)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const TEXT_MUTED = 'hsl(214,7%,38%)';
const ACCENT = '#6366f1';
const ACCENT_AMBER = '#f59e0b';

/* ─────────────────────────────── Seed Data ─────────────────────────────── */

const ALL_BENCHMARKS = [
  { benchmarkId: 'szl-cyber-threat-detection-v1', name: 'Threat Detection Accuracy', domain: 'cyber', description: 'TTP classification, false-positive rate, lateral movement detection.', tasks: [{ taskId: 'tda-ttp', name: 'TTP Classification', primaryMetric: 'f1', higherIsBetter: true }, { taskId: 'tda-fp-rate', name: 'False Positive Rate', primaryMetric: 'fpr', higherIsBetter: false }, { taskId: 'tda-lateral', name: 'Lateral Movement Detection', primaryMetric: 'recall', higherIsBetter: true }] },
  { benchmarkId: 'szl-cyber-mttt-v1', name: 'Mean Time to Triage', domain: 'cyber', description: 'End-to-end triage latency across 200 incident scenarios.', tasks: [{ taskId: 'mttt-p50', name: 'Median Triage Time', primaryMetric: 'latency_p50_s', higherIsBetter: false }, { taskId: 'mttt-accuracy', name: 'Priority Accuracy', primaryMetric: 'accuracy', higherIsBetter: true }] },
  { benchmarkId: 'szl-legal-contract-risk-v1', name: 'Contract Risk Scoring', domain: 'legal', description: 'Clause identification, risk ranking, and false-negative rate.', tasks: [{ taskId: 'crs-clause-id', name: 'Clause Identification', primaryMetric: 'f1', higherIsBetter: true }, { taskId: 'crs-risk-rank', name: 'Risk Ranking Agreement', primaryMetric: 'spearman_rho', higherIsBetter: true }] },
  { benchmarkId: 'szl-legal-citation-accuracy-v1', name: 'Citation Accuracy', domain: 'legal', description: 'Exact citation match and hallucination rate for legal reasoning agents.', tasks: [{ taskId: 'ca-exact-match', name: 'Exact Citation Match', primaryMetric: 'exact_match', higherIsBetter: true }, { taskId: 'ca-hallucination', name: 'Hallucination Rate', primaryMetric: 'hallucination_rate', higherIsBetter: false }] },
  { benchmarkId: 'szl-terra-comp-quality-v1', name: 'Comparable Sales Quality', domain: 'terra', description: 'NDCG@5 relevance, MAPE price error, and recency for AVM agents.', tasks: [{ taskId: 'csq-relevance', name: 'Comp Relevance', primaryMetric: 'ndcg@5', higherIsBetter: true }, { taskId: 'csq-price-error', name: 'Price Error (MAPE)', primaryMetric: 'mape', higherIsBetter: false }] },
  { benchmarkId: 'szl-terra-risk-scoring-v1', name: 'Risk Scoring Accuracy', domain: 'terra', description: 'Risk tier accuracy and AUC for property-distress agents.', tasks: [{ taskId: 'rsa-tier-accuracy', name: 'Risk Tier Accuracy', primaryMetric: 'accuracy', higherIsBetter: true }, { taskId: 'rsa-auc', name: 'Distress AUC', primaryMetric: 'auc_roc', higherIsBetter: true }] },
  { benchmarkId: 'szl-maritime-threat-class-v1', name: 'Threat Classification', domain: 'maritime', description: 'Dark vessel detection, sanctions evasion, and piracy risk scoring.', tasks: [{ taskId: 'tc-dark-vessel', name: 'Dark Vessel Detection', primaryMetric: 'f1', higherIsBetter: true }, { taskId: 'tc-sanctions', name: 'Sanctions Evasion ID', primaryMetric: 'precision', higherIsBetter: true }] },
  { benchmarkId: 'szl-maritime-track-confidence-v1', name: 'Track Confidence', domain: 'maritime', description: 'Identity resolution and track gap-fill accuracy for vessel tracking.', tasks: [{ taskId: 'trc-identity', name: 'Identity Resolution', primaryMetric: 'accuracy', higherIsBetter: true }, { taskId: 'trc-gap-fill', name: 'Track Gap Fill Error', primaryMetric: 'gap_fill_mae_km', higherIsBetter: false }] },
  { benchmarkId: 'szl-executive-briefing-faithfulness-v1', name: 'Briefing Faithfulness', domain: 'executive', description: 'Factual faithfulness and hallucination rate for executive briefing agents.', tasks: [{ taskId: 'bf-faithfulness', name: 'Factual Faithfulness', primaryMetric: 'faithfulness_score', higherIsBetter: true }, { taskId: 'bf-hallucination', name: 'Hallucination Rate', primaryMetric: 'hallucination_rate', higherIsBetter: false }] },
  { benchmarkId: 'szl-executive-briefing-latency-v1', name: 'Briefing Latency', domain: 'executive', description: 'P50/P95 brief delivery time and time-to-first-token.', tasks: [{ taskId: 'bl-p50', name: 'Median Brief Time', primaryMetric: 'latency_p50_ms', higherIsBetter: false }, { taskId: 'bl-ttfb', name: 'Time to First Token', primaryMetric: 'ttfb_ms', higherIsBetter: false }] },
  { benchmarkId: 'szl-decision-quality-v1', name: 'Decision Quality', domain: 'decision', description: 'Outcome accuracy, causal precision, and stakeholder alignment.', tasks: [{ taskId: 'dq-outcome-acc', name: 'Outcome Accuracy', primaryMetric: 'accuracy', higherIsBetter: true }, { taskId: 'dq-causal-prec', name: 'Causal Precision', primaryMetric: 'causal_precision', higherIsBetter: true }] },
  { benchmarkId: 'szl-decision-cost-v1', name: 'Cost-per-Decision', domain: 'decision', description: 'Token cost per 1k decisions and quality-efficiency ratio.', tasks: [{ taskId: 'cpd-token-cost', name: 'Token Cost / 1k', primaryMetric: 'token_cost_usd_1k', higherIsBetter: false }, { taskId: 'cpd-quality-efficiency', name: 'Quality × Efficiency', primaryMetric: 'qe_ratio', higherIsBetter: true }] },
];

const TOP_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, resultId: 'top-001', entityId: 'sentra-agentic-soc-v3', entityLabel: 'Sentra Agentic SOC v3', entityType: 'agent', domain: 'cyber', metric: 'f1', value: 0.947, numericValue: '0.947', badgeState: 'verified', evalDate: '2026-04-15', sourceUrl: '#' },
  { rank: 2, resultId: 'top-002', entityId: 'vessels-track-v5', entityLabel: 'Vessels Track Fusion v5', entityType: 'agent', domain: 'maritime', metric: 'accuracy', value: 0.974, numericValue: '0.974', badgeState: 'verified', evalDate: '2026-04-22', sourceUrl: '#' },
  { rank: 3, resultId: 'top-003', entityId: 'pulse-briefing-engine-v5', entityLabel: 'Pulse Briefing Engine v5', entityType: 'agent', domain: 'executive', metric: 'faithfulness_score', value: 0.961, numericValue: '0.961', badgeState: 'verified', evalDate: '2026-04-19', sourceUrl: '#' },
  { rank: 4, resultId: 'top-004', entityId: 'counsel-clause-genome-v4', entityLabel: 'Counsel Clause Genome v4', entityType: 'agent', domain: 'legal', metric: 'f1', value: 0.951, numericValue: '0.951', badgeState: 'verified', evalDate: '2026-04-12', sourceUrl: '#' },
  { rank: 5, resultId: 'top-005', entityId: 'lyte-decision-twin-v4', entityLabel: 'Lyte Decision Twin v4', entityType: 'agent', domain: 'decision', metric: 'accuracy', value: 0.941, numericValue: '0.941', badgeState: 'verified', evalDate: '2026-04-21', sourceUrl: '#' },
  { rank: 6, resultId: 'top-006', entityId: 'terra-avm-v5', entityLabel: 'Terra AVM Engine v5', entityType: 'agent', domain: 'terra', metric: 'ndcg@5', value: 0.943, numericValue: '0.943', badgeState: 'verified', evalDate: '2026-04-18', sourceUrl: '#' },
];

const DISPUTE_QUEUE = [
  { id: 'dsp-001', entityLabel: 'Community SOC-GPT', domain: 'cyber', metric: 'f1', claimed: 0.901, status: 'open', submittedBy: 'community', note: 'Claimed score on training-like data; re-run pending on held-out set.' },
  { id: 'dsp-002', entityLabel: 'Community Legal-GPT', domain: 'legal', metric: 'exact_match', claimed: 0.812, status: 'investigating', submittedBy: 'community', note: 'Citation sources not verifiable — awaiting trace upload from submitter.' },
];

const DOMAIN_COLOR: Record<string, string> = {
  cyber: '#ef4444',
  legal: '#4d8fcc',
  terra: '#22c55e',
  maritime: '#14b8a6',
  executive: '#a855f7',
  decision: '#f59e0b',
};

/* Task-specific leaderboard entries keyed by taskId */
const TASK_LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  'tda-ttp': [
    { rank: 1, resultId: 'tl-001', entityId: 'sentra-agentic-soc-v3', entityLabel: 'Sentra Agentic SOC v3', entityType: 'agent', domain: 'cyber', metric: 'f1', value: 0.947, numericValue: '0.947', badgeState: 'verified', evalDate: '2026-04-15', sourceUrl: '#' },
    { rank: 2, resultId: 'tl-002', entityId: 'community-soc-gpt', entityLabel: 'Community SOC-GPT', entityType: 'model', domain: 'cyber', metric: 'f1', value: 0.901, numericValue: '0.901', badgeState: 'community', evalDate: '2026-04-01', sourceUrl: null },
    { rank: 3, resultId: 'tl-003', entityId: 'baseline-ids', entityLabel: 'Baseline IDS', entityType: 'model', domain: 'cyber', metric: 'f1', value: 0.751, numericValue: '0.751', badgeState: 'community', evalDate: '2026-03-28', sourceUrl: null },
  ],
  'tda-fp-rate': [
    { rank: 1, resultId: 'tl-011', entityId: 'sentra-agentic-soc-v3', entityLabel: 'Sentra Agentic SOC v3', entityType: 'agent', domain: 'cyber', metric: 'fpr', value: 0.031, numericValue: '0.031', badgeState: 'verified', evalDate: '2026-04-15', sourceUrl: '#' },
    { rank: 2, resultId: 'tl-012', entityId: 'sentra-v2.7', entityLabel: 'Sentra v2.7', entityType: 'agent', domain: 'cyber', metric: 'fpr', value: 0.058, numericValue: '0.058', badgeState: 'community', evalDate: '2026-04-12', sourceUrl: null },
  ],
  'crs-clause-id': [
    { rank: 1, resultId: 'tl-021', entityId: 'counsel-clause-genome-v4', entityLabel: 'Counsel Clause Genome v4', entityType: 'agent', domain: 'legal', metric: 'f1', value: 0.951, numericValue: '0.951', badgeState: 'verified', evalDate: '2026-04-12', sourceUrl: '#' },
    { rank: 2, resultId: 'tl-022', entityId: 'community-legal-gpt', entityLabel: 'Community Legal-GPT', entityType: 'model', domain: 'legal', metric: 'f1', value: 0.812, numericValue: '0.812', badgeState: 'community', evalDate: '2026-04-01', sourceUrl: null },
  ],
  'csq-relevance': [
    { rank: 1, resultId: 'tl-031', entityId: 'terra-avm-v5', entityLabel: 'Terra AVM Engine v5', entityType: 'agent', domain: 'terra', metric: 'ndcg@5', value: 0.943, numericValue: '0.943', badgeState: 'verified', evalDate: '2026-04-18', sourceUrl: '#' },
    { rank: 2, resultId: 'tl-032', entityId: 'terra-avm-v4', entityLabel: 'Terra AVM Engine v4', entityType: 'agent', domain: 'terra', metric: 'ndcg@5', value: 0.891, numericValue: '0.891', badgeState: 'community', evalDate: '2026-03-20', sourceUrl: null },
  ],
  'tc-dark-vessel': [
    { rank: 1, resultId: 'tl-041', entityId: 'vessels-track-v5', entityLabel: 'Vessels Track Fusion v5', entityType: 'agent', domain: 'maritime', metric: 'f1', value: 0.974, numericValue: '0.974', badgeState: 'verified', evalDate: '2026-04-22', sourceUrl: '#' },
    { rank: 2, resultId: 'tl-042', entityId: 'vessels-track-v4', entityLabel: 'Vessels Track Fusion v4', entityType: 'agent', domain: 'maritime', metric: 'f1', value: 0.931, numericValue: '0.931', badgeState: 'community', evalDate: '2026-04-05', sourceUrl: null },
  ],
  'bf-faithfulness': [
    { rank: 1, resultId: 'tl-051', entityId: 'pulse-briefing-engine-v5', entityLabel: 'Pulse Briefing Engine v5', entityType: 'agent', domain: 'executive', metric: 'faithfulness_score', value: 0.961, numericValue: '0.961', badgeState: 'verified', evalDate: '2026-04-19', sourceUrl: '#' },
    { rank: 2, resultId: 'tl-052', entityId: 'pulse-briefing-engine-v4', entityLabel: 'Pulse Briefing Engine v4', entityType: 'agent', domain: 'executive', metric: 'faithfulness_score', value: 0.928, numericValue: '0.928', badgeState: 'community', evalDate: '2026-04-02', sourceUrl: null },
  ],
  'dq-outcome-acc': [
    { rank: 1, resultId: 'tl-061', entityId: 'lyte-decision-twin-v4', entityLabel: 'Lyte Decision Twin v4', entityType: 'agent', domain: 'decision', metric: 'accuracy', value: 0.941, numericValue: '0.941', badgeState: 'verified', evalDate: '2026-04-21', sourceUrl: '#' },
    { rank: 2, resultId: 'tl-062', entityId: 'lyte-decision-twin-v3', entityLabel: 'Lyte Decision Twin v3', entityType: 'agent', domain: 'decision', metric: 'accuracy', value: 0.897, numericValue: '0.897', badgeState: 'community', evalDate: '2026-04-08', sourceUrl: null },
  ],
};

type Tab = 'hub' | 'benchmarks' | 'compare' | 'submit' | 'disputes';

function domainPill(domain: string) {
  const color = DOMAIN_COLOR[domain] ?? TEXT_SEC;
  return (
    <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '999px', border: `1px solid ${color}40`, color, backgroundColor: `${color}12`, display: 'inline-block' }}>
      {domain}
    </span>
  );
}

export default function OpenEvalHub() {
  const [activeTab, setActiveTab] = useState<Tab>('hub');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [searchQ, setSearchQ] = useState('');
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [drawerResult, setDrawerResult] = useState<EvalResultDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredBenchmarks = useMemo(() => {
    return ALL_BENCHMARKS.filter((bm) => {
      const matchDomain = domainFilter === 'all' || bm.domain === domainFilter;
      const matchSearch = !searchQ || bm.name.toLowerCase().includes(searchQ.toLowerCase()) || bm.domain.toLowerCase().includes(searchQ.toLowerCase());
      return matchDomain && matchSearch;
    });
  }, [domainFilter, searchQ]);

  const DOMAINS = ['all', 'cyber', 'legal', 'terra', 'maritime', 'executive', 'decision'];

  function toggleCompare(resultId: string) {
    setCompareIds((prev) =>
      prev.includes(resultId) ? prev.filter((id) => id !== resultId) : prev.length < 3 ? [...prev, resultId] : prev
    );
  }

  const compareEntries = TOP_ENTRIES.filter((e) => compareIds.includes(e.resultId));

  function toDetail(entry: LeaderboardEntry): EvalResultDetail {
    return {
      resultId: entry.resultId,
      benchmarkId: 'cross-platform',
      benchmarkName: 'Cross-Platform Benchmark',
      taskId: entry.metric,
      entityId: entry.entityId,
      entityLabel: entry.entityLabel,
      entityType: entry.entityType,
      domain: entry.domain,
      metric: entry.metric,
      value: entry.value,
      numericValue: entry.numericValue,
      unit: entry.unit,
      higherIsBetter: true,
      badgeState: entry.badgeState,
      evalDate: entry.evalDate,
      sourceUrl: entry.sourceUrl,
    };
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'hub', label: 'Hub Overview', icon: <Globe className="h-3.5 w-3.5" /> },
    { id: 'benchmarks', label: 'All Benchmarks', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'compare', label: `Compare (${compareIds.length}/3)`, icon: <Trophy className="h-3.5 w-3.5" /> },
    { id: 'submit', label: 'Submit Score', icon: <Upload className="h-3.5 w-3.5" /> },
    { id: 'disputes', label: `Disputes (${DISPUTE_QUEUE.length})`, icon: <GitPullRequest className="h-3.5 w-3.5" /> },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: TEXT, fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Globe style={{ width: '1.25rem', height: '1.25rem', color: ACCENT }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Open Evaluation Hub</h1>
          <EvalBadge state="leaderboard" label="Cross-Platform" />
        </div>
        <p style={{ color: TEXT_SEC, fontSize: '0.875rem', margin: 0 }}>
          Single front door to every SZL benchmark — browse, drill, compare, and submit across Sentra, Counsel, Terra, Vessels, Pulse, and Lyte.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.125rem', padding: '0.75rem 2rem 0', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '6px 6px 0 0', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? TEXT : TEXT_SEC, backgroundColor: activeTab === tab.id ? SURFACE : 'transparent', borderBottom: activeTab === tab.id ? `2px solid ${ACCENT}` : '2px solid transparent' }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.5rem 2rem', maxWidth: '1200px' }}>
        {/* ── Hub Overview ── */}
        {activeTab === 'hub' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Task Leaderboard drill-down */}
            {selectedTaskId && (
              <div style={{ borderRadius: '10px', border: `1px solid ${ACCENT}40`, padding: '1.25rem', backgroundColor: `${ACCENT}08` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <BarChart3 style={{ width: '1rem', height: '1rem', color: ACCENT }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Task Leaderboard: <span style={{ color: ACCENT, fontFamily: 'monospace' }}>{selectedTaskId}</span></span>
                  <button
                    onClick={() => setSelectedTaskId(null)}
                    style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    ✕ Clear
                  </button>
                </div>
                {(TASK_LEADERBOARDS[selectedTaskId] ?? []).length === 0 ? (
                  <p style={{ color: TEXT_MUTED, fontSize: '0.875rem' }}>No leaderboard entries for this task yet.</p>
                ) : (
                  <LeaderboardTable
                    entries={TASK_LEADERBOARDS[selectedTaskId]}
                    taskId={selectedTaskId}
                    higherIsBetter
                    onRowClick={(entry) => { setDrawerResult(toDetail(entry)); setDrawerOpen(true); }}
                  />
                )}
              </div>
            )}
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Benchmarks', value: ALL_BENCHMARKS.length, sub: 'across 6 domains' },
                { label: 'Eval Tasks', value: ALL_BENCHMARKS.reduce((a, b) => a + b.tasks.length, 0), sub: 'unique metrics' },
                { label: 'Verified Results', value: '42', sub: 'cryptographically proven' },
                { label: 'Community Submissions', value: '8', sub: 'in review queue' },
              ].map((stat) => (
                <div key={stat.label} style={{ borderRadius: '10px', border: `1px solid ${BORDER}`, padding: '1.25rem', backgroundColor: SURFACE }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: TEXT }}>{stat.value}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: TEXT_SEC, marginTop: '0.25rem' }}>{stat.label}</div>
                  <div style={{ fontSize: '0.75rem', color: TEXT_MUTED }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Top performers */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Trophy style={{ width: '1rem', height: '1rem', color: ACCENT_AMBER }} />
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Top Performers Across All Domains</span>
              </div>
              <div style={{ borderRadius: '10px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'hsla(0,0%,100%,0.03)', borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
                      {['#', 'Entity', 'Domain', 'Flagship Score', 'Status', 'Actions'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.625rem 0.875rem', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: TEXT_MUTED }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_ENTRIES.map((entry, i) => (
                      <tr key={entry.resultId} style={{ borderBottom: i < TOP_ENTRIES.length - 1 ? `1px solid ${BORDER_SUBTLE}` : 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsla(0,0%,100%,0.025)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}>
                        <td style={{ padding: '0.75rem 0.875rem', fontWeight: 700, color: entry.rank <= 3 ? ACCENT_AMBER : TEXT_MUTED }}>
                          {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem', fontWeight: 500, color: TEXT }}>{entry.entityLabel}</td>
                        <td style={{ padding: '0.75rem 0.875rem' }}>{domainPill(entry.domain)}</td>
                        <td style={{ padding: '0.75rem 0.875rem' }}>
                          <ScoreChip metric={entry.metric} value={typeof entry.value === 'number' ? entry.value : Number(entry.numericValue)} higherIsBetter strong compact />
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem' }}>
                          <EvalBadge state={entry.badgeState} compact />
                        </td>
                        <td style={{ padding: '0.75rem 0.875rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => { setDrawerResult(toDetail(entry)); setDrawerOpen(true); }}
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '6px', border: `1px solid ${BORDER}`, background: 'transparent', color: TEXT_SEC, cursor: 'pointer' }}>
                              Details
                            </button>
                            <button onClick={() => toggleCompare(entry.resultId)}
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '6px', border: `1px solid ${compareIds.includes(entry.resultId) ? ACCENT + '60' : BORDER}`, background: compareIds.includes(entry.resultId) ? `${ACCENT}15` : 'transparent', color: compareIds.includes(entry.resultId) ? ACCENT : TEXT_SEC, cursor: 'pointer' }}>
                              {compareIds.includes(entry.resultId) ? '✓ Compare' : '+ Compare'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Domain pills */}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Benchmarks by Domain</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
                {['cyber', 'legal', 'terra', 'maritime', 'executive', 'decision'].map((domain) => {
                  const bms = ALL_BENCHMARKS.filter((b) => b.domain === domain);
                  const color = DOMAIN_COLOR[domain] ?? TEXT_SEC;
                  return (
                    <div key={domain} onClick={() => { setDomainFilter(domain); setActiveTab('benchmarks'); }}
                      style={{ borderRadius: '10px', border: `1px solid ${color}30`, padding: '1rem 1.25rem', background: `${color}08`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}60`)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${color}30`)}>
                      <div>
                        <div style={{ fontWeight: 600, color, textTransform: 'capitalize', fontSize: '0.875rem' }}>{domain}</div>
                        <div style={{ color: TEXT_MUTED, fontSize: '0.75rem' }}>{bms.length} benchmark{bms.length !== 1 ? 's' : ''}</div>
                      </div>
                      <ChevronRight style={{ width: '1rem', height: '1rem', color: TEXT_MUTED }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── All Benchmarks ── */}
        {activeTab === 'benchmarks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0.375rem 0.75rem', flexGrow: 1, maxWidth: '320px' }}>
                <Search style={{ width: '0.875rem', height: '0.875rem', color: TEXT_MUTED }} />
                <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search benchmarks…"
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: TEXT, fontSize: '0.875rem', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {DOMAINS.map((d) => (
                  <button key={d} onClick={() => setDomainFilter(d)}
                    style={{ padding: '0.3125rem 0.75rem', borderRadius: '999px', border: `1px solid ${domainFilter === d ? (DOMAIN_COLOR[d] ?? ACCENT) + '60' : BORDER}`, background: domainFilter === d ? `${DOMAIN_COLOR[d] ?? ACCENT}15` : 'transparent', color: domainFilter === d ? (DOMAIN_COLOR[d] ?? ACCENT) : TEXT_SEC, fontSize: '0.75rem', cursor: 'pointer', fontWeight: domainFilter === d ? 600 : 400, textTransform: 'capitalize' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {filteredBenchmarks.length === 0 && (
              <div style={{ textAlign: 'center', color: TEXT_MUTED, padding: '3rem' }}>No benchmarks match your filters.</div>
            )}

            {filteredBenchmarks.map((bm) => (
              <BenchmarkCard
                key={bm.benchmarkId}
                benchmarkId={bm.benchmarkId}
                name={bm.name}
                description={bm.description}
                domain={bm.domain}
                tasks={bm.tasks}
                evaluationFramework="szl-native"
                tags={[]}
                onClick={() => setSelectedBenchmarkId(selectedBenchmarkId === bm.benchmarkId ? null : bm.benchmarkId)}
                onLeaderboardClick={(taskId) => { setSelectedTaskId(taskId); setActiveTab('hub'); }}
              />
            ))}
          </div>
        )}

        {/* ── Side-by-Side Compare ── */}
        {activeTab === 'compare' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: TEXT_SEC, fontSize: '0.875rem' }}>
              Select up to 3 entries from the Hub Overview to compare side-by-side. Currently comparing {compareIds.length} entr{compareIds.length !== 1 ? 'ies' : 'y'}.
            </p>
            {compareIds.length === 0 && (
              <div style={{ textAlign: 'center', color: TEXT_MUTED, padding: '3rem', border: `1px dashed ${BORDER}`, borderRadius: '10px' }}>
                Go to Hub Overview and click "+ Compare" on up to 3 results.
              </div>
            )}
            {compareEntries.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareEntries.length}, 1fr)`, gap: '1rem' }}>
                {compareEntries.map((entry) => (
                  <div key={entry.resultId} style={{ borderRadius: '10px', border: `1px solid ${BORDER}`, padding: '1.25rem', backgroundColor: SURFACE, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: TEXT }}>{entry.entityLabel}</div>
                        <div style={{ marginTop: '0.25rem' }}>{domainPill(entry.domain)}</div>
                      </div>
                      <button onClick={() => toggleCompare(entry.resultId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: TEXT_MUTED }}>
                        <XCircle style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                    <EvalBadge state={entry.badgeState} />
                    <ScoreChip metric={entry.metric} value={typeof entry.value === 'number' ? entry.value : Number(entry.numericValue)} higherIsBetter strong />
                    <div style={{ fontSize: '0.75rem', color: TEXT_MUTED }}>Eval date: {entry.evalDate}</div>
                    <button onClick={() => { setDrawerResult(toDetail(entry)); setDrawerOpen(true); }}
                      style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', borderRadius: '6px', border: `1px solid ${BORDER}`, background: 'transparent', color: TEXT_SEC, cursor: 'pointer', textAlign: 'center' }}>
                      View Details →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Submit Score ── */}
        {activeTab === 'submit' && (
          <div style={{ maxWidth: '640px' }}>
            <p style={{ color: TEXT_SEC, fontSize: '0.875rem', marginBottom: '1rem' }}>
              Open a community PR to submit a new eval result against any benchmark task. Results enter the verification queue; verified results appear on the leaderboard.
            </p>
            <SubmitScoreForm
              onSubmit={async (p: SubmitScorePayload) => {
                await new Promise((r) => setTimeout(r, 600));
                console.info('Open Eval Hub submission:', p);
              }}
            />
          </div>
        )}

        {/* ── Dispute Queue ── */}
        {activeTab === 'disputes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <p style={{ color: TEXT_SEC, fontSize: '0.875rem' }}>
              Community-provided scores under review. Operators can accept, reject, or escalate disputes. Disputed scores fall back to the dispute flow until resolved.
            </p>
            {DISPUTE_QUEUE.map((d) => (
              <div key={d.id} style={{ borderRadius: '10px', border: `1px solid ${BORDER}`, padding: '1.25rem', backgroundColor: SURFACE, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: TEXT }}>{d.entityLabel}</span>
                  {domainPill(d.domain)}
                  <span style={{ fontSize: '0.75rem', color: TEXT_MUTED }}>metric: {d.metric}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, padding: '0.125rem 0.625rem', borderRadius: '999px', border: `1px solid ${d.status === 'open' ? '#f59e0b40' : '#6366f140'}`, color: d.status === 'open' ? '#f59e0b' : ACCENT, backgroundColor: d.status === 'open' ? '#f59e0b10' : '#6366f110' }}>
                    {d.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: TEXT_SEC }}>{d.note}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', padding: '0.375rem 0.75rem', borderRadius: '6px', border: `1px solid rgba(34,197,94,0.4)`, background: 'rgba(34,197,94,0.08)', color: '#22c55e', cursor: 'pointer' }}>
                    <CheckCircle style={{ width: '0.75rem', height: '0.75rem' }} /> Accept
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', padding: '0.375rem 0.75rem', borderRadius: '6px', border: `1px solid rgba(239,68,68,0.4)`, background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer' }}>
                    <XCircle style={{ width: '0.75rem', height: '0.75rem' }} /> Reject
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', padding: '0.375rem 0.75rem', borderRadius: '6px', border: `1px solid ${BORDER}`, background: 'transparent', color: TEXT_SEC, cursor: 'pointer' }}>
                    <AlertTriangle style={{ width: '0.75rem', height: '0.75rem' }} /> Escalate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResultDetailDrawer result={drawerResult} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
