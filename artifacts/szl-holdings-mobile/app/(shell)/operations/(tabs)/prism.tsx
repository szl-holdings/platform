import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type ComponentProps, useCallback, useMemo, useState } from 'react';
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
import Svg, { Circle } from 'react-native-svg';
import { LYTE_COLORS } from '@/constants/colors';
import { useLyte } from '@/context/LyteContext';
import { useColors } from '@/hooks/useColors';

type FeatherName = ComponentProps<typeof Feather>['name'];
type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface PrismDimension {
  key: 'pulse' | 'risk' | 'intel' | 'signals' | 'motion';
  label: string;
  description: string;
  icon: MCIName;
  trendIcon: FeatherName;
  color: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  detail: string;
  metrics: { label: string; value: string; color?: string }[];
}

function RingScore({ score, color, size = 56 }: { score: number; color: string; size?: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={`${color}20`} strokeWidth={4} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

type StylesType = ReturnType<typeof makeStyles>;

function DimensionCard({
  dim,
  onPress,
  expanded,
  styles,
  colors,
}: {
  dim: PrismDimension;
  onPress: () => void;
  expanded: boolean;
  styles: StylesType;
  colors: ReturnType<typeof useColors>;
}) {
  const trendColor =
    dim.trend === 'up'
      ? LYTE_COLORS.neonGreen
      : dim.trend === 'down'
        ? LYTE_COLORS.critical
        : colors.textSecondary;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <View style={[styles.dimCard, { borderColor: expanded ? `${dim.color}30` : colors.border }]}>
        <View style={styles.dimHeader}>
          <View style={[styles.dimIcon, { backgroundColor: `${dim.color}12` }]}>
            <MaterialCommunityIcons name={dim.icon} size={20} color={dim.color} />
          </View>
          <View style={styles.dimInfo}>
            <View style={styles.dimTopRow}>
              <Text style={[styles.dimKey, { color: dim.color }]}>{dim.key.toUpperCase()}</Text>
              <Feather name={dim.trendIcon} size={14} color={trendColor} />
            </View>
            <Text style={styles.dimLabel}>{dim.label}</Text>
            <Text style={styles.dimDesc} numberOfLines={expanded ? undefined : 1}>
              {dim.description}
            </Text>
          </View>
          <View style={styles.dimScore}>
            <RingScore score={dim.score} color={dim.color} size={52} />
            <Text style={[styles.dimScoreText, { color: dim.color }]}>{dim.score}</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.dimDetail}>
            <Text style={styles.dimDetailText}>{dim.detail}</Text>
            <View style={styles.dimMetrics}>
              {dim.metrics.map((m, i) => (
                <View key={i} style={styles.dimMetric}>
                  <Text style={styles.dimMetricLabel}>{m.label}</Text>
                  <Text style={[styles.dimMetricValue, { color: m.color ?? colors.textPrimary }]}>
                    {m.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function PrismScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { signals, actions, platforms, criticalCount, reload } = useLyte();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    reload();
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, [reload]);

  const healthyPlatforms = platforms.filter((p) => p.status === 'healthy').length;
  const avgSla =
    platforms.length > 0
      ? platforms.reduce((s, p) => s + p.slaCompliance, 0) / platforms.length
      : 0;
  const activeSignals = signals.filter((s) => !['resolved', 'dismissed'].includes(s.status));
  const openActions = actions.filter((a) => !['resolved', 'dismissed'].includes(a.state));

  const pulseScore = Math.round(avgSla);
  const riskScore = Math.max(
    0,
    100 - criticalCount * 20 - activeSignals.filter((s) => s.severity === 'high').length * 10,
  );
  const intelScore = Math.min(100, 60 + signals.length * 2);
  const signalsScore =
    activeSignals.length === 0 ? 100 : Math.max(0, 100 - activeSignals.length * 5);
  const motionScore = Math.max(0, 100 - openActions.length * 8);

  const dimensions: PrismDimension[] = [
    {
      key: 'pulse',
      label: 'Platform Health',
      description: 'Overall platform operational heartbeat and SLA compliance',
      icon: 'heart-pulse' satisfies MCIName,
      trendIcon: (pulseScore > 90 ? 'minus' : 'trending-down') satisfies FeatherName,
      color: LYTE_COLORS.neonGreen,
      score: pulseScore,
      trend: pulseScore > 90 ? 'stable' : 'down',
      detail: `${healthyPlatforms}/${platforms.length} platforms operating within SLA thresholds. Average uptime ${avgSla.toFixed(1)}%.`,
      metrics: [
        {
          label: 'Avg Uptime',
          value: `${platforms.length > 0 ? (platforms.reduce((s, p) => s + p.uptime, 0) / platforms.length).toFixed(1) : '—'}%`,
          color: LYTE_COLORS.neonGreen,
        },
        { label: 'Healthy Platforms', value: `${healthyPlatforms}/${platforms.length}` },
        { label: 'SLA Compliance', value: `${avgSla.toFixed(1)}%` },
        {
          label: 'Degraded',
          value: `${platforms.filter((p) => p.status === 'degraded').length}`,
          color: platforms.some((p) => p.status === 'degraded')
            ? LYTE_COLORS.high
            : LYTE_COLORS.neonGreen,
        },
      ],
    },
    {
      key: 'risk',
      label: 'Risk Posture',
      description: 'Active risk signals and business value at exposure',
      icon: 'shield-alert-outline' satisfies MCIName,
      trendIcon: (criticalCount > 2
        ? 'trending-down'
        : criticalCount === 0
          ? 'trending-up'
          : 'minus') satisfies FeatherName,
      color: criticalCount > 0 ? LYTE_COLORS.critical : LYTE_COLORS.high,
      score: riskScore,
      trend: criticalCount > 2 ? 'down' : criticalCount === 0 ? 'up' : 'stable',
      detail: `${criticalCount} critical signal${criticalCount !== 1 ? 's' : ''} detected. ${activeSignals.filter((s) => s.severity === 'high').length} high-severity signals in active state.`,
      metrics: [
        {
          label: 'Critical',
          value: `${criticalCount}`,
          color: criticalCount > 0 ? LYTE_COLORS.critical : LYTE_COLORS.neonGreen,
        },
        {
          label: 'High',
          value: `${activeSignals.filter((s) => s.severity === 'high').length}`,
          color: activeSignals.some((s) => s.severity === 'high')
            ? LYTE_COLORS.high
            : LYTE_COLORS.neonGreen,
        },
        { label: 'Active Signals', value: `${activeSignals.length}` },
        {
          label: 'Risk Score',
          value: `${riskScore}/100`,
          color: riskScore > 70 ? LYTE_COLORS.neonGreen : LYTE_COLORS.high,
        },
      ],
    },
    {
      key: 'intel',
      label: 'Operational Intel',
      description: 'Signal correlation depth and narrative intelligence quality',
      icon: 'brain' satisfies MCIName,
      trendIcon: 'minus' satisfies FeatherName,
      color: LYTE_COLORS.electricBlue,
      score: Math.min(intelScore, 100),
      trend: 'stable',
      detail: `${signals.length} total signals in corpus. Correlation engine active across ${platforms.length} platforms.`,
      metrics: [
        { label: 'Total Signals', value: `${signals.length}` },
        { label: 'Platforms Monitored', value: `${platforms.length}` },
        {
          label: 'Resolution Rate',
          value: `${signals.length > 0 ? Math.round((signals.filter((s) => s.status === 'resolved').length / signals.length) * 100) : 0}%`,
          color: LYTE_COLORS.neonGreen,
        },
        { label: 'Avg Response', value: '< 5min' },
      ],
    },
    {
      key: 'signals',
      label: 'Signal Volume',
      description: 'Real-time signal stream velocity and noise ratio',
      icon: 'waveform' satisfies MCIName,
      trendIcon: (activeSignals.length > 10 ? 'trending-down' : 'minus') satisfies FeatherName,
      color: LYTE_COLORS.medium,
      score: signalsScore,
      trend: activeSignals.length > 10 ? 'down' : 'stable',
      detail: `${activeSignals.length} active signals in stream. ${signals.filter((s) => s.status === 'new').length} unacknowledged.`,
      metrics: [
        {
          label: 'Active',
          value: `${activeSignals.length}`,
          color: activeSignals.length > 10 ? LYTE_COLORS.high : LYTE_COLORS.neonGreen,
        },
        {
          label: 'Unacknowledged',
          value: `${signals.filter((s) => s.status === 'new').length}`,
          color:
            signals.filter((s) => s.status === 'new').length > 0
              ? LYTE_COLORS.critical
              : LYTE_COLORS.neonGreen,
        },
        { label: 'Resolved', value: `${signals.filter((s) => s.status === 'resolved').length}` },
        { label: 'Signal Score', value: `${signalsScore}/100` },
      ],
    },
    {
      key: 'motion',
      label: 'Action Velocity',
      description: 'Team operational cadence and action resolution speed',
      icon: 'lightning-bolt' satisfies MCIName,
      trendIcon: (openActions.length < 5
        ? 'trending-up'
        : openActions.length > 10
          ? 'trending-down'
          : 'minus') satisfies FeatherName,
      color: '#a78bfa',
      score: motionScore,
      trend: openActions.length < 5 ? 'up' : openActions.length > 10 ? 'down' : 'stable',
      detail: `${openActions.length} open actions pending. ${actions.filter((a) => a.state === 'resolved').length} resolved today.`,
      metrics: [
        {
          label: 'Open Actions',
          value: `${openActions.length}`,
          color: openActions.length > 0 ? LYTE_COLORS.medium : LYTE_COLORS.neonGreen,
        },
        {
          label: 'Critical Actions',
          value: `${openActions.filter((a) => a.priority === 'critical' || a.urgency === 'critical').length}`,
          color: LYTE_COLORS.critical,
        },
        { label: 'Resolved', value: `${actions.filter((a) => a.state === 'resolved').length}` },
        { label: 'Velocity Score', value: `${motionScore}/100` },
      ],
    },
  ];

  const overallScore = Math.round(
    (pulseScore + riskScore + Math.min(intelScore, 100) + signalsScore + motionScore) / 5,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(167,139,250,0.06)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 140 }]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: bottomPad,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a78bfa" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PRISM VIEW</Text>
          <Text style={styles.headerTitle}>Operational Framework</Text>
          <Text style={styles.headerSub}>LUMINA · Risk · Intel · Signals · Motion</Text>
        </View>

        <View style={styles.overallCard}>
          <View style={styles.overallLeft}>
            <RingScore score={overallScore} color="#a78bfa" size={72} />
            <Text style={styles.overallScore}>{overallScore}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.overallLabel}>Overall PRISM Score</Text>
            <Text style={styles.overallDesc}>
              {overallScore >= 80
                ? 'All systems operating within normal parameters.'
                : overallScore >= 60
                  ? 'Some attention areas detected — review signals.'
                  : 'Elevated risk state — immediate action recommended.'}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    overallScore >= 80
                      ? LYTE_COLORS.neonGreenDim
                      : overallScore >= 60
                        ? LYTE_COLORS.mediumDim
                        : LYTE_COLORS.criticalDim,
                  borderColor:
                    overallScore >= 80
                      ? LYTE_COLORS.neonGreenLight
                      : overallScore >= 60
                        ? LYTE_COLORS.mediumLight
                        : LYTE_COLORS.criticalLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      overallScore >= 80
                        ? LYTE_COLORS.neonGreen
                        : overallScore >= 60
                          ? LYTE_COLORS.medium
                          : LYTE_COLORS.critical,
                  },
                ]}
              >
                {overallScore >= 80 ? 'NOMINAL' : overallScore >= 60 ? 'ELEVATED' : 'CRITICAL'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>DIMENSIONS</Text>
        <View style={styles.dimList}>
          {dimensions.map((dim) => (
            <DimensionCard
              key={dim.key}
              dim={dim}
              expanded={expanded === dim.key}
              onPress={() => setExpanded(expanded === dim.key ? null : dim.key)}
              styles={styles}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
    scroll: { flex: 1 },
    header: { marginBottom: 20 },
    eyebrow: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 3,
      color: '#a78bfa',
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Inter_600SemiBold',
      color: c.textPrimary,
      marginBottom: 2,
    },
    headerSub: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: c.textSecondary,
      letterSpacing: 1,
    },
    overallCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(167,139,250,0.12)',
      padding: 16,
      marginBottom: 24,
    },
    overallLeft: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
    overallScore: {
      position: 'absolute',
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: '#a78bfa',
    },
    overallLabel: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: c.textPrimary,
      marginBottom: 4,
    },
    overallDesc: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: c.textSecondary,
      lineHeight: 16,
      marginBottom: 8,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    statusText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
    sectionLabel: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      letterSpacing: 3,
      color: c.textTertiary,
      marginBottom: 10,
    },
    dimList: { gap: 8 },
    dimCard: { backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    dimHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    dimIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dimInfo: { flex: 1 },
    dimTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    dimKey: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5 },
    dimLabel: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: c.textPrimary,
      marginBottom: 2,
    },
    dimDesc: {
      fontSize: 10,
      fontFamily: 'Inter_400Regular',
      color: c.textSecondary,
      lineHeight: 14,
    },
    dimScore: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
    dimScoreText: { position: 'absolute', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    dimDetail: { borderTopWidth: 1, borderTopColor: c.border, padding: 14 },
    dimDetailText: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: c.textSecondary,
      lineHeight: 18,
      marginBottom: 12,
    },
    dimMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    dimMetric: { minWidth: '45%', gap: 2 },
    dimMetricLabel: {
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
      color: c.textTertiary,
      letterSpacing: 1,
    },
    dimMetricValue: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  });
}
