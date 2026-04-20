import { Feather } from '@expo/vector-icons';
import {
  VARIANT_RECOMMENDATIONS,
  VARIANT_SOURCE_HEALTH,
} from '@szl-holdings/shared-ui/os-demo-data';
import type { Recommendation, RecommendationAction } from '@szl-holdings/shared-ui/os-layer';
import { AUTONOMY_LABELS, POLICY_VERDICT_LABELS } from '@szl-holdings/shared-ui/os-layer';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const ACCENT = '#c9a84c';
const VARIANT = 'szl-holdings';

type Rec = Recommendation;

const VERDICT_COLORS: Record<string, string> = {
  green: '#4ade80',
  yellow: '#f59e0b',
  red: '#ef4444',
  blocked: '#ef4444',
};

const ACTION_COLORS: Record<string, { color: string; border: string; bg: string; label: string }> =
  {
    approve: { color: '#4ade80', border: '#4ade8044', bg: '#4ade8014', label: 'Approve' },
    reject: { color: '#ef4444', border: '#ef444444', bg: '#ef44440a', label: 'Reject' },
    escalate: { color: '#f59e0b', border: '#f59e0b44', bg: '#f59e0b0a', label: 'Escalate' },
    rollback: { color: '#7c85a0', border: '#7c85a044', bg: '#7c85a00a', label: 'Rollback' },
  };

function currency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface AuditEntry {
  action: string;
  justification?: string;
  at: string;
}

interface RecDetailModalProps {
  rec: Recommendation | null;
  onClose: () => void;
  onAction: (action: RecommendationAction, justification?: string) => void;
  colors: ReturnType<typeof useColors>;
}

function RecDetailModal({ rec, onClose, onAction, colors }: RecDetailModalProps) {
  const [justText, setJustText] = useState('');
  const [pendingAction, setPendingAction] = useState<RecommendationAction | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  if (!rec) return null;

  const verdict = rec.policyVerdict.verdict;
  const vColor = VERDICT_COLORS[verdict] ?? '#7c85a0';
  const isHardBlocked = verdict === 'blocked' || verdict === 'red';
  const isExecuted = rec.status === 'executed';
  const mandatesJustification = verdict === 'yellow' || rec.policyVerdict.requiresJustification;

  function handleRequestAction(action: RecommendationAction) {
    if (action !== 'reject' && mandatesJustification) {
      setPendingAction(action);
    } else {
      commitAction(action);
    }
  }

  function commitAction(action: RecommendationAction, justification?: string) {
    setAuditLog((prev) => [...prev, { action, justification, at: new Date().toISOString() }]);
    onAction(action, justification);
    setPendingAction(null);
    setJustText('');
  }

  return (
    <Modal visible={!!rec} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: '#0e1117', borderColor: '#ffffff14' }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={2}>
              {rec.title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Meta rows */}
            {[
              { label: 'Domain', value: rec.variant },
              { label: 'Confidence', value: `${Math.round(rec.confidence * 100)}%` },
              { label: 'Autonomy', value: AUTONOMY_LABELS[rec.autonomyMode] },
              ...(rec.valueAtRisk != null
                ? [{ label: 'Value at Risk', value: currency(rec.valueAtRisk), color: '#ef4444' }]
                : []),
              ...(rec.opportunityValue != null
                ? [
                    {
                      label: 'Opportunity',
                      value: currency(rec.opportunityValue),
                      color: '#4ade80',
                    },
                  ]
                : []),
              { label: 'Evidence items', value: String(rec.evidenceCount) },
            ].map((row) => (
              <View key={row.label} style={styles.modalRow}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{row.label}</Text>
                <Text
                  style={[
                    styles.rowValue,
                    { color: 'color' in row && row.color ? row.color : colors.text },
                  ]}
                >
                  {row.value}
                </Text>
              </View>
            ))}

            {/* Policy */}
            <View style={styles.modalRow}>
              <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Policy</Text>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: vColor + '22', borderColor: vColor + '55' },
                ]}
              >
                <Text style={{ color: vColor, fontSize: 11, fontWeight: '600' }}>
                  {POLICY_VERDICT_LABELS[verdict]}
                </Text>
              </View>
            </View>

            {/* Summary */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SUMMARY</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{rec.summary}</Text>
            </View>

            {/* Proposed action */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                PROPOSED ACTION
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {rec.proposedAction}
              </Text>
            </View>

            {/* Policy justification notice */}
            {mandatesJustification && !isHardBlocked && (
              <View
                style={[styles.notice, { borderColor: '#f59e0b33', backgroundColor: '#f59e0b0a' }]}
              >
                <Text style={{ color: '#f59e0b', fontSize: 11 }}>
                  Yellow verdict — written justification required before actioning
                </Text>
              </View>
            )}

            {/* Justification input (shown when pendingAction set) */}
            {pendingAction != null && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                  JUSTIFICATION FOR {pendingAction.toUpperCase()}
                </Text>
                <TextInput
                  value={justText}
                  onChangeText={setJustText}
                  placeholder="Describe why this action is warranted..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.justInput,
                    { backgroundColor: '#ffffff08', borderColor: '#ffffff18', color: colors.text },
                  ]}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setPendingAction(null);
                      setJustText('');
                    }}
                    style={[styles.actionBtn, { borderColor: '#ffffff18' }]}
                  >
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={!justText.trim()}
                    onPress={() => commitAction(pendingAction, justText.trim())}
                    style={[
                      styles.actionBtn,
                      {
                        flex: 1,
                        borderColor: '#f59e0b44',
                        backgroundColor: '#f59e0b14',
                        opacity: justText.trim() ? 1 : 0.4,
                      },
                    ]}
                  >
                    <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>
                      Submit &amp; {ACTION_COLORS[pendingAction]?.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Action buttons */}
            {pendingAction == null && (
              <View style={[styles.section, { marginBottom: 32 }]}>
                {isExecuted ? (
                  <TouchableOpacity
                    onPress={() => handleRequestAction('rollback')}
                    style={[
                      styles.actionBtn,
                      {
                        borderColor: ACTION_COLORS.rollback.border,
                        backgroundColor: ACTION_COLORS.rollback.bg,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: ACTION_COLORS.rollback.color,
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      Rollback
                    </Text>
                  </TouchableOpacity>
                ) : isHardBlocked ? (
                  <View
                    style={[
                      styles.notice,
                      { borderColor: '#ef444433', backgroundColor: '#ef44440a' },
                    ]}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 12 }}>
                      {verdict === 'red'
                        ? 'Red verdict — mandatory admin review before any action'
                        : 'Blocked by policy — override requires administrator approval'}
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['approve', 'reject', 'escalate'] as RecommendationAction[]).map((action) => {
                      const cfg = ACTION_COLORS[action];
                      return (
                        <TouchableOpacity
                          key={action}
                          onPress={() => handleRequestAction(action)}
                          style={[
                            styles.actionBtn,
                            { flex: 1, borderColor: cfg.border, backgroundColor: cfg.bg },
                          ]}
                        >
                          <Text style={{ color: cfg.color, fontSize: 13, fontWeight: '600' }}>
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Audit log */}
            {auditLog.length > 0 && (
              <View style={[styles.section, { marginBottom: 32 }]}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                  SESSION AUDIT
                </Text>
                {auditLog.map((entry, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                    <Text
                      style={{
                        color: ACTION_COLORS[entry.action]?.color ?? colors.textMuted,
                        fontSize: 10,
                        fontWeight: '600',
                      }}
                    >
                      {entry.action}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                      {new Date(entry.at).toLocaleTimeString()}
                    </Text>
                    {entry.justification && (
                      <Text
                        style={{ color: colors.textSecondary, fontSize: 10, flex: 1 }}
                        numberOfLines={2}
                      >
                        "{entry.justification}"
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface RecCardProps {
  rec: Rec;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}

function RecCard({ rec, onPress, colors }: RecCardProps) {
  const verdict = rec.policyVerdict.verdict;
  const vColor = VERDICT_COLORS[verdict] ?? '#7c85a0';
  const isHardBlocked = verdict === 'blocked' || verdict === 'red';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: '#0e1117', borderColor: isHardBlocked ? '#ef444435' : '#ffffff12' },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: vColor + '18', borderColor: vColor + '35' },
          ]}
        >
          <Text style={{ color: vColor, fontSize: 9, fontWeight: '700' }}>{rec.priority}</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'flex-end',
            gap: 6,
          }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 9 }}>{timeAgo(rec.createdAt)}</Text>
          <View
            style={[styles.pill, { backgroundColor: vColor + '22', borderColor: vColor + '55' }]}
          >
            <Text style={{ color: vColor, fontSize: 9, fontWeight: '600' }}>
              {POLICY_VERDICT_LABELS[verdict]}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
        {rec.title}
      </Text>
      <Text style={[styles.cardSummary, { color: colors.textSecondary }]} numberOfLines={2}>
        {rec.summary}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={{ color: colors.textMuted, fontSize: 9 }}>{rec.variant}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 9 }}>
          {Math.round(rec.confidence * 100)}% conf
        </Text>
        {rec.valueAtRisk != null && (
          <Text style={{ color: '#ef4444', fontSize: 9 }}>VaR {currency(rec.valueAtRisk)}</Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
          <Feather name="file-text" size={9} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 9, marginLeft: 3 }}>
            {rec.evidenceCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

type FilterTab = 'all' | 'pending' | 'flagged';

export default function DecisionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedRec, setSelectedRec] = useState<Rec | null>(null);
  const [recs, setRecs] = useState<Rec[]>(() => VARIANT_RECOMMENDATIONS[VARIANT] ?? []);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const sources = VARIANT_SOURCE_HEALTH[VARIANT] ?? [];
  const degradedSources = sources.filter((s) => s.status !== 'healthy').length;

  function handleAction(action: RecommendationAction, _justification?: string) {
    if (!selectedRec) return;
    const statusMap: Partial<Record<RecommendationAction, Rec['status']>> = {
      approve: 'approved',
      reject: 'rejected',
      escalate: 'escalated',
      rollback: 'rolled_back',
    };
    const newStatus = statusMap[action];
    if (!newStatus) return;
    setRecs((prev) => prev.map((r) => (r.id === selectedRec.id ? { ...r, status: newStatus } : r)));
  }

  const pendingRecs = recs.filter((r) => r.status === 'pending');
  const flaggedRecs = recs.filter(
    (r) =>
      r.policyVerdict.verdict === 'red' ||
      r.policyVerdict.verdict === 'blocked' ||
      r.policyVerdict.verdict === 'yellow',
  );

  const filtered = filterTab === 'all' ? recs : filterTab === 'pending' ? pendingRecs : flaggedRecs;

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All (${recs.length})` },
    { key: 'pending', label: `Pending (${pendingRecs.length})` },
    { key: 'flagged', label: `Review (${flaggedRecs.length})` },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      {/* Source health strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.sourceStrip, { borderBottomColor: '#ffffff10' }]}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
      >
        {sources.map((s) => (
          <View key={s.sourceId} style={styles.sourcePill}>
            <View
              style={[
                styles.sourceDot,
                {
                  backgroundColor:
                    s.status === 'healthy'
                      ? '#4ade80'
                      : s.status === 'degraded'
                        ? '#f97316'
                        : '#ef4444',
                },
              ]}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{s.sourceName}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 9, marginLeft: 3 }}>
              {Math.round((Date.now() - new Date(s.lastSeenAt).getTime()) / 60000)}m
            </Text>
          </View>
        ))}
        {degradedSources > 0 && (
          <Text style={{ color: '#f97316', fontSize: 9, marginLeft: 4 }}>
            {degradedSources} degraded
          </Text>
        )}
      </ScrollView>

      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Decision Center</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Decisions, with receipts
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, { borderColor: '#ffffff18', backgroundColor: '#ffffff08' }]}
          onPress={onRefresh}
        >
          <Feather name="refresh-cw" size={13} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilterTab(tab.key)}
            style={[
              styles.tabBtn,
              {
                backgroundColor: filterTab === tab.key ? ACCENT + '22' : 'transparent',
                borderColor: filterTab === tab.key ? ACCENT + '66' : '#ffffff18',
              },
            ]}
          >
            <Text
              style={{
                color: filterTab === tab.key ? ACCENT : colors.textMuted,
                fontSize: 11,
                fontWeight: filterTab === tab.key ? '600' : '400',
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recommendation list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        {filtered.map((rec) => (
          <RecCard key={rec.id} rec={rec} onPress={() => setSelectedRec(rec)} colors={colors} />
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="check-circle" size={32} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
              No recommendations
            </Text>
          </View>
        )}
      </ScrollView>

      <RecDetailModal
        rec={selectedRec}
        onClose={() => setSelectedRec(null)}
        onAction={(action, justification) => {
          handleAction(action, justification);
          setSelectedRec(null);
        }}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sourceStrip: { flexGrow: 0, borderBottomWidth: 1, height: 36 },
  sourcePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sourceDot: { width: 6, height: 6, borderRadius: 3 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pageTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 11, marginTop: 2 },
  refreshBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
  tabBar: { flexGrow: 0, marginBottom: 4 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  list: { flex: 1 },
  card: { borderRadius: 10, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  cardTitle: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  cardSummary: { fontSize: 11, lineHeight: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff22',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  modalBody: { paddingHorizontal: 20 },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff08',
  },
  rowLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue: { fontSize: 13, fontWeight: '500' },
  section: { marginTop: 16, gap: 6 },
  sectionLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  bodyText: { fontSize: 13, lineHeight: 20 },
  notice: { marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1 },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  justInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
