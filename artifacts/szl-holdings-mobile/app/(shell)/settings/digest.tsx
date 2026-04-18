import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useColors } from "@/hooks/useColors";
import { WORKSPACES } from "@/context/WorkspaceContext";
import { apiFetch } from "@/lib/apiClient";

const ACCENT = "#c9a84c";
const STORAGE_KEY = "cortex_digest_config";
const NOTIFICATION_ID_KEY = "cortex_digest_notification_id";

interface DigestConfig {
  enabled: boolean;
  deliveryHour: number;
  deliveryMinute: number;
  timezone: string;
  includedDomains: string[];
  sections: {
    overnightAlerts: boolean;
    portfolioSnapshot: boolean;
    fleetStatus: boolean;
    calendarPreview: boolean;
    threatBriefing: boolean;
    marketMoves: boolean;
  };
  digestFormat: "concise" | "detailed";
}

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const DEFAULT_CONFIG: DigestConfig = {
  enabled: true,
  deliveryHour: 6,
  deliveryMinute: 30,
  timezone: getDeviceTimezone(),
  includedDomains: ["command", "defense", "portfolio", "fleet"],
  sections: {
    overnightAlerts: true,
    portfolioSnapshot: true,
    fleetStatus: true,
    calendarPreview: true,
    threatBriefing: true,
    marketMoves: false,
  },
  digestFormat: "concise",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m} ${period}`;
}

async function cancelExistingDigestNotification() {
  try {
    const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
    }
  } catch {}
}

async function scheduleDigestNotification(config: DigestConfig): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelExistingDigestNotification();
  if (!config.enabled) return;

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Notifications Disabled",
        "Enable notifications in your device settings to receive the daily digest."
      );
      return;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⬡ Executive Morning Briefing",
        body: `Your cross-domain briefing is ready · ${config.digestFormat === "concise" ? "30-second read" : "2-minute briefing"}`,
        data: { type: "daily_digest", format: config.digestFormat },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: config.deliveryHour,
        minute: config.deliveryMinute,
        repeats: true,
      },
    });

    await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);
  } catch (err) {
    console.warn("[CORTEX Digest] Notification scheduling failed:", err);
  }
}

function MockDigestCard({ config, colors }: { config: DigestConfig; colors: ReturnType<typeof useColors> }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <View style={[styles.mockCard, { backgroundColor: "#0d0d1a", borderColor: `${ACCENT}25` }]}>
      <View style={styles.mockCardHeader}>
        <View style={styles.mockLogoRow}>
          <Text style={styles.mockLogo}>⬡</Text>
          <Text style={styles.mockAppName}>CORTEX</Text>
        </View>
        <Text style={styles.mockTime}>{formatTime(config.deliveryHour, config.deliveryMinute)}</Text>
      </View>
      <Text style={styles.mockTitle}>Executive Morning Briefing</Text>
      <Text style={styles.mockDate}>{dateStr}</Text>
      <View style={styles.mockDivider} />
      {config.sections.overnightAlerts && (
        <View style={styles.mockSection}>
          <Text style={styles.mockSectionIcon}>🛡</Text>
          <Text style={styles.mockSectionText}>2 overnight alerts — 1 critical</Text>
        </View>
      )}
      {config.sections.portfolioSnapshot && (
        <View style={styles.mockSection}>
          <Text style={styles.mockSectionIcon}>◈</Text>
          <Text style={styles.mockSectionText}>Portfolio +0.4% overnight</Text>
        </View>
      )}
      {config.sections.fleetStatus && (
        <View style={styles.mockSection}>
          <Text style={styles.mockSectionIcon}>⚓</Text>
          <Text style={styles.mockSectionText}>12 vessels active, all on route</Text>
        </View>
      )}
      {config.sections.calendarPreview && (
        <View style={styles.mockSection}>
          <Text style={styles.mockSectionIcon}>📅</Text>
          <Text style={styles.mockSectionText}>3 meetings, 1 board review</Text>
        </View>
      )}
      <TouchableOpacity style={styles.mockCta}>
        <Text style={styles.mockCtaText}>Open Full Briefing →</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DigestConfigScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<DigestConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val) {
          const parsed: DigestConfig = JSON.parse(val);
          setConfig((prev) => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = { ...config, timezone: config.timezone || getDeviceTimezone() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      await scheduleDigestNotification(payload);
      let apiOk = true;
      try {
        await apiFetch("/api/alloy/digest/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (apiErr) {
        apiOk = false;
        console.warn("[CORTEX Digest] API sync failed (config saved locally):", apiErr);
        Alert.alert(
          "Saved locally",
          "We couldn't sync your digest schedule with the server, so push delivery may not run at your chosen time. Your phone will still fire the local reminder. Try saving again when you're online."
        );
      }
      if (apiOk) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }, [config, saving]);

  const toggleDomain = (domainId: string) => {
    setConfig((prev) => ({
      ...prev,
      includedDomains: prev.includedDomains.includes(domainId)
        ? prev.includedDomains.filter((d) => d !== domainId)
        : [...prev.includedDomains, domainId],
    }));
  };

  const toggleSection = (key: keyof DigestConfig["sections"]) => {
    setConfig((prev) => ({
      ...prev,
      sections: { ...prev.sections, [key]: !prev.sections[key] },
    }));
  };

  if (!loaded) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Daily Executive Digest</Text>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: saved ? colors.green : saving ? "#666" : ACCENT },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saved ? "Saved ✓" : saving ? "Saving…" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.masterToggleCard, {
          backgroundColor: config.enabled ? `${ACCENT}08` : colors.card,
          borderColor: config.enabled ? `${ACCENT}30` : colors.border,
        }]}>
          <View style={styles.masterToggleLeft}>
            <Text style={styles.masterToggleIcon}>☀️</Text>
            <View>
              <Text style={[styles.masterToggleName, { color: colors.foreground }]}>Morning Briefing</Text>
              <Text style={[styles.masterToggleSub, { color: colors.mutedForeground }]}>
                {config.enabled ? `Delivers at ${formatTime(config.deliveryHour, config.deliveryMinute)}` : "Currently disabled"}
              </Text>
            </View>
          </View>
          <Switch
            value={config.enabled}
            onValueChange={(val) => setConfig((prev) => ({ ...prev, enabled: val }))}
            trackColor={{ false: "#333", true: `${ACCENT}80` }}
            thumbColor={config.enabled ? ACCENT : "#777"}
          />
        </View>

        {config.enabled && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PREVIEW</Text>
            <MockDigestCard config={config} colors={colors} />

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DELIVERY TIME</Text>
            <View style={[styles.timeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.timeRow}
                onPress={() => setShowTimePicker((v) => !v)}
              >
                <Feather name="clock" size={16} color={ACCENT} />
                <Text style={[styles.timeValue, { color: colors.foreground }]}>
                  {formatTime(config.deliveryHour, config.deliveryMinute)}
                </Text>
                <Feather name={showTimePicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>

              {showTimePicker && (
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Hour</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                      {HOURS.map((h) => (
                        <TouchableOpacity
                          key={h}
                          style={[
                            styles.pickerItem,
                            config.deliveryHour === h && { backgroundColor: `${ACCENT}15` },
                          ]}
                          onPress={() => setConfig((prev) => ({ ...prev, deliveryHour: h }))}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            { color: config.deliveryHour === h ? ACCENT : colors.mutedForeground },
                          ]}>
                            {h.toString().padStart(2, "0")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Minute</Text>
                    {MINUTES.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.pickerItem,
                          config.deliveryMinute === m && { backgroundColor: `${ACCENT}15` },
                        ]}
                        onPress={() => setConfig((prev) => ({ ...prev, deliveryMinute: m }))}
                      >
                        <Text style={[
                          styles.pickerItemText,
                          { color: config.deliveryMinute === m ? ACCENT : colors.mutedForeground },
                        ]}>
                          :{m.toString().padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>INCLUDED DOMAINS</Text>
            <View style={[styles.domainsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {WORKSPACES.map((ws) => {
                const included = config.includedDomains.includes(ws.id);
                return (
                  <TouchableOpacity
                    key={ws.id}
                    style={[styles.domainRow, { borderBottomColor: colors.border }]}
                    onPress={() => toggleDomain(ws.id)}
                  >
                    <View style={[styles.domainIcon, { backgroundColor: `${ws.accent}15` }]}>
                      <Text style={styles.domainIconText}>{ws.icon}</Text>
                    </View>
                    <Text style={[styles.domainName, { color: colors.foreground }]}>{ws.label}</Text>
                    <Switch
                      value={included}
                      onValueChange={() => toggleDomain(ws.id)}
                      trackColor={{ false: "#333", true: `${ws.accent}80` }}
                      thumbColor={included ? ws.accent : "#777"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BRIEFING SECTIONS</Text>
            <View style={[styles.sectionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(Object.entries(config.sections) as [keyof DigestConfig["sections"], boolean][]).map(([key, val]) => {
                const sectionLabels: Record<keyof DigestConfig["sections"], string> = {
                  overnightAlerts: "Overnight Alerts",
                  portfolioSnapshot: "Portfolio Snapshot",
                  fleetStatus: "Fleet Status",
                  calendarPreview: "Today's Calendar",
                  threatBriefing: "Threat Briefing",
                  marketMoves: "Market Moves",
                };
                return (
                  <View key={key} style={[styles.sectionRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.sectionRowText, { color: colors.foreground }]}>{sectionLabels[key]}</Text>
                    <Switch
                      value={val}
                      onValueChange={() => toggleSection(key)}
                      trackColor={{ false: "#333", true: `${ACCENT}80` }}
                      thumbColor={val ? ACCENT : "#777"}
                    />
                  </View>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FORMAT</Text>
            <View style={[styles.formatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(["concise", "detailed"] as const).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  style={[
                    styles.formatOption,
                    {
                      backgroundColor: config.digestFormat === fmt ? `${ACCENT}10` : "transparent",
                      borderColor: config.digestFormat === fmt ? `${ACCENT}40` : colors.border,
                    },
                  ]}
                  onPress={() => setConfig((prev) => ({ ...prev, digestFormat: fmt }))}
                >
                  <Text style={[styles.formatLabel, { color: config.digestFormat === fmt ? ACCENT : colors.foreground }]}>
                    {fmt === "concise" ? "Concise" : "Detailed"}
                  </Text>
                  <Text style={[styles.formatSub, { color: colors.mutedForeground }]}>
                    {fmt === "concise" ? "Top 5 signals, 30-second read" : "Full domain rundown, 2-minute read"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold", letterSpacing: -0.3 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  saveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#090810" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  masterToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  masterToggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  masterToggleIcon: { fontSize: 24 },
  masterToggleName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  masterToggleSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  mockCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  mockCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mockLogoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  mockLogo: { fontSize: 18, color: ACCENT },
  mockAppName: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: ACCENT, letterSpacing: 1 },
  mockTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(201,168,76,0.5)" },
  mockTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#f0eeff" },
  mockDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(240,238,255,0.4)" },
  mockDivider: { height: 1, backgroundColor: "rgba(201,168,76,0.1)" },
  mockSection: { flexDirection: "row", alignItems: "center", gap: 8 },
  mockSectionIcon: { fontSize: 13 },
  mockSectionText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(240,238,255,0.6)" },
  mockCta: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${ACCENT}15`,
    borderWidth: 1,
    borderColor: `${ACCENT}30`,
    marginTop: 4,
  },
  mockCtaText: { fontSize: 11, fontFamily: "Inter_500Medium", color: ACCENT },
  timeCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  timeValue: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  pickerContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 20,
  },
  pickerColumn: { flex: 1 },
  pickerLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.5, marginBottom: 6 },
  pickerScroll: { maxHeight: 180 },
  pickerItem: { paddingVertical: 8, paddingHorizontal: 4, borderRadius: 6, alignItems: "center" },
  pickerItemText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  domainsCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  domainRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  domainIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  domainIconText: { fontSize: 16 },
  domainName: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionsCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  sectionRowText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  formatCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    gap: 1,
    padding: 6,
  },
  formatOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
  },
  formatLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  formatSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
