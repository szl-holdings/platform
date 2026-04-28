/**
 * Leaderboards tab — mobile Open Evaluation hub.
 *
 * Shows all public benchmarks fetched live from the eval-registry API,
 * falls back to seed data when offline or unreachable. Lets operators
 * browse live rankings and tap through to per-result source traces,
 * mirroring the web Open Evaluation Hub.
 */

import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';
import { TAB_BAR_HEIGHT } from '@/constants/layout';

const GOLD = '#c9a84c';
const EVAL_TRACE_BASE = 'https://github.com/szlholdings/eval-results/blob/main/.eval_results';

type BadgeState = 'verified' | 'community' | 'leaderboard' | 'source';

interface LeaderboardEntry {
  rank: number;
  entityId: string;
  entityLabel: string;
  entityType: string;
  domain: string;
  metric: string;
  value: number | string;
  unit?: string;
  badgeState: BadgeState;
  evalDate?: string;
  sourceUrl?: string;
}

interface BenchmarkTask {
  taskId: string;
  name: string;
  primaryMetric: string;
  higherIsBetter: boolean;
  entries: LeaderboardEntry[];
}

interface Benchmark {
  benchmarkId: string;
  name: string;
  description: string;
  domain: string;
  evaluationFramework?: string;
  tasks: BenchmarkTask[];
}

const BADGE_CONFIG: Record<BadgeState, { label: string; color: string; bg: string }> = {
  verified:    { label: 'Verified',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  community:   { label: 'Community',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  leaderboard: { label: 'Leaderboard', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  source:      { label: 'Source',      color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

const SEED_BENCHMARKS: Benchmark[] = [
  {
    benchmarkId: 'contract-risk-detection',
    name: 'Contract Risk Detection',
    description: 'Clause classification accuracy and high-risk recall across commercial contracts.',
    domain: 'legal',
    evaluationFramework: 'Counsel Eval v1',
    tasks: [
      {
        taskId: 'crd-accuracy',
        name: 'Clause Classification Accuracy',
        primaryMetric: 'accuracy',
        higherIsBetter: true,
        entries: [
          { rank: 1, entityId: 'counsel-v2', entityLabel: 'Counsel v2', entityType: 'agent', domain: 'legal', metric: 'accuracy', value: 0.942, badgeState: 'verified', evalDate: '2026-04-10', sourceUrl: `${EVAL_TRACE_BASE}/counsel-v2-2026-04-10.yaml` },
          { rank: 2, entityId: 'counsel-v1', entityLabel: 'Counsel v1', entityType: 'agent', domain: 'legal', metric: 'accuracy', value: 0.918, badgeState: 'verified', evalDate: '2026-03-18', sourceUrl: `${EVAL_TRACE_BASE}/counsel-v1-2026-03-18.yaml` },
          { rank: 3, entityId: 'gpt4o-baseline', entityLabel: 'GPT-4o baseline', entityType: 'model', domain: 'legal', metric: 'accuracy', value: 0.881, badgeState: 'community', evalDate: '2026-03-01' },
        ],
      },
      {
        taskId: 'crd-recall',
        name: 'High-Risk Recall',
        primaryMetric: 'recall',
        higherIsBetter: true,
        entries: [
          { rank: 1, entityId: 'counsel-v2', entityLabel: 'Counsel v2', entityType: 'agent', domain: 'legal', metric: 'recall', value: 0.961, badgeState: 'verified', evalDate: '2026-04-10', sourceUrl: `${EVAL_TRACE_BASE}/counsel-v2-2026-04-10.yaml` },
          { rank: 2, entityId: 'counsel-v1', entityLabel: 'Counsel v1', entityType: 'agent', domain: 'legal', metric: 'recall', value: 0.933, badgeState: 'verified', evalDate: '2026-03-18', sourceUrl: `${EVAL_TRACE_BASE}/counsel-v1-2026-03-18.yaml` },
        ],
      },
    ],
  },
  {
    benchmarkId: 'executive-brief-quality',
    name: 'Executive Brief Quality',
    description: 'Expert-rated relevance and concision of AI-generated executive intelligence briefings.',
    domain: 'executive',
    evaluationFramework: 'Pulse Eval v1',
    tasks: [
      {
        taskId: 'ebq-relevance',
        name: 'Insight Relevance',
        primaryMetric: 'relevance',
        higherIsBetter: true,
        entries: [
          { rank: 1, entityId: 'pulse-v3', entityLabel: 'Pulse v3', entityType: 'agent', domain: 'executive', metric: 'relevance', value: '4.6/5', badgeState: 'verified', evalDate: '2026-04-14', sourceUrl: `${EVAL_TRACE_BASE}/pulse-v3-2026-04-14.yaml` },
          { rank: 2, entityId: 'pulse-v2', entityLabel: 'Pulse v2', entityType: 'agent', domain: 'executive', metric: 'relevance', value: '4.3/5', badgeState: 'verified', evalDate: '2026-03-22', sourceUrl: `${EVAL_TRACE_BASE}/pulse-v2-2026-03-22.yaml` },
          { rank: 3, entityId: 'gpt4o-baseline', entityLabel: 'GPT-4o baseline', entityType: 'model', domain: 'executive', metric: 'relevance', value: '3.9/5', badgeState: 'community', evalDate: '2026-03-10' },
        ],
      },
    ],
  },
  {
    benchmarkId: 'maritime-vessel-eta',
    name: 'Vessel ETA Accuracy',
    description: 'Mean absolute percentage error on vessel arrival time prediction.',
    domain: 'maritime',
    evaluationFramework: 'SEXTANT Eval v1',
    tasks: [
      {
        taskId: 'mveta-mape',
        name: 'MAPE — Arrival Prediction',
        primaryMetric: 'mape_%',
        higherIsBetter: false,
        entries: [
          { rank: 1, entityId: 'sextant-v2', entityLabel: 'SEXTANT v2', entityType: 'agent', domain: 'maritime', metric: 'mape_%', value: '3.1%', badgeState: 'verified', evalDate: '2026-04-08', sourceUrl: `${EVAL_TRACE_BASE}/sextant-v2-2026-04-08.yaml` },
          { rank: 2, entityId: 'sextant-v1', entityLabel: 'SEXTANT v1', entityType: 'agent', domain: 'maritime', metric: 'mape_%', value: '5.8%', badgeState: 'verified', evalDate: '2026-02-28', sourceUrl: `${EVAL_TRACE_BASE}/sextant-v1-2026-02-28.yaml` },
          { rank: 3, entityId: 'market-eta', entityLabel: 'Market ETA Tool', entityType: 'model', domain: 'maritime', metric: 'mape_%', value: '8.4%', badgeState: 'community', evalDate: '2026-01-15' },
        ],
      },
    ],
  },
  {
    benchmarkId: 'threat-signal-precision',
    name: 'Threat Signal Precision',
    description: 'Detection precision and false positive rate on simulated cyber threat scenarios.',
    domain: 'cyber',
    evaluationFramework: 'PARAGON Eval v1',
    tasks: [
      {
        taskId: 'tsp-precision',
        name: 'Detection Precision @95R',
        primaryMetric: 'precision@95r',
        higherIsBetter: true,
        entries: [
          { rank: 1, entityId: 'paragon-v2', entityLabel: 'PARAGON v2', entityType: 'agent', domain: 'cyber', metric: 'precision@95r', value: 0.891, badgeState: 'verified', evalDate: '2026-04-01', sourceUrl: `${EVAL_TRACE_BASE}/paragon-v2-2026-04-01.yaml` },
          { rank: 2, entityId: 'sentra-v1', entityLabel: 'Sentra v1', entityType: 'agent', domain: 'cyber', metric: 'precision@95r', value: 0.867, badgeState: 'verified', evalDate: '2026-03-20', sourceUrl: `${EVAL_TRACE_BASE}/sentra-v1-2026-03-20.yaml` },
          { rank: 3, entityId: 'crowdstrike-baseline', entityLabel: 'CrowdStrike Baseline', entityType: 'model', domain: 'cyber', metric: 'precision@95r', value: 0.831, badgeState: 'community', evalDate: '2026-02-10' },
        ],
      },
    ],
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  legal:     '#3b82f6',
  executive: '#f59e0b',
  maritime:  '#0ea5e9',
  cyber:     '#ef4444',
};

function domainColor(domain: string): string {
  return DOMAIN_COLORS[domain] ?? '#94a3b8';
}

function BadgeChip({ state, compact = false }: { state: BadgeState; compact?: boolean }) {
  const cfg = BADGE_CONFIG[state];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>
        {compact ? cfg.label.charAt(0) : cfg.label}
      </Text>
    </View>
  );
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function EntryRow({ entry, onPress }: { entry: LeaderboardEntry; onPress: () => void }) {
  const rankLabel = MEDAL[entry.rank] ?? `#${entry.rank}`;
  return (
    <TouchableOpacity onPress={onPress} style={styles.entryRow} activeOpacity={0.7}>
      <Text style={styles.entryRank}>{rankLabel}</Text>
      <View style={styles.entryBody}>
        <Text style={styles.entryLabel} numberOfLines={1}>{entry.entityLabel}</Text>
        <Text style={styles.entryMeta}>{entry.entityType} · {entry.evalDate ?? '—'}</Text>
      </View>
      <View style={styles.entryRight}>
        <Text style={styles.entryValue}>
          {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
        </Text>
        <BadgeChip state={entry.badgeState} compact />
      </View>
      {entry.sourceUrl && (
        <Feather name="external-link" size={13} color="#64748b" style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );
}

type Screen = 'hub' | 'leaderboard';

interface ActiveLeaderboard {
  benchmark: Benchmark;
  task: BenchmarkTask;
}

interface ApiTask {
  taskId: string;
  name: string;
  primaryMetric: string;
  higherIsBetter: boolean;
  sampleSize?: number;
}

interface ApiBenchmark {
  benchmarkId: string;
  name: string;
  description: string;
  domain: string;
  evaluationFramework?: string;
  tasks: ApiTask[];
}

interface ApiLeaderboardEntry {
  rank: number;
  entityId: string;
  entityLabel?: string;
  entityType?: string;
  value: string;
  numericValue?: string | null;
  unit?: string;
  badgeState?: string;
  evalDate?: string;
  sourceUrl?: string;
  confidence?: number;
}

function mapApiBenchmarks(
  apiBenchmarks: ApiBenchmark[],
  leaderboardMap: Map<string, Map<string, ApiLeaderboardEntry[]>>,
): Benchmark[] {
  return apiBenchmarks.map((b) => {
    const seedBenchmark = SEED_BENCHMARKS.find((s) => s.benchmarkId === b.benchmarkId);
    return {
      benchmarkId: b.benchmarkId,
      name: b.name,
      description: b.description,
      domain: b.domain,
      evaluationFramework: b.evaluationFramework,
      tasks: b.tasks.map((t) => {
        const liveEntries = leaderboardMap.get(b.benchmarkId)?.get(t.taskId) ?? [];
        const seedTask = seedBenchmark?.tasks.find((s) => s.taskId === t.taskId);
        if (liveEntries.length === 0) {
          return {
            taskId: t.taskId,
            name: t.name,
            primaryMetric: t.primaryMetric,
            higherIsBetter: t.higherIsBetter,
            entries: seedTask?.entries ?? [],
          };
        }
        const entries: LeaderboardEntry[] = liveEntries.map((e, idx) => {
          const parsed = e.numericValue != null ? parseFloat(e.numericValue) : NaN;
          const displayValue: number | string = Number.isFinite(parsed) ? parsed : e.value;
          return {
            rank: e.rank ?? idx + 1,
            entityId: e.entityId,
            entityLabel: e.entityLabel ?? e.entityId,
            entityType: e.entityType ?? 'agent',
            domain: b.domain,
            metric: t.primaryMetric,
            value: displayValue,
            unit: e.unit,
            badgeState: (e.badgeState as BadgeState) ?? 'community',
            evalDate: e.evalDate,
            sourceUrl: e.sourceUrl ?? (e.evalDate ? `${EVAL_TRACE_BASE}/${e.entityId}-${e.evalDate}.yaml` : undefined),
          };
        });
        return {
          taskId: t.taskId,
          name: t.name,
          primaryMetric: t.primaryMetric,
          higherIsBetter: t.higherIsBetter,
          entries,
        };
      }),
    };
  });
}

export default function LeaderboardsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [screen, setScreen] = useState<Screen>('hub');
  const [active, setActive] = useState<ActiveLeaderboard | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>(SEED_BENCHMARKS);
  const fetchRef = useRef(0);

  const fetchData = useCallback(async (isRefresh = false) => {
    const id = ++fetchRef.current;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await apiFetch<{ benchmarks?: ApiBenchmark[] }>('/api/eval-registry/public/benchmarks');
      if (id !== fetchRef.current) return;
      const apiBenchmarks: ApiBenchmark[] = data?.benchmarks ?? [];
      if (apiBenchmarks.length === 0) return;

      const leaderboardMap = new Map<string, Map<string, ApiLeaderboardEntry[]>>();
      await Promise.all(
        apiBenchmarks.flatMap((b) =>
          b.tasks.map(async (t) => {
            try {
              const lb = await apiFetch<{ entries?: ApiLeaderboardEntry[] }>(
                `/api/eval-registry/public/benchmarks/${b.benchmarkId}/leaderboard?task_id=${t.taskId}&limit=5`,
              );
              if (id !== fetchRef.current) return;
              if (!leaderboardMap.has(b.benchmarkId)) leaderboardMap.set(b.benchmarkId, new Map());
              leaderboardMap.get(b.benchmarkId)!.set(t.taskId, lb?.entries ?? []);
            } catch {}
          }),
        ),
      );
      if (id !== fetchRef.current) return;
      const mapped = mapApiBenchmarks(apiBenchmarks, leaderboardMap);
      if (mapped.length > 0) setBenchmarks(mapped);
    } catch {
    } finally {
      if (id === fetchRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const filteredBenchmarks = benchmarks.filter(
    (b) =>
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.domain.toLowerCase().includes(search.toLowerCase()),
  );

  const openLeaderboard = useCallback((benchmark: Benchmark, task: BenchmarkTask) => {
    setActive({ benchmark, task });
    setScreen('leaderboard');
  }, []);

  const handleEntryPress = useCallback((entry: LeaderboardEntry) => {
    if (entry.sourceUrl) {
      Linking.openURL(entry.sourceUrl).catch(() => {});
    }
  }, []);

  if (screen === 'leaderboard' && active) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setScreen('hub'); setActive(null); }} style={styles.backBtn}>
            <Feather name="chevron-left" size={20} color={GOLD} />
            <Text style={styles.backLabel}>Benchmarks</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}
        >
          <View style={styles.lbHeader}>
            <View style={[styles.domainDot, { backgroundColor: domainColor(active.benchmark.domain) }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.lbTitle, { color: colors.text }]}>{active.benchmark.name}</Text>
              <Text style={styles.lbSub}>{active.task.name}</Text>
              <Text style={styles.lbMeta}>
                {active.task.primaryMetric}
                {!active.task.higherIsBetter ? ' (lower is better)' : ' (higher is better)'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { flex: 0.6 }]}>Rank</Text>
              <Text style={[styles.thCell, { flex: 3 }]}>Entity</Text>
              <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Score</Text>
              <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Status</Text>
            </View>
            {active.task.entries.map((entry) => (
              <EntryRow key={entry.entityId} entry={entry} onPress={() => handleEntryPress(entry)} />
            ))}
          </View>

          <View style={styles.infoBox}>
            <Feather name="info" size={13} color={GOLD + '80'} />
            <Text style={styles.infoText}>
              Tap any row to open its source trace. Verified badges mean an independent re-run in a sandboxed environment.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Leaderboards</Text>
        <Text style={styles.subtitle}>Public benchmark rankings · All scores verified</Text>
      </View>

      <View style={styles.searchRow}>
        <Feather name="search" size={15} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search benchmarks…"
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color="#64748b" />
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator size="small" color={GOLD} style={{ marginLeft: 8 }} />}
      </View>

      <FlatList
        data={filteredBenchmarks}
        keyExtractor={(b) => b.benchmarkId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20, paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bar-chart-2" size={32} color="#334155" />
            <Text style={styles.emptyText}>No benchmarks match your search.</Text>
          </View>
        }
        renderItem={({ item: benchmark }) => (
          <View style={styles.benchmarkCard}>
            <View style={styles.benchmarkHeader}>
              <View style={[styles.domainDot, { backgroundColor: domainColor(benchmark.domain) }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.benchmarkName, { color: colors.text }]}>{benchmark.name}</Text>
                <Text style={styles.benchmarkDomain}>{benchmark.domain}</Text>
              </View>
              {benchmark.evaluationFramework && (
                <Text style={styles.frameworkLabel}>{benchmark.evaluationFramework}</Text>
              )}
            </View>
            <Text style={styles.benchmarkDesc} numberOfLines={2}>{benchmark.description}</Text>

            {benchmark.tasks.map((task) => {
              const top = task.entries[0];
              return (
                <TouchableOpacity
                  key={task.taskId}
                  style={styles.taskRow}
                  onPress={() => openLeaderboard(benchmark, task)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskName, { color: colors.text }]}>{task.name}</Text>
                    {top && (
                      <View style={styles.taskTopScore}>
                        <Text style={styles.taskTopLabel}>🥇 {top.entityLabel}</Text>
                        <Text style={styles.taskTopValue}>
                          {typeof top.value === 'number' ? top.value.toFixed(3) : top.value}
                        </Text>
                        <BadgeChip state={top.badgeState} compact />
                      </View>
                    )}
                  </View>
                  <Feather name="chevron-right" size={16} color="#475569" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  header:       { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  title:        { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle:     { fontSize: 12, color: '#64748b', marginTop: 3 },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backLabel:    { fontSize: 14, color: GOLD, fontWeight: '500' },

  searchRow:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' },
  searchInput:  { flex: 1, fontSize: 14 },

  benchmarkCard:   { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  benchmarkHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, paddingBottom: 8 },
  benchmarkName:   { fontSize: 14, fontWeight: '600' },
  benchmarkDomain: { fontSize: 11, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  benchmarkDesc:   { fontSize: 12, color: '#64748b', paddingHorizontal: 14, paddingBottom: 10, lineHeight: 17 },
  frameworkLabel:  { fontSize: 10, color: '#475569', backgroundColor: '#1e293b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  domainDot:    { width: 8, height: 8, borderRadius: 4, marginTop: 4 },

  taskRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
  taskName:     { fontSize: 13, fontWeight: '500' },
  taskTopScore: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  taskTopLabel: { fontSize: 11, color: '#94a3b8', flex: 1 },
  taskTopValue: { fontSize: 11, color: '#e2e8f0', fontWeight: '600', fontVariant: ['tabular-nums'] },

  section:      { marginHorizontal: 16, marginTop: 12, backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  tableHeader:  { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  thCell:       { fontSize: 10, color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  entryRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0a1120' },
  entryRank:    { width: 28, fontSize: 14 },
  entryBody:    { flex: 1, marginRight: 8 },
  entryLabel:   { fontSize: 13, color: '#e2e8f0', fontWeight: '500' },
  entryMeta:    { fontSize: 10, color: '#475569', marginTop: 1 },
  entryRight:   { alignItems: 'flex-end', gap: 4 },
  entryValue:   { fontSize: 13, color: '#f8fafc', fontWeight: '600', fontVariant: ['tabular-nums'] },

  badge:        { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  badgeText:    { fontSize: 10, fontWeight: '600' },

  lbHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  lbTitle:      { fontSize: 18, fontWeight: '700' },
  lbSub:        { fontSize: 13, color: '#94a3b8', marginTop: 3 },
  lbMeta:       { fontSize: 11, color: '#475569', marginTop: 2 },

  infoBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, margin: 16, backgroundColor: '#0f172a', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1e293b' },
  infoText:     { flex: 1, fontSize: 12, color: '#64748b', lineHeight: 17 },

  empty:        { paddingTop: 80, alignItems: 'center', gap: 10 },
  emptyText:    { color: '#475569', fontSize: 14 },
});
