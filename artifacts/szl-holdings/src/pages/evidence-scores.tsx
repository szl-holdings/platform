import {
  BenchmarkCard,
  EvalBadge,
  type LeaderboardEntry,
  LeaderboardTable,
  ScoreChip,
} from '@szl-holdings/design-system';
import { Activity, BarChart3, ExternalLink, ShieldCheck, Trophy } from 'lucide-react';

const DOMAIN_BENCHMARKS_URL: Record<string, string> = {
  cyber: '/sentra/benchmarks',
  legal: '/counsel/benchmarks',
  terra: '/terra/benchmarks',
  maritime: '/vessels/benchmarks',
  executive: '/pulse/benchmarks',
  decision: '/lyte-command-center/benchmarks',
};

const DOMAIN_SCORES = [
  {
    domain: 'Sentra',
    domainKey: 'cyber',
    score: 0.914,
    prevScore: 0.882,
    badgeState: 'verified' as const,
    benchmarks: ['Threat Detection Recall', 'MTTD', 'Alert Precision'],
    lastUpdated: '2026-04-27',
    entityId: 'sentra-v2.8',
  },
  {
    domain: 'Counsel',
    domainKey: 'legal',
    score: 0.879,
    prevScore: 0.841,
    badgeState: 'verified' as const,
    benchmarks: ['Contract Extraction Accuracy', 'Obligation Recall', 'Clause Genome F1'],
    lastUpdated: '2026-04-26',
    entityId: 'counsel-v2.5',
  },
  {
    domain: 'Terra',
    domainKey: 'terra',
    score: 0.836,
    prevScore: 0.800,
    badgeState: 'community' as const,
    benchmarks: ['Distress Signal Precision', 'Cap Rate Forecast MAE', 'Comp Match Accuracy'],
    lastUpdated: '2026-04-24',
    entityId: 'terra-v3.1',
  },
  {
    domain: 'Vessels',
    domainKey: 'maritime',
    score: 0.791,
    prevScore: 0.774,
    badgeState: 'community' as const,
    benchmarks: ['Port ETA Accuracy', 'Cargo Verification Rate', 'Route Anomaly Detection'],
    lastUpdated: '2026-04-23',
    entityId: 'vessels-v2.3',
  },
  {
    domain: 'Pulse',
    domainKey: 'executive',
    score: 0.942,
    prevScore: 0.918,
    badgeState: 'verified' as const,
    benchmarks: ['Brief Relevance Score', 'Confidence Calibration', 'Dissent Detection F1'],
    lastUpdated: '2026-04-27',
    entityId: 'pulse-v3.1',
  },
  {
    domain: 'Lyte',
    domainKey: 'decision',
    score: 0.887,
    prevScore: 0.853,
    badgeState: 'verified' as const,
    benchmarks: ['Decision Quality Index', 'Forecast Accuracy', 'Entity Graph Recall'],
    lastUpdated: '2026-04-26',
    entityId: 'lyte-v2.5',
  },
];

const LEADERBOARD_ENTRIES: LeaderboardEntry[] = DOMAIN_SCORES
  .sort((a, b) => b.score - a.score)
  .map((d, i) => ({
    rank: i + 1,
    resultId: `evidence-${d.entityId}`,
    entityId: d.entityId,
    entityLabel: d.domain,
    entityType: 'intelligence-product',
    domain: d.domainKey,
    metric: 'evidence_score',
    value: d.score,
    unit: '%',
    badgeState: d.badgeState,
    evalDate: d.lastUpdated,
    sourceUrl: null,
  }));

export default function EvidenceScoresPage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Evidence Scores</h1>
            <p className="text-sm text-white/40 mt-1">
              Verified performance benchmarks across all SZL domain products
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EvalBadge state="verified" />
          <span className="text-xs text-white/30">Last synced: Apr 27, 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: 'Portfolio Leader', value: 'Pulse', sub: '94.2%' },
          { icon: BarChart3, label: 'Avg Evidence Score', value: '87.5%', sub: '+3.2pp vs last cycle' },
          { icon: ShieldCheck, label: 'Verified Domains', value: '4 / 6', sub: 'Sentra, Counsel, Pulse, Lyte' },
          { icon: Activity, label: 'Active Benchmarks', value: '18', sub: 'Across 6 domains' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="p-4 rounded-xl border border-white/8 bg-white/3">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-white/40">{label}</span>
            </div>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs text-white/30 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-widest">Portfolio Leaderboard</h2>
        <div className="mb-2 flex items-center gap-1.5 text-xs text-white/30">
          <ExternalLink className="w-3 h-3" />
          <span>Click a row to open that domain's benchmarks page</span>
        </div>
        <LeaderboardTable
          entries={LEADERBOARD_ENTRIES}
          title="SZL Portfolio — Evidence Scores"
          higherIsBetter
          onRowClick={(entry) => {
            const url = DOMAIN_BENCHMARKS_URL[entry.domain];
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
          }}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-widest">Domain Evidence Cards</h2>
        <div className="grid grid-cols-3 gap-4">
          {DOMAIN_SCORES.map((d) => (
            <div key={d.domain} className="p-4 rounded-xl border border-white/8 bg-white/3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{d.domain}</span>
                <EvalBadge state={d.badgeState} />
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <ScoreChip
                  metric="evidence_score"
                  value={d.score}
                  unit="%"
                  higherIsBetter
                  strong={d.score >= 0.9}
                />
                <span className="text-xs text-emerald-400">
                  +{((d.score - d.prevScore) * 100).toFixed(1)}pp vs prev
                </span>
              </div>
              <div className="space-y-1">
                {d.benchmarks.map((b) => (
                  <div key={b} className="text-xs text-white/40 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-violet-500/60 inline-block" />
                    {b}
                  </div>
                ))}
              </div>
              <div className="text-xs text-white/20">Updated {d.lastUpdated}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-widest">Featured Benchmark Specs</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              benchmarkId: 'szl-pulse-brief-relevance-v1',
              name: 'Brief Relevance Score',
              description: 'NLP-scored relevance of AI-generated executive briefs vs analyst ground truth.',
              domain: 'executive',
              evaluationFramework: 'szl-native',
              tasks: [
                { taskId: 'brief-rel-full', name: 'Full Brief Relevance', primaryMetric: 'relevance_score', higherIsBetter: true, baseline: 0.81 },
              ],
              tags: ['nlp', 'briefs', 'executive'],
            },
            {
              benchmarkId: 'szl-cyber-threat-recall-v1',
              name: 'Threat Detection Recall',
              description: 'Percentage of confirmed threats flagged within the 30-minute detection window.',
              domain: 'cyber',
              evaluationFramework: 'szl-native',
              tasks: [
                { taskId: 'threat-recall', name: 'Threat Recall', primaryMetric: 'recall', higherIsBetter: true, baseline: 0.76 },
              ],
              tags: ['soc', 'threat-intel', 'recall'],
            },
            {
              benchmarkId: 'szl-lyte-decision-quality-v1',
              name: 'Decision Quality Index',
              description: 'Human-rated quality of AI-generated decision recommendations vs expert panel.',
              domain: 'decision',
              evaluationFramework: 'szl-native',
              tasks: [
                { taskId: 'decision-quality', name: 'Decision Quality', primaryMetric: 'dqi', higherIsBetter: true, baseline: 0.74 },
              ],
              tags: ['decisions', 'quality', 'human-eval'],
            },
          ].map((spec) => (
            <BenchmarkCard
              key={spec.benchmarkId}
              benchmarkId={spec.benchmarkId}
              name={spec.name}
              description={spec.description}
              domain={spec.domain}
              evaluationFramework={spec.evaluationFramework}
              tasks={spec.tasks}
              tags={spec.tags}
              source="seed"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
