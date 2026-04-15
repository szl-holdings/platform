import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const ACCENT = "#c9a84c";

interface SettingItem {
  title: string;
  description: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
  accent: string;
  tag?: string;
}

const SETTINGS: SettingItem[] = [
  {
    title: "Home Screen Widgets",
    description: "Configure KPI widgets for iOS & Android home screen",
    route: "/(shell)/settings/widgets",
    icon: "grid",
    accent: "#6366f1",
    tag: "NEW",
  },
  {
    title: "Daily Executive Digest",
    description: "Morning briefing push notification with delivery time",
    route: "/(shell)/settings/digest",
    icon: "sun",
    accent: ACCENT,
    tag: "NEW",
  },
  {
    title: "Security & Privacy",
    description: "Biometric layers, screenshot prevention, enterprise policy",
    route: "/(shell)/settings/security",
    icon: "shield",
    accent: "#ef4444",
  },
];

export default function SettingsIndexScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>COMMAND SURFACE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SETTINGS.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.settingRow,
                index < SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={() => router.push(item.route as never)}
              activeOpacity={0.8}
            >
              <View style={[styles.itemIcon, { backgroundColor: `${item.accent}15` }]}>
                <Feather name={item.icon} size={16} color={item.accent} />
              </View>
              <View style={styles.itemText}>
                <View style={styles.itemTitleRow}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                  {item.tag && (
                    <View style={[styles.tag, { backgroundColor: `${ACCENT}15`, borderColor: `${ACCENT}30` }]}>
                      <Text style={[styles.tagText, { color: ACCENT }]}>{item.tag}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
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
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemTitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  itemDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
});
