import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  useAlertPreferences,
  isQuietHoursActive,
  type AlertPreferences,
} from "@/hooks/useAlertPreferences";

const ACCENT = "#c9a84c";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function parseHHMM(s: string): { hour: number; minute: number } {
  const [h, m] = s.split(":");
  return { hour: parseInt(h ?? "0", 10), minute: parseInt(m ?? "0", 10) };
}

function fmtHHMM(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function format12h(hhmm: string): string {
  const { hour, minute } = parseHHMM(hhmm);
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  colors: ReturnType<typeof useColors>;
}

function TimePicker({ label, value, onChange, colors }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const { hour, minute } = parseHHMM(value);

  return (
    <View style={[styles.timeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.timeRow} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <Feather name="moon" size={16} color={ACCENT} />
        <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.timeValue, { color: colors.foreground }]}>{format12h(value)}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
      {open && (
        <View style={styles.pickerContainer}>
          <View style={styles.pickerColumn}>
            <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Hour</Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.pickerItem, hour === h && { backgroundColor: `${ACCENT}15` }]}
                  onPress={() => onChange(fmtHHMM(h, minute))}
                >
                  <Text style={[styles.pickerItemText, { color: hour === h ? ACCENT : colors.mutedForeground }]}>
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
                style={[styles.pickerItem, minute === m && { backgroundColor: `${ACCENT}15` }]}
                onPress={() => onChange(fmtHHMM(hour, m))}
              >
                <Text style={[styles.pickerItemText, { color: minute === m ? ACCENT : colors.mutedForeground }]}>
                  :{m.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: keyof typeof Feather.glyphMap;
  accent: string;
  colors: ReturnType<typeof useColors>;
  isLast?: boolean;
}

function ToggleRow({ title, description, value, onChange, icon, accent, colors, isLast }: ToggleRowProps) {
  return (
    <View style={[styles.toggleRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[styles.itemIcon, { backgroundColor: `${accent}15` }]}>
        <Feather name={icon} size={16} color={accent} />
      </View>
      <View style={styles.itemText}>
        <Text style={[styles.itemTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#333", true: `${accent}80` }}
        thumbColor={value ? accent : "#777"}
      />
    </View>
  );
}

export default function AlertPreferencesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prefs, loaded, saving, setPrefs } = useAlertPreferences();

  const update = <K extends keyof AlertPreferences>(key: K, value: AlertPreferences[K]) => {
    void setPrefs({ [key]: value } as Partial<AlertPreferences>);
  };

  const quietActive = isQuietHoursActive(prefs);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Alert Preferences</Text>
        {saving ? (
          <ActivityIndicator size="small" color={ACCENT} />
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {!loaded ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>
            Choose which agent alerts can wake you up. Preferences sync across all your devices.
          </Text>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ALERT CATEGORIES</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ToggleRow
              title="Approval escalations"
              description="Push when an agent approval is escalated to you (high or critical priority)"
              icon="alert-triangle"
              accent="#ef4444"
              value={prefs.alerts_approvals_enabled}
              onChange={(v) => update("alerts_approvals_enabled", v)}
              colors={colors}
            />
            <ToggleRow
              title="Failed or stuck agent runs"
              description="Push when an agent run fails or has been running longer than 10 minutes"
              icon="activity"
              accent="#f97316"
              value={prefs.alerts_run_failures_enabled}
              onChange={(v) => update("alerts_run_failures_enabled", v)}
              colors={colors}
              isLast
            />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>QUIET HOURS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ToggleRow
              title={`Quiet hours${quietActive ? " · active now" : ""}`}
              description="Mute non-critical alerts during the window below. Critical approvals still wake you."
              icon="moon"
              accent={ACCENT}
              value={prefs.alerts_quiet_hours_enabled}
              onChange={(v) => update("alerts_quiet_hours_enabled", v)}
              colors={colors}
              isLast
            />
          </View>

          {prefs.alerts_quiet_hours_enabled && (
            <View style={{ gap: 8 }}>
              <TimePicker
                label="From"
                value={prefs.alerts_quiet_hours_start}
                onChange={(v) => update("alerts_quiet_hours_start", v)}
                colors={colors}
              />
              <TimePicker
                label="Until"
                value={prefs.alerts_quiet_hours_end}
                onChange={(v) => update("alerts_quiet_hours_end", v)}
                colors={colors}
              />
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                Quiet window: {format12h(prefs.alerts_quiet_hours_start)} → {format12h(prefs.alerts_quiet_hours_end)} in your local time.
                Set your time zone in Settings → Time Zone so server alerts honor this window.
                Critical approvals always break through.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
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
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  intro: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  itemDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  timeCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  timeRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  timeLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  timeValue: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "right" },
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
  helperText: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, paddingHorizontal: 4 },
});
