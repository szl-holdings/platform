import { useSyncEngine } from '@szl-holdings/mobile-shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { featherIcon, VesselIcon } from '@/components/VesselIcon';
import { useColors } from '@/hooks/useColors';
import { api, CACHE_KEYS, cacheGetStale, cacheSet, type FleetException } from '@/lib/fleet/api';
import { type AlertUpdate, vesselsWs } from '@/lib/fleet/websocket';
import { scheduleLocalAlert } from '@/lib/notifications';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#64748b',
  watch: '#f59e0b',
};

const EXCEPTION_ICON_MAP: Record<string, string> = {
  ais_dark: 'eye-off',
  sanctions_match: 'shield-off',
  route_deviation: 'navigation',
  delay_risk: 'clock',
  port_congestion: 'anchor',
  weather_disruption: 'wind',
  maintenance_risk: 'tool',
  fuel_anomaly: 'zap',
  schedule_variance: 'calendar',
  security_alert: 'alert-triangle',
  overdue_arrival: 'clock',
  inspection_failure: 'x-circle',
};

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AlertCard({
  alert,
  onAcknowledge,
  isAcknowledging,
}: {
  alert: FleetException;
  onAcknowledge?: (id: string) => void;
  isAcknowledging?: boolean;
}) {
  const colors = useColors();
  const sc = SEVERITY_COLORS[alert.severity] || colors.textFaint;
  const iconName = featherIcon(EXCEPTION_ICON_MAP[alert.exceptionType] ?? 'alert-circle');
  const impact = alert.estimatedImpactUsd ? parseFloat(alert.estimatedImpactUsd) : 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: `${sc}25` }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: `${sc}15` }]}>
          <VesselIcon name={iconName} size={14} color={sc} />
        </View>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {alert.title}
          </Text>
        </View>
        <View
          style={[styles.severityBadge, { backgroundColor: `${sc}15`, borderColor: `${sc}30` }]}
        >
          <Text style={[styles.severityText, { color: sc }]}>{alert.severity.toUpperCase()}</Text>
        </View>
      </View>

      {alert.vesselName && (
        <View style={styles.vesselRow}>
          <VesselIcon name="anchor" size={10} color={colors.textFaint} />
          <Text style={[styles.vesselText, { color: colors.textDim }]}>{alert.vesselName}</Text>
        </View>
      )}

      <Text style={[styles.cardDesc, { color: colors.textDim }]} numberOfLines={2}>
        {alert.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.cardFooterLeft}>
          <View
            style={[
              styles.typePill,
              { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder },
            ]}
          >
            <Text style={[styles.typeText, { color: colors.primary }]}>
              {alert.exceptionType?.replace(/_/g, ' ')}
            </Text>
          </View>
          {impact > 0 && (
            <View style={[styles.impactPill, { backgroundColor: colors.redDim }]}>
              <Text style={[styles.impactText, { color: colors.red }]}>
                ${(impact / 1000).toFixed(0)}K at risk
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardFooterRight}>
          <Text style={[styles.timeText, { color: colors.textFaint }]}>
            {timeAgo(alert.detectedAt ?? '')}
          </Text>
          {onAcknowledge && (
            <TouchableOpacity
              onPress={() => onAcknowledge(alert.id)}
              disabled={isAcknowledging}
              style={[
                styles.ackBtn,
                { borderColor: `${sc}40`, opacity: isAcknowledging ? 0.5 : 1 },
              ]}
            >
              <Text style={[styles.ackText, { color: sc }]}>{isAcknowledging ? '…' : 'ACK'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function AlertsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [cachedAlerts, setCachedAlerts] = useState<FleetException[]>([]);

  const syncEngine = useSyncEngine();

  const acknowledgeAlert = useMutation({
    mutationFn: async (id: string) => {
      const base = process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
        : '/api';
      const url = `${base}/vessels/exceptions/${id}/acknowledge`;

      if (!syncEngine.isOnline) {
        await syncEngine.enqueue({
          domain: 'vessels',
          method: 'POST',
          url,
          idempotencyKey: `vessels-acknowledge-exception-${id}`,
        });
        return;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'X-Idempotency-Key': `vessels-acknowledge-exception-${id}` },
      });
      if (!res.ok) throw new Error('Acknowledge failed');
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['fleet-exceptions-mobile'] });
      const prev = queryClient.getQueryData<FleetException[]>(['fleet-exceptions-mobile']);
      queryClient.setQueryData<FleetException[]>(['fleet-exceptions-mobile'], (old) =>
        (old ?? []).filter((a) => String(a.id) !== String(id)),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['fleet-exceptions-mobile'], ctx.prev);
    },
    onSettled: () => {
      if (syncEngine.isOnline) {
        queryClient.invalidateQueries({ queryKey: ['fleet-exceptions-mobile'] });
      }
    },
  });

  const {
    data: alerts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['fleet-exceptions-mobile'],
    queryFn: async () => {
      try {
        const data = await api.getExceptions();
        await cacheSet(CACHE_KEYS.ALERTS, data);
        return data;
      } catch {
        return (await cacheGetStale<FleetException[]>(CACHE_KEYS.ALERTS)) ?? [];
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    cacheGetStale<FleetException[]>(CACHE_KEYS.ALERTS).then((d) => {
      if (d) setCachedAlerts(d);
    });
  }, []);

  useEffect(() => {
    const onAlert = (upd: AlertUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['fleet-exceptions-mobile'] });
      if (upd.severity === 'critical') {
        scheduleLocalAlert({
          title: 'CRITICAL: Maritime Alert',
          body: upd.title,
          data: { vesselId: upd.vesselId, severity: upd.severity },
        });
      }
    };
    const onResolved = () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-exceptions-mobile'] });
    };
    vesselsWs.on('alert_created', onAlert);
    vesselsWs.on('alert_resolved', onResolved);
    return () => {
      vesselsWs.off('alert_created', onAlert);
      vesselsWs.off('alert_resolved', onResolved);
    };
  }, [queryClient]);

  const displayAlerts = alerts.length > 0 ? alerts : cachedAlerts;
  const filtered =
    severityFilter === 'all'
      ? displayAlerts
      : displayAlerts.filter((a) => a.severity === severityFilter);
  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, watch: 2 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });

  const severityCounts = displayAlerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {});

  const critical = severityCounts.critical || 0;
  const high = severityCounts.high || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Alerts & Anomalies</Text>
          <Text style={[styles.sub, { color: colors.textFaint }]}>
            {critical > 0 && `${critical} critical · `}
            {high > 0 && `${high} high · `}
            {displayAlerts.length} total
          </Text>
        </View>
        {critical > 0 && (
          <View
            style={[
              styles.critBadge,
              { backgroundColor: colors.redDim, borderColor: `${colors.red}30` },
            ]}
          >
            <VesselIcon name="alert-triangle" size={12} color={colors.red} />
            <Text style={[styles.critText, { color: colors.red }]}>{critical}</Text>
          </View>
        )}
      </View>

      <FlatList
        horizontal
        data={[
          { id: 'all', label: `All (${displayAlerts.length})` },
          { id: 'critical', label: `Critical (${severityCounts.critical || 0})` },
          { id: 'high', label: `High (${severityCounts.high || 0})` },
          {
            id: 'medium',
            label: `Medium (${(severityCounts.medium || 0) + (severityCounts.watch || 0)})`,
          },
          { id: 'low', label: `Low (${severityCounts.low || 0})` },
        ]}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSeverityFilter(item.id)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: severityFilter === item.id ? colors.primaryDim : 'transparent',
                borderColor: severityFilter === item.id ? colors.primaryBorder : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: severityFilter === item.id ? colors.primary : colors.textDim },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(a) => String(a.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
              isAcknowledging={acknowledgeAlert.isPending && acknowledgeAlert.variables === item.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <VesselIcon name="check-circle" size={32} color={colors.green} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear</Text>
              <Text style={[styles.emptyText, { color: colors.textFaint }]}>No active alerts</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 11, marginTop: 2, fontFamily: 'Inter_400Regular' },
  critBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  critText: { fontSize: 12, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  filterBar: { marginTop: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleRow: { flex: 1 },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  severityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    fontFamily: 'Inter_700Bold',
  },
  vesselRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  vesselText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  cardDesc: { fontSize: 12, lineHeight: 16, marginBottom: 10, fontFamily: 'Inter_400Regular' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFooterLeft: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  cardFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  typePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  impactPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  impactText: { fontSize: 9, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  timeText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  ackBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  ackText: {
    fontSize: 9,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
