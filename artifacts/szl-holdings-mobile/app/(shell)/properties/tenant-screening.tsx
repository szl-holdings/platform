import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const ACCENT = '#c87941';

type ScreeningStatus = 'approved' | 'pending' | 'in-review' | 'denied' | 'more-info';

interface ScreeningApplication {
  id: string;
  applicantName: string;
  property: string;
  unit: string;
  submittedDate: string;
  status: ScreeningStatus;
  creditScore: number;
  creditGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  annualIncome: number;
  monthlyRent: number;
  rentToIncome: number;
  backgroundCheck: 'clear' | 'flag' | 'pending';
  evictionHistory: boolean;
  employmentStatus: 'verified' | 'pending' | 'unverified';
  references: 'checked' | 'pending' | 'failed';
  notes?: string;
}

const STATUS_COLORS: Record<ScreeningStatus, string> = {
  approved: '#34d399',
  pending: '#60a5fa',
  'in-review': '#fbbf24',
  denied: '#ef4444',
  'more-info': '#f97316',
};

const STATUS_ICONS: Record<ScreeningStatus, FeatherIconName> = {
  approved: 'check-circle',
  pending: 'clock',
  'in-review': 'search',
  denied: 'x-circle',
  'more-info': 'alert-circle',
};

const APPLICATIONS: ScreeningApplication[] = [
  {
    id: 'ts-1',
    applicantName: 'Marcus D. Holloway',
    property: 'Westside Plaza Apts',
    unit: '4B',
    submittedDate: 'Apr 12, 2026',
    status: 'approved',
    creditScore: 748,
    creditGrade: 'A',
    annualIncome: 114_000,
    monthlyRent: 2_850,
    rentToIncome: 30,
    backgroundCheck: 'clear',
    evictionHistory: false,
    employmentStatus: 'verified',
    references: 'checked',
  },
  {
    id: 'ts-2',
    applicantName: 'Priya Anand',
    property: 'Harborview Mixed-Use',
    unit: '12C',
    submittedDate: 'Apr 14, 2026',
    status: 'in-review',
    creditScore: 682,
    creditGrade: 'B',
    annualIncome: 88_000,
    monthlyRent: 2_400,
    rentToIncome: 33,
    backgroundCheck: 'clear',
    evictionHistory: false,
    employmentStatus: 'verified',
    references: 'pending',
    notes: 'Awaiting reference from previous landlord',
  },
  {
    id: 'ts-3',
    applicantName: 'Jordan P. Reyes',
    property: 'Gateway Commerce Center',
    unit: 'Suite 1100',
    submittedDate: 'Apr 15, 2026',
    status: 'pending',
    creditScore: 611,
    creditGrade: 'C',
    annualIncome: 72_000,
    monthlyRent: 2_200,
    rentToIncome: 37,
    backgroundCheck: 'pending',
    evictionHistory: false,
    employmentStatus: 'pending',
    references: 'pending',
  },
  {
    id: 'ts-4',
    applicantName: 'Keisha N. Bridges',
    property: 'Riverside Logistics Park',
    unit: 'B2',
    submittedDate: 'Apr 10, 2026',
    status: 'more-info',
    creditScore: 589,
    creditGrade: 'C',
    annualIncome: 64_000,
    monthlyRent: 2_100,
    rentToIncome: 39,
    backgroundCheck: 'flag',
    evictionHistory: false,
    employmentStatus: 'verified',
    references: 'checked',
    notes: 'Criminal background flag — minor infraction 6 yrs ago. Awaiting documentation',
  },
  {
    id: 'ts-5',
    applicantName: 'Tomás Vega-Cruz',
    property: 'Northgate Industrial',
    unit: 'Unit C',
    submittedDate: 'Apr 8, 2026',
    status: 'denied',
    creditScore: 512,
    creditGrade: 'D',
    annualIncome: 48_000,
    monthlyRent: 2_000,
    rentToIncome: 50,
    backgroundCheck: 'flag',
    evictionHistory: true,
    employmentStatus: 'unverified',
    references: 'failed',
    notes: 'Prior eviction 2022. Income insufficient at 50% ratio. Background flag.',
  },
];

const STATUS_FILTERS: { key: ScreeningStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in-review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'denied', label: 'Denied' },
  { key: 'more-info', label: 'More Info' },
];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(0)}K`
      : `$${n}`;

function CheckBadge({ label, status }: { label: string; status: string }) {
  const _colors = useColors();
  const passed = status === 'clear' || status === 'verified' || status === 'checked';
  const failed = status === 'flag' || status === 'unverified' || status === 'failed';
  const color = passed ? '#34d399' : failed ? '#ef4444' : '#60a5fa';
  const icon: FeatherIconName = passed ? 'check' : failed ? 'x' : 'clock';

  return (
    <View style={[styles.checkBadge, { backgroundColor: `${color}12`, borderColor: `${color}30` }]}>
      <Feather name={icon} size={9} color={color} />
      <Text style={[styles.checkLabel, { color }]}>{label}</Text>
    </View>
  );
}

function ApplicationCard({
  app,
  expanded,
  onToggle,
}: {
  app: ScreeningApplication;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[app.status];
  const creditColor =
    app.creditScore >= 720
      ? '#34d399'
      : app.creditScore >= 660
        ? '#60a5fa'
        : app.creditScore >= 580
          ? '#fbbf24'
          : '#ef4444';
  const rtiColor =
    app.rentToIncome <= 30 ? '#34d399' : app.rentToIncome <= 40 ? '#fbbf24' : '#ef4444';

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
      style={[
        styles.appCard,
        {
          backgroundColor: colors.surface,
          borderColor: expanded ? `${statusColor}40` : colors.border,
        },
      ]}
    >
      <View style={styles.appCardTop}>
        <View
          style={[
            styles.statusIconWrap,
            { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` },
          ]}
        >
          <Feather name={STATUS_ICONS[app.status]} size={14} color={statusColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.appName, { color: colors.cream }]}>{app.applicantName}</Text>
          <Text style={[styles.appSub, { color: colors.mutedForeground }]}>
            {app.property} · Unit {app.unit}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` },
            ]}
          >
            <Text style={[styles.statusPillText, { color: statusColor }]}>{app.status}</Text>
          </View>
          <Text style={[styles.appDate, { color: colors.mutedForeground }]}>
            {app.submittedDate}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreValue, { color: creditColor }]}>{app.creditScore}</Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Credit</Text>
        </View>
        <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreValue, { color: colors.cream }]}>{fmt(app.annualIncome)}</Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Income / yr</Text>
        </View>
        <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreValue, { color: rtiColor }]}>{app.rentToIncome}%</Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Rent/Income</Text>
        </View>
      </View>

      {expanded && (
        <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
          <View style={styles.checkRow}>
            <CheckBadge label="Background" status={app.backgroundCheck} />
            <CheckBadge label="Employment" status={app.employmentStatus} />
            <CheckBadge label="References" status={app.references} />
            {app.evictionHistory && (
              <View
                style={[
                  styles.checkBadge,
                  { backgroundColor: '#ef4444' + '12', borderColor: '#ef4444' + '30' },
                ]}
              >
                <Feather name="x" size={9} color="#ef4444" />
                <Text style={[styles.checkLabel, { color: '#ef4444' }]}>Eviction</Text>
              </View>
            )}
          </View>
          {app.notes && (
            <View
              style={[
                styles.notesBox,
                { backgroundColor: '#fbbf24' + '08', borderColor: '#fbbf24' + '20' },
              ]}
            >
              <Feather name="info" size={11} color="#fbbf24" />
              <Text style={[styles.notesText, { color: '#fbbf24' }]}>{app.notes}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

function mapApiToApplications(raw: unknown): ScreeningApplication[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const list = (r.data as Record<string, unknown>)?.applications ?? r.applications;
  if (!Array.isArray(list) || list.length === 0) return null;

  const normalizeStatus = (s: unknown): ScreeningStatus => {
    const str = String(s ?? '');
    const map: Record<string, ScreeningStatus> = {
      approved: 'approved',
      pending: 'pending',
      'in-review': 'in-review',
      denied: 'denied',
      'more-info': 'more-info',
      conditional: 'in-review',
      declined: 'denied',
      applied: 'pending',
      withdrawn: 'denied',
    };
    return map[str] ?? 'pending';
  };

  return list.map((a: Record<string, unknown>, idx: number) => ({
    id: String(a.id ?? idx),
    applicantName: String(a.applicantName ?? a.name ?? 'Applicant'),
    property: String(a.property ?? ''),
    unit: String(a.unit ?? a.suite ?? a.targetUnit ?? ''),
    submittedDate: String(a.submittedDate ?? a.appliedDate ?? a.applicationDate ?? ''),
    status: normalizeStatus(a.status),
    creditScore: Number(a.creditScore ?? 0),
    creditGrade: (['A', 'B', 'C', 'D', 'F'].includes(String(a.creditGrade))
      ? a.creditGrade
      : 'B') as ScreeningApplication['creditGrade'],
    annualIncome: Number(a.annualIncome ?? (a.monthlyIncome != null ? Number(a.monthlyIncome) * 12 : 0)),
    monthlyRent: Number(a.monthlyRent ?? a.proposedRent ?? a.requestedRent ?? a.rent ?? 0),
    rentToIncome: Number(a.rentToIncome ?? a.rentToIncomeRatio ?? 0),
    backgroundCheck: (['clear', 'flag', 'pending'].includes(String(a.backgroundCheck))
      ? a.backgroundCheck
      : 'pending') as ScreeningApplication['backgroundCheck'],
    evictionHistory: a.evictionHistory === true || Number(a.priorEvictions ?? 0) > 0,
    employmentStatus: (['verified', 'pending', 'unverified'].includes(String(a.employmentStatus))
      ? a.employmentStatus
      : a.incomeVerified === true
        ? 'verified'
        : 'pending') as ScreeningApplication['employmentStatus'],
    references: (['checked', 'pending', 'failed'].includes(String(a.references))
      ? a.references
      : 'pending') as ScreeningApplication['references'],
    notes: a.notes != null ? String(a.notes) : undefined,
  }));
}

export default function TenantScreeningScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [statusFilter, setStatusFilter] = useState<ScreeningStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: apiData } = useQuery({
    queryKey: ['terra-tenant-screening'],
    queryFn: async () => {
      try {
        return await apiFetch<unknown>('/api/terra/screening');
      } catch {
        return null;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const displayApplications: ScreeningApplication[] = mapApiToApplications(apiData) ?? APPLICATIONS;

  const filtered =
    statusFilter === 'all'
      ? displayApplications
      : displayApplications.filter((a) => a.status === statusFilter);

  const counts: Record<string, number> = displayApplications.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(200,121,65,0.07)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 100 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.cream} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: `${ACCENT}cc` }]}>DOMAINE · SCREENING</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Tenant Screening</Text>
        </View>
        <View
          style={[
            styles.pendingBadge,
            { backgroundColor: '#60a5fa' + '15', borderColor: '#60a5fa' + '40' },
          ]}
        >
          <Text style={[styles.pendingText, { color: '#60a5fa' }]}>
            {counts.pending ?? 0} pending
          </Text>
        </View>
      </View>

      <View style={styles.summaryStrip}>
        {[
          { label: 'Total', value: displayApplications.length, color: colors.cream },
          { label: 'Approved', value: counts.approved ?? 0, color: '#34d399' },
          {
            label: 'In Review',
            value: (counts['in-review'] ?? 0) + (counts.pending ?? 0),
            color: '#60a5fa',
          },
          {
            label: 'Action Needed',
            value: (counts['more-info'] ?? 0) + (counts.denied ?? 0),
            color: '#ef4444',
          },
        ].map((stat, i) => (
          <View key={i} style={styles.stripStat}>
            <Text style={[styles.stripValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.stripLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => {
              Haptics.selectionAsync();
              setStatusFilter(f.key);
            }}
            style={[
              styles.filterChip,
              {
                borderColor: statusFilter === f.key ? ACCENT : colors.border,
                backgroundColor: statusFilter === f.key ? `${ACCENT}15` : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: statusFilter === f.key ? ACCENT : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="users" size={28} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No applications in this category
            </Text>
          </View>
        ) : (
          filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              expanded={expandedId === app.id}
              onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  backBtn: { padding: 4, marginTop: 14 },
  eyebrow: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 3, marginBottom: 3 },
  title: { fontSize: 20, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
  },
  pendingText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  summaryStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 0,
  },
  stripStat: { flex: 1, alignItems: 'center' },
  stripValue: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  stripLabel: {
    fontSize: 9,
    fontFamily: 'Inter_300Light',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  filterRow: { paddingHorizontal: 16, gap: 6, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  appCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  appCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  statusIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  appName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  appSub: { fontSize: 10, fontFamily: 'Inter_300Light' },
  statusPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  statusPillText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  appDate: { fontSize: 9, fontFamily: 'Inter_300Light' },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreBlock: { flex: 1, alignItems: 'center' },
  scoreValue: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  scoreLabel: { fontSize: 9, fontFamily: 'Inter_300Light', letterSpacing: 0.5 },
  scoreDivider: { width: 1, height: 28 },
  expandedSection: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
  checkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  checkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  checkLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesText: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_300Light' },
});
