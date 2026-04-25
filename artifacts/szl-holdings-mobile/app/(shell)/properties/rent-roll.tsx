import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { apiFetch } from '@/lib/apiClient';

const ACCENT = '#c87941';

interface Lease {
  id: string;
  tenant: string;
  suite: string;
  sqft: number;
  monthlyRent: number;
  leaseEnd: string;
  status: 'active' | 'expiring' | 'month-to-month' | 'vacant';
  creditScore: 'A' | 'B' | 'C' | 'D';
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  markToMarketGap: number;
}

interface PropertyRentRoll {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  grossPotentialRent: number;
  effectiveGrossIncome: number;
  vacancyLoss: number;
  leases: Lease[];
}

const STATUS_COLORS: Record<string, string> = {
  active: '#34d399',
  expiring: '#fbbf24',
  'month-to-month': '#f97316',
  vacant: '#ef4444',
};

const CREDIT_COLORS: Record<string, string> = {
  A: '#34d399',
  B: '#60a5fa',
  C: '#fbbf24',
  D: '#ef4444',
};

const _PAYMENT_COLORS: Record<string, string> = {
  excellent: '#34d399',
  good: '#60a5fa',
  fair: '#fbbf24',
  poor: '#ef4444',
};

const PROPERTIES: PropertyRentRoll[] = [
  {
    id: 'rr-1',
    name: 'Gateway Commerce Center',
    address: '1200 Gateway Blvd, Dallas, TX',
    totalUnits: 12,
    occupiedUnits: 10,
    grossPotentialRent: 215000,
    effectiveGrossIncome: 186500,
    vacancyLoss: 28500,
    leases: [
      {
        id: 'l1',
        tenant: 'Meridian Technologies',
        suite: '100',
        sqft: 12500,
        monthlyRent: 31250,
        leaseEnd: 'Dec 2027',
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 14,
      },
      {
        id: 'l2',
        tenant: 'Apex Financial Group',
        suite: '200',
        sqft: 8200,
        monthlyRent: 22960,
        leaseEnd: 'May 2026',
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 2,
      },
      {
        id: 'l3',
        tenant: 'Vanguard Legal LLP',
        suite: '300',
        sqft: 6800,
        monthlyRent: 18360,
        leaseEnd: 'Feb 2026',
        status: 'expiring',
        creditScore: 'B',
        paymentHistory: 'good',
        markToMarketGap: 6,
      },
      {
        id: 'l4',
        tenant: 'BrightPath Health',
        suite: '400',
        sqft: 10500,
        monthlyRent: 23100,
        leaseEnd: 'Jun 2026',
        status: 'expiring',
        creditScore: 'B',
        paymentHistory: 'good',
        markToMarketGap: 30,
      },
      {
        id: 'l5',
        tenant: 'Cascade Marketing',
        suite: '500',
        sqft: 4200,
        monthlyRent: 10500,
        leaseEnd: 'Dec 2026',
        status: 'active',
        creditScore: 'B',
        paymentHistory: 'excellent',
        markToMarketGap: 14,
      },
      {
        id: 'l6',
        tenant: 'DataVault Systems',
        suite: '600',
        sqft: 9800,
        monthlyRent: 27440,
        leaseEnd: 'Aug 2028',
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 2,
      },
      {
        id: 'l7',
        tenant: 'Pinnacle Consulting',
        suite: '700',
        sqft: 3800,
        monthlyRent: 7600,
        leaseEnd: 'Dec 2025',
        status: 'expiring',
        creditScore: 'C',
        paymentHistory: 'fair',
        markToMarketGap: 43,
      },
      {
        id: 'l8',
        tenant: 'Vertex Engineering',
        suite: '800',
        sqft: 7200,
        monthlyRent: 19440,
        leaseEnd: 'Feb 2029',
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 6,
      },
    ],
  },
  {
    id: 'rr-2',
    name: 'Riverside Logistics Park',
    address: '4500 Riverside Dr, Atlanta, GA',
    totalUnits: 6,
    occupiedUnits: 5,
    grossPotentialRent: 140000,
    effectiveGrossIncome: 118000,
    vacancyLoss: 22000,
    leases: [
      {
        id: 'l9',
        tenant: 'Summit Logistics',
        suite: 'A',
        sqft: 22000,
        monthlyRent: 44000,
        leaseEnd: 'Mar 2028',
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 5,
      },
      {
        id: 'l10',
        tenant: 'Ironclad Freight',
        suite: 'B',
        sqft: 18500,
        monthlyRent: 37000,
        leaseEnd: 'Sep 2026',
        status: 'active',
        creditScore: 'B',
        paymentHistory: 'good',
        markToMarketGap: 8,
      },
      {
        id: 'l11',
        tenant: 'NorthStar Distribution',
        suite: 'C',
        sqft: 14000,
        monthlyRent: 21000,
        leaseEnd: 'Jun 2026',
        status: 'expiring',
        creditScore: 'C',
        paymentHistory: 'fair',
        markToMarketGap: 20,
      },
    ],
  },
];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(0)}K`
      : `$${n}`;

function SummaryCard({ property }: { property: PropertyRentRoll }) {
  const colors = useColors();
  const occupancyRate = Math.round((property.occupiedUnits / property.totalUnits) * 100);

  return (
    <View
      style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.summaryTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.propName, { color: colors.cream }]}>{property.name}</Text>
          <Text style={[styles.propAddress, { color: colors.mutedForeground }]}>
            {property.address}
          </Text>
        </View>
        <View
          style={[
            styles.occupancyBadge,
            { backgroundColor: '#34d399' + '15', borderColor: '#34d399' + '30' },
          ]}
        >
          <Text style={[styles.occupancyValue, { color: '#34d399' }]}>{occupancyRate}%</Text>
          <Text style={[styles.occupancyLabel, { color: '#34d399' + '80' }]}>OCC</Text>
        </View>
      </View>
      <View style={styles.summaryMetrics}>
        <View style={styles.metricBlock}>
          <Text style={[styles.metricVal, { color: colors.cream }]}>
            {fmt(property.effectiveGrossIncome)}
          </Text>
          <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>EGI / mo</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
        <View style={styles.metricBlock}>
          <Text style={[styles.metricVal, { color: '#fbbf24' }]}>{fmt(property.vacancyLoss)}</Text>
          <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>Vacancy Loss</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
        <View style={styles.metricBlock}>
          <Text style={[styles.metricVal, { color: colors.cream }]}>
            {property.occupiedUnits}/{property.totalUnits}
          </Text>
          <Text style={[styles.metricLbl, { color: colors.mutedForeground }]}>Units</Text>
        </View>
      </View>
    </View>
  );
}

function LeaseRow({ lease }: { lease: Lease }) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[lease.status] ?? '#888';
  const isExpiring = lease.status === 'expiring';

  return (
    <View
      style={[
        styles.leaseRow,
        {
          borderBottomColor: colors.border,
          backgroundColor: isExpiring ? '#fbbf24' + '05' : 'transparent',
        },
      ]}
    >
      <View style={[styles.leaseDot, { backgroundColor: statusColor }]} />
      <View style={styles.leaseTenantBlock}>
        <Text style={[styles.leaseTenant, { color: colors.cream }]} numberOfLines={1}>
          {lease.tenant}
        </Text>
        <Text style={[styles.leaseSuite, { color: colors.mutedForeground }]}>
          Suite {lease.suite} · {(lease.sqft / 1000).toFixed(1)}K sqft
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Text style={[styles.leaseRent, { color: colors.cream }]}>{fmt(lease.monthlyRent)}</Text>
        <Text style={[styles.leaseEnd, { color: isExpiring ? '#fbbf24' : colors.mutedForeground }]}>
          thru {lease.leaseEnd}
        </Text>
      </View>
      <View style={styles.creditBadge}>
        <Text style={[styles.creditText, { color: CREDIT_COLORS[lease.creditScore] }]}>
          {lease.creditScore}
        </Text>
      </View>
    </View>
  );
}

function mapApiToProperties(raw: unknown): PropertyRentRoll[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const list = (r.data as Record<string, unknown>)?.properties ?? r.properties;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((p: Record<string, unknown>, idx: number) => ({
    id: String(p.id ?? idx),
    name: String(p.name ?? p.propertyName ?? 'Unknown Property'),
    address: String(p.address ?? ''),
    totalUnits: Number(p.totalUnits ?? 0),
    occupiedUnits: Number(p.occupiedUnits ?? 0),
    grossPotentialRent: Number(p.grossPotentialRent ?? 0),
    effectiveGrossIncome: Number(p.effectiveGrossIncome ?? 0),
    vacancyLoss: Number(p.vacancyLoss ?? 0),
    leases: Array.isArray(p.leases)
      ? (p.leases as Record<string, unknown>[]).map((l, li) => ({
          id: String(l.id ?? li),
          tenant: String(l.tenant ?? l.tenantName ?? 'Tenant'),
          suite: String(l.suite ?? l.unit ?? '-'),
          sqft: Number(l.sqft ?? l.sqFt ?? 0),
          monthlyRent: Number(l.monthlyRent ?? l.rent ?? 0),
          leaseEnd: String(l.leaseEnd ?? l.expiryDate ?? ''),
          status: (['active', 'expiring', 'month-to-month', 'vacant'].includes(String(l.status))
            ? l.status
            : 'active') as Lease['status'],
          creditScore: (['A', 'B', 'C', 'D'].includes(String(l.creditScore))
            ? l.creditScore
            : 'B') as Lease['creditScore'],
          paymentHistory: (['excellent', 'good', 'fair', 'poor'].includes(String(l.paymentHistory))
            ? l.paymentHistory
            : 'good') as Lease['paymentHistory'],
          markToMarketGap: Number(l.markToMarketGap ?? 0),
        }))
      : [],
  }));
}

export default function RentRollScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: apiData } = useQuery({
    queryKey: ['terra-rent-roll'],
    queryFn: async () => {
      try {
        return await apiFetch<unknown>('/api/terra/rent-roll');
      } catch {
        return null;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const displayProperties: PropertyRentRoll[] = mapApiToProperties(apiData) ?? PROPERTIES;
  const [selectedProperty, setSelectedProperty] = useState<string>(displayProperties[0]?.id ?? PROPERTIES[0].id);

  const property = displayProperties.find((p) => p.id === selectedProperty) ?? displayProperties[0];
  const expiringCount = property.leases.filter((l) => l.status === 'expiring').length;

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
          <Text style={[styles.eyebrow, { color: `${ACCENT}cc` }]}>Terra · RENT ROLL</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Lease Ledger</Text>
        </View>
        {expiringCount > 0 && (
          <View
            style={[
              styles.alertBadge,
              { backgroundColor: '#fbbf24' + '15', borderColor: '#fbbf24' + '40' },
            ]}
          >
            <Feather name="alert-triangle" size={11} color="#fbbf24" />
            <Text style={[styles.alertText, { color: '#fbbf24' }]}>{expiringCount} expiring</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.propertyTabs}
      >
        {displayProperties.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedProperty(p.id);
            }}
            style={[
              styles.propertyTab,
              {
                borderColor: selectedProperty === p.id ? ACCENT : colors.border,
                backgroundColor: selectedProperty === p.id ? `${ACCENT}12` : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.propertyTabText,
                { color: selectedProperty === p.id ? ACCENT : colors.mutedForeground },
              ]}
            >
              {p.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
          <SummaryCard property={property} />
        </View>

        <View
          style={[
            styles.leaseHeader,
            { borderBottomColor: colors.border, borderTopColor: colors.border },
          ]}
        >
          <Text style={[styles.leaseHeaderText, { color: colors.mutedForeground }]}>TENANT</Text>
          <Text style={[styles.leaseHeaderText, { color: colors.mutedForeground }]}>
            RENT / EXPIRY
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {property.leases.map((lease) => (
            <LeaseRow key={lease.id} lease={lease} />
          ))}
        </View>

        <View style={[styles.legendRow, { borderTopColor: colors.border }]}>
          {Object.entries(STATUS_COLORS).map(([key, color]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{key}</Text>
            </View>
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
  propertyTabs: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  propertyTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  propertyTabText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  propName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  propAddress: { fontSize: 11, fontFamily: 'Inter_300Light' },
  occupancyBadge: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
    minWidth: 54,
  },
  occupancyValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  occupancyLabel: { fontSize: 8, fontFamily: 'Inter_500Medium', letterSpacing: 1 },
  summaryMetrics: { flexDirection: 'row', alignItems: 'center' },
  metricBlock: { flex: 1, alignItems: 'center' },
  metricVal: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  metricLbl: { fontSize: 9, fontFamily: 'Inter_300Light', letterSpacing: 0.5 },
  metricDivider: { width: 1, height: 30 },
  leaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  leaseHeaderText: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 2 },
  leaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  leaseDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  leaseTenantBlock: { flex: 1 },
  leaseTenant: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  leaseSuite: { fontSize: 10, fontFamily: 'Inter_300Light' },
  leaseRent: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  leaseEnd: { fontSize: 10, fontFamily: 'Inter_300Light' },
  creditBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  creditText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontSize: 10, fontFamily: 'Inter_300Light' },
});
