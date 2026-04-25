import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  type DimensionValue,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : '/api';

const ACCENT = '#ef4444';

interface TaxAppeal {
  id: string;
  property: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  taxYear: number;
  annualTaxBill: number;
  potentialSavings: number;
  appealStatus: 'not-filed' | 'filed' | 'in-hearing' | 'won' | 'lost' | 'settled';
  filingDeadline?: string;
  hearingDate?: string;
  comparables: { address: string; assessedValue: number; sqft: number }[];
}

const STATUS_COLORS: Record<TaxAppeal['appealStatus'], string> = {
  'not-filed': '#60a5fa',
  filed: '#fbbf24',
  'in-hearing': ACCENT,
  won: '#34d399',
  lost: 'rgba(255,255,255,0.3)',
  settled: '#a855f7',
};

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(0)}K`
      : `$${n}`;

const APPEALS: TaxAppeal[] = [
  {
    id: 'ta-1',
    property: 'Gateway Commerce Center',
    address: '1200 Gateway Blvd, Dallas, TX',
    assessedValue: 14_200_000,
    marketValue: 11_400_000,
    taxYear: 2026,
    annualTaxBill: 284_000,
    potentialSavings: 56_000,
    appealStatus: 'in-hearing',
    hearingDate: 'May 8, 2026',
    comparables: [
      { address: '1400 Commerce Blvd, Dallas, TX', assessedValue: 9_800_000, sqft: 72000 },
      { address: '900 Industrial Dr, Dallas, TX', assessedValue: 10_200_000, sqft: 81000 },
      { address: '2100 Gateway Ave, Dallas, TX', assessedValue: 11_000_000, sqft: 86000 },
    ],
  },
  {
    id: 'ta-2',
    property: 'Riverside Logistics Park',
    address: '4500 Riverside Dr, Atlanta, GA',
    assessedValue: 8_600_000,
    marketValue: 7_900_000,
    taxYear: 2026,
    annualTaxBill: 172_000,
    potentialSavings: 14_000,
    appealStatus: 'filed',
    filingDeadline: 'Jun 1, 2026',
    comparables: [
      { address: '3800 Logistics Way, Atlanta, GA', assessedValue: 7_100_000, sqft: 90000 },
      { address: '5200 Port Rd, Atlanta, GA', assessedValue: 8_200_000, sqft: 108000 },
    ],
  },
];

function Gauge({ assessed, market }: { assessed: number; market: number }) {
  const colors = useColors();
  const pct = Math.min(Math.round((market / assessed) * 100), 100);
  const overPct = 100 - pct;
  return (
    <View style={{ gap: 4 }}>
      <View style={gaugeStyles.track}>
        <View
          style={[
            gaugeStyles.fill,
            { width: `${pct}%` as DimensionValue, backgroundColor: '#34d399' },
          ]}
        />
        <View
          style={[
            gaugeStyles.over,
            { width: `${overPct}%` as DimensionValue, backgroundColor: `${ACCENT}60` },
          ]}
        />
      </View>
      <View style={gaugeStyles.legend}>
        <View style={gaugeStyles.legendItem}>
          <View style={[gaugeStyles.dot, { backgroundColor: '#34d399' }]} />
          <Text style={[gaugeStyles.legendText, { color: colors.mutedForeground }]}>
            Market {fmt(market)}
          </Text>
        </View>
        <View style={gaugeStyles.legendItem}>
          <View style={[gaugeStyles.dot, { backgroundColor: ACCENT }]} />
          <Text style={[gaugeStyles.legendText, { color: colors.mutedForeground }]}>
            Over-assessed {fmt(assessed - market)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fill: { height: 8 },
  over: { height: 8 },
  legend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, fontFamily: 'Inter_300Light' },
});

export default function TaxAppealScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useQuery({
    queryKey: ['terra-tax-appeal'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/terra/tax-appeal`);
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    retry: 1,
  });

  const totalSavings = APPEALS.reduce((s, a) => s + a.potentialSavings, 0);
  const activeAppeals = APPEALS.filter(
    (a) => a.appealStatus === 'in-hearing' || a.appealStatus === 'filed',
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(239,68,68,0.07)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 100 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.cream} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: `${ACCENT}cc` }]}>Terra · TAX</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Tax Appeal</Text>
        </View>
      </View>

      <View style={styles.summaryStrip}>
        {[
          { label: 'Total Savings Target', value: fmt(totalSavings), color: '#34d399' },
          { label: 'Active Appeals', value: String(activeAppeals), color: ACCENT },
          { label: 'Properties', value: String(APPEALS.length), color: colors.cream },
        ].map((s, i) => (
          <View key={i} style={styles.stripStat}>
            <Text style={[styles.stripVal, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.stripLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {APPEALS.map((appeal) => {
          const statusColor = STATUS_COLORS[appeal.appealStatus];
          return (
            <View
              key={appeal.id}
              style={[
                styles.appealCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.appealTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.appealProp, { color: colors.cream }]}>
                    {appeal.property}
                  </Text>
                  <Text style={[styles.appealAddr, { color: colors.mutedForeground }]}>
                    {appeal.address}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` },
                  ]}
                >
                  <Text style={[styles.statusPillText, { color: statusColor }]}>
                    {appeal.appealStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.appealMetrics}>
                <View style={styles.appealmMet}>
                  <Text style={[styles.appealMetVal, { color: ACCENT }]}>
                    {fmt(appeal.assessedValue)}
                  </Text>
                  <Text style={[styles.appealMetLbl, { color: colors.mutedForeground }]}>
                    Assessed
                  </Text>
                </View>
                <View style={styles.appealmMet}>
                  <Text style={[styles.appealMetVal, { color: '#34d399' }]}>
                    {fmt(appeal.marketValue)}
                  </Text>
                  <Text style={[styles.appealMetLbl, { color: colors.mutedForeground }]}>
                    Market
                  </Text>
                </View>
                <View style={styles.appealmMet}>
                  <Text style={[styles.appealMetVal, { color: '#34d399' }]}>
                    {fmt(appeal.potentialSavings)}
                  </Text>
                  <Text style={[styles.appealMetLbl, { color: colors.mutedForeground }]}>
                    Savings/yr
                  </Text>
                </View>
              </View>

              <View style={{ marginVertical: 10 }}>
                <Gauge assessed={appeal.assessedValue} market={appeal.marketValue} />
              </View>

              {appeal.hearingDate && (
                <View style={[styles.dateRow, { borderTopColor: colors.border }]}>
                  <Feather name="calendar" size={11} color="#fbbf24" />
                  <Text style={[styles.dateRowText, { color: '#fbbf24' }]}>
                    Hearing: {appeal.hearingDate}
                  </Text>
                </View>
              )}
              {appeal.filingDeadline && (
                <View style={[styles.dateRow, { borderTopColor: colors.border }]}>
                  <Feather name="clock" size={11} color="#60a5fa" />
                  <Text style={[styles.dateRowText, { color: '#60a5fa' }]}>
                    Filing deadline: {appeal.filingDeadline}
                  </Text>
                </View>
              )}

              <View style={[styles.compsSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.compsLabel, { color: colors.mutedForeground }]}>
                  COMPARABLES · {appeal.comparables.length}
                </Text>
                {appeal.comparables.map((comp, i) => (
                  <View key={i} style={styles.compRow}>
                    <Feather name="home" size={10} color={colors.mutedForeground} />
                    <Text
                      style={[styles.compAddress, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {comp.address}
                    </Text>
                    <Text style={[styles.compVal, { color: colors.cream }]}>
                      {fmt(comp.assessedValue)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
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
  summaryStrip: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, gap: 0 },
  stripStat: { flex: 1, alignItems: 'center' },
  stripVal: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  stripLbl: { fontSize: 8, fontFamily: 'Inter_300Light', letterSpacing: 0.3, textAlign: 'center' },
  appealCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  appealTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  appealProp: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  appealAddr: { fontSize: 10, fontFamily: 'Inter_300Light' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusPillText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  appealMetrics: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  appealmMet: { flex: 1, alignItems: 'center' },
  appealMetVal: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  appealMetLbl: { fontSize: 9, fontFamily: 'Inter_300Light', letterSpacing: 0.5 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  dateRowText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  compsSection: { borderTopWidth: 1, paddingTop: 10, marginTop: 8, gap: 6 },
  compsLabel: { fontSize: 8, fontFamily: 'Inter_500Medium', letterSpacing: 2, marginBottom: 6 },
  compRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compAddress: { flex: 1, fontSize: 10, fontFamily: 'Inter_300Light' },
  compVal: { fontSize: 11, fontFamily: 'Inter_500Medium' },
});
