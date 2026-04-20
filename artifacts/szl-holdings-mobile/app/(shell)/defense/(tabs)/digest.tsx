import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiGet } from '@/lib/apiClient';

interface Incident {
  id: number;
  title: string;
  severity: string;
  status: string;
  assignedAnalyst?: string;
}

interface Finding {
  id: number;
  severity: string;
  status: string;
}

interface HardeningSummary {
  overallScore: number;
  total: number;
  implemented: number;
  partial: number;
  notImplemented: number;
  criticalGaps: number;
}

interface Decision {
  id?: number;
  objectId?: string;
  decisionType?: string;
  recommendedAction?: string;
  summary?: string;
  approvalRequired?: boolean;
  humanReviewRequired?: boolean;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
}

function decisionNeedsReview(d: Decision): boolean {
  return (
    (d.approvalRequired === true || d.humanReviewRequired === true) &&
    !d.approvedAt &&
    !d.rejectedAt
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#6b7280',
};

const PILOT_TRUST_METRICS = [
  { label: 'Retrieval quality', value: '92.3%', status: 'good', note: 'Pilot data' },
  { label: 'Schema validity', value: '96.4%', status: 'good', note: 'Pilot data' },
  { label: 'Unsupported claim rate', value: '2.8%', status: 'warn', note: 'Pilot data' },
  { label: 'Override rate (7d)', value: '9.1%', status: 'warn', note: 'Pilot data' },
];

export default function DigestTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const {
    data: incidents,
    isLoading: incLoading,
    refetch: refetchInc,
    isRefetching: incRefetching,
  } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => apiGet<Incident[]>('/api/aegis/incidents'),
  });

  const {
    data: findings,
    isLoading: findLoading,
    refetch: refetchFind,
    isRefetching: findRefetching,
  } = useQuery({
    queryKey: ['findings'],
    queryFn: () => apiGet<Finding[]>('/api/aegis/findings'),
  });

  const { data: hardeningSummary, isLoading: hardLoading } = useQuery({
    queryKey: ['hardening-summary'],
    queryFn: () => apiGet<HardeningSummary>('/api/aegis/hardening-summary'),
  });

  const {
    data: decisions,
    isLoading: decLoading,
    refetch: refetchDec,
    isRefetching: decRefetching,
  } = useQuery({
    queryKey: ['tradecraft-decisions'],
    queryFn: () => apiGet<Decision[]>('/api/aegis/tradecraft/decisions'),
  });

  const activeIncidents = Array.isArray(incidents)
    ? incidents.filter((i) => i.status !== 'closed')
    : [];
  const closedIncidents = Array.isArray(incidents)
    ? incidents.filter((i) => i.status === 'closed')
    : [];
  const criticalFindings = Array.isArray(findings)
    ? findings.filter((f) => f.severity === 'critical' && f.status !== 'mitigated').length
    : 0;
  const pendingDecisions = Array.isArray(decisions)
    ? decisions.filter((d: Decision) => decisionNeedsReview(d))
    : [];
  const isLoading = incLoading || findLoading || hardLoading || decLoading;
  const isRefreshing = incRefetching || findRefetching || decRefetching;

  async function handleRefresh() {
    await Promise.all([refetchInc(), refetchFind(), refetchDec()]);
  }

  const overallPosture = activeIncidents.some((i) => i.severity === 'critical')
    ? 'critical'
    : activeIncidents.some((i) => i.severity === 'high')
      ? 'elevated'
      : 'guarded';
  const postureColor =
    overallPosture === 'critical'
      ? '#ef4444'
      : overallPosture === 'elevated'
        ? '#f59e0b'
        : '#22c55e';

  const keyMetrics = [
    { label: 'Active Incidents', value: String(activeIncidents.length), live: true },
    { label: 'Closed Incidents', value: String(closedIncidents.length), live: true },
    { label: 'Pending Approvals', value: String(pendingDecisions.length), live: true },
    { label: 'Critical Findings', value: String(criticalFindings), live: true },
    {
      label: 'Security Score',
      value: hardeningSummary ? `${hardeningSummary.overallScore}%` : '—',
      live: !!hardeningSummary,
    },
    {
      label: 'Critical Gaps',
      value: hardeningSummary ? String(hardeningSummary.criticalGaps) : '—',
      live: !!hardeningSummary,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.navy, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Executive Digest</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            Live data · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View
          style={[
            styles.postureBadge,
            { backgroundColor: postureColor + '20', borderColor: postureColor + '40' },
          ]}
        >
          <Text style={[styles.postureText, { color: postureColor }]}>
            {overallPosture.toUpperCase()}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.amber} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 80 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.amber}
            />
          }
        >
          <View
            style={[
              styles.section,
              { backgroundColor: colors.navyLight, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>LIVE METRICS</Text>
            <View style={styles.metricsGrid}>
              {keyMetrics.map((m) => (
                <View key={m.label} style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>{m.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons
                      name={m.live ? 'radio-button-on' : 'radio-button-off'}
                      size={8}
                      color={m.live ? '#22c55e' : '#6b7280'}
                    />
                    <Text
                      style={{
                        fontSize: 8,
                        fontFamily: 'Inter_400Regular',
                        color: m.live ? '#22c55e' : '#6b7280',
                      }}
                    >
                      {m.live ? 'live' : 'pilot'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.navyLight, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>ACTIVE INCIDENTS</Text>
            <View style={{ gap: 8 }}>
              {activeIncidents.length === 0 && (
                <Text style={[styles.incidentMeta, { color: colors.muted }]}>
                  No active incidents
                </Text>
              )}
              {activeIncidents.slice(0, 5).map((inc) => (
                <View
                  key={inc.id}
                  style={[
                    styles.incidentRow,
                    { borderColor: (SEVERITY_COLORS[inc.severity] ?? '#6b7280') + '30' },
                  ]}
                >
                  <View
                    style={[
                      styles.severityDot,
                      { backgroundColor: SEVERITY_COLORS[inc.severity] ?? '#6b7280' },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.incidentTitle, { color: colors.foreground }]}>
                      {inc.title}
                    </Text>
                    <Text style={[styles.incidentMeta, { color: colors.muted }]}>
                      {inc.status} {inc.assignedAnalyst ? `· ${inc.assignedAnalyst}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {pendingDecisions.length > 0 && (
            <View
              style={[
                styles.section,
                { backgroundColor: colors.navyLight, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>PENDING APPROVALS</Text>
              <View style={{ gap: 8 }}>
                {pendingDecisions.slice(0, 4).map((d: Decision) => (
                  <View
                    key={d.id ?? d.objectId}
                    style={[styles.incidentRow, { borderColor: '#f59e0b30' }]}
                  >
                    <View style={[styles.severityDot, { backgroundColor: '#f59e0b' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.incidentTitle, { color: colors.foreground }]}>
                        {d.recommendedAction ??
                          d.summary ??
                          d.decisionType ??
                          'Decision pending review'}
                      </Text>
                      <Text style={[styles.incidentMeta, { color: colors.muted }]}>
                        {d.id ?? d.objectId}
                      </Text>
                    </View>
                    <Ionicons name="time-outline" size={14} color="#f59e0b" />
                  </View>
                ))}
              </View>
            </View>
          )}

          <View
            style={[
              styles.section,
              { backgroundColor: colors.navyLight, borderColor: colors.border },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>TRUST & QUALITY</Text>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: '#f59e0b20',
                }}
              >
                <Text style={{ fontSize: 8, fontFamily: 'Inter_600SemiBold', color: '#f59e0b' }}>
                  PILOT DATA
                </Text>
              </View>
            </View>
            <View style={{ gap: 8 }}>
              {PILOT_TRUST_METRICS.map((r) => (
                <View key={r.label} style={styles.trustRow}>
                  <Text style={[styles.trustLabel, { color: colors.muted }]}>{r.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[
                        styles.trustValue,
                        { color: r.status === 'good' ? '#22c55e' : '#f59e0b' },
                      ]}
                    >
                      {r.value}
                    </Text>
                    <Ionicons
                      name={r.status === 'good' ? 'checkmark-circle' : 'warning'}
                      size={12}
                      color={r.status === 'good' ? '#22c55e' : '#f59e0b'}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {hardeningSummary && (
            <View
              style={[
                styles.section,
                { backgroundColor: colors.navyLight, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>SECURITY POSTURE</Text>
              <View style={{ gap: 4, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.trustLabel, { color: colors.muted }]}>Overall Score</Text>
                  <Text
                    style={[
                      styles.trustValue,
                      {
                        color:
                          hardeningSummary.overallScore >= 80
                            ? '#22c55e'
                            : hardeningSummary.overallScore >= 60
                              ? '#f59e0b'
                              : '#ef4444',
                      },
                    ]}
                  >
                    {hardeningSummary.overallScore}%
                  </Text>
                </View>
                <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      width: `${hardeningSummary.overallScore}%`,
                      backgroundColor:
                        hardeningSummary.overallScore >= 80
                          ? '#22c55e'
                          : hardeningSummary.overallScore >= 60
                            ? '#f59e0b'
                            : '#ef4444',
                    }}
                  />
                </View>
              </View>
              <Text style={[styles.incidentMeta, { color: '#ef4444' }]}>
                {hardeningSummary.criticalGaps} critical control gaps
              </Text>
              <Text style={[styles.incidentMeta, { color: colors.muted }]}>
                {hardeningSummary.implemented} of {hardeningSummary.total} controls implemented
              </Text>
            </View>
          )}

          <View style={[styles.section, { backgroundColor: '#1e3a1e', borderColor: '#22c55e30' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="information-circle" size={14} color="#22c55e" />
              <Text style={[styles.sectionTitle, { color: '#22c55e' }]}>DATA SOURCES</Text>
            </View>
            <Text style={[styles.incidentMeta, { color: '#86efac' }]}>
              · Incidents, findings, decisions: live API
            </Text>
            <Text style={[styles.incidentMeta, { color: '#86efac' }]}>
              · Security score: live (hardening-summary endpoint)
            </Text>
            <Text style={[styles.incidentMeta, { color: '#86efac80' }]}>
              · Trust quality metrics: seeded pilot data
            </Text>
            <Text style={[styles.incidentMeta, { color: '#86efac80' }]}>
              · MTTD/MTTR: not yet instrumented in production
            </Text>
            <Text style={[styles.incidentMeta, { color: '#86efac80', marginTop: 6 }]}>
              Updated: {new Date().toLocaleString()}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -0.5 },
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  postureBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  postureText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  section: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 4 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricItem: { width: '30%', gap: 2 },
  metricValue: { fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
  metricLabel: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  severityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  incidentTitle: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  incidentMeta: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trustLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  trustValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
