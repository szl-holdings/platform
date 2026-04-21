import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { apiFetch } from '@/lib/apiClient';

const ACCENT = '#14b8a6';
const BG = '#060b12';
const SURFACE = '#0d1520';
const OVERLAY = '#111c2a';
const BORDER = '#1a2535';
const TEXT_PRIMARY = '#c8d8e8';
const TEXT_SECONDARY = '#7a99b8';
const TEXT_MUTED = '#4a6070';

type PolicyState = 'allowed' | 'requires-approval' | 'blocked';
type AutonomyMode = 'observe' | 'recommend' | 'draft' | 'ask-to-act' | 'approved-act';

const POLICY_COLORS: Record<PolicyState, string> = {
  allowed: '#00e878',
  'requires-approval': '#ffb700',
  blocked: '#ff4455',
};

const AUTONOMY_LABELS: Record<AutonomyMode, string> = {
  observe: 'OBS',
  recommend: 'REC',
  draft: 'DFT',
  'ask-to-act': 'ASK',
  'approved-act': 'ACT',
};

const AUTONOMY_COLORS: Record<AutonomyMode, string> = {
  observe: '#4a6070',
  recommend: '#7a99b8',
  draft: '#00d4ff',
  'ask-to-act': '#ffb700',
  'approved-act': '#00e878',
};

interface EvidenceSource {
  id: string;
  label: string;
  type: string;
  excerpt?: string;
  timestamp?: string;
}

interface ProofCardProps {
  title: string;
  summary: string;
  confidence: number;
  policyState: PolicyState;
  policyReason?: string;
  autonomyMode: AutonomyMode;
  onAutonomyChange: (mode: AutonomyMode) => void;
  evidence: EvidenceSource[];
  accentColor?: string;
  metrics?: Array<{ label: string; value: string; color?: string }>;
  contradiction?: boolean;
  /**
   * When set, mode changes PATCH /api/alloy/autonomy-mode for this domain
   * and the live policy decision is shown beneath the toggle.
   */
  domain?: string;
  actionLabel?: string;
}

interface AutonomyDecisionPayload {
  policyState: PolicyState;
  policyReason?: string;
  disposition: 'execute' | 'queue' | 'draft' | 'block';
  mode: AutonomyMode;
}

async function patchAutonomyMode(
  domain: string,
  mode: AutonomyMode,
): Promise<AutonomyDecisionPayload | null> {
  try {
    const res = await apiFetch<{ data?: { decision?: AutonomyDecisionPayload } }>(
      '/api/alloy/autonomy-mode',
      {
        method: 'PATCH',
        body: JSON.stringify({ domain, mode }),
      },
    );
    return res?.data?.decision ?? null;
  } catch (err) {
    return {
      policyState: 'blocked',
      policyReason: `Could not reach Alloy autonomy service — mode not persisted (${(err as Error).message}).`,
      disposition: 'block',
      mode,
    };
  }
}

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.confidenceRow}>
      <View style={styles.confidenceTrack}>
        <View style={{ width: `${value}%`, height: 5, borderRadius: 3, backgroundColor: color }} />
      </View>
      <Text style={[styles.confidenceLabel, { color }]}>{value}%</Text>
    </View>
  );
}

function PolicyChip({ state, reason }: { state: PolicyState; reason?: string }) {
  const color = POLICY_COLORS[state];
  const labels: Record<PolicyState, string> = {
    allowed: 'Allowed',
    'requires-approval': 'Requires Approval',
    blocked: 'Blocked',
  };
  return (
    <View style={[styles.chip, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
      <Text style={[styles.chipText, { color }]}>{labels[state]}</Text>
    </View>
  );
}

function AutonomyToggle({
  value,
  onChange,
  domain,
  disabled,
}: {
  value: AutonomyMode;
  onChange: (m: AutonomyMode) => void;
  domain?: string;
  disabled?: boolean;
}) {
  const modes: AutonomyMode[] = ['observe', 'recommend', 'draft', 'ask-to-act', 'approved-act'];
  return (
    <View style={styles.autonomyToggle}>
      {modes.map((mode) => {
        const active = mode === value;
        const color = AUTONOMY_COLORS[mode];
        return (
          <Pressable
            key={mode}
            disabled={disabled}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              onChange(mode);
            }}
            style={[
              styles.autonomyBtn,
              active && { backgroundColor: color },
              disabled && !active && { opacity: 0.4 },
            ]}
            accessibilityLabel={`Set autonomy mode to ${mode}${domain ? ` for ${domain}` : ''}`}
          >
            <Text style={[styles.autonomyBtnText, { color: active ? BG : TEXT_MUTED }]}>
              {AUTONOMY_LABELS[mode]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function EvidenceList({ sources }: { sources: EvidenceSource[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.evidenceContainer}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.evidenceToggle}>
        <Feather name="file-text" size={12} color={TEXT_MUTED} />
        <Text style={styles.evidenceCount}>
          {sources.length} evidence source{sources.length !== 1 ? 's' : ''}
        </Text>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={TEXT_MUTED} />
      </Pressable>
      {expanded && (
        <View style={styles.evidenceList}>
          {sources.map((src) => (
            <View key={src.id} style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>{src.label}</Text>
              <Text style={styles.evidenceType}>{src.type.toUpperCase()}</Text>
              {src.excerpt && <Text style={styles.evidenceExcerpt}>{src.excerpt}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ProofCard({
  title,
  summary,
  confidence,
  policyState,
  policyReason,
  autonomyMode,
  onAutonomyChange,
  evidence,
  accentColor = ACCENT,
  metrics,
  contradiction,
  domain,
  actionLabel,
}: ProofCardProps) {
  const confColor =
    confidence >= 85
      ? '#00e878'
      : confidence >= 70
        ? '#84cc16'
        : confidence >= 50
          ? '#ffb700'
          : '#ff4455';

  const [liveDecision, setLiveDecision] = useState<AutonomyDecisionPayload | null>(null);
  const [pending, setPending] = useState(false);

  const handleAutonomy = useCallback(
    async (mode: AutonomyMode) => {
      onAutonomyChange(mode);
      if (!domain) return;
      setPending(true);
      const decision = await patchAutonomyMode(domain, mode);
      if (decision) setLiveDecision(decision);
      setPending(false);
    },
    [onAutonomyChange, domain],
  );

  const effectivePolicyState = liveDecision?.policyState ?? policyState;
  const effectivePolicyReason = liveDecision?.policyReason ?? policyReason;

  void actionLabel;

  return (
    <View style={[styles.card, { borderLeftColor: accentColor, borderLeftWidth: 2 }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.cardChips}>
          <PolicyChip state={effectivePolicyState} reason={effectivePolicyReason} />
          {contradiction && (
            <View style={[styles.chip, { backgroundColor: '#a855f718', borderColor: '#a855f740' }]}>
              <Text style={[styles.chipText, { color: '#a855f7' }]}>DISSENT</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.cardSummary}>{summary}</Text>

      {policyReason && (
        <View style={styles.policyReason}>
          <Feather name="shield" size={11} color="#ffb700" />
          <Text style={styles.policyReasonText}>{policyReason}</Text>
        </View>
      )}

      {metrics && (
        <View style={styles.metricsRow}>
          {metrics.map(({ label, value, color }) => (
            <View key={label} style={styles.metricItem}>
              <Text style={styles.metricLabel}>{label}</Text>
              <Text style={[styles.metricValue, { color: color ?? accentColor }]}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.proofFooter}>
        <EvidenceList sources={evidence} />
        <View style={styles.proofRight}>
          <View style={styles.confidenceWrapper}>
            <Text style={styles.proofMeta}>Confidence</Text>
            <ConfidenceBar value={confidence} color={confColor} />
          </View>
        </View>
      </View>

      <View style={styles.autonomySection}>
        <Text style={styles.proofMeta}>Autonomy Mode{domain ? ` · ${domain}` : ''}</Text>
        <AutonomyToggle
          value={autonomyMode}
          onChange={handleAutonomy}
          domain={domain}
          disabled={pending}
        />
        {liveDecision?.policyReason && (
          <Text style={styles.alloyDecisionText}>
            <Text style={styles.alloyDecisionLabel}>ALLOY: </Text>
            {liveDecision.policyReason}
          </Text>
        )}
      </View>
    </View>
  );
}

const FRESH_3M = new Date(Date.now() - 3 * 60_000).toISOString();
const FRESH_10M = new Date(Date.now() - 10 * 60_000).toISOString();
const AGING_40M = new Date(Date.now() - 40 * 60_000).toISOString();

const FUND_EVIDENCE: EvidenceSource[] = [
  {
    id: 'e1',
    label: 'LP Capital Account Valuation — Q1 2026',
    type: 'document',
    timestamp: FRESH_10M,
    excerpt: 'Fund NAV: $142.3M. IRR since inception: 24.1%. Benchmark: 19.8%.',
  },
  {
    id: 'e2',
    label: 'Portfolio Health Scores — Alloy',
    type: 'model',
    timestamp: FRESH_3M,
    excerpt: 'Composite health: 7.3/10. Revenue growth YoY: +67% blended.',
  },
  {
    id: 'e3',
    label: 'Market Comparable Benchmarking',
    type: 'api',
    timestamp: FRESH_10M,
    excerpt: 'Portfolio entry multiples: 6.4x ARR. Implied appreciation potential: 28%.',
  },
];

const THREAT_EVIDENCE: EvidenceSource[] = [
  {
    id: 'e4',
    label: 'Cross-Domain Signal Aggregation',
    type: 'model',
    timestamp: FRESH_3M,
    excerpt: 'Aegis: 3 critical threats. Vessels: 6 alerts. Correlation: 0.71.',
  },
  {
    id: 'e5',
    label: 'Alloy Risk Classifier',
    type: 'model',
    timestamp: FRESH_3M,
    excerpt: 'Market regime: Late cycle / Rate stress. Drawdown base rate: 18%.',
  },
  {
    id: 'e6',
    label: 'Approval Queue Monitor',
    type: 'api',
    timestamp: FRESH_3M,
    excerpt: '3 open approvals. Combined exposure: $4.7M. All within SLA.',
  },
];

const VESSELS_EVIDENCE: EvidenceSource[] = [
  {
    id: 'e7',
    label: 'Vessels Health Score',
    type: 'model',
    timestamp: FRESH_10M,
    excerpt: 'Health declining — 6.8/10 vs 7.4 prior period. 6 active alerts.',
  },
  {
    id: 'e8',
    label: 'Counterparty Risk Screening',
    type: 'api',
    timestamp: FRESH_3M,
    excerpt: '1 OFAC SDN match (94% confidence). Transaction blocked pending review.',
  },
  {
    id: 'e9',
    label: 'Predictive Maintenance Signal',
    type: 'signal',
    timestamp: FRESH_3M,
    excerpt: 'MV Horizon Star: cylinder 4 anomaly. P(failure) = 31%.',
  },
];

export default function ProofEnvelopeScreen() {
  const insets = useSafeAreaInsets();
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('ask-to-act');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Governed Intelligence</Text>
          <Text style={styles.headerSub}>Every signal carries a full proof chain</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.globalAutonomy}>
        <Text style={styles.proofMeta}>Global Autonomy Mode</Text>
        <AutonomyToggle value={autonomyMode} onChange={setAutonomyMode} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.kpiRow}>
          {[
            { label: 'Fund NAV', value: '$142M', color: ACCENT },
            { label: 'Portfolio IRR', value: '24.1%', color: '#00e878' },
            { label: 'Open Approvals', value: '3', color: '#ffb700' },
            { label: 'Active Threats', value: '3', color: '#ff4455' },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{label}</Text>
              <Text style={[styles.kpiValue, { color }]}>{value}</Text>
            </View>
          ))}
        </View>

        <ProofCard
          title="Fund Performance — 24.1% IRR"
          summary="Q1 2026 NAV: $142.3M with $38.7M unrealised appreciation. Outperforming top-quartile benchmark by 4.3%. Blended portfolio revenue growth: +67% YoY."
          confidence={94}
          policyState="allowed"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          evidence={FUND_EVIDENCE}
          accentColor={ACCENT}
          metrics={[
            { label: 'Fund NAV', value: '$142.3M', color: ACCENT },
            { label: 'IRR', value: '24.1%', color: '#00e878' },
            { label: 'TVPI', value: '1.42x', color: ACCENT },
          ]}
          domain="holdings.fund-performance"
          actionLabel="Publish LP performance briefing"
        />

        <ProofCard
          title="Cross-Domain Alert: 3 Critical Signals Correlated"
          summary="Alloy has identified correlated exposure across Aegis (APT-29 threat), Vessels (counterparty sanctions), and Pulse (rate regime shift). 3 approval items pending — all within SLA."
          confidence={85}
          policyState="requires-approval"
          policyReason="Multi-domain action requires CRO approval"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          evidence={THREAT_EVIDENCE}
          accentColor="#ffb700"
          metrics={[
            { label: 'Correlated Domains', value: '3', color: '#ffb700' },
            { label: 'Open Approvals', value: '3', color: '#ffb700' },
            { label: 'Decision Exposure', value: '$4.7M', color: '#7a99b8' },
          ]}
          domain="holdings.cross-domain-actions"
          actionLabel="Execute correlated cross-domain mitigation"
        />

        <ProofCard
          title="Vessels Portfolio — Health Declining (6.8/10)"
          summary="Vessels health score has declined from 7.4 to 6.8. One OFAC SDN match blocked. MV Horizon Star cylinder 4 anomaly: 31% failure probability before next port call."
          confidence={81}
          policyState="requires-approval"
          policyReason="Maintenance port call requires ops director approval"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          evidence={VESSELS_EVIDENCE}
          accentColor="#00d4ff"
          metrics={[
            { label: 'Health Score', value: '6.8/10', color: '#ffb700' },
            { label: 'Failure Risk', value: '31%', color: '#ff4455' },
            { label: 'Downtime Saving', value: '$340K', color: '#00e878' },
          ]}
          domain="vessels.charter-actions"
          actionLabel="Schedule unplanned maintenance port call (MV Horizon Star)"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: SURFACE,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  headerSub: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 1,
  },
  globalAutonomy: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: OVERLAY,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  kpiLabel: {
    fontSize: 9,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHeader: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: 18,
  },
  cardChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardSummary: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    lineHeight: 17,
  },
  policyReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${OVERLAY}`,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ffb70030',
  },
  policyReasonText: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    gap: 0,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  proofFooter: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    gap: 8,
  },
  proofRight: {
    gap: 4,
  },
  proofMeta: {
    fontSize: 9,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontWeight: '600',
  },
  confidenceWrapper: {
    gap: 4,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceTrack: {
    flex: 1,
    height: 5,
    backgroundColor: OVERLAY,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
  evidenceContainer: {
    gap: 6,
  },
  evidenceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  evidenceCount: {
    fontSize: 11,
    color: TEXT_MUTED,
    flex: 1,
  },
  evidenceList: {
    gap: 6,
    paddingLeft: 4,
  },
  evidenceItem: {
    gap: 2,
    backgroundColor: BG,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  evidenceType: {
    fontSize: 9,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
  evidenceExcerpt: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    lineHeight: 14,
    marginTop: 2,
  },
  autonomySection: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    gap: 6,
  },
  autonomyToggle: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 2,
    gap: 2,
  },
  autonomyBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  autonomyBtnText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  alloyDecisionText: {
    marginTop: 6,
    fontSize: 10,
    color: TEXT_SECONDARY,
    lineHeight: 14,
  },
  alloyDecisionLabel: {
    color: TEXT_MUTED,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
