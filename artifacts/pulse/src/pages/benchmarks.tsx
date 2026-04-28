/**
 * Pulse — Benchmarks & Leaderboards
 * Domain: Executive Briefing
 * Benchmarks: Briefing Faithfulness, Briefing Latency
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
import { Newspaper, Trophy } from 'lucide-react';
import { useState } from 'react';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = '#a855f7';

const BENCHMARKS = [
  {
    benchmarkId: 'szl-executive-briefing-faithfulness-v1',
    name: 'Briefing Faithfulness',
    description:
      'Evaluates executive briefing agents on factual accuracy, source faithfulness, and hallucination rate across a 500-item curated intelligence dataset.',
    domain: 'executive',
    evaluationFramework: 'szl-native',
    tags: ['faithfulness', 'hallucination', 'RAG', 'intelligence'],
    tasks: [
      { taskId: 'bf-faithfulness', name: 'Factual Faithfulness', primaryMetric: 'faithfulness_score', higherIsBetter: true, baseline: 0.76 },
      { taskId: 'bf-hallucination', name: 'Hallucination Rate', primaryMetric: 'hallucination_rate', higherIsBetter: false, baseline: 0.19 },
      { taskId: 'bf-completeness', name: 'Completeness', primaryMetric: 'completeness_score', higherIsBetter: true, baseline: 0.72 },
    ],
  },
  {
    benchmarkId: 'szl-executive-briefing-latency-v1',
    name: 'Briefing Latency',
    description:
      'Measures end-to-end time from event ingestion to fully rendered executive brief, at P50 and P95 across different source types and complexity tiers.',
    domain: 'executive',
    evaluationFramework: 'szl-native',
    tags: ['latency', 'performance', 'streaming', 'speed'],
    tasks: [
      { taskId: 'bl-p50', name: 'Median Brief Time', primaryMetric: 'latency_p50_ms', higherIsBetter: false, baseline: 8400 },
      { taskId: 'bl-p95', name: 'P95 Brief Time', primaryMetric: 'latency_p95_ms', higherIsBetter: false, baseline: 22000 },
      { taskId: 'bl-ttfb', name: 'Time to First Token', primaryMetric: 'ttfb_ms', higherIsBetter: false, baseline: 1200 },
    ],
  },
];

const LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  'bf-faithfulness': [
    { rank: 1, resultId: 'pr-001', entityId: 'pulse-briefing-engine-v5', entityLabel: 'Briefing Engine v5', entityType: 'agent', domain: 'executive', metric: 'faithfulness_score', value: 0.961, numericValue: '0.961', badgeState: 'verified', evalDate: '2026-04-19', sourceUrl: '#' },
    { rank: 2, resultId: 'pr-002', entityId: 'pulse-confidence-v4', entityLabel: 'Confidence Dashboard Agent v4', entityType: 'agent', domain: 'executive', metric: 'faithfulness_score', value: 0.933, numericValue: '0.933', badgeState: 'leaderboard', evalDate: '2026-04-06', sourceUrl: '#' },
    { rank: 3, resultId: 'pr-003', entityId: 'community-brief-gpt', entityLabel: 'Community Brief-GPT', entityType: 'model', domain: 'executive', metric: 'faithfulness_score', value: 0.874, numericValue: '0.874', badgeState: 'community', evalDate: '2026-03-01', sourceUrl: '#' },
  ],
  'bf-hallucination': [
    { rank: 1, resultId: 'pr-004', entityId: 'pulse-briefing-engine-v5', entityLabel: 'Briefing Engine v5', entityType: 'agent', domain: 'executive', metric: 'hallucination_rate', value: 0.018, numericValue: '0.018', badgeState: 'verified', evalDate: '2026-04-19', sourceUrl: '#' },
    { rank: 2, resultId: 'pr-005', entityId: 'pulse-confidence-v4', entityLabel: 'Confidence Dashboard Agent v4', entityType: 'agent', domain: 'executive', metric: 'hallucination_rate', value: 0.031, numericValue: '0.031', badgeState: 'leaderboard', evalDate: '2026-04-06', sourceUrl: '#' },
  ],
  'bf-completeness': [
    { rank: 1, resultId: 'pr-006', entityId: 'pulse-briefing-engine-v5', entityLabel: 'Briefing Engine v5', entityType: 'agent', domain: 'executive', metric: 'completeness_score', value: 0.944, numericValue: '0.944', badgeState: 'verified', evalDate: '2026-04-19', sourceUrl: '#' },
    { rank: 2, resultId: 'pr-007', entityId: 'pulse-watchlist-v2', entityLabel: 'Watchlist Intelligence Agent v2', entityType: 'agent', domain: 'executive', metric: 'completeness_score', value: 0.911, numericValue: '0.911', badgeState: 'leaderboard', evalDate: '2026-03-28', sourceUrl: '#' },
  ],
  'bl-p50': [
    { rank: 1, resultId: 'pr-008', entityId: 'pulse-briefing-engine-v5', entityLabel: 'Briefing Engine v5', entityType: 'agent', domain: 'executive', metric: 'latency_p50_ms', value: 2140, numericValue: '2140', unit: 'ms', badgeState: 'verified', evalDate: '2026-04-19', sourceUrl: '#' },
    { rank: 2, resultId: 'pr-009', entityId: 'pulse-confidence-v4', entityLabel: 'Confidence Dashboard Agent v4', entityType: 'agent', domain: 'executive', metric: 'latency_p50_ms', value: 3080, numericValue: '3080', unit: 'ms', badgeState: 'leaderboard', evalDate: '2026-04-06', sourceUrl: '#' },
  ],
  'bl-p95': [
    { rank: 1, resultId: 'pr-010', entityId: 'pulse-briefing-engine-v5', entityLabel: 'Briefing Engine v5', entityType: 'agent', domain: 'executive', metric: 'latency_p95_ms', value: 6800, numericValue: '6800', unit: 'ms', badgeState: 'verified', evalDate: '2026-04-19', sourceUrl: '#' },
    { rank: 2, resultId: 'pr-011', entityId: 'pulse-confidence-v4', entityLabel: 'Confidence Dashboard Agent v4', entityType: 'agent', domain: 'executive', metric: 'latency_p95_ms', value: 9400, numericValue: '9400', unit: 'ms', badgeState: 'leaderboard', evalDate: '2026-04-06', sourceUrl: '#' },
  ],
  'bl-ttfb': [
    { rank: 1, resultId: 'pr-012', entityId: 'pulse-briefing-engine-v5', entityLabel: 'Briefing Engine v5', entityType: 'agent', domain: 'executive', metric: 'ttfb_ms', value: 310, numericValue: '310', unit: 'ms', badgeState: 'verified', evalDate: '2026-04-19', sourceUrl: '#' },
    { rank: 2, resultId: 'pr-013', entityId: 'pulse-confidence-v4', entityLabel: 'Confidence Dashboard Agent v4', entityType: 'agent', domain: 'executive', metric: 'ttfb_ms', value: 440, numericValue: '440', unit: 'ms', badgeState: 'leaderboard', evalDate: '2026-04-06', sourceUrl: '#' },
  ],
};

function toDetail(entry: LeaderboardEntry): EvalResultDetail {
  return {
    resultId: entry.resultId,
    benchmarkId: 'pulse-benchmark',
    benchmarkName: 'Pulse Briefing Benchmark',
    taskId: entry.metric,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    entityType: entry.entityType,
    domain: entry.domain,
    metric: entry.metric,
    value: entry.value,
    numericValue: entry.numericValue,
    unit: entry.unit,
    higherIsBetter: !['hallucination_rate', 'latency_p50_ms', 'latency_p95_ms', 'ttfb_ms'].includes(entry.metric),
    badgeState: entry.badgeState,
    evalDate: entry.evalDate,
    sourceUrl: entry.sourceUrl,
  };
}

type Tab = 'leaderboards' | 'benchmarks' | 'submit';

export default function PulseBenchmarks() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboards');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('bf-faithfulness');
  const [drawerResult, setDrawerResult] = useState<EvalResultDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allTasks = BENCHMARKS.flatMap((b) => b.tasks.map((t) => ({ ...t })));
  const currentTask = allTasks.find((t) => t.taskId === selectedTaskId) ?? allTasks[0];
  const currentEntries = LEADERBOARDS[selectedTaskId] ?? [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: TEXT, fontFamily: 'inherit' }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Newspaper style={{ width: '1.25rem', height: '1.25rem', color: ACCENT }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Benchmarks &amp; Leaderboards</h1>
          <EvalBadge state="verified" label="Open Eval Layer" />
        </div>
        <p style={{ color: TEXT_SEC, fontSize: '0.875rem', margin: 0 }}>
          Verified scores for Pulse briefing agents — faithfulness, hallucination control, and delivery latency.
        </p>
      </div>

      {/* Provenance banner */}
      <div style={{ background: `${ACCENT}12`, borderBottom: `1px solid ${ACCENT}30`, padding: '0.625rem 2rem', fontSize: '0.8125rem', color: TEXT_SEC, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <EvalBadge state="verified" compact />
        <span>Today's Briefing generated by <strong style={{ color: TEXT }}>Briefing Engine v5</strong> — #1 ranked agent on Briefing Faithfulness (0.961)</span>
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
            <SubmitScoreForm domain="executive" onSubmit={async (p: SubmitScorePayload) => { await new Promise((r) => setTimeout(r, 600)); console.info('Pulse eval:', p); }} />
          </div>
        )}
      </div>

      <ResultDetailDrawer result={drawerResult} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
