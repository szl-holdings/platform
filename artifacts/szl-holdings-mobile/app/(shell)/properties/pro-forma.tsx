import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
  ? 'https://' + process.env.EXPO_PUBLIC_DOMAIN + '/api'
  : '/api';

const ACCENT = '#c87941';

interface ProFormaScenario {
  id: string;
  label: string;
  irr: number;
  equityMultiple: number;
  cashOnCash: number;
  holdPeriod: number;
  exitCapRate: number;
  color: string;
}

interface ProFormaModel {
  id: string;
  name: string;
  property: string;
  purchasePrice: number;
  equity: number;
  leverage: number;
  closingDate: string;
  noi: number;
  capRate: number;
  scenarios: ProFormaScenario[];
  yearlyNoi: { year: number; noi: number; cashFlow: number }[];
}

const MODELS: ProFormaModel[] = [
  {
    id: 'pf-1',
    name: 'Harborview Acquisition',
    property: 'Harborview Mixed-Use · Miami, FL',
    purchasePrice: 18_500_000,
    equity: 5_550_000,
    leverage: 70,
    closingDate: 'Jun 2024',
    noi: 1_110_000,
    capRate: 6.0,
    scenarios: [
      {
        id: 's1',
        label: 'Bear',
        irr: 8.4,
        equityMultiple: 1.6,
        cashOnCash: 5.2,
        holdPeriod: 5,
        exitCapRate: 6.75,
        color: '#ef4444',
      },
      {
        id: 's2',
        label: 'Base',
        irr: 14.2,
        equityMultiple: 2.1,
        cashOnCash: 7.8,
        holdPeriod: 5,
        exitCapRate: 6.0,
        color: '#34d399',
      },
      {
        id: 's3',
        label: 'Bull',
        irr: 19.8,
        equityMultiple: 2.8,
        cashOnCash: 10.1,
        holdPeriod: 5,
        exitCapRate: 5.25,
        color: '#60a5fa',
      },
    ],
    yearlyNoi: [
      { year: 1, noi: 1_110_000, cashFlow: 432_000 },
      { year: 2, noi: 1_143_300, cashFlow: 465_300 },
      { year: 3, noi: 1_177_599, cashFlow: 499_599 },
      { year: 4, noi: 1_212_927, cashFlow: 534_927 },
      { year: 5, noi: 1_249_315, cashFlow: 571_315 },
    ],
  },
  {
    id: 'pf-2',
    name: 'Northgate Industrial Buy',
    property: 'Northgate Industrial Park · Houston, TX',
    purchasePrice: 9_200_000,
    equity: 2_760_000,
    leverage: 70,
    closingDate: 'Sep 2024',
    noi: 644_000,
    capRate: 7.0,
    scenarios: [
      {
        id: 's4',
        label: 'Bear',
        irr: 9.1,
        equityMultiple: 1.5,
        cashOnCash: 6.0,
        holdPeriod: 7,
        exitCapRate: 7.5,
        color: '#ef4444',
      },
      {
        id: 's5',
        label: 'Base',
        irr: 15.6,
        equityMultiple: 2.4,
        cashOnCash: 8.5,
        holdPeriod: 7,
        exitCapRate: 6.75,
        color: '#34d399',
      },
      {
        id: 's6',
        label: 'Bull',
        irr: 21.3,
        equityMultiple: 3.1,
        cashOnCash: 11.2,
        holdPeriod: 7,
        exitCapRate: 6.0,
        color: '#60a5fa',
      },
    ],
    yearlyNoi: [
      { year: 1, noi: 644_000, cashFlow: 268_000 },
      { year: 2, noi: 663_320, cashFlow: 287_320 },
      { year: 3, noi: 683_220, cashFlow: 307_220 },
      { year: 4, noi: 703_717, cashFlow: 327_717 },
      { year: 5, noi: 724_828, cashFlow: 348_828 },
    ],
  },
];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(0)}K`
      : `$${n}`;

const maxNoi = Math.max(...MODELS[0].yearlyNoi.map((y) => y.noi));

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <View style={barStyles.track}>
      <View
        style={[barStyles.fill, { width: `${pct}%` as DimensionValue, backgroundColor: color }]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3 },
});

export default function ProFormaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);

  useQuery({
    queryKey: ['terra-pro-forma'],
    queryFn: async () => {
      try {
        const res = await fetch(API_BASE + '/terra/pro-forma');
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    retry: 1,
  });

  const model = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];
  const baseScenario = model.scenarios.find((s) => s.label === 'Base') ?? model.scenarios[1];
  const noMax = Math.max(...model.yearlyNoi.map((y) => y.noi));

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
          <Text style={[styles.eyebrow, { color: ACCENT + 'cc' }]}>TERRA · FINANCE</Text>
          <Text style={[styles.title, { color: colors.cream }]}>Pro Forma</Text>
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
                backgroundColor: selectedModel === m.id ? ACCENT + '12' : 'transparent',
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
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
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
                { label: 'Purchase', value: fmt(model.purchasePrice), color: colors.cream },
                { label: 'Equity', value: fmt(model.equity), color: ACCENT },
                { label: 'LTV', value: `${model.leverage}%`, color: '#60a5fa' },
                { label: 'Entry Cap', value: `${model.capRate}%`, color: '#34d399' },
              ].map((m, i) => (
                <View key={i} style={styles.modelMet}>
                  <Text style={[styles.modelMetVal, { color: m.color }]}>{m.value}</Text>
                  <Text style={[styles.modelMetLbl, { color: colors.mutedForeground }]}>
                    {m.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.sectionHead, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionHeadText, { color: colors.mutedForeground }]}>
            SCENARIO ANALYSIS
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 8, paddingTop: 12, marginBottom: 16 }}>
          {model.scenarios.map((scenario) => (
            <View
              key={scenario.id}
              style={[
                styles.scenarioCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: scenario.color + '30',
                  borderLeftColor: scenario.color,
                  borderLeftWidth: 3,
                },
              ]}
            >
              <View style={styles.scenarioTop}>
                <Text style={[styles.scenarioLabel, { color: scenario.color }]}>
                  {scenario.label} Case
                </Text>
                <Text style={[styles.scenarioHold, { color: colors.mutedForeground }]}>
                  {scenario.holdPeriod}yr hold · {scenario.exitCapRate}% exit cap
                </Text>
              </View>
              <View style={styles.scenarioMetrics}>
                <View style={styles.scenMet}>
                  <Text style={[styles.scenMetVal, { color: scenario.color }]}>
                    {scenario.irr}%
                  </Text>
                  <Text style={[styles.scenMetLbl, { color: colors.mutedForeground }]}>IRR</Text>
                </View>
                <View style={styles.scenMet}>
                  <Text style={[styles.scenMetVal, { color: scenario.color }]}>
                    {scenario.equityMultiple}x
                  </Text>
                  <Text style={[styles.scenMetLbl, { color: colors.mutedForeground }]}>EM</Text>
                </View>
                <View style={styles.scenMet}>
                  <Text style={[styles.scenMetVal, { color: scenario.color }]}>
                    {scenario.cashOnCash}%
                  </Text>
                  <Text style={[styles.scenMetLbl, { color: colors.mutedForeground }]}>
                    CoC Yr1
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.sectionHead, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionHeadText, { color: colors.mutedForeground }]}>
            NOI PROJECTION · BASE CASE
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 10 }}>
          {model.yearlyNoi.map((y) => (
            <View key={y.year} style={styles.noRow}>
              <Text style={[styles.noYear, { color: colors.mutedForeground }]}>Y{y.year}</Text>
              <View style={{ flex: 1, gap: 3 }}>
                <Bar value={y.noi} max={noMax} color={ACCENT} />
                <Bar value={y.cashFlow} max={noMax} color="#34d399" />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.noVal, { color: colors.cream }]}>{fmt(y.noi)}</Text>
                <Text style={[styles.noSub, { color: '#34d399' }]}>{fmt(y.cashFlow)} CF</Text>
              </View>
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
  modelTabs: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  modelTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  modelTabText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  modelCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  modelName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  modelProp: { fontSize: 11, fontFamily: 'Inter_300Light', marginBottom: 12 },
  modelMetrics: { flexDirection: 'row', alignItems: 'center' },
  modelMet: { flex: 1, alignItems: 'center' },
  modelMetVal: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  modelMetLbl: { fontSize: 9, fontFamily: 'Inter_300Light', letterSpacing: 0.5 },
  sectionHead: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1 },
  sectionHeadText: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 2 },
  scenarioCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  scenarioTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scenarioLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  scenarioHold: { fontSize: 10, fontFamily: 'Inter_300Light' },
  scenarioMetrics: { flexDirection: 'row' },
  scenMet: { flex: 1, alignItems: 'center' },
  scenMetVal: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  scenMetLbl: { fontSize: 9, fontFamily: 'Inter_300Light', letterSpacing: 0.5 },
  noRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noYear: { width: 24, fontSize: 10, fontFamily: 'Inter_500Medium' },
  noVal: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  noSub: { fontSize: 10, fontFamily: 'Inter_300Light' },
});
