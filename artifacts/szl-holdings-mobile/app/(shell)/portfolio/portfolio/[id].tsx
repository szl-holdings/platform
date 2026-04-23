import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const OPS_ROWS: Array<{ label: string; key: 'launchDate' | 'team'; icon: FeatherIconName }> = [
  { label: 'Launch Date', key: 'launchDate', icon: 'calendar' },
  { label: 'Team Size', key: 'team', icon: 'users' },
];

const VENTURES: Record<
  string,
  {
    id: string;
    name: string;
    subtitle: string;
    accentColor: string;
    status: string;
    kpi: string;
    market: string;
    arr: string;
    metrics: Array<{ label: string; value: string }>;
    trend: number[];
    strategicNotes: string;
    description: string;
    launchDate: string;
    team: string;
    nextMilestone: string;
    nextMilestoneDate: string;
  }
> = {
  aegis: {
    id: 'aegis',
    name: 'PARAGON',
    subtitle: 'Defense & Intelligence Command',
    accentColor: '#6366f1',
    status: 'live',
    kpi: '$25M+ ARR',
    arr: '$25M+',
    market: '$266B TAM',
    metrics: [
      { label: 'Simulations/Month', value: '31,200+' },
      { label: 'ATT&CK Techniques', value: '200+' },
      { label: 'Enterprise Clients', value: '3' },
      { label: 'Avg Response Time', value: '< 2 min' },
      { label: 'Data Feeds', value: '40+' },
      { label: 'AI Models Active', value: '12' },
    ],
    trend: [62, 68, 71, 73, 75, 78, 80],
    strategicNotes:
      'Flagship enterprise security platform. FedRAMP certification targeted Q3 2026. Federal sector expansion underway.',
    description:
      'PARAGON is a unified defense and intelligence command platform purpose-built for organizations where a single breach can be existential. Real-time threat intelligence, AI-simulated adversary campaigns, and NATO-aligned targeting workflows in a single operator interface.',
    launchDate: 'January 2024',
    team: '12 engineers, 3 intelligence analysts',
    nextMilestone: 'FedRAMP Authorization',
    nextMilestoneDate: 'Q3 2026',
  },
  vessels: {
    id: 'vessels',
    name: 'SEXTANT',
    subtitle: 'Maritime Intelligence',
    accentColor: '#3b82f6',
    status: 'live',
    kpi: '$8.2M ARR',
    arr: '$8.2M',
    market: '$15.4B TAM',
    metrics: [
      { label: 'SEXTANT Monitored', value: '52,000+' },
      { label: 'Shipping Lanes', value: '340+' },
      { label: 'Dark Vessel Lead Time', value: '34 days' },
      { label: 'Port Congestion Alerts', value: 'Real-time' },
      { label: 'AIS Predictions', value: '> 96%' },
      { label: 'Commodity Feeds', value: '18' },
    ],
    trend: [50, 55, 58, 63, 68, 72, 75],
    strategicNotes:
      'Maritime domain awareness for commodity traders and compliance teams. Climate routing overlay coming Q3 2026.',
    description:
      'SEXTANT delivers maritime intelligence for commodity traders, compliance teams, and defense logistics. Dark vessel detection, port congestion forecasting, and AIS prediction with a 34-day lead time advantage over competitors.',
    launchDate: 'September 2023',
    team: '8 engineers, 2 domain experts',
    nextMilestone: 'Climate Routing Overlay',
    nextMilestoneDate: 'Q3 2026',
  },
  terra: {
    id: 'terra',
    name: 'DOMAINE',
    subtitle: 'Real Estate Intelligence',
    accentColor: '#4d7c0f',
    status: 'live',
    kpi: '$3.1M ARR',
    arr: '$3.1M',
    market: '$29B TAM',
    metrics: [
      { label: 'Enterprise Clients', value: '34' },
      { label: 'Assets Under Analysis', value: '$4.2B+' },
      { label: 'Distress Properties', value: 'Live tracker' },
      { label: 'Price Accuracy', value: '±2.1%' },
      { label: 'Data Sources', value: '200+' },
      { label: 'Coverage', value: 'NYC → National' },
    ],
    trend: [30, 38, 44, 52, 58, 63, 70],
    strategicNotes:
      'NYC beachhead for distress property intelligence. Expanding to national coverage. API launch Q4 2026.',
    description:
      'DOMAINE delivers real estate intelligence for institutional investors and operators in NYC and beyond. Distress property tracking, portfolio risk analysis, and hyperlocal pricing signals with two-percentage-point accuracy.',
    launchDate: 'March 2024',
    team: '6 engineers, 1 real estate analyst',
    nextMilestone: 'National Coverage Expansion',
    nextMilestoneDate: 'Q4 2026',
  },
  lyte: {
    id: 'lyte',
    name: 'KORA',
    subtitle: 'Business Observability',
    accentColor: '#f59e0b',
    status: 'live',
    kpi: '$4.2M ARR',
    arr: '$4.2M',
    market: '$1.8T TAM',
    metrics: [
      { label: 'Signal Detection', value: '< 4 min' },
      { label: 'Signals/Day', value: '2.4M+' },
      { label: 'Playbooks', value: '120+' },
      { label: 'Avg MTTR', value: '63 min' },
      { label: 'Integrations', value: '85+' },
      { label: 'AI Anomaly Models', value: 'Predictive' },
    ],
    trend: [40, 48, 52, 58, 62, 67, 72],
    strategicNotes:
      'Core observability layer for the SZL ecosystem. AI-native anomaly forecast launching Q2 2026.',
    description:
      'KORA is the SZL execution nervous system — business observability that detects signals in under 4 minutes across commerce, infrastructure, and human behavior. AI-native anomaly forecasting identifies what will fail before it does.',
    launchDate: 'June 2023',
    team: '10 engineers, 2 data scientists',
    nextMilestone: 'AI Anomaly Forecast GA',
    nextMilestoneDate: 'Q2 2026',
  },
  alloy: {
    id: 'alloy',
    name: 'FORGE',
    subtitle: 'Execution Fabric',
    accentColor: '#8b5cf6',
    status: 'live',
    kpi: '$5.1M ARR (embedded)',
    arr: '$5.1M',
    market: '$14.8B TAM',
    metrics: [
      { label: 'Automations/Day', value: '48K+' },
      { label: 'Avg Execution Latency', value: '< 200ms' },
      { label: 'Prediction Models', value: '12,400+' },
      { label: 'Approval Workflows', value: 'Active' },
      { label: 'Success Rate', value: '> 99.2%' },
      { label: 'External Integrations', value: '60+' },
    ],
    trend: [45, 52, 58, 64, 70, 74, 79],
    strategicNotes:
      'The backbone of the SZL platform stack. Scenario Model Library public launch Q2 2026.',
    description:
      'FORGE is the execution fabric that powers every automation, prediction, and approval workflow across the SZL platform. Sub-200ms latency, 12,400+ scenario models, and a human-in-the-loop approval layer trusted by enterprise operators.',
    launchDate: 'November 2022',
    team: '14 engineers, 1 ML researcher',
    nextMilestone: 'Scenario Model Library Launch',
    nextMilestoneDate: 'Q2 2026',
  },
  'carlota-jo': {
    id: 'carlota-jo',
    name: 'Carlota Jo',
    subtitle: 'Private Advisory',
    accentColor: '#f472b6',
    status: 'beta',
    kpi: 'Private Alpha',
    arr: 'Invite-only',
    market: '$8.4B TAM',
    metrics: [
      { label: 'Retention Rate', value: '100%' },
      { label: 'Active Clients', value: '8' },
      { label: 'Avg Response SLA', value: '< 2h' },
      { label: 'Concierge Hours', value: '24/7' },
      { label: 'Task Categories', value: '14+' },
      { label: 'Client NPS', value: '72' },
    ],
    trend: [60, 65, 68, 72, 76, 80, 85],
    strategicNotes:
      'White-glove lifestyle management for UHNW principals. Family office partnership program expanding Q2 2026.',
    description:
      'Carlota Jo is a private advisory and lifestyle management platform for ultra-high-net-worth principals. AI-powered with human expert oversight — zero-latency tasks meet impeccable judgment and discretion.',
    launchDate: 'October 2024',
    team: '4 engineers, 6 advisory specialists',
    nextMilestone: 'Family Office Partnership Program',
    nextMilestoneDate: 'Q2 2026',
  },
};

export default function VentureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const venture = VENTURES[id ?? ''];
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (!venture) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.notFound, { paddingTop: topPad + 20 }]}>
          <Text style={[styles.notFoundText, { color: colors.cream }]}>Venture not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.gold }]}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[`${venture.accentColor}10`, 'transparent']}
        style={[styles.headerGradient, { height: topPad + 200 }]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 12, paddingBottom: 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
        >
          <Feather name="arrow-left" size={20} color={colors.creamDim} />
          <Text style={[styles.backBtnText, { color: colors.creamDim }]}>Portfolio</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.nameRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: venture.status === 'live' ? '#10b981' : '#f59e0b',
                },
              ]}
            />
            <Text style={[styles.ventureName, { color: colors.cream }]}>{venture.name}</Text>
          </View>
          <Text style={[styles.ventureSubtitle, { color: colors.mutedForeground }]}>
            {venture.subtitle}
          </Text>
          <Text style={[styles.ventureDescription, { color: colors.creamDim }]}>
            {venture.description}
          </Text>
        </View>

        <View style={styles.heroStats}>
          {[
            { label: 'ARR', value: venture.arr, color: colors.gold },
            { label: 'Market', value: venture.market, color: venture.accentColor },
            {
              label: 'Status',
              value: venture.status.toUpperCase(),
              color: venture.status === 'live' ? '#10b981' : '#f59e0b',
            },
          ].map((s) => (
            <View
              key={s.label}
              style={[
                styles.heroStat,
                { backgroundColor: colors.card, borderColor: colors.borderSubtle },
              ]}
            >
              <Text style={[styles.heroStatValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>KEY METRICS</Text>
          <View style={styles.metricsGrid}>
            {venture.metrics.map((m) => (
              <View
                key={m.label}
                style={[
                  styles.metricCard,
                  { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.metricValue, { color: venture.accentColor }]}>{m.value}</Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {m.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>OPERATIONS</Text>
          <View style={[styles.opsList, { borderColor: colors.borderSubtle }]}>
            {OPS_ROWS.map((row, i) => (
              <View
                key={row.label}
                style={[
                  styles.opsRow,
                  {
                    borderBottomColor: colors.borderSubtle,
                    borderBottomWidth: i < OPS_ROWS.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <Feather name={row.icon} size={13} color={colors.goldSubtle} />
                <Text style={[styles.opsLabel, { color: colors.mutedForeground }]}>
                  {row.label}
                </Text>
                <Text style={[styles.opsValue, { color: colors.cream }]}>{venture[row.key]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>STRATEGIC NOTES</Text>
          <View
            style={[
              styles.notesCard,
              {
                backgroundColor: colors.card,
                borderColor: `${venture.accentColor}20`,
              },
            ]}
          >
            <Text style={[styles.notesText, { color: colors.creamDim }]}>
              {venture.strategicNotes}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: colors.goldSubtle }]}>NEXT MILESTONE</Text>
          <View
            style={[
              styles.milestoneCard,
              {
                backgroundColor: colors.card,
                borderColor: `${venture.accentColor}25`,
              },
            ]}
          >
            <View style={[styles.milestoneDot, { backgroundColor: venture.accentColor }]} />
            <View style={styles.milestoneContent}>
              <Text style={[styles.milestoneTitle, { color: colors.cream }]}>
                {venture.nextMilestone}
              </Text>
              <Text style={[styles.milestoneDate, { color: venture.accentColor }]}>
                Target: {venture.nextMilestoneDate}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  header: { marginBottom: 20, gap: 8 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ventureName: {
    fontSize: 28,
    fontFamily: 'Inter_300Light',
  },
  ventureSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_300Light',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ventureDescription: {
    fontSize: 14,
    fontFamily: 'Inter_300Light',
    lineHeight: 22,
    marginTop: 4,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  heroStat: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  heroStatValue: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  heroStatLabel: {
    fontSize: 8,
    fontFamily: 'Inter_300Light',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 3,
    marginBottom: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 3,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: 'Inter_300Light',
    letterSpacing: 0.3,
  },
  opsList: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  opsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  opsLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_300Light',
  },
  opsValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    maxWidth: '60%',
  },
  notesCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  notesText: {
    fontSize: 13,
    fontFamily: 'Inter_300Light',
    lineHeight: 21,
  },
  milestoneCard: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  milestoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  milestoneContent: { flex: 1, gap: 3 },
  milestoneTitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  milestoneDate: {
    fontSize: 11,
    fontFamily: 'Inter_300Light',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  backText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
