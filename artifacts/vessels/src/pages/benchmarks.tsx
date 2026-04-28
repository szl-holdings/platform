/**
 * Vessels — Benchmarks & Leaderboards
 * Domain: Maritime
 * Benchmarks: Threat Classification, Track Confidence
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
import { Ship, Trophy } from 'lucide-react';
import { useState } from 'react';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = '#14b8a6';

const BENCHMARKS = [
  {
    benchmarkId: 'szl-maritime-threat-class-v1',
    name: 'Threat Classification',
    description:
      'Evaluates AI systems on dark vessel detection, sanctions evasion patterns, and piracy-risk classification across AIS and RF signal datasets.',
    domain: 'maritime',
    evaluationFramework: 'szl-native',
    tags: ['dark-fleet', 'sanctions', 'piracy', 'AIS', 'classification'],
    tasks: [
      { taskId: 'tc-dark-vessel', name: 'Dark Vessel Detection', primaryMetric: 'f1', higherIsBetter: true, baseline: 0.73 },
      { taskId: 'tc-sanctions', name: 'Sanctions Evasion ID', primaryMetric: 'precision', higherIsBetter: true, baseline: 0.69 },
      { taskId: 'tc-piracy-risk', name: 'Piracy Risk Scoring', primaryMetric: 'auc_roc', higherIsBetter: true, baseline: 0.81 },
    ],
  },
  {
    benchmarkId: 'szl-maritime-track-confidence-v1',
    name: 'Track Confidence',
    description:
      'Measures accuracy of vessel identity resolution and track continuity across AIS gaps, spoofing events, and multi-source fusion windows.',
    domain: 'maritime',
    evaluationFramework: 'szl-native',
    tags: ['tracking', 'identity-resolution', 'spoofing', 'fusion'],
    tasks: [
      { taskId: 'trc-identity', name: 'Identity Resolution Accuracy', primaryMetric: 'accuracy', higherIsBetter: true, baseline: 0.78 },
      { taskId: 'trc-spoof-detect', name: 'Spoofing Detection', primaryMetric: 'recall', higherIsBetter: true, baseline: 0.71 },
      { taskId: 'trc-gap-fill', name: 'Track Gap Fill Error', primaryMetric: 'gap_fill_mae_km', higherIsBetter: false, baseline: 8.4 },
    ],
  },
];

const LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  'tc-dark-vessel': [
    { rank: 1, resultId: 'vr-001', entityId: 'vessels-dark-fleet-v4', entityLabel: 'Dark Fleet Detector v4', entityType: 'agent', domain: 'maritime', metric: 'f1', value: 0.961, numericValue: '0.961', badgeState: 'verified', evalDate: '2026-04-20', sourceUrl: '#' },
    { rank: 2, resultId: 'vr-002', entityId: 'vessels-satellite-rf-v2', entityLabel: 'Satellite RF Agent v2', entityType: 'agent', domain: 'maritime', metric: 'f1', value: 0.934, numericValue: '0.934', badgeState: 'leaderboard', evalDate: '2026-04-01', sourceUrl: '#' },
    { rank: 3, resultId: 'vr-003', entityId: 'community-ais-ml', entityLabel: 'Community AIS-ML', entityType: 'model', domain: 'maritime', metric: 'f1', value: 0.887, numericValue: '0.887', badgeState: 'community', evalDate: '2026-02-15', sourceUrl: '#' },
  ],
  'tc-sanctions': [
    { rank: 1, resultId: 'vr-004', entityId: 'vessels-sanctions-v3', entityLabel: 'Sanctions Chain Explorer v3', entityType: 'agent', domain: 'maritime', metric: 'precision', value: 0.948, numericValue: '0.948', badgeState: 'verified', evalDate: '2026-04-17', sourceUrl: '#' },
    { rank: 2, resultId: 'vr-005', entityId: 'vessels-dark-fleet-v4', entityLabel: 'Dark Fleet Detector v4', entityType: 'agent', domain: 'maritime', metric: 'precision', value: 0.921, numericValue: '0.921', badgeState: 'leaderboard', evalDate: '2026-04-20', sourceUrl: '#' },
  ],
  'tc-piracy-risk': [
    { rank: 1, resultId: 'vr-006', entityId: 'vessels-piracy-v2', entityLabel: 'Piracy Risk Agent v2', entityType: 'agent', domain: 'maritime', metric: 'auc_roc', value: 0.951, numericValue: '0.951', badgeState: 'verified', evalDate: '2026-04-10', sourceUrl: '#' },
  ],
  'trc-identity': [
    { rank: 1, resultId: 'vr-007', entityId: 'vessels-track-v5', entityLabel: 'Track Fusion Engine v5', entityType: 'agent', domain: 'maritime', metric: 'accuracy', value: 0.974, numericValue: '0.974', badgeState: 'verified', evalDate: '2026-04-22', sourceUrl: '#' },
    { rank: 2, resultId: 'vr-008', entityId: 'vessels-digital-twin-v3', entityLabel: 'Vessel Digital Twin v3', entityType: 'agent', domain: 'maritime', metric: 'accuracy', value: 0.951, numericValue: '0.951', badgeState: 'leaderboard', evalDate: '2026-04-05', sourceUrl: '#' },
  ],
  'trc-spoof-detect': [
    { rank: 1, resultId: 'vr-009', entityId: 'vessels-track-v5', entityLabel: 'Track Fusion Engine v5', entityType: 'agent', domain: 'maritime', metric: 'recall', value: 0.942, numericValue: '0.942', badgeState: 'verified', evalDate: '2026-04-22', sourceUrl: '#' },
    { rank: 2, resultId: 'vr-010', entityId: 'vessels-satellite-rf-v2', entityLabel: 'Satellite RF Agent v2', entityType: 'agent', domain: 'maritime', metric: 'recall', value: 0.913, numericValue: '0.913', badgeState: 'leaderboard', evalDate: '2026-04-01', sourceUrl: '#' },
  ],
  'trc-gap-fill': [
    { rank: 1, resultId: 'vr-011', entityId: 'vessels-track-v5', entityLabel: 'Track Fusion Engine v5', entityType: 'agent', domain: 'maritime', metric: 'gap_fill_mae_km', value: 1.8, numericValue: '1.8', unit: 'km', badgeState: 'verified', evalDate: '2026-04-22', sourceUrl: '#' },
    { rank: 2, resultId: 'vr-012', entityId: 'vessels-digital-twin-v3', entityLabel: 'Vessel Digital Twin v3', entityType: 'agent', domain: 'maritime', metric: 'gap_fill_mae_km', value: 2.7, numericValue: '2.7', unit: 'km', badgeState: 'leaderboard', evalDate: '2026-04-05', sourceUrl: '#' },
  ],
};

function toDetail(entry: LeaderboardEntry): EvalResultDetail {
  return {
    resultId: entry.resultId,
    benchmarkId: 'vessels-benchmark',
    benchmarkName: 'Vessels Maritime Benchmark',
    taskId: entry.metric,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    entityType: entry.entityType,
    domain: entry.domain,
    metric: entry.metric,
    value: entry.value,
    numericValue: entry.numericValue,
    unit: entry.unit,
    higherIsBetter: entry.metric !== 'gap_fill_mae_km',
    badgeState: entry.badgeState,
    evalDate: entry.evalDate,
    sourceUrl: entry.sourceUrl,
  };
}

type Tab = 'leaderboards' | 'benchmarks' | 'submit';

export default function VesselsBenchmarks() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboards');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('tc-dark-vessel');
  const [drawerResult, setDrawerResult] = useState<EvalResultDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allTasks = BENCHMARKS.flatMap((b) => b.tasks.map((t) => ({ ...t })));
  const currentTask = allTasks.find((t) => t.taskId === selectedTaskId) ?? allTasks[0];
  const currentEntries = LEADERBOARDS[selectedTaskId] ?? [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: TEXT, fontFamily: 'inherit' }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Ship style={{ width: '1.25rem', height: '1.25rem', color: ACCENT }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Benchmarks &amp; Leaderboards</h1>
          <EvalBadge state="verified" label="Open Eval Layer" />
        </div>
        <p style={{ color: TEXT_SEC, fontSize: '0.875rem', margin: 0 }}>
          Verified scores for Vessels maritime intelligence agents, tracking workflows, and threat-classification models.
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
            <SubmitScoreForm domain="maritime" onSubmit={async (p: SubmitScorePayload) => { await new Promise((r) => setTimeout(r, 600)); console.info('Vessels eval:', p); }} />
          </div>
        )}
      </div>

      <ResultDetailDrawer result={drawerResult} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
