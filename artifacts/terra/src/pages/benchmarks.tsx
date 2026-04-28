/**
 * Terra — Benchmarks & Leaderboards
 * Domain: Real Estate
 * Benchmarks: Comparable Sales Quality, Risk Scoring Accuracy
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
import { Building2, Trophy } from 'lucide-react';
import { useState } from 'react';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = '#22c55e';

const BENCHMARKS = [
  {
    benchmarkId: 'szl-terra-comp-quality-v1',
    name: 'Comparable Sales Quality',
    description:
      'Evaluates AVM and comp-selection agents on relevance, recency, and geographic accuracy of selected comparable properties versus an appraiser ground truth.',
    domain: 'terra',
    evaluationFramework: 'szl-native',
    tags: ['AVM', 'comps', 'valuation', 'appraisal'],
    tasks: [
      { taskId: 'csq-relevance', name: 'Comp Relevance', primaryMetric: 'ndcg@5', higherIsBetter: true, baseline: 0.71 },
      { taskId: 'csq-price-error', name: 'Price Error (MAPE)', primaryMetric: 'mape', higherIsBetter: false, baseline: 0.087 },
      { taskId: 'csq-recency', name: 'Recency Score', primaryMetric: 'recency_score', higherIsBetter: true, baseline: 0.68 },
    ],
  },
  {
    benchmarkId: 'szl-terra-risk-scoring-v1',
    name: 'Risk Scoring Accuracy',
    description:
      'Tests property-risk and distress-detection agents on predicting risk tier changes 90 days forward, benchmarked against realised outcomes in a held-out dataset.',
    domain: 'terra',
    evaluationFramework: 'szl-native',
    tags: ['risk', 'distress', 'prediction', 'forecasting'],
    tasks: [
      { taskId: 'rsa-tier-accuracy', name: 'Risk Tier Accuracy', primaryMetric: 'accuracy', higherIsBetter: true, baseline: 0.74 },
      { taskId: 'rsa-auc', name: 'Distress AUC', primaryMetric: 'auc_roc', higherIsBetter: true, baseline: 0.79 },
      { taskId: 'rsa-calibration', name: 'Score Calibration', primaryMetric: 'brier_score', higherIsBetter: false, baseline: 0.18 },
    ],
  },
];

const LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  'csq-relevance': [
    { rank: 1, resultId: 'tr-001', entityId: 'terra-avm-v5', entityLabel: 'Terra AVM Engine v5', entityType: 'agent', domain: 'terra', metric: 'ndcg@5', value: 0.943, numericValue: '0.943', badgeState: 'verified', evalDate: '2026-04-18', sourceUrl: '#' },
    { rank: 2, resultId: 'tr-002', entityId: 'terra-comps-v3', entityLabel: 'Comp Selection Agent v3', entityType: 'agent', domain: 'terra', metric: 'ndcg@5', value: 0.918, numericValue: '0.918', badgeState: 'leaderboard', evalDate: '2026-03-30', sourceUrl: '#' },
    { rank: 3, resultId: 'tr-003', entityId: 'community-terra-ml', entityLabel: 'Community Terra-ML', entityType: 'model', domain: 'terra', metric: 'ndcg@5', value: 0.874, numericValue: '0.874', badgeState: 'community', evalDate: '2026-02-28', sourceUrl: '#' },
  ],
  'csq-price-error': [
    { rank: 1, resultId: 'tr-004', entityId: 'terra-avm-v5', entityLabel: 'Terra AVM Engine v5', entityType: 'agent', domain: 'terra', metric: 'mape', value: 0.034, numericValue: '0.034', badgeState: 'verified', evalDate: '2026-04-18', sourceUrl: '#' },
    { rank: 2, resultId: 'tr-005', entityId: 'terra-comps-v3', entityLabel: 'Comp Selection Agent v3', entityType: 'agent', domain: 'terra', metric: 'mape', value: 0.051, numericValue: '0.051', badgeState: 'leaderboard', evalDate: '2026-03-30', sourceUrl: '#' },
  ],
  'csq-recency': [
    { rank: 1, resultId: 'tr-006', entityId: 'terra-avm-v5', entityLabel: 'Terra AVM Engine v5', entityType: 'agent', domain: 'terra', metric: 'recency_score', value: 0.921, numericValue: '0.921', badgeState: 'verified', evalDate: '2026-04-18', sourceUrl: '#' },
  ],
  'rsa-tier-accuracy': [
    { rank: 1, resultId: 'tr-007', entityId: 'terra-distress-v4', entityLabel: 'Distress Engine v4', entityType: 'agent', domain: 'terra', metric: 'accuracy', value: 0.887, numericValue: '0.887', badgeState: 'verified', evalDate: '2026-04-14', sourceUrl: '#' },
    { rank: 2, resultId: 'tr-008', entityId: 'terra-risk-ml-v2', entityLabel: 'Risk Scoring ML v2', entityType: 'model', domain: 'terra', metric: 'accuracy', value: 0.851, numericValue: '0.851', badgeState: 'leaderboard', evalDate: '2026-03-25', sourceUrl: '#' },
  ],
  'rsa-auc': [
    { rank: 1, resultId: 'tr-009', entityId: 'terra-distress-v4', entityLabel: 'Distress Engine v4', entityType: 'agent', domain: 'terra', metric: 'auc_roc', value: 0.932, numericValue: '0.932', badgeState: 'verified', evalDate: '2026-04-14', sourceUrl: '#' },
    { rank: 2, resultId: 'tr-010', entityId: 'terra-risk-ml-v2', entityLabel: 'Risk Scoring ML v2', entityType: 'model', domain: 'terra', metric: 'auc_roc', value: 0.906, numericValue: '0.906', badgeState: 'leaderboard', evalDate: '2026-03-25', sourceUrl: '#' },
  ],
  'rsa-calibration': [
    { rank: 1, resultId: 'tr-011', entityId: 'terra-distress-v4', entityLabel: 'Distress Engine v4', entityType: 'agent', domain: 'terra', metric: 'brier_score', value: 0.062, numericValue: '0.062', badgeState: 'verified', evalDate: '2026-04-14', sourceUrl: '#' },
    { rank: 2, resultId: 'tr-012', entityId: 'terra-risk-ml-v2', entityLabel: 'Risk Scoring ML v2', entityType: 'model', domain: 'terra', metric: 'brier_score', value: 0.081, numericValue: '0.081', badgeState: 'leaderboard', evalDate: '2026-03-25', sourceUrl: '#' },
  ],
};

function toDetail(entry: LeaderboardEntry): EvalResultDetail {
  return {
    resultId: entry.resultId,
    benchmarkId: 'terra-benchmark',
    benchmarkName: 'Terra Real Estate Benchmark',
    taskId: entry.metric,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    entityType: entry.entityType,
    domain: entry.domain,
    metric: entry.metric,
    value: entry.value,
    numericValue: entry.numericValue,
    higherIsBetter: entry.metric !== 'mape' && entry.metric !== 'brier_score',
    badgeState: entry.badgeState,
    evalDate: entry.evalDate,
    sourceUrl: entry.sourceUrl,
  };
}

type Tab = 'leaderboards' | 'benchmarks' | 'submit';

export default function TerraBenchmarks() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboards');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('csq-relevance');
  const [drawerResult, setDrawerResult] = useState<EvalResultDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allTasks = BENCHMARKS.flatMap((b) => b.tasks.map((t) => ({ ...t, benchmarkId: b.benchmarkId })));
  const currentTask = allTasks.find((t) => t.taskId === selectedTaskId) ?? allTasks[0];
  const currentEntries = LEADERBOARDS[selectedTaskId] ?? [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: TEXT, fontFamily: 'inherit' }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Building2 style={{ width: '1.25rem', height: '1.25rem', color: ACCENT }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Benchmarks &amp; Leaderboards</h1>
          <EvalBadge state="verified" label="Open Eval Layer" />
        </div>
        <p style={{ color: TEXT_SEC, fontSize: '0.875rem', margin: 0 }}>
          Verified scores for Terra real-estate AI agents, AVM models, and property-risk workflows.
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
            <SubmitScoreForm domain="terra" onSubmit={async (p: SubmitScorePayload) => { await new Promise((r) => setTimeout(r, 600)); console.info('Terra eval:', p); }} />
          </div>
        )}
      </div>

      <ResultDetailDrawer result={drawerResult} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
