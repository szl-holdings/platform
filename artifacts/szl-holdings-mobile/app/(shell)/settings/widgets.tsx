import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WORKSPACES } from '@/context/WorkspaceContext';
import { useColors } from '@/hooks/useColors';

const ACCENT = '#c9a84c';
const STORAGE_KEY = 'cortex_widget_config';

type WidgetSize = 'small' | 'medium' | 'large';
type WidgetDataSource =
  | 'portfolio_value'
  | 'threat_level'
  | 'fleet_status'
  | 'deal_pipeline'
  | 'system_health'
  | 'active_alerts';

interface WidgetConfig {
  enabled: boolean;
  size: WidgetSize;
  dataSource: WidgetDataSource;
  domain: string;
}

interface WidgetSlot {
  id: string;
  name: string;
  description: string;
  config: WidgetConfig;
}

const DATA_SOURCES: { id: WidgetDataSource; label: string; domain: string }[] = [
  { id: 'portfolio_value', label: 'Portfolio Value', domain: 'portfolio' },
  { id: 'threat_level', label: 'Threat Level', domain: 'defense' },
  { id: 'fleet_status', label: 'Fleet Status', domain: 'fleet' },
  { id: 'deal_pipeline', label: 'Deal Pipeline', domain: 'properties' },
  { id: 'system_health', label: 'System Health', domain: 'operations' },
  { id: 'active_alerts', label: 'Active Alerts', domain: 'command' },
];

const DEFAULT_SLOTS: WidgetSlot[] = [
  {
    id: 'widget-1',
    name: 'Primary Widget',
    description: 'Always-visible home screen widget',
    config: { enabled: true, size: 'medium', dataSource: 'portfolio_value', domain: 'portfolio' },
  },
  {
    id: 'widget-2',
    name: 'Alert Widget',
    description: 'Critical alert counter',
    config: { enabled: true, size: 'small', dataSource: 'active_alerts', domain: 'command' },
  },
  {
    id: 'widget-3',
    name: 'Domain Widget',
    description: 'Domain-specific KPI',
    config: { enabled: false, size: 'large', dataSource: 'threat_level', domain: 'defense' },
  },
];

const SIZE_OPTIONS: { id: WidgetSize; label: string; icon: string }[] = [
  { id: 'small', label: 'Small', icon: '□' },
  { id: 'medium', label: 'Medium', icon: '◫' },
  { id: 'large', label: 'Large', icon: '▣' },
];

function WidgetPreview({
  config,
  colors,
}: {
  config: WidgetConfig;
  colors: ReturnType<typeof useColors>;
}) {
  const ds = DATA_SOURCES.find((d) => d.id === config.dataSource);
  const ws = WORKSPACES.find((w) => w.id === ds?.domain);
  const accent = ws?.accent ?? ACCENT;

  const previewValues: Record<WidgetDataSource, string> = {
    portfolio_value: '$847M',
    threat_level: 'ELEVATED',
    fleet_status: '12 Active',
    deal_pipeline: '7 Deals',
    system_health: '94%',
    active_alerts: '3 Critical',
  };

  const widgetWidth = config.size === 'small' ? 80 : config.size === 'medium' ? 150 : 220;
  const widgetHeight = config.size === 'small' ? 80 : config.size === 'medium' ? 100 : 120;

  return (
    <View
      style={[styles.previewWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Preview</Text>
      <View
        style={[
          styles.widgetPreview,
          {
            width: widgetWidth,
            height: widgetHeight,
            backgroundColor: '#0d0d1a',
            borderColor: `${accent}30`,
          },
        ]}
      >
        <View style={[styles.widgetAccentBar, { backgroundColor: accent }]} />
        <View style={styles.widgetContent}>
          <Text style={[styles.widgetIcon]}>{ws?.icon ?? '⬡'}</Text>
          <Text style={[styles.widgetValue, { color: '#f0eeff' }]} numberOfLines={1}>
            {previewValues[config.dataSource]}
          </Text>
          {config.size !== 'small' && (
            <Text style={[styles.widgetDomain, { color: accent }]} numberOfLines={1}>
              {ds?.label}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function WidgetSlotCard({
  slot,
  onUpdate,
  colors,
}: {
  slot: WidgetSlot;
  onUpdate: (id: string, config: WidgetConfig) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.slotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.slotHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.slotHeaderLeft}>
          <Text style={[styles.slotName, { color: colors.foreground }]}>{slot.name}</Text>
          <Text style={[styles.slotDesc, { color: colors.mutedForeground }]}>
            {slot.description}
          </Text>
        </View>
        <View style={styles.slotHeaderRight}>
          <Switch
            value={slot.config.enabled}
            onValueChange={(val) => onUpdate(slot.id, { ...slot.config, enabled: val })}
            trackColor={{ false: '#333', true: `${ACCENT}80` }}
            thumbColor={slot.config.enabled ? ACCENT : '#777'}
          />
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.mutedForeground}
          />
        </View>
      </TouchableOpacity>

      {expanded && slot.config.enabled && (
        <View style={styles.slotBody}>
          <WidgetPreview config={slot.config} colors={colors} />

          <View style={styles.configSection}>
            <Text style={[styles.configLabel, { color: colors.mutedForeground }]}>WIDGET SIZE</Text>
            <View style={styles.sizeRow}>
              {SIZE_OPTIONS.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  style={[
                    styles.sizeBtn,
                    {
                      borderColor: slot.config.size === size.id ? ACCENT : colors.border,
                      backgroundColor: slot.config.size === size.id ? `${ACCENT}10` : 'transparent',
                    },
                  ]}
                  onPress={() => onUpdate(slot.id, { ...slot.config, size: size.id })}
                >
                  <Text
                    style={[
                      styles.sizeBtnIcon,
                      { color: slot.config.size === size.id ? ACCENT : colors.mutedForeground },
                    ]}
                  >
                    {size.icon}
                  </Text>
                  <Text
                    style={[
                      styles.sizeBtnLabel,
                      { color: slot.config.size === size.id ? ACCENT : colors.mutedForeground },
                    ]}
                  >
                    {size.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.configSection}>
            <Text style={[styles.configLabel, { color: colors.mutedForeground }]}>DATA SOURCE</Text>
            <View style={styles.dataSourceGrid}>
              {DATA_SOURCES.map((ds) => {
                const ws = WORKSPACES.find((w) => w.id === ds.domain);
                const isActive = slot.config.dataSource === ds.id;
                return (
                  <TouchableOpacity
                    key={ds.id}
                    style={[
                      styles.dataSourceChip,
                      {
                        borderColor: isActive ? (ws?.accent ?? ACCENT) : colors.border,
                        backgroundColor: isActive ? `${ws?.accent ?? ACCENT}10` : 'transparent',
                      },
                    ]}
                    onPress={() =>
                      onUpdate(slot.id, {
                        ...slot.config,
                        dataSource: ds.id,
                        domain: ds.domain,
                      })
                    }
                  >
                    <Text style={styles.dataSourceIcon}>{ws?.icon}</Text>
                    <Text
                      style={[
                        styles.dataSourceLabel,
                        { color: isActive ? (ws?.accent ?? ACCENT) : colors.mutedForeground },
                      ]}
                    >
                      {ds.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default function WidgetConfigScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [slots, setSlots] = useState<WidgetSlot[]>(DEFAULT_SLOTS);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val) {
          const savedSlots: WidgetSlot[] = JSON.parse(val);
          setSlots((prev) =>
            prev.map((s) => {
              const saved = savedSlots.find((ss) => ss.id === s.id);
              return saved ? { ...s, config: saved.config } : s;
            }),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleUpdate = (id: string, config: WidgetConfig) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, config } : s)));
    setSaved(false);
  };

  const handleSave = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(slots)).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Home Screen Widgets</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saved ? colors.green : ACCENT }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{saved ? 'Saved ✓' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.infoCard, { backgroundColor: `${ACCENT}08`, borderColor: `${ACCENT}20` }]}
        >
          <Feather name="info" size={14} color={ACCENT} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Configure your iOS/Android home screen widgets. Changes sync when the app is
            backgrounded.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WIDGET SLOTS</Text>
        {slots.map((slot) => (
          <WidgetSlotCard key={slot.id} slot={slot} onUpdate={handleUpdate} colors={colors} />
        ))}

        <View
          style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="smartphone" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            Add CORTEX widgets to your home screen via the long-press menu on iOS or widget library
            on Android.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#090810' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  slotCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  slotHeaderLeft: { flex: 1, gap: 2 },
  slotName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  slotDesc: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  slotHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  slotBody: {
    padding: 14,
    paddingTop: 0,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  previewWrapper: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  previewLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', letterSpacing: 0.5 },
  widgetPreview: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  widgetAccentBar: { height: 3 },
  widgetContent: {
    flex: 1,
    padding: 8,
    gap: 2,
    justifyContent: 'center',
  },
  widgetIcon: { fontSize: 16 },
  widgetValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  widgetDomain: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  configSection: { gap: 8 },
  configLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
  },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
  },
  sizeBtnIcon: { fontSize: 18 },
  sizeBtnLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  dataSourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dataSourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dataSourceIcon: { fontSize: 12 },
  dataSourceLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  noteCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  noteText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
});
