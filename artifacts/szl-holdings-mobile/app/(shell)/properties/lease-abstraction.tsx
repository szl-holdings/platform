import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? 'https://' + process.env.EXPO_PUBLIC_DOMAIN + '/api'
  : '/api';

const ACCENT = '#8b5cf6';

type ClauseCategory =
  | 'rent'
  | 'term'
  | 'option'
  | 'insurance'
  | 'use'
  | 'exclusivity'
  | 'termination';

interface LeaseClause {
  id: string;
  category: ClauseCategory;
  title: string;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  criticalDate?: string;
}

interface AbstractedLease {
  id: string;
  tenant: string;
  property: string;
  suite: string;
  executedDate: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  escalation: string;
  securityDeposit: number;
  aiConfidence: number;
  clauses: LeaseClause[];
}

const CATEGORY_ICONS: Record<ClauseCategory, React.ComponentProps<typeof Feather>['name']> = {
  rent: 'dollar-sign',
  term: 'calendar',
  option: 'refresh-cw',
  insurance: 'shield',
  use: 'home',
  exclusivity: 'lock',
  termination: 'x-circle',
};

const RISK_COLORS = { low: '#34d399', medium: '#fbbf24', high: '#ef4444' };

const LEASES: AbstractedLease[] = [
  {
    id: 'la-1',
    tenant: 'Meridian Technologies',
    property: 'Gateway Commerce Center',
    suite: 'Suite 100',
    executedDate: 'Dec 20, 2021',
    leaseStart: 'Jan 1, 2022',
    leaseEnd: 'Dec 31, 2027',
    monthlyRent: 31250,
    escalation: '3% annual',
    securityDeposit: 62500,
    aiConfidence: 97,
    clauses: [
      {
        id: 'c1',
        category: 'rent',
        title: 'Base Rent & Escalation',
        summary:
          'Base rent $31,250/mo with 3% annual escalation on Jan 1 each year. First escalation Jan 2023.',
        riskLevel: 'low',
      },
      {
        id: 'c2',
        category: 'option',
        title: 'Renewal Option',
        summary:
          'Two 3-year renewal options at 95% of prevailing market rate. Tenant must exercise 9 months prior to expiry.',
        riskLevel: 'low',
        criticalDate: 'Mar 31, 2027',
      },
      {
        id: 'c3',
        category: 'termination',
        title: 'Early Termination',
        summary:
          'Tenant may terminate after Year 4 with 6 months notice and a termination fee equal to 4 months unamortized TI allowance.',
        riskLevel: 'medium',
        criticalDate: 'Jan 1, 2026',
      },
      {
        id: 'c4',
        category: 'insurance',
        title: 'Insurance Requirements',
        summary:
          'General liability $2M per occurrence / $4M aggregate. Landlord named as additional insured. Certificates due annually.',
        riskLevel: 'low',
      },
      {
        id: 'c5',
        category: 'exclusivity',
        title: 'Exclusivity Clause',
        summary:
          'Landlord may not lease to direct competitors in SaaS infrastructure sector within the building for lease term.',
        riskLevel: 'medium',
      },
      {
        id: 'c6',
        category: 'use',
        title: 'Permitted Use',
        summary:
          'Technology company operations, software development, and ancillary office use only.',
        riskLevel: 'low',
      },
    ],
  },
  {
    id: 'la-2',
    tenant: 'BrightPath Health',
    property: 'Gateway Commerce Center',
    suite: 'Suite 400',
    executedDate: 'Jun 14, 2019',
    leaseStart: 'Jul 1, 2019',
    leaseEnd: 'Jun 30, 2026',
    monthlyRent: 23100,
    escalation: '2% annual',
    securityDeposit: 46200,
    aiConfidence: 91,
    clauses: [
      {
        id: 'c7',
        category: 'rent',
        title: 'Base Rent',
        summary:
          'Base rent $23,100/mo escalating 2% annually. Current rent below market — 30% mark-to-market gap identified.',
        riskLevel: 'high',
      },
      {
        id: 'c8',
        category: 'term',
        title: 'Lease Expiry',
        summary:
          'Lease expires Jun 30, 2026. No renewal option. Tenant has indicated intent to downsize.',
        riskLevel: 'high',
        criticalDate: 'Jun 30, 2026',
      },
      {
        id: 'c9',
        category: 'option',
        title: 'ROFO',
        summary:
          'Tenant has right of first offer on any adjacent space that becomes available during lease term.',
        riskLevel: 'medium',
      },
    ],
  },
];

const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`);

function ClauseCard({ clause }: { clause: LeaseClause }) {
  const colors = useColors();
  const riskColor = RISK_COLORS[clause.riskLevel];
  const icon = CATEGORY_ICONS[clause.category];

  return (
    <View
      style={[styles.clauseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.clauseTop}>
        <View
          style={[
            styles.clauseIcon,
            { backgroundColor: ACCENT + '15', borderColor: ACCENT + '25' },
          ]}
        >
          <Feather name={icon} size={12} color={ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.clauseTitle, { color: colors.cream }]}>{clause.title}</Text>
          <View style={[styles.riskPill, { backgroundColor: riskColor + '15' }]}>
            <Text style={[styles.riskText, { color: riskColor }]}>{clause.riskLevel} risk</Text>
          </View>
        </View>
        {clause.criticalDate && (
          <View
            style={[
              styles.datePill,
              { backgroundColor: '#fbbf24' + '15', borderColor: '#fbbf24' + '30' },
            ]}
          >
            <Feather name="calendar" size={9} color="#fbbf24" />
            <Text style={[styles.dateText, { color: '#fbbf24' }]}>{clause.criticalDate}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.clauseSummary, { color: colors.mutedForeground }]}>
        {clause.summary}
      </Text>
    </View>
  );
}

export default function LeaseAbstractionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [selectedId, setSelectedId] = useState<string>(LEASES[0].id);

  useQuery({
    queryKey: ['terra-lease-abstraction'],
    queryFn: async () => {
      try {
        const res = await fetch(API_BASE + '/terra/lease-abstraction');
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    retry: 1,
  });

  const lease = LEASES.find((l) => l.id === selectedId) ?? LEASES[0];
  const highRiskCount = lease.clauses.filter((c) => c.riskLevel === 'high').length;
  const criticalDates = lease.clauses.filter((c) => c.criticalDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(139,92,246,0.07)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 100 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.cream} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: ACCENT + 'cc' }]}>TERRA · AI</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Lease Abstraction</Text>
        </View>
        {highRiskCount > 0 && (
          <View
            style={[
              styles.alertBadge,
              { backgroundColor: '#ef4444' + '15', borderColor: '#ef4444' + '40' },
            ]}
          >
            <Feather name="alert-triangle" size={11} color="#ef4444" />
            <Text style={[styles.alertText, { color: '#ef4444' }]}>{highRiskCount} high risk</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.leaseTabs}
      >
        {LEASES.map((l) => (
          <Pressable
            key={l.id}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedId(l.id);
            }}
            style={[
              styles.leaseTab,
              {
                borderColor: selectedId === l.id ? ACCENT : colors.border,
                backgroundColor: selectedId === l.id ? ACCENT + '12' : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.leaseTabText,
                { color: selectedId === l.id ? ACCENT : colors.mutedForeground },
              ]}
            >
              {l.tenant}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
          <View
            style={[
              styles.leaseCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.leaseCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.leaseTenant, { color: colors.cream }]}>{lease.tenant}</Text>
                <Text style={[styles.leaseProp, { color: colors.mutedForeground }]}>
                  {lease.property} · {lease.suite}
                </Text>
              </View>
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: '#34d399' + '15', borderColor: '#34d399' + '30' },
                ]}
              >
                <Feather name="cpu" size={10} color="#34d399" />
                <Text style={[styles.confidenceText, { color: '#34d399' }]}>
                  {lease.aiConfidence}% AI
                </Text>
              </View>
            </View>
            <View style={styles.leaseMetrics}>
              <View style={styles.leaseMet}>
                <Text style={[styles.leaseMetVal, { color: colors.cream }]}>
                  {fmt(lease.monthlyRent)}
                </Text>
                <Text style={[styles.leaseMetLbl, { color: colors.mutedForeground }]}>Rent/mo</Text>
              </View>
              <View style={[styles.metDivider, { backgroundColor: colors.border }]} />
              <View style={styles.leaseMet}>
                <Text style={[styles.leaseMetVal, { color: colors.cream }]}>{lease.leaseEnd}</Text>
                <Text style={[styles.leaseMetLbl, { color: colors.mutedForeground }]}>Expiry</Text>
              </View>
              <View style={[styles.metDivider, { backgroundColor: colors.border }]} />
              <View style={styles.leaseMet}>
                <Text style={[styles.leaseMetVal, { color: colors.cream }]}>
                  {lease.escalation}
                </Text>
                <Text style={[styles.leaseMetLbl, { color: colors.mutedForeground }]}>
                  Escalation
                </Text>
              </View>
            </View>
            {criticalDates.length > 0 && (
              <View
                style={[
                  styles.criticalBox,
                  { backgroundColor: '#fbbf24' + '08', borderColor: '#fbbf24' + '20' },
                ]}
              >
                <Feather name="clock" size={11} color="#fbbf24" />
                <Text style={[styles.criticalText, { color: '#fbbf24' }]}>
                  {criticalDates.length} critical date{criticalDates.length !== 1 ? 's' : ''}{' '}
                  require action
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.sectionLabel, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionLabelText, { color: colors.mutedForeground }]}>
            EXTRACTED CLAUSES · {lease.clauses.length}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 8, paddingTop: 12 }}>
          {lease.clauses.map((clause) => (
            <ClauseCard key={clause.id} clause={clause} />
          ))}
        </View>
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
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
  },
  alertText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  leaseTabs: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  leaseTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  leaseTabText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  leaseCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  leaseCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  leaseTenant: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  leaseProp: { fontSize: 11, fontFamily: 'Inter_300Light' },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  confidenceText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  leaseMetrics: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  leaseMet: { flex: 1, alignItems: 'center' },
  leaseMetVal: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  leaseMetLbl: { fontSize: 9, fontFamily: 'Inter_300Light', letterSpacing: 0.5 },
  metDivider: { width: 1, height: 26 },
  criticalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  criticalText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  sectionLabel: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1 },
  sectionLabelText: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 2 },
  clauseCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  clauseTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  clauseIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  clauseTitle: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  riskPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  riskText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  dateText: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  clauseSummary: { fontSize: 11, fontFamily: 'Inter_300Light', lineHeight: 16 },
});
