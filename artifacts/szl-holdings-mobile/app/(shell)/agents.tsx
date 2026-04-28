import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

const ACCENT = '#c9a84c';

type TrustLevel = 'untrusted' | 'supervised' | 'trusted' | 'autonomous';

interface AgentTrustInfo {
  agentId: string;
  displayName: string;
  role: string;
  domain: string;
  currentLevel: TrustLevel;
  overallScore: number;
  totalActions: number;
  successfulActions: number;
  consecutiveSuccesses: number;
}

const TRUST_COLORS: Record<TrustLevel, string> = {
  untrusted: '#ef4444',
  supervised: '#f59e0b',
  trusted: '#3b82f6',
  autonomous: '#22c55e',
};

const TRUST_ICONS: Record<TrustLevel, keyof typeof Feather.glyphMap> = {
  untrusted: 'alert-circle',
  supervised: 'eye',
  trusted: 'check-circle',
  autonomous: 'zap',
};

type EvalBadgeState = 'verified' | 'community' | 'leaderboard';
const EVAL_BADGE_CFG: Record<EvalBadgeState, { label: string; color: string; bg: string; icon: keyof typeof Feather.glyphMap }> = {
  verified:    { label: 'Verified',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: 'check-circle' },
  community:   { label: 'Community',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: 'git-pull-request' },
  leaderboard: { label: 'Leaderboard', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: 'award' },
};

function evalBadgeForScore(score: number): EvalBadgeState {
  if (score >= 0.90) return 'verified';
  if (score >= 0.80) return 'leaderboard';
  return 'community';
}

function EvalBadgeRow({ overallScore, domain }: { overallScore: number; domain: string }) {
  const badgeState = evalBadgeForScore(overallScore);
  const cfg = EVAL_BADGE_CFG[badgeState];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 4 }}>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, borderWidth: 1 }, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}>
        <Feather name={cfg.icon} size={11} color={cfg.color} />
        <Text style={{ fontSize: 10, color: cfg.color, fontWeight: '600' }}>{cfg.label}</Text>
      </View>
      <Text style={{ fontSize: 10, color: '#475569' }}>
        {Math.round(overallScore * 100)}% verified · {domain} benchmark
      </Text>
    </View>
  );
}

const ROLE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  analyst: 'bar-chart-2',
  drafter: 'edit-3',
  hunter: 'target',
  sourcer: 'database',
  coordinator: 'layers',
};

const MOCK_AGENTS: AgentTrustInfo[] = [
  { agentId: 'terra-analyst', displayName: 'DOMAINE Analyst', role: 'analyst', domain: 'terra', currentLevel: 'trusted', overallScore: 0.92, totalActions: 247, successfulActions: 227, consecutiveSuccesses: 18 },
  { agentId: 'vessels-analyst', displayName: 'SEXTANT Analyst', role: 'analyst', domain: 'vessels', currentLevel: 'autonomous', overallScore: 0.96, totalActions: 312, successfulActions: 300, consecutiveSuccesses: 34 },
  { agentId: 'counsel-analyst', displayName: 'Counsel Analyst', role: 'analyst', domain: 'counsel', currentLevel: 'supervised', overallScore: 0.83, totalActions: 128, successfulActions: 106, consecutiveSuccesses: 7 },
  { agentId: 'sentra-analyst', displayName: 'Sentra Analyst', role: 'analyst', domain: 'sentra', currentLevel: 'trusted', overallScore: 0.89, totalActions: 195, successfulActions: 174, consecutiveSuccesses: 12 },
  { agentId: 'aegis-analyst', displayName: 'PARAGON Analyst', role: 'analyst', domain: 'aegis', currentLevel: 'trusted', overallScore: 0.91, totalActions: 203, successfulActions: 185, consecutiveSuccesses: 15 },
  { agentId: 'holdings-analyst', displayName: 'Holdings Analyst', role: 'analyst', domain: 'holdings', currentLevel: 'autonomous', overallScore: 0.94, totalActions: 289, successfulActions: 272, consecutiveSuccesses: 28 },
  { agentId: 'crew-drafter', displayName: 'Document Drafter', role: 'drafter', domain: 'general', currentLevel: 'supervised', overallScore: 0.78, totalActions: 89, successfulActions: 69, consecutiveSuccesses: 4 },
  { agentId: 'crew-hunter', displayName: 'Threat Hunter', role: 'hunter', domain: 'defense', currentLevel: 'trusted', overallScore: 0.87, totalActions: 156, successfulActions: 136, consecutiveSuccesses: 9 },
  { agentId: 'crew-sourcer', displayName: 'Data Sourcer', role: 'sourcer', domain: 'general', currentLevel: 'supervised', overallScore: 0.81, totalActions: 112, successfulActions: 91, consecutiveSuccesses: 6 },
];

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [agents, setAgents] = useState<AgentTrustInfo[]>(MOCK_AGENTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fetchAgents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await apiFetch('/api/trust/scores');
      if (Array.isArray(data?.scores) && data.scores.length > 0) {
        setAgents(data.scores);
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const renderAgent = useCallback(({ item }: { item: AgentTrustInfo }) => {
    const trustColor = TRUST_COLORS[item.currentLevel];
    const scorePercent = Math.round(item.overallScore * 100);
    const roleIcon = ROLE_ICONS[item.role] ?? 'cpu';

    return (
      <View style={[styles.agentCard, { backgroundColor: colors.card }]}>
        <View style={styles.agentHeader}>
          <View style={[styles.roleIcon, { backgroundColor: `${ACCENT}22` }]}>
            <Feather name={roleIcon} size={18} color={ACCENT} />
          </View>
          <View style={styles.agentInfo}>
            <Text style={[styles.agentName, { color: colors.text }]}>{item.displayName}</Text>
            <Text style={[styles.agentDomain, { color: colors.secondaryText }]}>
              {item.domain} · {item.role}
            </Text>
          </View>
          <View style={[styles.trustBadge, { backgroundColor: `${trustColor}22`, borderColor: `${trustColor}44` }]}>
            <Feather name={TRUST_ICONS[item.currentLevel]} size={12} color={trustColor} />
            <Text style={[styles.trustBadgeText, { color: trustColor }]}>
              {item.currentLevel.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{scorePercent}%</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Accuracy</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.totalActions}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Actions</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.successfulActions}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Successful</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.consecutiveSuccesses}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Streak</Text>
          </View>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${scorePercent}%`, backgroundColor: trustColor }]} />
        </View>

        {/* Open Evaluation badges */}
        <EvalBadgeRow overallScore={item.overallScore} domain={item.domain} />
      </View>
    );
  }, [colors]);

  const autonomousCount = agents.filter((a) => a.currentLevel === 'autonomous').length;
  const trustedCount = agents.filter((a) => a.currentLevel === 'trusted').length;
  const supervisedCount = agents.filter((a) => a.currentLevel === 'supervised').length;
  const avgScore = agents.length > 0 ? Math.round((agents.reduce((s, a) => s + a.overallScore, 0) / agents.length) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Agent Trust & Autonomy</Text>
      </View>

      <FlatList
        data={agents}
        keyExtractor={(item) => item.agentId}
        renderItem={renderAgent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAgents(true)} tintColor={ACCENT} />}
        ListHeaderComponent={
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryValue, { color: TRUST_COLORS.autonomous }]}>{autonomousCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Autonomous</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryValue, { color: TRUST_COLORS.trusted }]}>{trustedCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Trusted</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryValue, { color: TRUST_COLORS.supervised }]}>{supervisedCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Supervised</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryValue, { color: ACCENT }]}>{avgScore}%</Text>
              <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Avg Score</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingBottom: 16 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  agentCard: { borderRadius: 14, padding: 16, gap: 14 },
  agentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  agentInfo: { flex: 1, gap: 2 },
  agentName: { fontSize: 15, fontWeight: '700' },
  agentDomain: { fontSize: 12, textTransform: 'capitalize' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  trustBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  progressBarBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.15)' },
  progressBarFill: { height: 4, borderRadius: 2 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
});
