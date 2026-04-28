/**
 * Counsel — Benchmarks & Leaderboards
 * Domain: Legal
 * Benchmarks: Contract Risk Scoring, Citation Accuracy
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
import { Scale, Trophy } from 'lucide-react';
import { useState } from 'react';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = '#4d8fcc';

const BENCHMARKS = [
  {
    benchmarkId: 'szl-legal-contract-risk-v1',
    name: 'Contract Risk Scoring',
    description:
      'Evaluates AI accuracy in identifying, classifying, and scoring risk clauses within commercial contracts against a panel of senior legal reviewers.',
    domain: 'legal',
    evaluationFramework: 'szl-native',
    tags: ['contracts', 'risk', 'clause-analysis', 'NLP'],
    tasks: [
      { taskId: 'crs-clause-id', name: 'Clause Identification', primaryMetric: 'f1', higherIsBetter: true, baseline: 0.74 },
      { taskId: 'crs-risk-rank', name: 'Risk Ranking Agreement', primaryMetric: 'spearman_rho', higherIsBetter: true, baseline: 0.65 },
      { taskId: 'crs-false-neg', name: 'False Negative Rate', primaryMetric: 'fnr', higherIsBetter: false, baseline: 0.14 },
    ],
  },
  {
    benchmarkId: 'szl-legal-citation-accuracy-v1',
    name: 'Citation Accuracy',
    description:
      'Tests legal reasoning agents on their ability to produce accurate, verifiable statutory and case-law citations when drafting memos, briefs, and opinions.',
    domain: 'legal',
    evaluationFramework: 'szl-native',
    tags: ['citations', 'hallucination', 'legal-reasoning', 'RAG'],
    tasks: [
      { taskId: 'ca-exact-match', name: 'Exact Citation Match', primaryMetric: 'exact_match', higherIsBetter: true, baseline: 0.68 },
      { taskId: 'ca-hallucination', name: 'Hallucination Rate', primaryMetric: 'hallucination_rate', higherIsBetter: false, baseline: 0.22 },
      { taskId: 'ca-relevance', name: 'Citation Relevance', primaryMetric: 'relevance_score', higherIsBetter: true, baseline: 0.71 },
    ],
  },
];

const LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  'crs-clause-id': [
    { rank: 1, resultId: 'r-001', entityId: 'counsel-clause-genome-v4', entityLabel: 'Clause Genome Agent v4', entityType: 'agent', domain: 'legal', metric: 'f1', value: 0.951, numericValue: '0.951', badgeState: 'verified', evalDate: '2026-04-12', sourceUrl: '#' },
    { rank: 2, resultId: 'r-002', entityId: 'counsel-drafting-v3', entityLabel: 'Drafting Agent v3', entityType: 'agent', domain: 'legal', metric: 'f1', value: 0.912, numericValue: '0.912', badgeState: 'leaderboard', evalDate: '2026-03-22', sourceUrl: '#' },
    { rank: 3, resultId: 'r-003', entityId: 'community-legal-gpt', entityLabel: 'Community Legal-GPT', entityType: 'model', domain: 'legal', metric: 'f1', value: 0.863, numericValue: '0.863', badgeState: 'community', evalDate: '2026-02-14', sourceUrl: '#' },
  ],
  'crs-risk-rank': [
    { rank: 1, resultId: 'r-004', entityId: 'counsel-clause-genome-v4', entityLabel: 'Clause Genome Agent v4', entityType: 'agent', domain: 'legal', metric: 'spearman_rho', value: 0.924, numericValue: '0.924', badgeState: 'verified', evalDate: '2026-04-12', sourceUrl: '#' },
    { rank: 2, resultId: 'r-005', entityId: 'counsel-risk-diff-v2', entityLabel: 'Risk Diff Agent v2', entityType: 'agent', domain: 'legal', metric: 'spearman_rho', value: 0.891, numericValue: '0.891', badgeState: 'leaderboard', evalDate: '2026-03-18', sourceUrl: '#' },
  ],
  'crs-false-neg': [
    { rank: 1, resultId: 'r-006', entityId: 'counsel-clause-genome-v4', entityLabel: 'Clause Genome Agent v4', entityType: 'agent', domain: 'legal', metric: 'fnr', value: 0.022, numericValue: '0.022', badgeState: 'verified', evalDate: '2026-04-12', sourceUrl: '#' },
    { rank: 2, resultId: 'r-007', entityId: 'counsel-drafting-v3', entityLabel: 'Drafting Agent v3', entityType: 'agent', domain: 'legal', metric: 'fnr', value: 0.041, numericValue: '0.041', badgeState: 'leaderboard', evalDate: '2026-03-22', sourceUrl: '#' },
  ],
  'ca-exact-match': [
    { rank: 1, resultId: 'r-008', entityId: 'counsel-matter-knowledge-v3', entityLabel: 'Matter Knowledge Agent v3', entityType: 'agent', domain: 'legal', metric: 'exact_match', value: 0.883, numericValue: '0.883', badgeState: 'verified', evalDate: '2026-04-10', sourceUrl: '#' },
    { rank: 2, resultId: 'r-009', entityId: 'counsel-clause-genome-v4', entityLabel: 'Clause Genome Agent v4', entityType: 'agent', domain: 'legal', metric: 'exact_match', value: 0.854, numericValue: '0.854', badgeState: 'leaderboard', evalDate: '2026-04-12', sourceUrl: '#' },
    { rank: 3, resultId: 'r-010', entityId: 'community-legal-gpt', entityLabel: 'Community Legal-GPT', entityType: 'model', domain: 'legal', metric: 'exact_match', value: 0.721, numericValue: '0.721', badgeState: 'community', evalDate: '2026-02-14', sourceUrl: '#' },
  ],
  'ca-hallucination': [
    { rank: 1, resultId: 'r-011', entityId: 'counsel-matter-knowledge-v3', entityLabel: 'Matter Knowledge Agent v3', entityType: 'agent', domain: 'legal', metric: 'hallucination_rate', value: 0.027, numericValue: '0.027', badgeState: 'verified', evalDate: '2026-04-10', sourceUrl: '#' },
    { rank: 2, resultId: 'r-012', entityId: 'counsel-clause-genome-v4', entityLabel: 'Clause Genome Agent v4', entityType: 'agent', domain: 'legal', metric: 'hallucination_rate', value: 0.039, numericValue: '0.039', badgeState: 'leaderboard', evalDate: '2026-04-12', sourceUrl: '#' },
  ],
  'ca-relevance': [
    { rank: 1, resultId: 'r-013', entityId: 'counsel-matter-knowledge-v3', entityLabel: 'Matter Knowledge Agent v3', entityType: 'agent', domain: 'legal', metric: 'relevance_score', value: 0.931, numericValue: '0.931', badgeState: 'verified', evalDate: '2026-04-10', sourceUrl: '#' },
    { rank: 2, resultId: 'r-014', entityId: 'counsel-clause-genome-v4', entityLabel: 'Clause Genome Agent v4', entityType: 'agent', domain: 'legal', metric: 'relevance_score', value: 0.902, numericValue: '0.902', badgeState: 'leaderboard', evalDate: '2026-04-12', sourceUrl: '#' },
  ],
};

function toDetail(entry: LeaderboardEntry): EvalResultDetail {
  return {
    resultId: entry.resultId,
    benchmarkId: 'counsel-benchmark',
    benchmarkName: 'Counsel Legal Benchmark',
    taskId: entry.metric,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    entityType: entry.entityType,
    domain: entry.domain,
    metric: entry.metric,
    value: entry.value,
    numericValue: entry.numericValue,
    unit: entry.unit,
    higherIsBetter: entry.metric !== 'fnr' && entry.metric !== 'hallucination_rate',
    badgeState: entry.badgeState,
    evalDate: entry.evalDate,
    sourceUrl: entry.sourceUrl,
  };
}

type Tab = 'leaderboards' | 'benchmarks' | 'submit';

export default function CounselBenchmarks() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboards');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('crs-clause-id');
  const [drawerResult, setDrawerResult] = useState<EvalResultDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allTasks = BENCHMARKS.flatMap((b) => b.tasks.map((t) => ({ ...t, benchmarkId: b.benchmarkId, benchmarkName: b.name })));
  const currentTask = allTasks.find((t) => t.taskId === selectedTaskId) ?? allTasks[0];
  const currentEntries = LEADERBOARDS[selectedTaskId] ?? [];

  function openDrawer(entry: LeaderboardEntry) {
    setDrawerResult(toDetail(entry));
    setDrawerOpen(true);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: TEXT, fontFamily: 'inherit' }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Scale style={{ width: '1.25rem', height: '1.25rem', color: ACCENT }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Benchmarks &amp; Leaderboards</h1>
          <EvalBadge state="verified" label="Open Eval Layer" />
        </div>
        <p style={{ color: TEXT_SEC, fontSize: '0.875rem', margin: 0 }}>
          Verified scores for Counsel legal AI agents, clause-analysis workflows, and citation models.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', padding: '1rem 2rem 0', borderBottom: `1px solid ${BORDER}` }}>
        {(['leaderboards', 'benchmarks', 'submit'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '6px 6px 0 0', border: 'none', cursor: 'pointer',
              fontSize: '0.8125rem', fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? TEXT : TEXT_SEC,
              backgroundColor: activeTab === tab ? SURFACE : 'transparent',
              borderBottom: activeTab === tab ? `2px solid ${ACCENT}` : '2px solid transparent',
            }}
          >
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
              <LeaderboardTable entries={currentEntries} title={`${currentTask?.name} Leaderboard`} higherIsBetter={currentTask?.higherIsBetter ?? true} onRowClick={openDrawer} />
              <p style={{ fontSize: '0.75rem', color: TEXT_SEC, marginTop: '0.75rem' }}>
                All results link to source traces. <a href="/command/open-eval-hub" style={{ color: ACCENT }}>Open Evaluation Hub →</a>
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
            <p style={{ color: TEXT_SEC, fontSize: '0.875rem', marginBottom: '1rem' }}>Submit a community eval result for a Counsel legal agent or workflow.</p>
            <SubmitScoreForm domain="legal" onSubmit={async (p: SubmitScorePayload) => { await new Promise((r) => setTimeout(r, 600)); console.info('Counsel eval:', p); }} />
          </div>
        )}
      </div>

      <ResultDetailDrawer result={drawerResult} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
