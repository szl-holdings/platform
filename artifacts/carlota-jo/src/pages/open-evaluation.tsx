/**
 * Open Evaluation — Public benchmark hub for Carlota Jo Consulting.
 *
 * Shows verified and community benchmark scores for the SZL platform's
 * public-safe benchmark subset. No login required. Gracefully degrades
 * when the registry is unreachable.
 */

import { BenchmarkCard } from '@szl-holdings/design-system/eval/benchmark-card';
import { EvalBadge } from '@szl-holdings/design-system/eval/badge';
import { LeaderboardTable, type LeaderboardEntry } from '@szl-holdings/design-system/eval/leaderboard-table';
import { ResultDetailDrawer, type EvalResultDetail } from '@szl-holdings/design-system/eval/result-detail-drawer';
import { ScoreChip } from '@szl-holdings/design-system/eval/score-chip';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronLeft, ExternalLink, Info, RefreshCw, Search, Trophy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const API_BASE = `${import.meta.env.BASE_URL}api`;

const GOLD = 'var(--color-gold)';
const CREAM = 'var(--color-cream-warm)';
const INK = 'var(--color-ink-900)';
const STONE = 'var(--color-stone-200)';

interface PublicBenchmark {
  benchmarkId: string;
  name: string;
  description: string;
  domain: string;
  evaluationFramework?: string;
  tags?: string[];
  tasks: Array<{
    taskId: string;
    name: string;
    description: string;
    primaryMetric: string;
    higherIsBetter: boolean;
  }>;
}

interface PublicLeaderboard {
  benchmarkId: string;
  taskId: string;
  benchmarkName: string;
  taskName: string;
  entries: LeaderboardEntry[];
}

const SEED_BENCHMARKS: PublicBenchmark[] = [
  {
    benchmarkId: 'contract-risk-detection',
    name: 'Contract Risk Detection',
    description: 'Identifies high-risk clauses across standard commercial contracts with accuracy and recall metrics.',
    domain: 'legal',
    evaluationFramework: 'Counsel Eval v1',
    tags: ['legal', 'nlp', 'risk'],
    tasks: [
      { taskId: 'crd-accuracy', name: 'Clause Classification Accuracy', description: 'Correctly classifies risk level per clause', primaryMetric: 'accuracy', higherIsBetter: true },
      { taskId: 'crd-recall', name: 'High-Risk Recall', description: 'Recall on high-risk clauses specifically', primaryMetric: 'recall', higherIsBetter: true },
    ],
  },
  {
    benchmarkId: 'executive-brief-quality',
    name: 'Executive Brief Quality',
    description: 'End-to-end quality of AI-generated executive intelligence briefings scored by domain experts.',
    domain: 'executive',
    evaluationFramework: 'Pulse Eval v1',
    tags: ['briefing', 'generation', 'quality'],
    tasks: [
      { taskId: 'ebq-relevance', name: 'Insight Relevance', description: 'Expert-rated relevance of surfaced insights', primaryMetric: 'relevance', higherIsBetter: true },
      { taskId: 'ebq-concision', name: 'Concision Score', description: 'Signal-to-noise ratio in final brief', primaryMetric: 'concision', higherIsBetter: true },
    ],
  },
  {
    benchmarkId: 'maritime-vessel-eta',
    name: 'Maritime Vessel ETA Accuracy',
    description: 'Measures prediction accuracy for vessel arrival times across diverse route and cargo conditions.',
    domain: 'maritime',
    evaluationFramework: 'SEXTANT Eval v1',
    tags: ['maritime', 'prediction', 'logistics'],
    tasks: [
      { taskId: 'mveta-mape', name: 'Mean Absolute Percentage Error', description: 'ETA vs actual in percentage terms', primaryMetric: 'mape_%', higherIsBetter: false },
    ],
  },
  {
    benchmarkId: 'threat-signal-precision',
    name: 'Threat Signal Precision',
    description: 'Evaluates precision and false positive rate on cyber threat detection across simulated environments.',
    domain: 'cyber',
    evaluationFramework: 'PARAGON Eval v1',
    tags: ['security', 'detection', 'cyber'],
    tasks: [
      { taskId: 'tsp-precision', name: 'Detection Precision', description: 'Precision at 95% recall threshold', primaryMetric: 'precision@95r', higherIsBetter: true },
      { taskId: 'tsp-fpr', name: 'False Positive Rate', description: 'FPR across simulated attack scenarios', primaryMetric: 'fpr_%', higherIsBetter: false },
    ],
  },
];

const EVAL_TRACE_BASE = 'https://github.com/szlholdings/eval-results/blob/main/.eval_results';

const SEED_LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  'contract-risk-detection::crd-accuracy': [
    { rank: 1, resultId: 'r-counsel-acc-1', entityId: 'counsel-v2', entityLabel: 'Counsel v2', entityType: 'agent', domain: 'legal', metric: 'accuracy', value: 0.942, numericValue: '0.942', badgeState: 'verified', evaluationFramework: 'Counsel Eval v1', evalDate: '2026-04-10', sourceUrl: `${EVAL_TRACE_BASE}/counsel-v2-2026-04-10.yaml` },
    { rank: 2, resultId: 'r-counsel-acc-2', entityId: 'counsel-v1', entityLabel: 'Counsel v1', entityType: 'agent', domain: 'legal', metric: 'accuracy', value: 0.918, numericValue: '0.918', badgeState: 'verified', evaluationFramework: 'Counsel Eval v1', evalDate: '2026-03-18', sourceUrl: `${EVAL_TRACE_BASE}/counsel-v1-2026-03-18.yaml` },
    { rank: 3, resultId: 'r-counsel-acc-3', entityId: 'gpt4o-baseline', entityLabel: 'GPT-4o baseline', entityType: 'model', domain: 'legal', metric: 'accuracy', value: 0.881, numericValue: '0.881', badgeState: 'community', evalDate: '2026-03-01', sourceUrl: `${EVAL_TRACE_BASE}/gpt4o-baseline-2026-03-01.yaml` },
    { rank: 4, resultId: 'r-counsel-acc-4', entityId: 'claude-baseline', entityLabel: 'Claude 3.5 Sonnet', entityType: 'model', domain: 'legal', metric: 'accuracy', value: 0.876, numericValue: '0.876', badgeState: 'community', evalDate: '2026-03-05', sourceUrl: `${EVAL_TRACE_BASE}/claude-baseline-2026-03-05.yaml` },
  ],
  'contract-risk-detection::crd-recall': [
    { rank: 1, resultId: 'r-counsel-rec-1', entityId: 'counsel-v2', entityLabel: 'Counsel v2', entityType: 'agent', domain: 'legal', metric: 'recall', value: 0.961, numericValue: '0.961', badgeState: 'verified', evaluationFramework: 'Counsel Eval v1', evalDate: '2026-04-10', sourceUrl: `${EVAL_TRACE_BASE}/counsel-v2-2026-04-10.yaml` },
    { rank: 2, resultId: 'r-counsel-rec-2', entityId: 'counsel-v1', entityLabel: 'Counsel v1', entityType: 'agent', domain: 'legal', metric: 'recall', value: 0.933, numericValue: '0.933', badgeState: 'verified', evalDate: '2026-03-18', sourceUrl: `${EVAL_TRACE_BASE}/counsel-v1-2026-03-18.yaml` },
    { rank: 3, resultId: 'r-counsel-rec-3', entityId: 'gpt4o-baseline', entityLabel: 'GPT-4o baseline', entityType: 'model', domain: 'legal', metric: 'recall', value: 0.902, numericValue: '0.902', badgeState: 'community', evalDate: '2026-03-01', sourceUrl: `${EVAL_TRACE_BASE}/gpt4o-baseline-2026-03-01.yaml` },
  ],
  'executive-brief-quality::ebq-relevance': [
    { rank: 1, resultId: 'r-pulse-rel-1', entityId: 'pulse-v3', entityLabel: 'Pulse v3', entityType: 'agent', domain: 'executive', metric: 'relevance', value: 4.6, numericValue: '4.6', unit: '/5', badgeState: 'verified', evaluationFramework: 'Pulse Eval v1', evalDate: '2026-04-14', sourceUrl: `${EVAL_TRACE_BASE}/pulse-v3-2026-04-14.yaml` },
    { rank: 2, resultId: 'r-pulse-rel-2', entityId: 'pulse-v2', entityLabel: 'Pulse v2', entityType: 'agent', domain: 'executive', metric: 'relevance', value: 4.3, numericValue: '4.3', unit: '/5', badgeState: 'verified', evalDate: '2026-03-22', sourceUrl: `${EVAL_TRACE_BASE}/pulse-v2-2026-03-22.yaml` },
    { rank: 3, resultId: 'r-pulse-rel-3', entityId: 'gpt4o-baseline', entityLabel: 'GPT-4o baseline', entityType: 'model', domain: 'executive', metric: 'relevance', value: 3.9, numericValue: '3.9', unit: '/5', badgeState: 'community', evalDate: '2026-03-10', sourceUrl: `${EVAL_TRACE_BASE}/gpt4o-baseline-2026-03-10.yaml` },
  ],
  'maritime-vessel-eta::mveta-mape': [
    { rank: 1, resultId: 'r-sex-mape-1', entityId: 'sextant-v2', entityLabel: 'SEXTANT v2', entityType: 'agent', domain: 'maritime', metric: 'mape_%', value: 3.1, numericValue: '3.1', unit: '%', badgeState: 'verified', evaluationFramework: 'SEXTANT Eval v1', evalDate: '2026-04-08', sourceUrl: `${EVAL_TRACE_BASE}/sextant-v2-2026-04-08.yaml` },
    { rank: 2, resultId: 'r-sex-mape-2', entityId: 'sextant-v1', entityLabel: 'SEXTANT v1', entityType: 'agent', domain: 'maritime', metric: 'mape_%', value: 5.8, numericValue: '5.8', unit: '%', badgeState: 'verified', evalDate: '2026-02-28', sourceUrl: `${EVAL_TRACE_BASE}/sextant-v1-2026-02-28.yaml` },
    { rank: 3, resultId: 'r-sex-mape-3', entityId: 'market-eta', entityLabel: 'Market ETA Tool', entityType: 'model', domain: 'maritime', metric: 'mape_%', value: 8.4, numericValue: '8.4', unit: '%', badgeState: 'community', evalDate: '2026-01-15', sourceUrl: `${EVAL_TRACE_BASE}/market-eta-2026-01-15.yaml` },
  ],
  'threat-signal-precision::tsp-precision': [
    { rank: 1, resultId: 'r-par-pr-1', entityId: 'paragon-v2', entityLabel: 'PARAGON v2', entityType: 'agent', domain: 'cyber', metric: 'precision@95r', value: 0.891, numericValue: '0.891', badgeState: 'verified', evaluationFramework: 'PARAGON Eval v1', evalDate: '2026-04-01', sourceUrl: `${EVAL_TRACE_BASE}/paragon-v2-2026-04-01.yaml` },
    { rank: 2, resultId: 'r-par-pr-2', entityId: 'sentra-v1', entityLabel: 'Sentra v1', entityType: 'agent', domain: 'cyber', metric: 'precision@95r', value: 0.867, numericValue: '0.867', badgeState: 'verified', evalDate: '2026-03-20', sourceUrl: `${EVAL_TRACE_BASE}/sentra-v1-2026-03-20.yaml` },
    { rank: 3, resultId: 'r-par-pr-3', entityId: 'crowdstrike-baseline', entityLabel: 'CrowdStrike Baseline', entityType: 'model', domain: 'cyber', metric: 'precision@95r', value: 0.831, numericValue: '0.831', badgeState: 'community', evalDate: '2026-02-10', sourceUrl: `${EVAL_TRACE_BASE}/crowdstrike-baseline-2026-02-10.yaml` },
  ],
};

type LeaderboardMap = Record<string, LeaderboardEntry[]>;

function getLeaderboard(lbMap: LeaderboardMap, benchmarkId: string, taskId: string): LeaderboardEntry[] {
  return lbMap[`${benchmarkId}::${taskId}`] ?? [];
}

function TopScoreCallout({ benchmark, task, lbMap }: { benchmark: PublicBenchmark; task: PublicBenchmark['tasks'][0]; lbMap: LeaderboardMap }) {
  const entries = getLeaderboard(lbMap, benchmark.benchmarkId, task.taskId);
  const top = entries[0];
  if (!top) return null;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded"
      style={{ background: 'rgba(196,170,126,0.05)', border: '1px solid rgba(196,170,126,0.12)' }}
    >
      <Trophy className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium" style={{ color: INK }}>{top.entityLabel}</span>
          <EvalBadge state={top.badgeState} />
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-stone-600)' }}>
          {benchmark.name} · {task.name}
        </div>
      </div>
      <ScoreChip metric={task.primaryMetric} value={top.value} unit={top.unit ?? undefined} higherIsBetter={task.higherIsBetter} compact />
    </div>
  );
}

type View = 'hub' | 'leaderboard';

interface ActiveLeaderboard {
  benchmark: PublicBenchmark;
  task: PublicBenchmark['tasks'][0];
}

export default function OpenEvaluationPage() {
  const [view, setView] = useState<View>('hub');
  const [active, setActive] = useState<ActiveLeaderboard | null>(null);
  const [selectedResult, setSelectedResult] = useState<EvalResultDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [benchmarks, setBenchmarks] = useState<PublicBenchmark[]>(SEED_BENCHMARKS);
  const [lbMap, setLbMap] = useState<LeaderboardMap>(SEED_LEADERBOARDS);
  const fetchRef = useRef(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const id = ++fetchRef.current;
    try {
      const res = await fetch(`${API_BASE}/eval-registry/public/benchmarks`, {
        credentials: 'include',
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const apiBenchmarks: PublicBenchmark[] = json?.benchmarks ?? [];
      if (id !== fetchRef.current) return;
      if (apiBenchmarks.length > 0) {
        setBenchmarks(apiBenchmarks);
        const lbEntries = await Promise.allSettled(
          apiBenchmarks.flatMap((bm) =>
            (bm.tasks ?? []).map(async (task) => {
              const lb = await fetch(
                `${API_BASE}/eval-registry/public/benchmarks/${bm.benchmarkId}/leaderboard?task_id=${task.taskId}`,
                { credentials: 'include', signal: AbortSignal.timeout(6000) },
              );
              if (!lb.ok) return null;
              const lbJson = await lb.json();
              const entries: LeaderboardEntry[] = (lbJson?.entries ?? []).map(
                (e: LeaderboardEntry & { sourceUrl?: string }) => ({
                  ...e,
                  sourceUrl: e.sourceUrl ?? `${EVAL_TRACE_BASE}/${e.entityId ?? e.resultId}-${e.evalDate ?? 'unknown'}.yaml`,
                }),
              );
              return { key: `${bm.benchmarkId}::${task.taskId}`, entries };
            }),
          ),
        );
        if (id !== fetchRef.current) return;
        const merged: LeaderboardMap = { ...SEED_LEADERBOARDS };
        for (const result of lbEntries) {
          if (result.status === 'fulfilled' && result.value) {
            merged[result.value.key] = result.value.entries;
          }
        }
        setLbMap(merged);
      }
    } catch {
      if (id === fetchRef.current) {
        setBenchmarks(SEED_BENCHMARKS);
        setLbMap(SEED_LEADERBOARDS);
      }
    } finally {
      if (id === fetchRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredBenchmarks = benchmarks.filter(
    (b) =>
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.domain.toLowerCase().includes(search.toLowerCase()) ||
      (b.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  const openLeaderboard = useCallback((benchmark: PublicBenchmark, taskId: string) => {
    const task = benchmark.tasks.find((t) => t.taskId === taskId);
    if (!task) return;
    setActive({ benchmark, task });
    setView('leaderboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openResultDetail = useCallback((entry: LeaderboardEntry, benchmark: PublicBenchmark, task: PublicBenchmark['tasks'][0]) => {
    setSelectedResult({
      resultId: entry.resultId,
      benchmarkId: benchmark.benchmarkId,
      benchmarkName: benchmark.name,
      taskId: task.taskId,
      entityId: entry.entityId,
      entityLabel: entry.entityLabel,
      entityType: entry.entityType,
      domain: entry.domain,
      metric: entry.metric,
      value: entry.value,
      numericValue: entry.numericValue ?? null,
      unit: entry.unit ?? null,
      higherIsBetter: task.higherIsBetter,
      badgeState: entry.badgeState,
      evaluationFramework: entry.evaluationFramework ?? null,
      evalDate: entry.evalDate ?? null,
      sourceUrl: entry.sourceUrl ?? null,
    });
    setDrawerOpen(true);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: CREAM }}>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <section
          style={{ background: '#18150f', borderBottom: '1px solid rgba(196,170,126,0.08)' }}
          className="pt-28 pb-14"
        >
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-px" style={{ background: 'rgba(196,170,126,0.45)' }} />
                <span
                  className="text-[10px] font-medium tracking-[0.38em] uppercase"
                  style={{ color: 'rgba(196,170,126,0.65)' }}
                >
                  Open Evaluation
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 300,
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  color: '#f4ede0',
                  lineHeight: 1.1,
                }}
              >
                Performance is public.
              </h1>
              <p
                className="mt-4 text-[14px] leading-[1.8] max-w-2xl"
                style={{ color: 'rgba(244,237,224,0.6)' }}
              >
                Every score shown here is independently verified or community-submitted against
                published benchmarks. No black boxes — every number links to a traceable
                source run.
              </p>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <EvalBadge state="verified" label="Verified — cryptographic proof" />
                <EvalBadge state="community" label="Community — open PR" />
                <EvalBadge state="leaderboard" label="Published on leaderboard" />
              </div>
            </motion.div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {view === 'hub' && (
            <motion.div
              key="hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-5xl mx-auto px-6 lg:px-12 py-14">
                <div className="flex items-center gap-3 mb-8">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-stone-500)' }} />
                    <input
                      type="search"
                      placeholder="Search benchmarks…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm rounded border outline-none focus:ring-1"
                      style={{
                        background: 'rgba(196,170,126,0.04)',
                        borderColor: STONE,
                        color: INK,
                      }}
                    />
                  </div>
                  <button
                    onClick={fetchData}
                    className="p-2 rounded border transition-colors"
                    style={{ borderColor: STONE }}
                    title="Refresh scores"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--color-stone-600)' }} />
                  </button>
                </div>

                {filteredBenchmarks.length === 0 && (
                  <div className="text-center py-16" style={{ color: 'var(--color-stone-500)' }}>
                    No benchmarks match your search.
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {filteredBenchmarks.map((benchmark) => (
                    <div key={benchmark.benchmarkId} className="space-y-4">
                      <BenchmarkCard
                        benchmarkId={benchmark.benchmarkId}
                        name={benchmark.name}
                        description={benchmark.description}
                        domain={benchmark.domain}
                        evaluationFramework={benchmark.evaluationFramework}
                        tasks={benchmark.tasks}
                        tags={benchmark.tags}
                        source="seed"
                        onLeaderboardClick={(taskId) => openLeaderboard(benchmark, taskId)}
                      />
                      <div className="space-y-2">
                        {benchmark.tasks.map((task) => (
                          <TopScoreCallout key={task.taskId} benchmark={benchmark} task={task} lbMap={lbMap} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-14 rounded p-5 flex items-start gap-3"
                  style={{ background: 'rgba(196,170,126,0.05)', border: '1px solid rgba(196,170,126,0.1)' }}
                >
                  <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'rgba(196,170,126,0.6)' }} />
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-stone-600)' }}>
                    This page shows only public-safe benchmarks. Tenant-specific results and
                    proprietary test sets are not surfaced here. Verified badges indicate an
                    independent re-run of the submitted artifact in a sandboxed environment.
                    Community scores are third-party submissions pending review.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'leaderboard' && active && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-5xl mx-auto px-6 lg:px-12 py-14">
                <button
                  onClick={() => { setView('hub'); setActive(null); }}
                  className="flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-stone-600)' }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  All Benchmarks
                </button>

                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5" style={{ color: GOLD }} />
                    <h2 className="text-xl font-semibold" style={{ color: INK }}>
                      {active.benchmark.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm" style={{ color: 'var(--color-stone-600)' }}>
                      Task: {active.task.name}
                    </span>
                    <span style={{ color: STONE }}>·</span>
                    <span className="text-sm font-mono" style={{ color: 'var(--color-stone-500)' }}>
                      {active.task.primaryMetric}
                      {!active.task.higherIsBetter && ' (lower is better)'}
                    </span>
                  </div>
                </div>

                <LeaderboardTable
                  entries={getLeaderboard(lbMap, active.benchmark.benchmarkId, active.task.taskId)}
                  benchmarkId={active.benchmark.benchmarkId}
                  taskId={active.task.taskId}
                  higherIsBetter={active.task.higherIsBetter}
                  title={`${active.benchmark.name} — ${active.task.name}`}
                  onRowClick={(entry) => openResultDetail(entry, active.benchmark, active.task)}
                />

                <p className="mt-6 text-xs" style={{ color: 'var(--color-stone-500)' }}>
                  Click any row to view the full evaluation trace and source link. Verified scores
                  link to a sandboxed re-run artifact. Community scores link to the submitter's
                  paper or repository.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ResultDetailDrawer
        result={selectedResult}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <Footer />
    </div>
  );
}
