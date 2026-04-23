import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WORKSPACES } from '@/context/WorkspaceContext';
import { useColors } from '@/hooks/useColors';
import { apiGet } from '@/lib/apiClient';

const ACCENT = '#c9a84c';
const PURPLE = '#8b7ac8';

export interface DecisionHistoryItem {
  id: string;
  domain: string;
  title: string;
  description: string;
  decision: 'approved' | 'rejected';
  decidedAt: string | null;
  decidedAtRelative: string | null;
  decidedById: number | null;
  requester?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resourceType?: string;
  resourceId?: string;
}

interface HistoryResponse {
  items: DecisionHistoryItem[];
  total: number;
}

export default function QuickActionsHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['cortex', 'quick-actions', 'history'],
    queryFn: () => apiGet<HistoryResponse>('/api/cortex/quick-actions/history?limit=100'),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const items = data?.items ?? [];
  const approvedCount = items.filter((i) => i.decision === 'approved').length;
  const rejectedCount = items.filter((i) => i.decision === 'rejected').length;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(shell)/quick-actions');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Decision History</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Audit trail of past Quick Action deck decisions
          </Text>
        </View>
        <View
          style={[styles.accentDot, { backgroundColor: `${PURPLE}20`, borderColor: `${PURPLE}40` }]}
        >
          <Feather name="clock" size={16} color={PURPLE} />
        </View>
      </View>

      {!isLoading && !isError && items.length > 0 && (
        <View style={[styles.summaryStrip, { borderBottomColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: colors.green }]}>{approvedCount}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Approved</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: colors.red }]}>{rejectedCount}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Denied</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: colors.foreground }]}>{items.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total</Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 32 },
          (isLoading || isError || items.length === 0) && styles.bodyCenter,
        ]}
      >
        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading decision history…
            </Text>
          </View>
        )}

        {!isLoading && isError && (
          <View style={styles.centerState}>
            <Text style={styles.emptyIcon}>⚠</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Unable to Load</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Could not fetch decision history. Check your connection.
            </Text>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: 'rgba(201,168,76,0.3)' }]}
              onPress={() => refetch()}
            >
              <Text style={styles.resetBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <View style={styles.centerState}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Decisions Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Once you approve or deny items from the Quick Action deck, they will appear here for
              audit review.
            </Text>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: 'rgba(201,168,76,0.3)' }]}
              onPress={handleBack}
            >
              <Text style={styles.resetBtnText}>Back to Deck</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading &&
          !isError &&
          items.map((item) => {
            const ws = WORKSPACES.find((w) => w.id === item.domain);
            const accent = ws?.accent ?? ACCENT;
            const isApproved = item.decision === 'approved';
            const decisionColor = isApproved ? colors.green : colors.red;
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderLeftColor: decisionColor,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.domainBadge, { backgroundColor: `${accent}20` }]}>
                    <Text style={[styles.domainText, { color: accent }]}>
                      {ws?.label ?? item.domain.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.decisionBadge, { backgroundColor: `${decisionColor}18` }]}>
                    <Feather
                      name={isApproved ? 'check-circle' : 'x-circle'}
                      size={11}
                      color={decisionColor}
                    />
                    <Text style={[styles.decisionText, { color: decisionColor }]}>
                      {isApproved ? 'Approved' : 'Denied'}
                    </Text>
                  </View>
                  {item.decidedAtRelative && (
                    <Text
                      style={[styles.timeText, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {item.decidedAtRelative}
                    </Text>
                  )}
                </View>

                <Text
                  style={[styles.cardTitle, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                {item.description ? (
                  <Text
                    style={[styles.cardDesc, { color: colors.mutedForeground }]}
                    numberOfLines={3}
                  >
                    {item.description}
                  </Text>
                ) : null}

                <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                  {item.requester && (
                    <View style={styles.metaItem}>
                      <Feather name="user" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        Requested by {item.requester}
                      </Text>
                    </View>
                  )}
                  {item.decidedAt && (
                    <View style={styles.metaItem}>
                      <Feather name="calendar" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {new Date(item.decidedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

        {!isLoading && !isError && items.length > 0 && (
          <TouchableOpacity
            style={[styles.refreshBtn, { borderColor: colors.border }]}
            onPress={() => refetch()}
            disabled={isFetching}
          >
            <Feather name="refresh-cw" size={12} color={colors.mutedForeground} />
            <Text style={[styles.refreshBtnText, { color: colors.mutedForeground }]}>
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 4,
  },
  backBtn: { padding: 8, marginRight: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  accentDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryDivider: { width: 1, height: 28 },
  summaryNum: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  summaryLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  bodyCenter: { flexGrow: 1, justifyContent: 'center' },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  card: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  domainBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  domainText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  decisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  decisionText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  timeText: { fontSize: 10, fontFamily: 'Inter_400Regular', marginLeft: 'auto' },
  cardTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  cardDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17, marginBottom: 10 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#c9a84c' },
  refreshBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  refreshBtnText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
