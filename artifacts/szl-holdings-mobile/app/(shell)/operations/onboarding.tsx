import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const ACCENT = '#a855f7';

interface OnboardingRow {
  orgId: number;
  orgName: string;
  orgSlug: string;
  plan: string;
  orgStatus: string;
  createdAt: string;
  onboarding: {
    status: 'complete' | 'in_progress' | 'not_started';
    progress: number;
    completedSteps: string[];
    currentStep: string;
    completedAt: string | null;
    lastUpdatedAt: string | null;
    totalSteps: number;
  };
}

interface OnboardingStatusData {
  totals: {
    orgs: number;
    complete: number;
    inProgress: number;
    notStarted: number;
  };
  rows: OnboardingRow[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

type OnboardingStatus = 'complete' | 'in_progress' | 'not_started';

const STATUS_FILTERS: { key: OnboardingStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'complete', label: 'Complete' },
];

const STEP_LABELS: Record<string, string> = {
  profile: 'Organization Profile',
  team: 'Invite Team',
  notifications: 'Notifications',
  integrations: 'Integrations',
};

const STEPS = ['profile', 'team', 'notifications', 'integrations'] as const;

function statusColor(status: OnboardingStatus, colors: ReturnType<typeof useColors>) {
  switch (status) {
    case 'complete':
      return colors.green;
    case 'in_progress':
      return colors.amber;
    case 'not_started':
      return colors.mutedForeground;
  }
}

function statusLabel(status: OnboardingStatus): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in_progress':
      return 'In Progress';
    case 'not_started':
      return 'Not Started';
  }
}

function statusIcon(status: OnboardingStatus): FeatherIconName {
  switch (status) {
    case 'complete':
      return 'check-circle';
    case 'in_progress':
      return 'clock';
    case 'not_started':
      return 'alert-circle';
  }
}

function ProgressBar({
  progress,
  color,
  bgColor,
}: {
  progress: number;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[pStyles.barOuter, { backgroundColor: bgColor }]}>
      <View style={[pStyles.barInner, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );
}

const pStyles = StyleSheet.create({
  barOuter: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    flex: 1,
  },
  barInner: {
    height: '100%',
    borderRadius: 2,
  },
});

function SummaryCard({
  label,
  value,
  color,
  bgColor,
  borderColor,
  colors,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[cardStyles.summaryCard, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[cardStyles.summaryValue, { color }]}>{value}</Text>
      <Text style={[cardStyles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});

function OrgCard({
  row,
  expanded,
  onToggle,
  colors,
}: {
  row: OnboardingRow;
  expanded: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const sColor = statusColor(row.onboarding.status, colors);
  const progressColor =
    row.onboarding.progress === 100
      ? colors.green
      : row.onboarding.progress > 0
        ? colors.amber
        : colors.mutedForeground;

  return (
    <View style={[orgStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onToggle();
        }}
        style={orgStyles.cardHeader}
      >
        <View style={[orgStyles.iconBox, { backgroundColor: `${ACCENT}18` }]}>
          <Feather name="clipboard" size={16} color={ACCENT} />
        </View>
        <View style={orgStyles.cardMain}>
          <View style={orgStyles.nameRow}>
            <Text
              style={[orgStyles.orgName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {row.orgName}
            </Text>
            <View
              style={[
                orgStyles.statusBadge,
                { backgroundColor: `${sColor}18`, borderColor: `${sColor}30` },
              ]}
            >
              <Feather name={statusIcon(row.onboarding.status)} size={9} color={sColor} />
              <Text style={[orgStyles.statusText, { color: sColor }]}>
                {statusLabel(row.onboarding.status)}
              </Text>
            </View>
          </View>
          <Text style={[orgStyles.orgSlug, { color: colors.mutedForeground }]}>
            {row.orgSlug}
          </Text>
          <View style={orgStyles.progressRow}>
            <ProgressBar
              progress={row.onboarding.progress}
              color={progressColor}
              bgColor={`${colors.mutedForeground}20`}
            />
            <Text style={[orgStyles.progressText, { color: colors.mutedForeground }]}>
              {row.onboarding.progress}%
            </Text>
          </View>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.mutedForeground}
        />
      </Pressable>

      {expanded && (
        <View style={[orgStyles.detail, { borderTopColor: colors.border }]}>
          <View style={orgStyles.metaGrid}>
            <View style={orgStyles.metaItem}>
              <Text style={[orgStyles.metaLabel, { color: colors.mutedForeground }]}>
                Current step
              </Text>
              <Text style={[orgStyles.metaValue, { color: colors.foreground }]}>
                {STEP_LABELS[row.onboarding.currentStep] ?? row.onboarding.currentStep}
              </Text>
            </View>
            <View style={orgStyles.metaItem}>
              <Text style={[orgStyles.metaLabel, { color: colors.mutedForeground }]}>
                Steps done
              </Text>
              <Text style={[orgStyles.metaValue, { color: colors.foreground }]}>
                {row.onboarding.completedSteps.length} / {row.onboarding.totalSteps}
              </Text>
            </View>
            <View style={orgStyles.metaItem}>
              <Text style={[orgStyles.metaLabel, { color: colors.mutedForeground }]}>
                Completed at
              </Text>
              <Text style={[orgStyles.metaValue, { color: colors.foreground }]}>
                {row.onboarding.completedAt
                  ? new Date(row.onboarding.completedAt).toLocaleDateString()
                  : '—'}
              </Text>
            </View>
            <View style={orgStyles.metaItem}>
              <Text style={[orgStyles.metaLabel, { color: colors.mutedForeground }]}>
                Last activity
              </Text>
              <Text style={[orgStyles.metaValue, { color: colors.foreground }]}>
                {row.onboarding.lastUpdatedAt
                  ? new Date(row.onboarding.lastUpdatedAt).toLocaleDateString()
                  : '—'}
              </Text>
            </View>
          </View>

          <Text style={[orgStyles.breakdownTitle, { color: colors.mutedForeground }]}>
            Step breakdown
          </Text>
          <View style={orgStyles.stepList}>
            {STEPS.map((step) => {
              const done = row.onboarding.completedSteps.includes(step);
              const isCurrent = row.onboarding.currentStep === step && !done;
              const chipColor = done
                ? colors.green
                : isCurrent
                  ? colors.amber
                  : colors.mutedForeground;
              const chipIcon: FeatherIconName = done
                ? 'check-circle'
                : isCurrent
                  ? 'clock'
                  : 'circle';
              return (
                <View
                  key={step}
                  style={[
                    orgStyles.stepChip,
                    {
                      backgroundColor: `${chipColor}14`,
                      borderColor: `${chipColor}30`,
                    },
                  ]}
                >
                  <Feather name={chipIcon} size={10} color={chipColor} />
                  <Text style={[orgStyles.stepChipText, { color: chipColor }]}>
                    {STEP_LABELS[step]}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={orgStyles.footerRow}>
            <Text style={[orgStyles.footerText, { color: colors.mutedForeground }]}>
              Created {new Date(row.createdAt).toLocaleDateString()}
            </Text>
            <Text style={[orgStyles.footerDot, { color: colors.mutedForeground }]}> · </Text>
            <Text style={[orgStyles.footerText, { color: colors.foreground }]}>
              {row.plan}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const orgStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  orgName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  orgSlug: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  progressText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    width: 28,
    textAlign: 'right',
  },
  detail: {
    borderTopWidth: 1,
    padding: 14,
    gap: 12,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    width: '45%',
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  metaValue: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  breakdownTitle: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  stepList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  stepChipText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  footerDot: {
    fontSize: 10,
  },
});

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'all'>('all');
  const [orgSearch, setOrgSearch] = useState('');
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null);
  const topPad = Platform.OS === 'web' ? 16 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : 90;

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (orgSearch.trim()) params.set('org', orgSearch.trim());
    params.set('limit', '200');
    return params.toString();
  }, [statusFilter, orgSearch]);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin-onboarding-status', statusFilter, orgSearch],
    queryFn: () =>
      apiFetch<OnboardingStatusData>(
        `/api/admin/onboarding-status${queryParams ? `?${queryParams}` : ''}`,
      ),
    staleTime: 30000,
  });

  const rows = data?.rows ?? [];
  const totals = data?.totals;

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  }, [refetch]);

  return (
    <View style={[screenStyles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[`${ACCENT}0a`, 'transparent']}
        style={[screenStyles.headerGradient, { height: topPad + 100 }]}
      />

      <View
        style={[
          screenStyles.headerBar,
          { paddingTop: topPad + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[screenStyles.backBtn, { borderColor: colors.border }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={screenStyles.headerCenter}>
          <Text style={[screenStyles.headerTitle, { color: colors.foreground }]}>
            Onboarding Status
          </Text>
          <Text style={[screenStyles.headerSubtitle, { color: colors.mutedForeground }]}>
            Organization setup progress
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            qc.invalidateQueries({ queryKey: ['admin-onboarding-status'] });
          }}
          style={[screenStyles.refreshBtn, { borderColor: colors.border }]}
          hitSlop={8}
        >
          <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        style={screenStyles.scroll}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: bottomPad,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        {totals && (
          <View style={screenStyles.summaryRow}>
            <SummaryCard
              label="Total orgs"
              value={totals.orgs}
              color={colors.foreground}
              bgColor={colors.card}
              borderColor={colors.border}
              colors={colors}
            />
            <SummaryCard
              label="Complete"
              value={totals.complete}
              color={colors.green}
              bgColor={`${colors.green}0c`}
              borderColor={`${colors.green}25`}
              colors={colors}
            />
            <SummaryCard
              label="In progress"
              value={totals.inProgress}
              color={colors.amber}
              bgColor={`${colors.amber}0c`}
              borderColor={`${colors.amber}25`}
              colors={colors}
            />
            <SummaryCard
              label="Not started"
              value={totals.notStarted}
              color={colors.mutedForeground}
              bgColor={`${colors.mutedForeground}0c`}
              borderColor={colors.border}
              colors={colors}
            />
          </View>
        )}

        <View style={screenStyles.filterRow}>
          <View
            style={[
              screenStyles.searchBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="search" size={14} color={colors.mutedForeground} />
            <TextInput
              style={[screenStyles.searchInput, { color: colors.foreground }]}
              placeholder="Search org name or slug..."
              placeholderTextColor={colors.mutedForeground}
              value={orgSearch}
              onChangeText={setOrgSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {orgSearch.length > 0 && (
              <Pressable onPress={() => setOrgSearch('')} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={screenStyles.filterChipRow}
        >
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setStatusFilter(f.key);
                }}
                style={[
                  screenStyles.filterChip,
                  {
                    backgroundColor: active ? `${ACCENT}20` : colors.card,
                    borderColor: active ? `${ACCENT}40` : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    screenStyles.filterChipText,
                    { color: active ? ACCENT : colors.mutedForeground },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={screenStyles.centerState}>
            <ActivityIndicator color={ACCENT} />
            <Text style={[screenStyles.stateText, { color: colors.mutedForeground }]}>
              Loading onboarding data...
            </Text>
          </View>
        ) : error ? (
          <View
            style={[
              screenStyles.errorState,
              { backgroundColor: `${colors.red}10`, borderColor: `${colors.red}25` },
            ]}
          >
            <Feather name="alert-circle" size={16} color={colors.red} />
            <Text style={[screenStyles.errorText, { color: colors.red }]}>
              Failed to load onboarding status. Ensure you have admin access.
            </Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={screenStyles.centerState}>
            <Feather name="clipboard" size={32} color={`${colors.mutedForeground}60`} />
            <Text
              style={[
                screenStyles.emptyTitle,
                { color: colors.foreground },
              ]}
            >
              No organizations found
            </Text>
            <Text style={[screenStyles.stateText, { color: colors.mutedForeground }]}>
              {statusFilter !== 'all' || orgSearch
                ? 'Try adjusting the search or filter.'
                : 'No organizations have been provisioned yet.'}
            </Text>
          </View>
        ) : (
          <View style={screenStyles.orgList}>
            {rows.map((row) => (
              <OrgCard
                key={row.orgId}
                row={row}
                expanded={expandedOrg === row.orgId}
                onToggle={() =>
                  setExpandedOrg(expandedOrg === row.orgId ? null : row.orgId)
                }
                colors={colors}
              />
            ))}
          </View>
        )}

        {data?.pagination.hasMore && (
          <Text style={[screenStyles.paginationNote, { color: colors.mutedForeground }]}>
            Showing {rows.length} of {data.pagination.total} organizations
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterRow: {
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  filterChipRow: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  centerState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  stateText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  errorState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  orgList: {
    gap: 8,
  },
  paginationNote: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 14,
  },
});
