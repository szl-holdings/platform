import { Feather } from '@expo/vector-icons';
import { getProduct } from '@szl-holdings/brand-registry/mobile';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const _ACCENT = '#6366f1';
const BG = '#0a0a0a';
const BORDER = 'rgba(255,255,255,0.06)';
const TEXT = '#e8e8f0';
const TEXT_DIM = 'rgba(255,255,255,0.45)';

const VENTURES = [
  {
    slug: 'vessels',
    name: getProduct('vessels')?.name ?? 'SEXTANT',
    tagline: getProduct('vessels')?.tagline ?? 'Maritime Intelligence',
    description:
      'AIS fleet tracking, voyage economics, and sanctions screening covering global shipping routes.',
    url: 'https://vessels.szlholdings.com',
    color: '#3b82f6',
    metrics: [
      { label: 'Vessels tracked', value: '50K+' },
      { label: 'Data pts/day', value: '2M+' },
      { label: 'Coverage', value: 'Global' },
    ],
  },
  {
    slug: 'aegis',
    name: getProduct('aegis')?.name ?? 'PARAGON',
    tagline: getProduct('aegis')?.tagline ?? 'Defense & Intelligence',
    description:
      'Unified cybersecurity command converging SOC operations, threat intel, and MSP management.',
    url: 'https://aegis.szlholdings.com',
    color: '#6366f1',
    metrics: [
      { label: 'Threat vectors', value: '100+' },
      { label: 'Framework', value: 'MITRE' },
      { label: 'Response', value: '<1 min' },
    ],
  },
  {
    slug: 'terra',
    name: getProduct('terra')?.name ?? 'DOMAINE',
    tagline: getProduct('terra')?.tagline ?? 'Real Estate Intelligence',
    description:
      'Distress-first real estate platform covering all five NYC boroughs with multi-factor scoring.',
    url: 'https://terra.szlholdings.com',
    color: '#10b981',
    metrics: [
      { label: 'Properties', value: '500K+' },
      { label: 'Coverage', value: '5 Boroughs' },
      { label: 'Data sources', value: '12+' },
    ],
  },
  {
    slug: 'lyte',
    name: getProduct('lyte')?.name ?? 'KORA',
    tagline: getProduct('lyte')?.tagline ?? 'Business Observability',
    description:
      'AI ops dashboard with multi-model routing, cross-portfolio signal aggregation, and observability.',
    url: 'https://lyte.szlholdings.com',
    color: '#06b6d4',
    metrics: [
      { label: 'AI models', value: '6+' },
      { label: 'Signals/hr', value: '10K+' },
      { label: 'Latency', value: '<100ms' },
    ],
  },
  {
    slug: 'carlota-jo',
    name: getProduct('carlota-jo')?.name ?? 'Carlota Jo',
    tagline: getProduct('carlota-jo')?.tagline ?? 'Private Advisory',
    description:
      'Strategic advisory platform for high-net-worth clients with secure communication and portal.',
    url: 'https://carlota-jo.szlholdings.com',
    color: '#f59e0b',
    metrics: [
      { label: 'Client portal', value: 'Secure' },
      { label: 'Engagement', value: '360°' },
      { label: 'Advisors', value: 'Dedicated' },
    ],
  },
  {
    slug: 'szl-holdings',
    name: 'SZL Holdings',
    tagline: 'Parent Company',
    description:
      'Holding company with shared infrastructure, authentication, and execution fabric powering all platforms.',
    url: 'https://szlholdings.com',
    color: '#c4a97e',
    metrics: [
      { label: 'Platforms', value: '6' },
      { label: 'Founded', value: '2023' },
      { label: 'LOC', value: '150k+' },
    ],
  },
];

export default function VenturesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99,102,241,0.08)', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ventures</Text>
        <Text style={styles.headerSub}>Six platforms. One architecture.</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {VENTURES.map((v) => {
          const isExpanded = expanded === v.slug;
          return (
            <TouchableOpacity
              key={v.slug}
              activeOpacity={0.85}
              style={[styles.card, { borderColor: `${v.color}25` }]}
              onPress={() => setExpanded(isExpanded ? null : v.slug)}
            >
              <View style={styles.cardTop}>
                <View style={[styles.dot, { backgroundColor: v.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{v.name}</Text>
                  <Text style={[styles.cardTagline, { color: v.color }]}>{v.tagline}</Text>
                </View>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={TEXT_DIM}
                />
              </View>
              {isExpanded && (
                <View style={styles.cardBody}>
                  <Text style={styles.cardDesc}>{v.description}</Text>
                  <View style={styles.metricsRow}>
                    {v.metrics.map((m) => (
                      <View
                        key={m.label}
                        style={[
                          styles.metricChip,
                          { borderColor: `${v.color}30`, backgroundColor: `${v.color}0a` },
                        ]}
                      >
                        <Text style={[styles.metricValue, { color: v.color }]}>{m.value}</Text>
                        <Text style={styles.metricLabel}>{m.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.btn, { borderColor: `${v.color}40` }]}
                      onPress={() =>
                        router.push({
                          pathname: '/venture/[slug]',
                          params: { slug: v.slug },
                        } as any)
                      }
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.btnText, { color: v.color }]}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.btn,
                        styles.btnPrimary,
                        { backgroundColor: `${v.color}18`, borderColor: `${v.color}40` },
                      ]}
                      onPress={() => Linking.openURL(v.url)}
                      activeOpacity={0.75}
                    >
                      <Feather name="external-link" size={11} color={v.color} />
                      <Text style={[styles.btnText, { color: v.color, marginLeft: 4 }]}>Live</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerGradient: { ...StyleSheet.absoluteFillObject, height: 200 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Inter_700Bold',
  },
  headerSub: { fontSize: 13, color: TEXT_DIM, marginTop: 2 },
  scroll: { flex: 1 },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardName: { fontSize: 15, fontWeight: '600', color: TEXT },
  cardTagline: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
  },
  cardDesc: { fontSize: 13, color: TEXT_DIM, lineHeight: 20 },
  metricsRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  metricChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  metricValue: { fontSize: 14, fontWeight: '700' },
  metricLabel: {
    fontSize: 9,
    color: TEXT_DIM,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnPrimary: {},
  btnText: { fontSize: 12, fontWeight: '600' },
});
