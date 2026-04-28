/**
 * Lyte — Benchmarks & Leaderboards
 * Domain: Decision Intelligence
 * Benchmarks: Decision Quality, Cost-per-Decision
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
} from '@szl-holdings/design-system';
import { Zap, Trophy } from 'lucide-react';
import { useState } from 'react';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = '#f59e0b';

const BENCHMARKS = [
  {
    benchmarkId: 'szl-decision-quality-v1',
    name: 'Decision Quality',
    description:
      'Evaluates decision agents on outcome accuracy, causal reasoning quality, and stakeholder alignment across 300 synthetic high-stakes scenarios.',
    domain: 'decision',
    evaluationFramework: 'szl-native',
    tags: ['decision-making', 'causal', 'accuracy', 'scenarios'],
    tasks: [
      { taskId: 'dq-outcome-acc', name: 'Outcome Accuracy', primaryMetric: 'accuracy', higherIsBetter: true, baseline: 0.71 },
      { taskId: 'dq-causal-prec', name: 'Causal Precision', primaryMetric: 'causal_precision', higherIsBetter: true, baseline: 0.63 },
      { taskId: 'dq-stakeholder', name: 'Stakeholder Alignment', primaryMetric: 'alignment_score', higherIsBetter: true, baseline: 0.67 },
    ],
  },
  {
    benchmarkId: 'szl-decision-cost-v1',
    name: 'Cost-per-Decision',
    description:
      'Measures total token and compute cost incurred to produce a fully justified decision recommendation, normalised per 1,000 decisions.',
    domain: 'decision',
    evaluationFramework: 'szl-native',
    tags: ['cost', 'efficiency', 'token-economy', 'performance'],
    tasks: [
      { taskId: 'cpd-token-cost', name: 'Token Cost / 1k Decisions', primaryMetric: 'token_cost_usd_1k', higherIsBetter: false, baseline: 4.20 },
      { taskId: 'cpd-latency', name: 'Decision Latency P50', primaryMetric: 'latency_p50_ms', higherIsBetter: false, baseline: 1800 },
      { taskId: 'cpd-quality-efficiency', name: 'Quality × Efficiency', primaryMetric: 'qe_ratio', higherIsBetter: true, baseline: 0.34 },
    ],
  },
];

const LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  'dq-outcome-acc': [
    { rank: 1, resultId: 'lr-001', entityId: 'lyte-decision-twin-v4', entityLabel: 'Decision Twin Agent v4', entityType: 'agent', domain: 'decision', metric: 'accuracy', value: 0.941, numericValue: '0.941', badgeState: 'verified', evalDate: '2026-04-21', sourceUrl: '#' },
    { rank: 2, resultId: 'lr-002', entityId: 'lyte-causal-v3', entityLabel: 'Causal Intelligence Agent v3', entityType: 'agent', domain: 'decision', metric: 'accuracy', value: 0.918, numericValue: '0.918', badgeState: 'leaderboard', evalDate: '2026-04-08', sourceUrl: '#' },
    { rank: 3, resultId: 'lr-003', entityId: 'community-decision-gpt', entityLabel: 'Community Decision-GPT', entityType: 'model', domain: 'decision', metric: 'accuracy', value: 0.862, numericValue: '0.862', badgeState: 'community', evalDate: '2026-03-03', sourceUrl: '#' },
  ],
  'dq-causal-prec': [
    { rank: 1, resultId: 'lr-004', entityId: 'lyte-causal-v3', entityLabel: 'Causal Intelligence Agent v3', entityType: 'agent', domain: 'decision', metric: 'causal_precision', value: 0.928, numericValue: '0.928', badgeState: 'verified', evalDate: '2026-04-08', sourceUrl: '#' },
    { rank: 2, resultId: 'lr-005', entityId: 'lyte-decision-twin-v4', entityLabel: 'Decision Twin Agent v4', entityType: 'agent', domain: 'decision', metric: 'causal_precision', value: 0.904, numericValue: '0.904', badgeState: 'leaderboard', evalDate: '2026-04-21', sourceUrl: '#' },
  ],
  'dq-stakeholder': [
    { rank: 1, resultId: 'lr-006', entityId: 'lyte-decision-twin-v4', entityLabel: 'Decision Twin Agent v4', entityType: 'agent', domain: 'decision', metric: 'alignment_score', value: 0.937, numericValue: '0.937', badgeState: 'verified', evalDate: '2026-04-21', sourceUrl: '#' },
    { rank: 2, resultId: 'lr-007', entityId: 'lyte-monte-carlo-v2', entityLabel: 'Monte Carlo Fabric v2', entityType: 'workflow', domain: 'decision', metric: 'alignment_score', value: 0.889, numericValue: '0.889', badgeState: 'leaderboard', evalDate: '2026-03-31', sourceUrl: '#' },
  ],
  'cpd-token-cost': [
    { rank: 1, resultId: 'lr-008', entityId: 'lyte-decision-twin-v4', entityLabel: 'Decision Twin Agent v4', entityType: 'agent', domain: 'decision', metric: 'token_cost_usd_1k', value: 0.84, numericValue: '0.84', unit: '$', badgeState: 'verified', evalDate: '2026-04-21', sourceUrl: '#' },
    { rank: 2, resultId: 'lr-009', entityId: 'lyte-causal-v3', entityLabel: 'Causal Intelligence Agent v3', entityType: 'agent', domain: 'decision', metric: 'token_cost_usd_1k', value: 1.12, numericValue: '1.12', unit: '$', badgeState: 'leaderboard', evalDate: '2026-04-08', sourceUrl: '#' },
  ],
  'cpd-latency': [
    { rank: 1, resultId: 'lr-010', entityId: 'lyte-decision-twin-v4', entityLabel: 'Decision Twin Agent v4', entityType: 'agent', domain: 'decision', metric: 'latency_p50_ms', value: 420, numericValue: '420', unit: 'ms', badgeState: 'verified', evalDate: '2026-04-21', sourceUrl: '#' },
    { rank: 2, resultId: 'lr-011', entityId: 'lyte-causal-v3', entityLabel: 'Causal Intelligence Agent v3', entityType: 'agent', domain: 'decision', metric: 'latency_p50_ms', value: 590, numericValue: '590', unit: 'ms', badgeState: 'leaderboard', evalDate: '2026-04-08', sourceUrl: '#' },
  ],
  'cpd-quality-efficiency': [
    { rank: 1, resultId: 'lr-012', entityId: 'lyte-decision-twin-v4', entityLabel: 'Decision Twin Agent v4', entityType: 'agent', domain: 'decision', metric: 'qe_ratio', value: 1.12, numericValue: '1.12', badgeState: 'verified', evalDate: '2026-04-21', sourceUrl: '#' },
    { rank: 2, resultId: 'lr-013', entityId: 'lyte-causal-v3', entityLabel: 'Causal Intelligence Agent v3', entityType: 'agent', domain: 'decision', metric: 'qe_ratio', value: 0.98, numericValue: '0.98', badgeState: 'leaderboard', evalDate: '2026-04-08', sourceUrl: '#' },
  ],
};

function toDetail(entry: LeaderboardEntry): EvalResultDetail {
  return {
    resultId: entry.resultId,
    benchmarkId: 'lyte-benchmark',
    benchmarkName: 'Lyte Decision Benchmark',
    taskId: entry.metric,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    entityType: entry.entityType,
    domain: entry.domain,
    metric: entry.metric,
    value: entry.value,
    numericValue: entry.numericValue,
    unit: entry.unit,
    higherIsBetter: !['token_cost_usd_1k', 'latency_p50_ms'].includes(entry.metric),
    badgeState: entry.badgeState,
    evalDate: entry.evalDate,
    sourceUrl: entry.sourceUrl,
  };
}

type Tab = 'leaderboards' | 'benchmarks' | 'submit';

export default function LyteBenchmarks() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboards');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('dq-outcome-acc');
  const [drawerResult, setDrawerResult] = useState<EvalResultDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allTasks = BENCHMARKS.flatMap((b) => b.tasks.map((t) => ({ ...t })));
  const currentTask = allTasks.find((t) => t.taskId === selectedTaskId) ?? allTasks[0];
  const currentEntries = LEADERBOARDS[selectedTaskId] ?? [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: TEXT, fontFamily: 'inherit' }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Zap style={{ width: '1.25rem', height: '1.25rem', color: ACCENT }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Benchmarks &amp; Leaderboards</h1>
          <EvalBadge state="verified" label="Open Eval Layer" />
        </div>
        <p style={{ color: TEXT_SEC, fontSize: '0.875rem', margin: 0 }}>
          Verified scores for Lyte decision agents and decision-recipe workflows — quality, cost, and latency.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', padding: '1rem 2rem 0', borderBottom: `1px solid ${BORDER}` }}>
        {(['leaderboards', 'benchmarks', 'submit'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px 6px 0 0', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? TEXT : TEXT_SEC, backgroundColor: activeTab === tab ? SURFACE : 'transparent', borderBottom: activeTab === tab ? `2px solid ${ACCENT}` : '2px solid transparent' }}>
            {tab === 'leaderboards' ? 'Leaderboards' : tab === 'benchmarks' ? 'Benchmark Specs' : 'Submit Score'}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.5rem 2rem', maxWidth: '1100px' }}>
        {activeTab === 'leaderboards' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: TEXT_SEC, marginBottom: '0.25rem' }}>Benchmark Tasks</span>
              {BENCHMARKS.map((bm) => (
                <div key={bm.benchmarkId}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: ACCENT, padding: '0.25rem 0.5rem', marginBottom: '0.25rem' }}>{bm.name}</div>
                  {bm.tasks.map((task) => (
                    <button key={task.taskId} onClick={() => setSelectedTaskId(task.taskId)}
                      style={{ width: '100%', textAlign: 'left', padding: '0.375rem 0.75rem', borderRadius: '6px', border: selectedTaskId === task.taskId ? `1px solid ${ACCENT}40` : `1px solid transparent`, background: selectedTaskId === task.taskId ? `${ACCENT}10` : 'transparent', color: selectedTaskId === task.taskId ? TEXT : TEXT_SEC, fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '0.125rem' }}>
                      {task.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Trophy style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{currentTask?.name}</span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: TEXT_SEC }}>Metric: <strong>{currentTask?.primaryMetric}</strong></span>
              </div>
              <LeaderboardTable entries={currentEntries} title={`${currentTask?.name} Leaderboard`} higherIsBetter={currentTask?.higherIsBetter ?? true} onRowClick={(e) => { setDrawerResult(toDetail(e)); setDrawerOpen(true); }} />
              <p style={{ fontSize: '0.75rem', color: TEXT_SEC, marginTop: '0.75rem' }}>
                <a href="/command/open-eval-hub" style={{ color: ACCENT }}>Open Evaluation Hub →</a>
              </p>
            </div>
          </div>
        )}
        {activeTab === 'benchmarks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {BENCHMARKS.map((bm) => (
              <BenchmarkCard key={bm.benchmarkId} {...bm} onLeaderboardClick={(taskId) => { setSelectedTaskId(taskId); setActiveTab('leaderboards'); }} />
            ))}
          </div>
        )}
        {activeTab === 'submit' && (
          <div style={{ maxWidth: '640px' }}>
            <SubmitScoreForm domain="decision" onSubmit={async (p: SubmitScorePayload) => { await new Promise((r) => setTimeout(r, 600)); console.info('Lyte eval:', p); }} />
          </div>
        )}
      </div>

      <ResultDetailDrawer result={drawerResult} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
