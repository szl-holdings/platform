import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
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

const ACCENT = '#0ea5e9';

interface WaterfallTier {
  id: string;
  label: string;
  preferredReturn: number;
  lpSplit: number;
  gpSplit: number;
  hurdle: string;
  lpAmount: number;
  gpAmount: number;
  color: string;
}

interface WaterfallModel {
  id: string;
  name: string;
  property: string;
  totalProceeds: number;
  totalEquity: number;
  lpEquity: number;
  gpEquity: number;
  gpPromote: number;
  tiers: WaterfallTier[];
}

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(0)}K`
      : `$${n}`;

const MODELS: WaterfallModel[] = [
  {
    id: 'wf-1',
    name: 'Harborview Exit Waterfall',
    property: 'Harborview Mixed-Use · Miami, FL',
    totalProceeds: 26_400_000,
    totalEquity: 5_550_000,
    lpEquity: 4_995_000,
    gpEquity: 555_000,
    gpPromote: 20,
    tiers: [
      {
        id: 't1',
        label: 'Return of Capital',
        preferredReturn: 0,
        lpSplit: 90,
        gpSplit: 10,
        hurdle: 'Capital return',
        lpAmount: 4_995_000,
        gpAmount: 555_000,
        color: '#60a5fa',
      },
      {
        id: 't2',
        label: 'Preferred Return (8%)',
        preferredReturn: 8,
        lpSplit: 90,
        gpSplit: 10,
        hurdle: '8% pref',
        lpAmount: 1_796_400,
        gpAmount: 199_600,
        color: '#34d399',
      },
      {
        id: 't3',
        label: 'GP Catch-Up (50/50)',
        preferredReturn: 0,
        lpSplit: 50,
        gpSplit: 50,
        hurdle: 'Catch-up to 20%',
        lpAmount: 398_000,
        gpAmount: 398_000,
        color: '#fbbf24',
      },
      {
        id: 't4',
        label: 'Carried Interest (80/20)',
        preferredReturn: 0,
        lpSplit: 80,
        gpSplit: 20,
        hurdle: 'Above pref',
        lpAmount: 9_648_000,
        gpAmount: 2_412_000,
        color: ACCENT,
      },
    ],
  },
  {
    id: 'wf-2',
    name: 'Northgate Industrial Sale',
    property: 'Northgate Industrial · Houston, TX',
    totalProceeds: 14_200_000,
    totalEquity: 2_760_000,
    lpEquity: 2_484_000,
    gpEquity: 276_000,
    gpPromote: 25,
    tiers: [
      {
        id: 't5',
        label: 'Return of Capital',
        preferredReturn: 0,
        lpSplit: 90,
        gpSplit: 10,
        hurdle: 'Capital return',
        lpAmount: 2_484_000,
        gpAmount: 276_000,
        color: '#60a5fa',
      },
      {
        id: 't6',
        label: 'Preferred Return (7%)',
        preferredReturn: 7,
        lpSplit: 90,
        gpSplit: 10,
        hurdle: '7% pref',
        lpAmount: 870_400,
        gpAmount: 96_700,
        color: '#34d399',
      },
      {
        id: 't7',
        label: 'Promote (75/25)',
        preferredReturn: 0,
        lpSplit: 75,
        gpSplit: 25,
        hurdle: 'Above pref',
        lpAmount: 7_782_000,
        gpAmount: 2_594_000,
        color: ACCENT,
      },
    ],
  },
];

export default function WaterfallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);

  useQuery({
    queryKey: ['terra-waterfall'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/terra/waterfall`);
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    retry: 1,
  });

  const model = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];
  const totalLP = model.tiers.reduce((s, t) => s + t.lpAmount, 0);
  const totalGP = model.tiers.reduce((s, t) => s + t.gpAmount, 0);
  const gpPct = Math.round((totalGP / (totalLP + totalGP)) * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(14,165,233,0.07)', 'transparent']}
        style={[styles.headerGradient, { height: topPad + 100 }]}
      />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.cream} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: `${ACCENT}cc` }]}>TERRA · FINANCE</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Waterfall</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modelTabs}
      >
        {MODELS.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedModel(m.id);
            }}
            style={[
              styles.modelTab,
              {
                borderColor: selectedModel === m.id ? ACCENT : colors.border,
                backgroundColor: selectedModel === m.id ? `${ACCENT}12` : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.modelTabText,
                { color: selectedModel === m.id ? ACCENT : colors.mutedForeground },
              ]}
            >
              {m.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View
            style={[
              styles.modelCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modelName, { color: colors.cream }]}>{model.name}</Text>
            <Text style={[styles.modelProp, { color: colors.mutedForeground }]}>
              {model.property}
            </Text>
            <View style={styles.modelMetrics}>
              {[
                { label: 'Total Proceeds', value: fmt(model.totalProceeds), color: colors.cream },
                { label: 'LP Total', value: fmt(totalLP), color: '#60a5fa' },
                { label: 'GP Total', value: fmt(totalGP), color: ACCENT },
                { label: 'GP%', value: `${gpPct}%`, color: ACCENT },
              ].map((m, i) => (
                <View key={i} style={styles.modelMet}>
                  <Text style={[styles.modelMetVal, { color: m.color }]}>{m.value}</Text>
                  <Text style={[styles.modelMetLbl, { color: colors.mutedForeground }]}>
                    {m.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.splitBar}>
              <View
                style={[styles.splitSegment, { flex: 100 - gpPct, backgroundColor: '#60a5fa' }]}
              />
              <View style={[styles.splitSegment, { flex: gpPct, backgroundColor: ACCENT }]} />
            </View>
            <View style={styles.splitLegend}>
              <View style={styles.splitLegendItem}>
                <View style={[styles.splitDot, { backgroundColor: '#60a5fa' }]} />
                <Text style={[styles.splitLegendText, { color: colors.mutedForeground }]}>
                  LP {100 - gpPct}%
                </Text>
              </View>
              <View style={styles.splitLegendItem}>
                <View style={[styles.splitDot, { backgroundColor: ACCENT }]} />
                <Text style={[styles.splitLegendText, { color: colors.mutedForeground }]}>
                  GP {gpPct}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.sectionHead, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionHeadText, { color: colors.mutedForeground }]}>
            DISTRIBUTION TIERS
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10, paddingTop: 12 }}>
          {model.tiers.map((tier, idx) => {
            const tierTotal = tier.lpAmount + tier.gpAmount;
            const lpPct = tierTotal > 0 ? Math.round((tier.lpAmount / tierTotal) * 100) : 0;
            return (
              <View
                key={tier.id}
                style={[
                  styles.tierCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: `${tier.color}25`,
                    borderLeftColor: tier.color,
                    borderLeftWidth: 3,
                  },
                ]}
              >
                <View style={styles.tierTop}>
                  <View style={[styles.tierNum, { backgroundColor: `${tier.color}20` }]}>
                    <Text style={[styles.tierNumText, { color: tier.color }]}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tierLabel, { color: colors.cream }]}>{tier.label}</Text>
                    <Text style={[styles.tierHurdle, { color: colors.mutedForeground }]}>
                      {tier.hurdle} · {tier.lpSplit}/{tier.gpSplit} split
                    </Text>
                  </View>
                  <Text style={[styles.tierTotal, { color: colors.cream }]}>{fmt(tierTotal)}</Text>
                </View>
                <View style={tierBar}>
                  <View
                    style={[
                      {
                        width: `${lpPct}%` as DimensionValue,
                        backgroundColor: '#60a5fa',
                        height: 6,
                      },
                    ]}
                  />
                  <View
                    style={[
                      {
                        width: `${100 - lpPct}%` as DimensionValue,
                        backgroundColor: tier.color,
                        height: 6,
                      },
                    ]}
                  />
                </View>
                <View style={styles.tierAmounts}>
                  <Text style={[styles.tierAmt, { color: '#60a5fa' }]}>
                    LP {fmt(tier.lpAmount)}
                  </Text>
                  <Text style={[styles.tierAmt, { color: tier.color }]}>
                    GP {fmt(tier.gpAmount)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const tierBar = {
  flexDirection: 'row' as const,
  height: 6,
  borderRadius: 3,
  overflow: 'hidden' as const,
  marginVertical: 8,
  backgroundColor: 'rgba(255,255,255,0.07)',
};

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
  modelTabs: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  modelTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  modelTabText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  modelCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  modelName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  modelProp: { fontSize: 11, fontFamily: 'Inter_300Light', marginBottom: 12 },
  modelMetrics: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modelMet: { flex: 1, alignItems: 'center' },
  modelMetVal: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  modelMetLbl: { fontSize: 9, fontFamily: 'Inter_300Light', letterSpacing: 0.5 },
  splitBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  splitSegment: { height: 8 },
  splitLegend: { flexDirection: 'row', gap: 14 },
  splitLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  splitDot: { width: 6, height: 6, borderRadius: 3 },
  splitLegendText: { fontSize: 10, fontFamily: 'Inter_300Light' },
  sectionHead: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1 },
  sectionHeadText: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 2 },
  tierCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  tierTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tierNum: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tierNumText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  tierLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  tierHurdle: { fontSize: 10, fontFamily: 'Inter_300Light' },
  tierTotal: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tierAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  tierAmt: { fontSize: 11, fontFamily: 'Inter_500Medium' },
});
